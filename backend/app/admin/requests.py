"""«Arizalar»: one moderation queue for tournament applications and club/coach/sponsor leads.

Keys: "a<id>" = Application (tournament), "l<id>" = BusinessLead.
"""

import re
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Application, Booking, BusinessLead, Club, Coach, Staff, Tournament, now
from ..notifier import notify
from ..utils import money, stamp
from . import store
from .auth import Admin, require

router = APIRouter(prefix="/api/admin/requests", tags=["admin requests"])

TYPES = {"turnir": "Turnir", "klub": "Klub", "murabbiy": "Murabbiy", "homiy": "Homiy"}
LEAD_TYPE = {"club": "klub", "coach": "murabbiy", "sponsor": "homiy"}
# Internal status → CRM status pill
CRM_STATUS = {"new": "new", "review": "rev", "info": "info", "approved": "ok", "rejected": "no"}
OPEN = ("new", "review", "info")

CHECKS = {
    "turnir": [["Tashkilotchi shaxsi", "Telegram va telefon mos keldi · avtomatik"], ["Klub kortlarni berishga rozi", "Klub KiGo’da: so‘rov yuborilgan"], ["Sana va joy bo‘sh", "Klub jadvali bilan solishtirildi · avtomatik"], ["Sovrin fondi manbasi aniq", "Homiy yoki tashkilotchi hisobidan"], ["To‘lov rekviziti tekshirildi", "Karta egasi tashkilotchi bilan bir xil"], ["Tavsif, qoidalar, rasm to‘g‘ri", "Haqoratli yoki chalg‘ituvchi gap yo‘q"]],
    "klub": [["Guvohnoma / STIR", "Hujjat ilova qilingan"], ["Manzil va rasmlar", "Xaritada nuqta to‘g‘ri"], ["Narxlar va ish vaqti", ""], ["Shartnoma imzolandi", "Elektron imzo yoki qog‘oz"], ["Tarif va birinchi to‘lov", "300 000 so‘m/oy + 1–2%"]],
    "murabbiy": [["Shaxsi", "Telegram va telefon"], ["Sertifikat yoki diplom", ""], ["Tajriba va mashg‘ulot joyi", ""], ["Narx va 5% shartiga rozilik", ""]],
    "homiy": [["Kompaniya ma’lumotlari", ""], ["Logotip sifati (SVG/PNG)", ""], ["Turnir tashkilotchisi rozi", ""], ["Homiylik to‘lovi", "[shart belgilanmagan]"]],
}

# [key, label, hint, default on]; "list" is mandatory
PLACES = {
    "turnir": [["list", "Turnirlar ro‘yxati", "Ilova va saytda doim chiqadi", True], ["feat", "Sayt: «Tanlangan turnirlar»", "kigo.uz bosh sahifasidagi kartalar", False], ["banner", "Ilova: bosh ekran banneri", "Mini ilova bosh ekranining tepasida", False], ["chan", "@kigo_uz kanalga post", "Avtomatik post: rasm, sana, ro‘yxat tugmasi", False], ["push", "Shu sport o‘yinchilariga xabar", "Shu sportni tanlagan foydalanuvchilarga bot xabari", False]],
    "klub": [["list", "Qidiruv va xarita", "Klub sahifasi ochiladi, bron qilish mumkin", True], ["feat", "Sayt: «Tavsiya klublar»", "kigo.uz bosh sahifasi", False], ["near", "Ilova: «Yaqin atrofda» bloki", "", False], ["crm", "KiGo Business CRM’ni ulash", "Klub egasiga kirish havolasi boradi", True]],
    "murabbiy": [["list", "Murabbiylar ro‘yxati", "Profil ochiladi, dars bron qilinadi", True], ["feat", "Sayt: «Murabbiylar» bloki", "", False], ["club", "Klub sahifasida ko‘rsatish", "", False]],
    "homiy": [["list", "Turnir sahifasidagi homiylar", "", True], ["feat", "Sayt: homiylar logotip qatori", "", False], ["banner", "Ilova: bosh ekran banneri", "", False]],
}


