from datetime import date, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import serializers as s
from ..auth import current_user
from ..db import get_db
from ..admin import store
from ..models import Booking, ClubType, User, now
from ..notifier import notify
from ..utils import TIMES, hour, starts_at, today

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

DEPOSIT = 20000
MAX_DAYS_AHEAD = 30


class BookingIn(BaseModel):
    club_id: str
    type_id: int
    date: date
    start: str
    hours: int = Field(ge=1, le=3)
    pay_method: str = Field(pattern="^(click|payme|club)$")
    invite: bool = False
    name: str = Field(default="", max_length=80)
    phone: str = Field(default="", max_length=32)


def _own(db: Session, booking_id: int, user: User) -> Booking:
    b = db.get(Booking, booking_id)
    if not b or b.user_id != user.id:
        raise HTTPException(404, "Bron topilmadi")
    return b


@router.get("")
def my_bookings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Booking).where(Booking.user_id == user.id).order_by(Booking.day, Booking.start)).all()
    items = [s.booking(b) for b in rows]
    # Upcoming first (soonest on top), then past and cancelled.
    return sorted(items, key=lambda b: (b["past"] or b["status"] == "cancelled", b["date"] if not b["past"] else "", b["slot"]))


@router.get("/{booking_id}")
def get_booking(booking_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return s.booking(_own(db, booking_id, user))


@router.post("", status_code=201)
def create_booking(body: BookingIn, tasks: BackgroundTasks, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not user.can_book:
        raise HTTPException(403, "Sizga bron qilish cheklangan. @kigo_sherik ga yozing.")
    ctype = db.get(ClubType, body.type_id)
    if not ctype or ctype.club_id != body.club_id or ctype.club.blocked:
        raise HTTPException(404, "Klub yoki stol turi topilmadi")
    if not ctype.club.bookable:
        raise HTTPException(403, "Bu klubda bron vaqtincha yopiq")
    if body.start not in TIMES:
        raise HTTPException(400, "Bu vaqtda bron qilib bo‘lmaydi")
    if not today() <= body.date <= today() + timedelta(days=MAX_DAYS_AHEAD):
        raise HTTPException(400, "Sana noto‘g‘ri")
    if starts_at(body.date, body.start) <= now():
        raise HTTPException(400, "Bu vaqt o‘tib ketgan")

    busy = set(s.busy_starts(db, ctype.id, ctype.units, body.date))
    wanted = [t for t in TIMES if hour(body.start) <= hour(t) < hour(body.start) + body.hours]
    if any(t in busy for t in wanted):
        raise HTTPException(409, "Bu vaqt band, boshqa vaqtni tanlang")

    total = ctype.price * body.hours
    deposit = 0 if body.pay_method == "club" else min(DEPOSIT, total)
    b = Booking(
        user_id=user.id, club_id=body.club_id, type_id=ctype.id, day=body.date, start=body.start, hours=body.hours,
        price=ctype.price, total=total, deposit=deposit, pay_method=body.pay_method, invite=body.invite,
        status="confirmed" if deposit == 0 else "awaiting_payment",
        contact_name=body.name or user.name, contact_phone=body.phone or user.phone,
    )
    db.add(b)
    if body.phone and not user.phone:
        user.phone = body.phone
    db.commit()
    if b.status == "confirmed":
        tasks.add_task(notify, user.id, "booking_confirmed", s.booking_notification(b))
    return s.booking(b)


@router.post("/{booking_id}/pay")
def pay(booking_id: int, tasks: BackgroundTasks, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Payment stub: confirms the booking right away.

    Production: create a Click/Payme invoice (or a Telegram invoice link for WebApp.openInvoice)
    and confirm the booking from the provider's callback instead of here.
    """
    b = _own(db, booking_id, user)
    if b.status != "awaiting_payment":
        raise HTTPException(400, "Bron to‘lovni kutmayapti")
    b.status = "confirmed"
    db.commit()
    tasks.add_task(notify, user.id, "booking_confirmed", s.booking_notification(b))
    return s.booking(b)


@router.post("/{booking_id}/cancel")
def cancel(booking_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    b = _own(db, booking_id, user)
    if b.status == "cancelled":
        raise HTTPException(400, "Bron allaqachon bekor qilingan")
    info = s.booking(b)
    if info["past"]:
        raise HTTPException(400, "O‘tgan bronni bekor qilib bo‘lmaydi")
    # Early cancel: the deposit goes back automatically (unless the rule is off).
    # Late cancel: the refund becomes a request for the club/admins in the CRM.
    if b.status == "confirmed" and b.deposit > 0:
        if info["freeCancel"] and store.rule(db, store.R_AUTO_REFUND):
            b.refunded, b.refund_status = True, "refunded"
        else:
            b.refund_status = "requested"
    b.status = "cancelled"
    db.commit()
    return s.booking(b)
