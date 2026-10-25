"""«Bronlar va to‘lovlar»: money that went through bookings, and refund requests."""

from datetime import timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Booking, Club, now
from ..notifier import notify
from ..serializers import PAY_LABELS
from ..utils import MONTHS, day_label, hh, hour, money
from . import store
from .auth import Admin, require

router = APIRouter(prefix="/api/admin/payments", tags=["admin payments"])

MONTHS_FULL = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]


def _short(n: float) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}".replace(".", ",").replace(",0", "") + " mln"
    return f"{round(n):,}".replace(",", " ")


def status_of(b: Booking) -> str:
    if b.refund_status == "requested":
        return "refreq"
    if b.refund_status in ("refunded", "denied"):
        return b.refund_status
    if b.status == "cancelled":
        return "cancelled"
    return "paid" if b.status == "confirmed" else "pending"


def row(b: Booking) -> dict:
    fee = round(b.total * b.club.commission_pct / 100)
    who = b.contact_name or "—"
    return {
        "id": b.id, "no": f"B-{b.id + 88400}", "who": who, "what": f"{b.type.label} · {b.hours} soat",
        "when": f"{day_label(b.day)}, {b.start}–{hh(hour(b.start) + b.hours)}", "where": b.club.name,
        "sum": money(b.total).replace(" so‘m", ""), "deposit": money(b.deposit) if b.deposit else "—",
        "fee": f"{fee:,}".replace(",", " "), "pay": PAY_LABELS[b.pay_method], "st": status_of(b), "kind": "bron",
    }


@router.get("")
def payments(admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    month_start = now().date().replace(day=1)
    bookings = db.scalars(select(Booking).order_by(Booking.created_at.desc()).limit(500)).all()
    paid = [b for b in bookings if b.status == "confirmed" and b.day >= month_start]
    total = sum(b.total for b in paid)
    commission = sum(b.total * b.club.commission_pct / 100 for b in paid)
    clubs = db.scalars(select(Club)).all()
    subscribed = sum(1 for c in clubs if c.billing == "ok")
    payouts = []
    for c in clubs:
        club_total = sum(b.total for b in paid if b.club_id == c.id)
        if club_total:
            payouts.append([c.name, f"{_short(club_total - club_total * c.commission_pct / 100)} so‘m"])
    today = now().date()
    return {
        "range": f"1–{today.day} {MONTHS_FULL[today.month - 1]}",
        "kpis": {
            "total": _short(total), "totalSub": f"{len(paid)} bron · 0 turnir to‘lovi",
            "commission": _short(commission), "subs": f"{subscribed} × 300k",
            "refunds": sum(1 for b in bookings if b.refund_status == "requested"),
        },
        "rows": [row(b) for b in bookings],
        "payouts": sorted(payouts, key=lambda p: p[0])[:5],
        "nextPayout": f"{(today + timedelta(days=(0 - today.weekday()) % 7 or 7)).day}-{MONTHS[today.month - 1]}",
    }


class RefundIn(BaseModel):
    approve: bool


@router.post("/{booking_id}/refund")
def decide_refund(booking_id: int, body: RefundIn, tasks: BackgroundTasks, admin: Admin = Depends(require(store.P_MONEY)), db: Session = Depends(get_db)):
    b = db.get(Booking, booking_id)
    if not b or b.refund_status != "requested":
        raise HTTPException(400, "Qaytarish so‘ralmagan")
    b.refund_status, b.refunded = ("refunded", True) if body.approve else ("denied", False)
    store.log(db, admin.user, f"B-{b.id + 88400} bo‘yicha pul qaytarishni {'tasdiqladi' if body.approve else 'rad etdi'}")
    db.commit()
    tasks.add_task(notify, b.user_id, "refund_approved" if body.approve else "refund_denied",
                   {"club": b.club.name, "amount": money(b.deposit), "day": day_label(b.day), "start": b.start})
    return row(b)
