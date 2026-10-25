from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import serializers as s
from ..auth import current_user
from ..db import get_db
from ..admin.content import app_blocks
from ..admin.requests import notify_staff_new_request
from ..models import BusinessLead, Game, Rating, User, now
from ..notifier import notify
from ..utils import stamp

router = APIRouter(prefix="/api", tags=["users"])


class ProfileIn(BaseModel):
    roles: list[str] | None = None
    sports: list[str] | None = None
    level: str | None = None
    areas: list[str] | None = None
    phone: str | None = Field(default=None, max_length=32)
    onboarded: bool | None = None


@router.get("/me")
def get_me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return s.me(db, user)


@router.patch("/me")
def update_me(body: ProfileIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(user, key, value)
    db.commit()
    return s.me(db, user)


@router.get("/players")
def players(sport: str | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)):
    users = db.scalars(select(User).where(User.id != user.id, User.onboarded.is_(True)).order_by(User.rating.desc())).all()
    out = [s.player(u) for u in users if u.sports]
    return [p for p in out if not sport or sport == "Hammasi" or p["sport"] == sport]


class RatingIn(BaseModel):
    game_id: int
    user_id: int
    stars: int = Field(ge=1, le=5)


@router.post("/ratings")
def rate(body: RatingIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    game = db.get(Game, body.game_id)
    ids = {p.user_id for p in game.players} if game else set()
    if user.id not in ids or body.user_id not in ids or body.user_id == user.id:
        raise HTTPException(400, "Siz bu o‘yinchi bilan o‘ynamagansiz")
    if db.scalar(select(Rating.id).where(Rating.from_user_id == user.id, Rating.to_user_id == body.user_id, Rating.game_id == game.id)):
        raise HTTPException(409, "Allaqachon baholangan")

    db.add(Rating(from_user_id=user.id, to_user_id=body.user_id, game_id=game.id, stars=body.stars))
    target = db.get(User, body.user_id)
    total = (target.rating or 0) * target.rating_count + body.stars
    target.rating_count += 1
    target.rating = round(total / target.rating_count, 2)
    db.commit()
    return {"ok": True, "pendingRating": s.pending_rating(db, user)}


class LeadIn(BaseModel):
    kind: str = Field(default="club", pattern="^(club|coach|sponsor)$")
    club_name: str = Field(min_length=1, max_length=120)
    sport: str = Field(max_length=32)
    phone: str = Field(min_length=5, max_length=32)


@router.post("/business-leads", status_code=201)
def business_lead(body: LeadIn, tasks: BackgroundTasks, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """«Klubni ulash» / «Murabbiy bo‘lish» from the mini app; lands in the CRM «Arizalar»."""
    label = {"club": "Klub", "coach": "Murabbiy", "sponsor": "Homiy"}[body.kind]
    lead = BusinessLead(
        user_id=user.id, kind=body.kind, club_name=body.club_name, sport=body.sport, phone=body.phone,
        contact=user.name, telegram=f"@{user.username}" if user.username else "", sub=f"{body.sport} · mini ilovadan",
        details=[["Sport", body.sport], ["Telefon", body.phone]], status="new",
        history=[{"title": "Ariza yuborildi", "at": stamp(now()), "who": user.name}],
    )
    db.add(lead)
    db.commit()
    for args in notify_staff_new_request(db, body.club_name, label):
        tasks.add_task(notify, *args)
    return {"ok": True, "id": lead.id, "number": lead.number}


@router.get("/content")
def public_content(db: Session = Depends(get_db)):
    """Which mini app home blocks are switched on in the CRM («Landing va ilova»)."""
    return {"app": app_blocks(db)}
