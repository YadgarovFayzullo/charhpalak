"""«Klublar, murabbiylar, foydalanuvchilar»."""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Booking, Club, Coach, Staff, Tournament, TournamentEntry, User, now
from ..utils import money
from . import store
from .auth import Admin, require

router = APIRouter(prefix="/api/admin", tags=["admin directory"])

CLUB_COLORS = ["#FFD58A", "#9EE6C8", "#B9C8FF", "#FFB59A"]
BILLING = {"ok": "To‘langan", "trial": "Sinov", "debt": "Qarzdor"}
ROLE_NAMES = {"p": "O‘yinchi", "c": "Klub egasi", "m": "Murabbiy", "t": "Tashkilotchi"}


def _initials(name: str) -> str:
    words = [w for w in name.replace("«", "").replace("»", "").split() if w[:1].isalnum()]
    return "".join(w[0] for w in words[:2]).upper() or "?"


def club_row(db: Session, c: Club, i: int) -> dict:
    month_ago = now().date() - timedelta(days=30)
    q = select(Booking).where(Booking.club_id == c.id, Booking.day >= month_ago, Booking.status == "confirmed")
    rows = db.scalars(q).all()
    revenue = sum(b.total for b in rows)
    units = sum(t.units for t in c.types)
    return {
        "id": c.id, "i": _initials(c.name), "bg": CLUB_COLORS[i % len(CLUB_COLORS)], "name": c.name,
        "sub": f"{c.sport} · {c.district} · {units} {'stol' if c.sport == 'Bilyard' else 'joy'}",
        "c2": c.tariff, "c3": c.next_payment or "—", "c4": str(len(rows)),
        "st": "blocked" if c.blocked else c.billing, "stLabel": "Bloklangan" if c.blocked else BILLING[c.billing],
        "details": [["Egasi", c.owner or "—"], ["Komissiya", f"{c.commission_pct:g}%"], ["CRM", "Ulangan" if c.crm_connected else "Ulanmagan"],
                    ["Reyting", f"★ {c.rating:.1f} · {c.reviews_count} sharh"], ["Shu oy tushum", f"{money(revenue)} · KiGo ulushi {money(round(revenue * c.commission_pct / 100))}"]],
        "toggles": [c.featured, c.nearby, c.bookable], "blocked": c.blocked, "route": f"/club/{c.id}",
    }


def coach_row(c: Coach) -> dict:
    return {
        "id": c.id, "i": _initials(c.name), "bg": c.color, "name": c.name, "sub": c.place or "—",
        "c2": c.sport, "c3": f"{c.price:,}".replace(",", " ") if c.price else "—", "c4": str(c.lessons_month or "—"),
        "st": "blocked" if c.blocked else c.status, "stLabel": "Bloklangan" if c.blocked else {"ok": "Faol", "rev": "Tekshiruvda"}[c.status],
        "details": c.details or [["Telegram", c.telegram or "—"], ["Komissiya", "5% har bir darsdan"]],
        "toggles": [c.on_site, c.on_club_page, c.bookable], "blocked": c.blocked, "route": "/search",
    }


def user_row(db: Session, u: User) -> dict:
    bookings = db.scalar(select(func.count()).select_from(Booking).where(Booking.user_id == u.id)) or 0
    hosted = db.scalar(select(func.count()).select_from(Tournament).where(Tournament.organizer_id == u.id)) or 0
    played = db.scalar(select(func.count()).select_from(TournamentEntry).where(TournamentEntry.user_id == u.id)) or 0
    roles = ", ".join(ROLE_NAMES[r] for r in u.roles if r in ROLE_NAMES) or "O‘yinchi"
    st = "blocked" if u.blocked else ("warn" if u.warned else "ok")
    sub = " · ".join(x for x in [f"@{u.username}" if u.username else "", "tashkilotchi" if hosted else ""] if x) or "—"
    return {
        "id": u.id, "i": u.initials, "bg": u.color, "name": u.name, "sub": sub, "c2": u.city, "c3": str(bookings),
        "c4": str(u.created_at.year), "st": st, "stLabel": {"blocked": "Bloklangan", "warn": "Ogohlantirilgan", "ok": "Faol"}[st],
        "details": [["Telefon", u.phone or "—"], ["Rollar", roles], ["Reyting", f"★ {u.rating:.1f}" if u.rating else "—"],
                    ["Kelmay qolish", str(u.no_shows)], ["Turnirlar", f"{hosted} o‘tkazgan, {played} qatnashgan"]],
        "toggles": [u.can_book, u.can_apply, u.can_chat], "blocked": u.blocked, "route": "/profile",
    }


