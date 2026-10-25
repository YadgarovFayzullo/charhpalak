"""«Turnirlar»: published tournaments plus applications still under review."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Application, Tournament
from ..notifier import notify
from ..utils import money
from . import store
from .auth import Admin, require

router = APIRouter(prefix="/api/admin/tournaments", tags=["admin tournaments"])

CRM_STATUS = {"upcoming": "pub", "live": "run", "finished": "end", "stop": "stop"}
MAX_FEATURED = 4


def row(t: Tournament) -> dict:
    count = t.seeded_players + len(t.entries)
    collected = t.collected or (money(t.fee * len(t.entries)).replace(" so‘m", "") if t.fee and t.entries else "—")
    return {
        "id": t.id, "name": t.title, "sport": f"{t.sport} · {t.format.lower()}", "org": t.organizer_name or t.venue,
        "date": t.dates, "c": count, "m": t.max_players, "money": collected, "st": CRM_STATUS[t.status],
        "featured": t.featured_pos, "banner": t.banner, "paid": len(t.entries),
    }


def app_row(a: Application) -> dict:
    d = a.data
    return {
        "id": f"a{a.id}", "name": d["name"], "sport": f"{d['sport']} · {d['format'].lower()}", "org": a.user.short_name,
        "date": d.get("dates", "—"), "c": 0, "m": d.get("max_players", 0), "money": "—", "st": "rev",
        "featured": None, "banner": False, "paid": 0, "application": True,
    }


def _list(db: Session) -> list[dict]:
    tours = db.scalars(select(Tournament).order_by(Tournament.start_day.desc().nulls_last())).all()
    apps = db.scalars(select(Application).where(Application.status.in_(("new", "review", "info")))).all()
    return [*map(row, tours), *map(app_row, apps)]


@router.get("")
def list_tournaments(admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    return _list(db)


def _live(db: Session, tid: str) -> Tournament:
    t = db.get(Tournament, tid)
    if not t:
        raise HTTPException(404, "Turnir topilmadi")
    if t.status not in ("upcoming", "live"):
        raise HTTPException(400, "Faqat «E’lon qilingan» va «Davom etmoqda» turnirlarni ko‘rsatish mumkin")
    return t


def _featured(db: Session) -> list[Tournament]:
    return db.scalars(select(Tournament).where(Tournament.featured_pos.is_not(None)).order_by(Tournament.featured_pos)).all()


class OnIn(BaseModel):
    on: bool


@router.post("/{tid}/featured")
def set_featured(tid: str, body: OnIn, admin: Admin = Depends(require(store.P_CONTENT)), db: Session = Depends(get_db)):
    t = _live(db, tid)
    order = [x for x in _featured(db) if x.id != t.id]
    if body.on:
        if len(order) >= MAX_FEATURED:
            raise HTTPException(409, "Saytda 4 ta joy band")
        order.append(t)
    t.featured_pos = None
    for i, x in enumerate(order):
        x.featured_pos = i + 1
    store.log(db, admin.user, f"«{t.title}» turnirini saytda {'ko‘rsatdi' if body.on else 'yashirdi'}")
    db.commit()
    return _list(db)


class OrderIn(BaseModel):
    ids: list[str] = Field(max_length=MAX_FEATURED)


@router.put("/featured")
def reorder(body: OrderIn, admin: Admin = Depends(require(store.P_CONTENT)), db: Session = Depends(get_db)):
    current = {t.id: t for t in _featured(db)}
    if set(body.ids) != set(current):
        raise HTTPException(400, "Ro‘yxat o‘zgargan, sahifani yangilang")
    for i, tid in enumerate(body.ids):
        current[tid].featured_pos = i + 1
    db.commit()
    return _list(db)


@router.post("/{tid}/banner")
def set_banner(tid: str, body: OnIn, admin: Admin = Depends(require(store.P_CONTENT)), db: Session = Depends(get_db)):
    t = _live(db, tid)
    for x in db.scalars(select(Tournament).where(Tournament.banner.is_(True))).all():
        x.banner = False
    t.banner = body.on
    if body.on:
        store.log(db, admin.user, f"bosh bannerni «{t.title}» ga almashtirdi")
    db.commit()
    return _list(db)


class StopIn(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


@router.post("/{tid}/stop")
def stop(tid: str, body: StopIn, tasks: BackgroundTasks, admin: Admin = Depends(require(store.P_DECIDE)), db: Session = Depends(get_db)):
    """Take the tournament down; participants and the organizer get a bot message.

    Entry fees are not charged yet (payment stub), so there is nothing to refund for real.
    """
    t = _live(db, tid)
    t.status, t.stop_reason, t.featured_pos, t.banner = "stop", body.reason, None, False
    for i, x in enumerate(_featured(db)):
        x.featured_pos = i + 1
    store.log(db, admin.user, f"«{t.title}» turnirini to‘xtatdi")
    db.commit()
    data = {"title": t.title, "reason": body.reason, "refund": money(t.fee) if t.fee else ""}
    for uid in {e.user_id for e in t.entries} | ({t.organizer_id} if t.organizer_id else set()):
        tasks.add_task(notify, uid, "tournament_stopped", data)
    return _list(db)
