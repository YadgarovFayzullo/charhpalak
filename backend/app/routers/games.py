from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import serializers as s
from ..auth import current_user
from ..db import get_db
from ..models import Club, Game, GamePlayer, User
from ..utils import today

router = APIRouter(prefix="/api/games", tags=["games"])


class GameIn(BaseModel):
    sport: str = Field(max_length=32)
    level: str = Field(max_length=32)
    date: date
    time: str = Field(pattern=r"^\d\d:\d\d$")
    place: str = Field(min_length=1, max_length=120)
    club_id: str | None = None
    need: int = Field(ge=1, le=21)
    price: str = Field(default="", max_length=40)
    to_group: bool = False


@router.get("")
def list_games(sport: str | None = None, mine: bool = False, user: User = Depends(current_user), db: Session = Depends(get_db)):
    query = select(Game).where(Game.day >= today()).order_by(Game.day, Game.time)
    if sport and sport != "Hammasi":
        query = query.where(Game.sport == sport)
    games = [s.game(g, user.id) for g in db.scalars(query).all()]
    return [g for g in games if g["joined"] or g["mine"]] if mine else games


@router.post("", status_code=201)
def create_game(body: GameIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.date < today() or body.date > today() + timedelta(days=60):
        raise HTTPException(400, "Sana noto‘g‘ri")
    if body.club_id and not db.get(Club, body.club_id):
        raise HTTPException(404, "Klub topilmadi")
    g = Game(
        author_id=user.id, sport=body.sport, level=body.level, day=body.date, time=body.time, place=body.place,
        club_id=body.club_id, max_players=body.need + 1, price_text=body.price or "bepul", to_group=body.to_group,
    )
    g.players.append(GamePlayer(user_id=user.id))
    db.add(g)
    db.commit()
    # TODO: when to_group is set, the bot should post the game to the city's Telegram group.
    return s.game(g, user.id)


@router.post("/{game_id}/join")
def toggle_join(game_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    g = db.get(Game, game_id)
    if not g or g.day < today():
        raise HTTPException(404, "O‘yin topilmadi")
    mine = next((p for p in g.players if p.user_id == user.id), None)
    if mine:
        if g.author_id == user.id:
            raise HTTPException(400, "E’lon egasi o‘yindan chiqa olmaydi")
        g.players.remove(mine)
    else:
        if g.extra_players + len(g.players) >= g.max_players:
            raise HTTPException(409, "O‘yin to‘ldi")
        g.players.append(GamePlayer(user_id=user.id))
    db.commit()
    db.refresh(g)
    return s.game(g, user.id)