@router.get("/directory")
def directory(tab: str = "klub", q: str = "", admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    counts = {
        "klub": db.scalar(select(func.count()).select_from(Club)),
        "murabbiy": db.scalar(select(func.count()).select_from(Coach)),
        "foyd": db.scalar(select(func.count()).select_from(User).where(User.onboarded.is_(True))),
    }
    like = f"%{q.strip()}%"
    if tab == "klub":
        query = select(Club).order_by(Club.name)
        if q.strip():
            query = query.where(or_(Club.name.ilike(like), Club.owner.ilike(like), Club.sport.ilike(like)))
        rows = [club_row(db, c, i) for i, c in enumerate(db.scalars(query).all())]
    elif tab == "murabbiy":
        query = select(Coach).order_by(Coach.name)
        if q.strip():
            query = query.where(or_(Coach.name.ilike(like), Coach.telegram.ilike(like), Coach.sport.ilike(like)))
        rows = [coach_row(c) for c in db.scalars(query).all()]
    else:
        staff_ids = select(Staff.user_id)
        query = select(User).where(User.onboarded.is_(True), User.id.not_in(staff_ids)).order_by(User.created_at.desc()).limit(200)
        if q.strip():
            query = query.where(or_(User.first_name.ilike(like), User.last_name.ilike(like), User.username.ilike(like), User.phone.ilike(like)))
        rows = [user_row(db, u) for u in db.scalars(query).all()]
    return {"counts": counts, "rows": rows}


class PatchIn(BaseModel):
    toggle: int | None = None  # index into the row's toggles
    value: bool | None = None
    blocked: bool | None = None


TOGGLE_FIELDS = {"klub": ["featured", "nearby", "bookable"], "murabbiy": ["on_site", "on_club_page", "bookable"], "foyd": ["can_book", "can_apply", "can_chat"]}
MODELS = {"klub": Club, "murabbiy": Coach, "foyd": User}


@router.patch("/directory/{tab}/{item_id}")
def patch(tab: str, item_id: str, body: PatchIn, admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    if tab not in MODELS:
        raise HTTPException(404, "Bo‘lim topilmadi")
    obj = db.get(MODELS[tab], item_id if tab == "klub" else int(item_id))
    if not obj:
        raise HTTPException(404, "Topilmadi")
    # Visibility toggles are content; blocking and user permissions need «bloklash».
    needs = store.P_BLOCK if body.blocked is not None or tab == "foyd" else store.P_CONTENT
    if not store.can(db, admin.role, needs):
        raise HTTPException(403, f"Ruxsat yo‘q: {store.PERMISSIONS[needs]}")
    name = getattr(obj, "name", "")
    if body.toggle is not None and body.value is not None:
        setattr(obj, TOGGLE_FIELDS[tab][body.toggle], body.value)
    if body.blocked is not None:
        obj.blocked = body.blocked
        store.log(db, admin.user, f"«{name}» ni {'blokladi' if body.blocked else 'blokdan chiqardi'}")
    db.commit()
    if tab == "klub":
        index = db.scalars(select(Club.id).order_by(Club.name)).all().index(obj.id)
        return club_row(db, obj, index)
    return coach_row(obj) if tab == "murabbiy" else user_row(db, obj)