def age(created) -> tuple[str, bool]:
    minutes = int((now() - created).total_seconds() // 60)
    if minutes < 60:
        return f"{max(minutes, 1)} daqiqa", False
    hours = minutes // 60
    return (f"{hours} soat" if hours < 72 else f"{hours // 24} kun"), hours >= 24


def _event(obj, title: str, who: str = "") -> None:
    obj.history = [*obj.history, {"title": title, "at": stamp(now()), "who": who}]


def _user_info(db: Session, user) -> dict:
    if not user:
        return {"ini": "?", "tg": "", "phone": "", "since": "yangi", "prev": "—"}
    bookings = db.scalar(select(func.count()).select_from(Booking).where(Booking.user_id == user.id)) or 0
    hosted = db.scalar(select(func.count()).select_from(Tournament).where(Tournament.organizer_id == user.id)) or 0
    since = f"{user.created_at.year}-yildan · {bookings} bron" + (f" · ★ {user.rating:.1f}" if user.rating else "")
    return {"ini": user.initials, "tg": f"@{user.username}" if user.username else "", "phone": user.phone or "—",
            "since": since, "prev": f"{hosted} ta turnir o‘tkazgan" if hosted else "Birinchi ariza"}


def item(db: Session, obj) -> dict:
    if isinstance(obj, Application):
        d = obj.data
        t = "turnir"
        fee = d.get("fee") or 0
        kv = [["Joy", d.get("venue", "")], ["Sana", f"{d.get('dates', '')}, {d.get('time', '')}".strip(", ")],
              ["Format", f"{d.get('format', '')} · {d.get('level', '')}"], ["Ishtirok", d.get("players", "")],
              ["Kirish", money(fee) + " · Click/Payme" if fee else "Bepul"], ["Sovrin", d.get("prizes") or "—"]]
        if d.get("sponsor"):
            kv.append(["Homiy", d["sponsor"]])
        if obj.answer:
            kv.append(["Javob", obj.answer])
        base = {"key": f"a{obj.id}", "id": obj.number, "name": d.get("name", ""),
                "sub": f"{d.get('sport', '')} · {d.get('format', '').lower()} · {d.get('dates', '')}",
                "who": obj.user.name, "kv": kv, "files": [], "reason": obj.reason}
        status = "pub" if obj.status == "approved" else CRM_STATUS[obj.status]
        user = obj.user
    else:
        t = LEAD_TYPE[obj.kind]
        user = obj.user
        kv = obj.details or [["Sport", obj.sport], ["Telefon", obj.phone]]
        base = {"key": f"l{obj.id}", "id": obj.number, "name": obj.club_name, "sub": obj.sub or obj.sport,
                "who": obj.contact or (user.name if user else ""), "kv": kv, "files": obj.files, "reason": obj.reason}
        status = CRM_STATUS[obj.status]
    info = _user_info(db, user)
    if not user:
        info.update(tg=getattr(obj, "telegram", ""), phone=getattr(obj, "phone", "—"), ini="".join(w[0] for w in base["who"].split()[:2]).upper() or "?")
    a, late = age(obj.created_at)
    return {
        **base, **info, "t": t, "st": status, "when": stamp(obj.created_at),
        "age": a if obj.status in OPEN else "—", "late": late and obj.status in ("new", "review"),
        "checks": obj.checks, "note": obj.note, "moderator": obj.moderator,
        "history": [[h["title"], f"{h['at']}{' · ' + h['who'] if h.get('who') else ''}"] for h in obj.history],
    }


def _get(db: Session, key: str):
    model = {"a": Application, "l": BusinessLead}.get(key[:1])
    obj = db.get(model, int(key[1:])) if model and key[1:].isdigit() else None
    if not obj:
        raise HTTPException(404, "Ariza topilmadi")
    return obj


def _type_of(obj) -> str:
    return "turnir" if isinstance(obj, Application) else LEAD_TYPE[obj.kind]


@router.get("")
def list_requests(admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    apps = db.scalars(select(Application).order_by(Application.id.desc())).all()
    leads = db.scalars(select(BusinessLead).order_by(BusinessLead.id.desc())).all()
    items = [item(db, o) for o in [*apps, *leads]]
    return {"types": TYPES, "checks": CHECKS, "places": PLACES, "items": items}


@router.post("/{key}/open")
def open_request(key: str, admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    """Opening a new request marks it as being reviewed."""
    obj = _get(db, key)
    if obj.status == "new":
        obj.status, obj.moderator = "review", admin.name
        _event(obj, "Admin ko‘ra boshladi", admin.name)
        db.commit()
    return item(db, obj)


class ChecksIn(BaseModel):
    checks: list[int]


@router.put("/{key}/checks")
def set_checks(key: str, body: ChecksIn, admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    obj = _get(db, key)
    n = len(CHECKS[_type_of(obj)])
    obj.checks = sorted({i for i in body.checks if 0 <= i < n})
    db.commit()
    return item(db, obj)


class NoteIn(BaseModel):
    note: str = Field(max_length=2000)


@router.put("/{key}/note")
def set_note(key: str, body: NoteIn, admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    obj = _get(db, key)
    obj.note = body.note
    db.commit()
    return item(db, obj)


def _decidable(obj, admin: Admin) -> None:
    if obj.status not in OPEN:
        raise HTTPException(400, "Ariza ko‘rib chiqilmayapti")
    if obj.status == "new":
        obj.status, obj.moderator = "review", admin.name
        _event(obj, "Admin ko‘ra boshladi", admin.name)


class ApproveIn(BaseModel):
    places: dict[str, bool] = {}
    slot: int | None = Field(default=None, ge=0, le=3)  # «Tanlangan turnirlar» position, 0-based


def _slug(title: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40] or "turnir"
    slug, n = base, 2
    while db.get(Tournament, slug):
        slug, n = f"{base}-{n}", n + 1
    return slug


def _publish_tournament(db: Session, a: Application, places: dict, slot: int | None) -> Tournament:
    d = a.data
    club = db.get(Club, d["club_id"]) if d.get("club_id") else None
    fee = d.get("fee") or 0
    rules = [["Format", d["format"]], ["Kirish to‘lovi", money(fee) if fee else "Bepul"]]
    if d.get("prizes"):
        rules.append(["Sovrinlar", d["prizes"]])
    t = Tournament(
        id=_slug(d["name"], db), title=d["name"], sport=d["sport"], format=d["format"], img=club.img if club else "",
        status="upcoming", dates=d["dates"], start_day=date.fromisoformat(d["start_date"]), club_id=club.id if club else None,
        venue=club.name if club else d["venue"], max_players=d["max_players"], prize=(d.get("prizes") or "")[:80],
        fee=fee, rules=rules, note=d.get("rules", ""), organizer_id=a.user_id, organizer_name=a.user.short_name,
    )
    db.add(t)
    db.flush()
    if places.get("feat") and slot is not None:
        # Shift tournaments already at or after the chosen slot down by one, keeping at most 4.
        featured = db.scalars(select(Tournament).where(Tournament.featured_pos.is_not(None), Tournament.id != t.id).order_by(Tournament.featured_pos)).all()
        order = [x for x in featured]
        order.insert(min(slot, len(order)), t)
        for i, x in enumerate(order):
            x.featured_pos = i + 1 if i < 4 else None
    if places.get("banner"):
        for x in db.scalars(select(Tournament).where(Tournament.banner.is_(True))).all():
            x.banner = False
        t.banner = True
    return t


@router.post("/{key}/approve")
def approve(key: str, body: ApproveIn, tasks: BackgroundTasks, admin: Admin = Depends(require(store.P_DECIDE)), db: Session = Depends(get_db)):
    obj = _get(db, key)
    _decidable(obj, admin)
    t = _type_of(obj)
    if len(obj.checks) < len(CHECKS[t]):
        raise HTTPException(400, f"Tekshiruvni yakunlang ({len(obj.checks)}/{len(CHECKS[t])})")

    obj.status, obj.moderator = "approved", admin.name
    _event(obj, "Tasdiqlandi", admin.name)
    if isinstance(obj, Application):
        tour = _publish_tournament(db, obj, body.places, body.slot)
        obj.tournament_id = tour.id
        _event(obj, "E’lon qilindi", "tanlangan joylarda")
        store.log(db, admin.user, f"«{tour.title}» turnirini tasdiqladi va e’lon qildi")
        d = obj.data
        tasks.add_task(notify, obj.user_id, "application_approved", {
            "title": tour.title, "tournament_id": tour.id, "spots": tour.max_players,
            "deadline": d.get("registration_until") or d["start_date"],
        })
    else:
        if obj.kind == "coach":
            db.add(Coach(user_id=obj.user_id, name=obj.club_name, sport=obj.sport, telegram=obj.telegram, status="ok",
                         details=obj.details, on_site=body.places.get("feat", False), on_club_page=body.places.get("club", False)))
        elif obj.kind == "sponsor":
            content = store.get(db, "content")
            if obj.club_name not in content["sponsors"]:
                content["sponsors"].append(obj.club_name)
                store.put(db, "content", content)
        store.log(db, admin.user, f"«{obj.club_name}» ({TYPES[LEAD_TYPE[obj.kind]].lower()}) arizasini tasdiqladi")
        if obj.user_id:
            tasks.add_task(notify, obj.user_id, "lead_approved", {"title": obj.club_name, "kind": TYPES[LEAD_TYPE[obj.kind]]})
    db.commit()
    return item(db, obj)


class InfoIn(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)
    fields: list[str] = []
    deadline: str = "72 soat"


@router.post("/{key}/request-info")
def request_info(key: str, body: InfoIn, tasks: BackgroundTasks, admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    obj = _get(db, key)
    _decidable(obj, admin)
    obj.status, obj.comment, obj.moderator = "info", body.comment, admin.name
    if isinstance(obj, Application):
        obj.comment_fields, obj.answer = body.fields, ""
    _event(obj, "Ma’lumot so‘raldi", f"{admin.name} · javob kutilmoqda")
    name = obj.data["name"] if isinstance(obj, Application) else obj.club_name
    store.log(db, admin.user, f"{name} arizasidan ma’lumot so‘radi")
    db.commit()
    if obj.user_id:
        event = "info_requested" if isinstance(obj, Application) else "lead_info_requested"
        tasks.add_task(notify, obj.user_id, event, {"comment": body.comment, "title": name, "deadline": body.deadline})
    return item(db, obj)


class RejectIn(BaseModel):
    reason: str = Field(min_length=1, max_length=200)
    comment: str = Field(default="", max_length=2000)
    allow_resend: bool = True


@router.post("/{key}/reject")
def reject(key: str, body: RejectIn, tasks: BackgroundTasks, admin: Admin = Depends(require(store.P_DECIDE)), db: Session = Depends(get_db)):
    obj = _get(db, key)
    _decidable(obj, admin)
    reason = f"{body.reason}. {body.comment}".strip(". ") if body.comment else body.reason
    obj.status, obj.reason, obj.moderator = "rejected", reason, admin.name
    if isinstance(obj, Application):
        obj.allow_resend = body.allow_resend
    _event(obj, "Rad etildi", "sabab yuborildi")
    name = obj.data["name"] if isinstance(obj, Application) else obj.club_name
    store.log(db, admin.user, f"{name} arizasini rad etdi")
    db.commit()
    if obj.user_id:
        event = "application_rejected" if isinstance(obj, Application) else "lead_rejected"
        tasks.add_task(notify, obj.user_id, event, {"title": name, "reason": reason})
    return item(db, obj)


def notify_staff_new_request(db: Session, title: str, kind: str) -> list[tuple]:
    """Telegram messages for staff about a new request (rule «Yangi arizada adminlarga xabar»)."""
    if not store.rule(db, store.R_NOTIFY_ADMINS):
        return []
    ids = [s.user_id for s in db.scalars(select(Staff)).all() if store.can(db, s.role, store.P_VIEW)]
    return [(uid, "admin_new_request", {"title": title, "kind": kind}) for uid in ids]
