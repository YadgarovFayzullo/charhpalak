from datetime import date, datetime, timedelta

from .models import now

WEEKDAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"]  # date.weekday(): Monday = 0
WEEKDAYS_FULL = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"]

# Start times shown on the club page, evening only as in the design. "00:00" is midnight after 23:00.
TIMES = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"]


def today() -> date:
    return now().date()


def hour(t: str) -> int:
    """'19:00' → 19, '00:00' → 24 (an evening slot, not the morning)."""
    h = int(t[:2])
    return h + 24 if h < 6 else h


def hh(h: int) -> str:
    return f"{h % 24:02d}:00"


def starts_at(day: date, t: str) -> datetime:
    return datetime.combine(day, datetime.min.time()) + timedelta(hours=hour(t))


def day_short(d: date) -> str:
    return f"{d.day}-{MONTHS[d.month - 1]}"


def day_label(d: date) -> str:
    """'Bugun, 24-okt' / 'Shan, 25-okt' — the format of the club and booking screens."""
    w = "Bugun" if d == today() else WEEKDAYS[d.weekday()]
    return f"{w}, {day_short(d)}"


def day_word(d: date) -> str:
    """'Bugun' / 'Ertaga' / 'Shanba' / '2-noy' — the format of game cards."""
    delta = (d - today()).days
    if delta == 0:
        return "Bugun"
    if delta == 1:
        return "Ertaga"
    if 1 < delta < 7:
        return WEEKDAYS_FULL[d.weekday()]
    return day_short(d)


def stamp(dt: datetime) -> str:
    return f"{day_short(dt.date())}, {dt:%H:%M}"


def money(n: int) -> str:
    return f"{n:,}".replace(",", " ") + " so‘m"


def next_weekday(weekday: int) -> date:
    d = today()
    return d + timedelta(days=(weekday - d.weekday()) % 7 or 7)
