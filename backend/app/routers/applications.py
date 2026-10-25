"""Tournament hosting applications, the organizer's side. Moderation lives in admin/requests.py."""

from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import serializers as s
from ..admin.requests import notify_staff_new_request
from ..auth import current_user
from ..db import get_db
from ..models import Application, User, now
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


@router.get("/applications")
def my_applications(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Application).where(Application.user_id == user.id).order_by(Application.id.desc())).all()
    return [s.application(a) for a in rows]


@router.get("/applications/{app_id}")
def get_application(app_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return s.application(_own(db, app_id, user))


@router.post("/applications", status_code=201)
def create_application(body: ApplicationIn, tasks: BackgroundTasks, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not user.can_apply:
        raise HTTPException(403, "Sizga turnir arizasi berish cheklangan. @kigo_sherik ga yozing.")
    if body.end_date < body.start_date or body.min_players > body.max_players:
        raise HTTPException(400, "Sana yoki ishtirokchilar soni noto‘g‘ri")
    a = Application(user_id=user.id, data=_data(body), history=[], status="new")
    _event(a, "Ariza yuborildi")
    db.add(a)
    db.commit()
    tasks.add_task(notify, user.id, "application_received", {"title": body.name, "number": a.number})
    for args in notify_staff_new_request(db, body.name, "Turnir"):
        tasks.add_task(notify, *args)
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
def resubmit(app_id: int, body: ApplicationIn, tasks: BackgroundTasks, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Edit an application (while under review or info) or fix and resend a rejected one."""
    a = _own(db, app_id, user)
    if a.status == "approved":
        raise HTTPException(400, "Tasdiqlangan arizani o‘zgartirib bo‘lmaydi")
    if a.status == "rejected" and not a.allow_resend:
        raise HTTPException(400, "Bu arizani qayta yuborib bo‘lmaydi")
    a.data = _data(body)
    if a.status == "rejected":
        # A fixed application comes back to moderators as new.
        a.status, a.reason, a.checks = "new", "", []
        _event(a, "Qayta yuborildi")
        for args in notify_staff_new_request(db, body.name, "Turnir"):
            tasks.add_task(notify, *args)
    db.commit()
    return s.application(a)
