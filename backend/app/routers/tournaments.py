from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import serializers as s
from ..auth import current_user
from ..db import get_db
from ..models import Tournament, TournamentEntry, User
from ..notifier import notify
from ..utils import money

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

GROUPS = "ABCDEFGH"


@router.get("")
def list_tournaments(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Tournament).order_by(Tournament.start_day)).all()
    return [s.tournament(t, user.id) for t in rows]


@router.get("/{tid}")
def get_tournament(tid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    t = db.get(Tournament, tid)
    if not t:
        raise HTTPException(404, "Turnir topilmadi")
    return s.tournament(t, user.id)


@router.post("/{tid}/register")
def toggle_register(tid: str, tasks: BackgroundTasks, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Register or unregister. The entry fee is not charged yet (same payment stub as bookings)."""
    t = db.get(Tournament, tid)
    if not t:
        raise HTTPException(404, "Turnir topilmadi")
    if t.status != "upcoming":
        raise HTTPException(400, "Ro‘yxatdan o‘tish yopilgan")

    entry = next((e for e in t.entries if e.user_id == user.id), None)
    if entry:
        t.entries.remove(entry)
    else:
        count = t.seeded_players + len(t.entries)
        if count >= t.max_players:
            raise HTTPException(409, "Joylar tugadi")
        t.entries.append(TournamentEntry(user_id=user.id, group=GROUPS[count % len(GROUPS)]))
    db.commit()
    db.refresh(t)

    if not entry and t.organizer_id:
        count = t.seeded_players + len(t.entries)
        tasks.add_task(notify, t.organizer_id, "new_participant",
                       {"names": user.short_name, "amount": money(t.fee), "count": count, "max": t.max_players})
    return s.tournament(t, user.id)
