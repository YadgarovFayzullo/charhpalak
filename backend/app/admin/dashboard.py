"""«Boshqaruv»: KPIs, queue, bookings chart and the team feed, all from the database."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Activity, Application, Booking, BusinessLead, Club, Complaint, Tournament, User, now
from . import store
from .auth import Admin, staff_user
from .content import featured
from .requests import item

router = APIRouter(prefix="/api/admin/dashboard", tags=["admin dashboard"])

WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]
FEED_COLORS = ["#FFE4D6", "#B9C8FF", "#9EE6C8", "#FFD58A"]


def _mln(n: float) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}".replace(".", ",").replace(",0", "") + " mln"
    return f"{round(n):,}".replace(",", " ")


def _delta(cur: int, prev: int, label: str) -> tuple[str, str]:
    if not prev:
        return (f"{cur} ta" if cur else "hali yo‘q", "#5A6B5E")
    pct = round((cur - prev) / prev * 100)
    return (f"{'+' if pct >= 0 else ''}{pct}% {label}", "#2C7A12" if pct >= 0 else "#B4321C")


@router.get("")
def dashboard(period: int = 1, admin: Admin = Depends(staff_user), db: Session = Depends(get_db)):
    today = now().date()
    days = {0: 1, 1: 7, 2: 30}.get(period, 7)
    start, prev_start = today - timedelta(days=days - 1), today - timedelta(days=2 * days - 1)

    confirmed = db.scalars(select(Booking).where(Booking.status == "confirmed", Booking.day >= prev_start, Booking.day <= today)).all()
    cur = [b for b in confirmed if b.day >= start]
    prev = [b for b in confirmed if b.day < start]
    revenue = sum(b.total for b in cur)
    share = sum(b.total * b.club.commission_pct / 100 for b in cur)

    open_apps = db.scalars(select(Application).where(Application.status.in_(("new", "review", "info")))).all()
    open_leads = db.scalars(select(BusinessLead).where(BusinessLead.status.in_(("new", "review", "info")))).all()
    queue = [item(db, o) for o in sorted([*open_apps, *open_leads], key=lambda o: o.created_at)]
    late = [r for r in queue if r["late"]]
    complaints = db.scalars(select(Complaint).where(Complaint.status == "open")).all()
    urgent = sum(1 for c in complaints if c.priority == "Shoshilinch")
    users = db.scalars(select(User).where(User.onboarded.is_(True))).all()
    new_users = sum(1 for u in users if u.created_at.date() >= start)

    label = {0: "kechagidan", 1: "o‘tgan haftadan", 2: "o‘tgan oydan"}[period]
    d, c = _delta(len(cur), len(prev), label)
    last_kpi = (["Ochiq shikoyatlar", str(len(complaints)), f"{urgent} tasi shoshilinch" if urgent else "shoshilinch yo‘q", "#B4321C" if urgent else "#5A6B5E", "/shikoyatlar"]
                if period == 0 else
                ["Faol foydalanuvchi", f"{len(users):,}".replace(",", " "), f"+{new_users} yangi", "#2C7A12", "/foydalanuvchilar"])
    kpis = [
        ["Bronlar", str(len(cur)), d, c, "/tolovlar"],
        ["Tushum", _mln(revenue), f"KiGo ulushi {_mln(share)}", "#5A6B5E", "/tolovlar"],
        ["Yangi arizalar", str(len(queue)), f"{len(late)} tasi muddati o‘tgan" if late else "muddati o‘tgani yo‘q", "#B4321C" if late else "#5A6B5E", "/arizalar"],
        last_kpi,
    ]

    # Chart: last 7 days for "Bugun" / "7 kun", 5 weeks for "30 kun".
    if period == 2:
        weeks = [today - timedelta(days=7 * (4 - i) + 6) for i in range(5)]
        rows = db.scalars(select(Booking).where(Booking.status == "confirmed", Booking.day >= weeks[0], Booking.day <= today)).all()
        bars = [sum(1 for b in rows if w <= b.day <= w + timedelta(days=6)) for w in weeks] + [0, 0]
        labels = ["1-h", "2-h", "3-h", "4-h", "5-h", "", ""]
    else:
        week = [today - timedelta(days=6 - i) for i in range(7)]
        rows = db.scalars(select(Booking).where(Booking.status == "confirmed", Booking.day >= week[0], Booking.day <= today)).all()
        bars = [sum(1 for b in rows if b.day == dd) for dd in week]
        labels = [WEEKDAYS[dd.weekday()] for dd in week]

    content = store.get(db, "content")
    from .content import SITE
    banner = db.scalar(select(Tournament).where(Tournament.banner.is_(True)))
    on = content["on"]
    live = [
        ["Bosh banner", f"«{banner.title}»" if banner else "umumiy"],
        ["Tanlangan turnirlar", f"{len(featured(db))} / 4 joy"],
        ["Tavsiya klublar", f"{sum(1 for cl in db.scalars(select(Club)).all() if cl.featured)} ta"],
        ["Homiy logotiplari", f"{len(content['sponsors'])} ta"],
        ["Do‘kon kutish ro‘yxati", "yoqilgan" if on.get("sayt:shop", SITE[-1][3]) else "o‘chirilgan"],
    ]

    feed_rows = db.scalars(select(Activity).order_by(Activity.at.desc()).limit(5)).all()
    feed = [[a.user.initials if a.user else "TZ", FEED_COLORS[(a.user_id or 0) % len(FEED_COLORS)] if a.user else "#FFD58A",
             (a.user.short_name or a.user.name) if a.user else "Tizim", a.text, a.at.strftime("%H:%M") if a.at.date() == today else a.at.strftime("%d.%m")]
            for a in feed_rows]

    refunds = db.scalars(select(Booking).where(Booking.refund_status == "requested")).all()
    return {
        "kpis": kpis, "bars": bars, "labels": labels, "queue": queue[:5], "late": len(late),
        "live": live, "feed": feed, "refunds": len(refunds), "complaints": len(complaints),
    }
