"""Model → JSON in the shape the webapp uses (camelCase, ready-to-show labels)."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .models import Application, Booking, Club, Game, GamePlayer, Rating, Tournament, User, now
from .utils import TIMES, day_label, day_short, day_word, hh, hour, money, stamp, starts_at, today

ACTIVE = ("awaiting_payment", "confirmed")
PAY_LABELS = {"click": "Click", "payme": "Payme", "club": "Klubda"}
AVATAR_FILL = [("AT", "#FFD58A"), ("SN", "#B9C8FF"), ("MR", "#9EE6C8"), ("BO", "#FFB59A")]


# ---------- clubs ----------

def busy_starts(db: Session, type_id: int, units: int, day: date) -> list[str]:
    """Start times on `day` when every unit of the type is taken."""
    bookings = db.scalars(
        select(Booking).where(Booking.type_id == type_id, Booking.day == day, Booking.status.in_(ACTIVE))
    ).all()
    busy = []
    for t in TIMES:
        h = hour(t)
        taken = sum(1 for b in bookings if hour(b.start) <= h < hour(b.start) + b.hours)
        if taken >= units:
            busy.append(t)
    return busy


def free_today(db: Session, club: Club) -> list[str]:
    t0 = club.types[0]
    busy = set(busy_starts(db, t0.id, t0.units, today()))
    current = now().hour
    return [t for t in TIMES if hour(t) > current and t not in busy]


def club_card(db: Session, club: Club) -> dict:
    slots = free_today(db, club)
    return {
        "id": club.id,
        "name": club.name,
        "fullName": club.full_name,
        "sport": club.sport,
        "district": club.district,
        "dist": club.dist,
        "rating": f"{club.rating:.1f}",
        "reviewsCount": club.reviews_count,
        "img": club.img,
        "price": min(t.price for t in club.types),
        "slots": slots[:4],
        "nextFree": slots[0] if slots else None,
        "map": {"left": club.map_left, "top": club.map_top},
    }


def club_detail(db: Session, club: Club, days: int = 6) -> dict:
    start = today()
    return {
        **club_card(db, club),
        "photos": club.photos,
        "types": [{"id": t.id, "label": t.label, "price": t.price} for t in club.types],
        "prices": club.prices,
        "amenities": club.amenities,
        "reviews": [{"name": r.author, "stars": r.stars, "text": r.text} for r in club.reviews],
        "days": [{"date": (start + timedelta(days=i)).isoformat(), "label": day_label(start + timedelta(days=i))} for i in range(days)],
        # busy[typeId][dayIndex] = start times that cannot be booked
        "busy": {
            str(t.id): [busy_starts(db, t.id, t.units, start + timedelta(days=i)) for i in range(days)]
            for t in club.types
        },
        "times": TIMES,
    }


# ---------- bookings ----------

def booking(b: Booking) -> dict:
    begin = starts_at(b.day, b.start)
    return {
        "id": b.id,
        "number": b.id + 4820,
        "clubId": b.club_id,
        "clubName": b.club.name,
        "clubFullName": b.club.full_name,
        "img": b.club.img,
        "typeLabel": b.type.label,
        "date": b.day.isoformat(),
        "dayLabel": day_label(b.day),
        "slot": b.start,
        "end": hh(hour(b.start) + b.hours),
        "dur": b.hours,
        "price": b.price,
        "total": b.total,
        "paid": b.deposit if b.status == "confirmed" else 0,
        "deposit": b.deposit,
        "atClub": b.total - b.deposit,
        "payMethod": b.pay_method,
        "payLabel": PAY_LABELS[b.pay_method],
        "status": b.status,
        "refunded": b.refunded,
        "invite": b.invite,
        "cancelUntil": hh(hour(b.start) - 2),
        "freeCancel": now() < begin - timedelta(hours=2),
        "isToday": b.day == today(),
        "hoursLeft": max(0, round((begin - now()).total_seconds() / 3600)),
        "past": begin + timedelta(hours=b.hours) < now(),
    }


def booking_notification(b: Booking) -> dict:
    d = booking(b)
    return {
        "club": b.club.name, "type": d["typeLabel"], "day": d["dayLabel"], "start": d["slot"], "end": d["end"],
        "number": d["number"], "paid": money(d["paid"]) if d["paid"] else "", "at_club": money(d["atClub"]),
        "cancel_until": d["cancelUntil"],
    }


# ---------- users ----------

def avatar(u: User) -> dict:
    return {"i": u.initials, "bg": u.color}


def pending_rating(db: Session, me: User) -> dict | None:
    """The first co-player from a past game the user has not rated yet."""
    games = db.scalars(
        select(Game).join(GamePlayer).where(GamePlayer.user_id == me.id, Game.day < today()).order_by(Game.day.desc())
    ).all()
    for g in games:
        for p in g.players:
            if p.user_id == me.id:
                continue
            done = db.scalar(select(Rating.id).where(Rating.from_user_id == me.id, Rating.to_user_id == p.user_id, Rating.game_id == g.id))
            if not done:
                return {"gameId": g.id, "userId": p.user_id, "name": p.user.short_name, "label": f"{g.sport}, {day_short(g.day)}"}
    return None


def me(db: Session, u: User) -> dict:
    open_info = db.scalars(select(Application).where(Application.user_id == u.id)).all()
    info = [a for a in open_info if a.status == "info"]
    return {
        "id": u.id,
        "name": u.name,
        "first": u.first_name or u.name,
        "username": f"@{u.username}" if u.username else "",
        "initials": u.initials,
        "phone": u.phone,
        "roles": u.roles,
        "sports": u.sports,
        "level": u.level,
        "areas": u.areas,
        "onboarded": u.onboarded,
        "stats": {
            "games": u.games_played,
            "rating": f"{u.rating:.1f}" if u.rating else "—",
            "onTime": f"{u.on_time_pct}%" if u.on_time_pct is not None else "—",
        },
        "pendingRating": pending_rating(db, u),
        "applications": {"count": len(open_info), "needInfo": len(info)},
        "isAdmin": u.id in settings.admin_ids,
    }


def player(u: User) -> dict:
    sport = u.sports[0] if u.sports else ""
    parts = [sport, u.level.lower() if u.level else ""]
    if u.rating:
        parts.append(f"★ {u.rating:.1f}")
    return {"id": u.id, "i": u.initials, "bg": u.color, "name": u.short_name, "sport": sport,
            "meta": " · ".join(p for p in parts if p), "username": u.username or None}


# ---------- games ----------

def game(g: Game, me_id: int) -> dict:
    have = g.extra_players + len(g.players)
    avatars = [avatar(p.user) for p in g.players]
    avatars += [{"i": i, "bg": bg} for i, bg in AVATAR_FILL][: max(0, g.extra_players)]
    return {
        "id": g.id,
        "sport": g.sport,
        "level": g.level,
        "when": f"{day_word(g.day)}, {g.time}",
        "date": g.day.isoformat(),
        "time": g.time,
        "place": g.place,
        "clubId": g.club_id,
        "have": have,
        "max": g.max_players,
        "left": max(0, g.max_players - have),
        "price": g.price_text,
        "avatars": avatars[:4],
        "joined": any(p.user_id == me_id for p in g.players),
        "mine": g.author_id == me_id,
    }


# ---------- tournaments ----------

STATUS_LABEL = {"upcoming": "Kutilayotgan", "live": "Davom etayotgan", "finished": "Yakunlangan"}


def tournament(t: Tournament, me_id: int) -> dict:
    entry = next((e for e in t.entries if e.user_id == me_id), None)
    count = t.seeded_players + len(t.entries)
    people = list(t.participants) + [[e.user.initials, e.user.short_name, f"{e.user.rating:.1f}" if e.user.rating else "—", e.user.color] for e in t.entries]
    return {
        "id": t.id,
        "title": t.title,
        "img": t.img,
        "sport": t.sport,
        "tags": [f"{t.sport} · {t.format.lower()}"],
        "status": STATUS_LABEL[t.status],
        "dates": t.dates,
        "startLabel": day_short(t.start_day) if t.start_day else "",
        "clubId": t.club_id,
        "clubName": t.venue,
        "players": f"{count} / {t.max_players}",
        "count": count,
        "max": t.max_players,
        "full": count >= t.max_players,
        "prize": t.prize,
        "fee": t.fee,
        "rules": t.rules,
        "note": t.note,
        "rounds": t.rounds,
        "participants": people,
        "registered": entry is not None,
        "group": entry.group if entry else "",
    }


# ---------- applications ----------

APP_STATUS = {"review": "rev", "info": "info", "approved": "ok", "rejected": "no"}


def application(a: Application) -> dict:
    d = a.data
    return {
        "id": a.id,
        "number": a.number,
        "status": APP_STATUS[a.status],
        "title": d.get("name", ""),
        "sport": d.get("sport", ""),
        "format": d.get("format", ""),
        "venue": d.get("venue", ""),
        "dates": d.get("dates", ""),
        "players": d.get("players", ""),
        "data": d,
        "comment": a.comment,
        "commentFields": a.comment_fields,
        "moderator": a.moderator,
        "answer": a.answer,
        "reason": a.reason,
        "history": a.history,
        "tournamentId": a.tournament_id,
        "createdAt": stamp(a.created_at),
        "author": {"id": a.user.id, "name": a.user.name, "username": a.user.username},
    }
