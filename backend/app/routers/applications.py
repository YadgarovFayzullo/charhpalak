"""Tournament hosting applications: the organizer's side and the moderators' side."""

import re
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import serializers as s
from ..auth import admin_user, current_user
from ..db import get_db
from ..models import Application, Club, Tournament, User, now
from ..notifier import notify
from ..utils import stamp

router = APIRouter(prefix="/api", tags=["applications"])


class ApplicationIn(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    sport: str = Field(max_length=32)
    format: str = Field(max_length=48)
    level: str = Field(max_length=32)
    description: str = Field(default="", max_length=2000)
    venue: str = Field(max_length=120)
    club_id: str | None = None
    start_date: date
    end_date: date
    time: str = Field(default="10:00", max_length=5)
    registration_until: date | None = None
    max_players: int = Field(ge=2, le=512)
    min_players: int = Field(ge=2, le=512)
    unit: str = Field(default="ishtirokchi", max_length=24)  # "juftlik", "jamoa", ...
    fee: int = Field(default=0, ge=0)
    payout_card: str = Field(default="", max_length=32)  # where entry fees are paid out
    rules: str = Field(default="", max_length=4000)
    prizes: str = Field(default="", max_length=2000)
    sponsor: str = Field(default="", max_length=120)


def _event(app: Application, title: str) -> None:
    app.history = [*app.history, {"title": title, "at": stamp(now())}]


def _data(body: ApplicationIn) -> dict:
    d = body.model_dump(mode="json")
    d["dates"] = f"{body.start_date.day}–{body.end_date.day}.{body.end_date.month:02d}" if body.start_date != body.end_date else f"{body.start_date.day}.{body.start_date.month:02d}"
    d["players"] = f"{body.min_players}–{body.max_players} {body.unit}"
    return d


def _own(db: Session, app_id: int, user: User) -> Application:
    a = db.get(Application, app_id)
    if not a or a.user_id != user.id:
        raise HTTPException(404, "Ariza topilmadi")
    return a


# ---------- organizer ----------

@router.get("/applications")
def my_applications(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Application).where(Application.user_id == user.id).order_by(Application.id.desc())).all()
    return [s.application(a) for a in rows]


@router.get("/applications/{app_id}")
def get_application(app_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return s.application(_own(db, app_id, user))


@router.post("/applications", status_code=201)
def create_application(body: ApplicationIn, tasks: BackgroundTasks, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.end_date < body.start_date or body.min_players > body.max_players:
        raise HTTPException(400, "Sana yoki ishtirokchilar soni noto‘g‘ri")
    a = Application(user_id=user.id, data=_data(body), history=[])
    _event(a, "Ariza yuborildi")
    db.add(a)
    db.commit()
    tasks.add_task(notify, user.id, "application_received", {"title": body.name, "number": a.number})
    return s.application(a)


class AnswerIn(BaseModel):
    answer: str = Field(min_length=1, max_length=4000)


@router.post("/applications/{app_id}/answer")
def answer(app_id: int, body: AnswerIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    a = _own(db, app_id, user)
    if a.status != "info":
        raise HTTPException(400, "Javob so‘ralmagan")
    a.answer = body.answer
    a.status = "review"
    _event(a, "Siz javob berdingiz")
    db.commit()
    return s.application(a)


@router.put("/applications/{app_id}")
def resubmit(app_id: int, body: ApplicationIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Edit an application (while under review or info) or fix and resend a rejected one."""
    a = _own(db, app_id, user)
    if a.status == "approved":
        raise HTTPException(400, "Tasdiqlangan arizani o‘zgartirib bo‘lmaydi")
    a.data = _data(body)
    if a.status == "rejected":
        a.status, a.reason = "review", ""
        _event(a, "Qayta yuborildi")
    db.commit()
    return s.application(a)


# ---------- moderators ----------

admin = APIRouter(prefix="/api/admin/applications", tags=["admin"], dependencies=[Depends(admin_user)])


@admin.get("")
def all_applications(status: str | None = None, db: Session = Depends(get_db)):
    query = select(Application).order_by(Application.id.desc())
    if status:
        query = query.where(Application.status == status)
    return [s.application(a) for a in db.scalars(query).all()]


def _get(db: Session, app_id: int) -> Application:
    """An application a moderator can act on; marks the review as started."""
    a = db.get(Application, app_id)
    if not a:
        raise HTTPException(404, "Ariza topilmadi")
    if a.status not in ("review", "info"):
        raise HTTPException(400, "Ariza ko‘rib chiqilmayapti")
    if not any(e["title"] == "Admin ko‘ra boshladi" for e in a.history):
        _event(a, "Admin ko‘ra boshladi")
    return a


class InfoIn(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)
    fields: list[str] = []


@admin.post("/{app_id}/request-info")
def request_info(app_id: int, body: InfoIn, tasks: BackgroundTasks, mod: User = Depends(admin_user), db: Session = Depends(get_db)):
    a = _get(db, app_id)
    a.status, a.comment, a.comment_fields, a.moderator, a.answer = "info", body.comment, body.fields, mod.short_name, ""
    _event(a, "Ma’lumot so‘raldi")
    db.commit()
    tasks.add_task(notify, a.user_id, "info_requested", {"comment": body.comment})
    return s.application(a)


def _slug(title: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40] or "turnir"
    slug, n = base, 2
    while db.get(Tournament, slug):
        slug, n = f"{base}-{n}", n + 1
    return slug


@admin.post("/{app_id}/approve")
def approve(app_id: int, tasks: BackgroundTasks, db: Session = Depends(get_db)):
    a = _get(db, app_id)
    d = a.data
    club = db.get(Club, d["club_id"]) if d.get("club_id") else None
    rules = [["Format", d["format"]], ["Kirish to‘lovi", f"{d['fee']:,} so‘m".replace(",", " ") if d["fee"] else "Bepul"]]
    if d.get("prizes"):
        rules.append(["Sovrinlar", d["prizes"]])
    t = Tournament(
        id=_slug(d["name"], db), title=d["name"], sport=d["sport"], format=d["format"], img=club.img if club else "",
        status="upcoming", dates=d["dates"], start_day=date.fromisoformat(d["start_date"]), club_id=club.id if club else None,
        venue=club.name if club else d["venue"], max_players=d["max_players"], prize=d.get("prizes", "")[:80],
        fee=d["fee"], rules=rules, note=d.get("rules", ""), organizer_id=a.user_id,
    )
    db.add(t)
    a.status, a.tournament_id = "approved", t.id
    _event(a, "Tasdiqlandi")
    _event(a, "E’lon qilindi")
    db.commit()
    until = d.get("registration_until") or d["start_date"]
    tasks.add_task(notify, a.user_id, "application_approved", {
        "title": t.title, "tournament_id": t.id, "spots": t.max_players, "deadline": until,
    })
    return s.application(a)


class RejectIn(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)


@admin.post("/{app_id}/reject")
def reject(app_id: int, body: RejectIn, tasks: BackgroundTasks, db: Session = Depends(get_db)):
    a = _get(db, app_id)
    a.status, a.reason = "rejected", body.reason
    _event(a, "Rad etildi")
    db.commit()
    tasks.add_task(notify, a.user_id, "application_rejected", {"title": a.data["name"], "reason": body.reason})
    return s.application(a)
