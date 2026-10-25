"""Background loop: remind players one hour before their booking."""

import asyncio
import logging
from datetime import timedelta

from sqlalchemy import select

from .db import SessionLocal
from .models import Booking, now
from .notifier import notify
from .utils import starts_at, today

log = logging.getLogger(__name__)
LEAD = timedelta(hours=1)


def send_due_reminders() -> int:
    sent = 0
    with SessionLocal() as db:
        rows = db.scalars(
            select(Booking).where(Booking.status == "confirmed", Booking.reminded.is_(False), Booking.day >= today() - timedelta(days=1))
        ).all()
        for b in rows:
            begin = starts_at(b.day, b.start)
            if now() <= begin <= now() + LEAD:
                notify(b.user_id, "booking_reminder", {"club": b.club.name, "start": b.start})
                b.reminded = True
                sent += 1
        db.commit()
    return sent


async def reminder_loop(interval: int = 60) -> None:
    while True:
        try:
            await asyncio.to_thread(send_due_reminders)
        except Exception:  # keep the loop alive whatever happens in one pass
            log.exception("reminder pass failed")
        await asyncio.sleep(interval)
