from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import serializers as s
from ..auth import current_user
from ..db import get_db
from ..models import Club

router = APIRouter(prefix="/api/clubs", tags=["clubs"], dependencies=[Depends(current_user)])


@router.get("")
def list_clubs(
    sport: str | None = None,
    q: str | None = None,
    district: str | None = None,
    max_price: int | None = None,
    min_rating: float | None = None,
    free_only: bool = False,
    db: Session = Depends(get_db),
):
    clubs = db.scalars(select(Club).where(Club.blocked.is_(False)).order_by(Club.dist)).all()
    out = []
    for c in clubs:
        if sport and sport != "Hammasi" and c.sport != sport:
            continue
        if q and q.lower() not in c.name.lower() and q.lower() not in c.sport.lower():
            continue
        if district and c.district != district:
            continue
        if min_rating and c.rating < min_rating:
            continue
        card = s.club_card(db, c)
        if max_price and card["price"] > max_price:
            continue
        if free_only and not card["slots"]:
            continue
        out.append(card)
    return out


@router.get("/{club_id}")
def get_club(club_id: str, db: Session = Depends(get_db)):
    club = db.get(Club, club_id)
    if not club or club.blocked:
        raise HTTPException(404, "Klub topilmadi")
    return s.club_detail(db, club)
