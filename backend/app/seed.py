"""Demo data from the KiGo design. Loaded once, into an empty database."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .models import Application, Booking, Club, ClubType, Game, GamePlayer, Review, Tournament, User, now
from .utils import next_weekday, stamp, today

CLUBS = [
    dict(id="pirat", name="«Pirat» bilyard", full_name="«Pirat» bilyard klubi", sport="Bilyard", district="Yunusobod", dist="1,2 km",
         rating=4.7, reviews_count=312, img="images/billiards.jpg", photos=24, map_left="40%", map_top="30%",
         prices=[["Rus bilyardi, kunduzi", "40 000/soat"], ["Rus bilyardi, 18:00 dan", "55 000/soat"], ["Pul (amerikancha)", "45 000/soat"], ["VIP xona", "90 000/soat"]],
         amenities=["Bar", "Parking", "Wi‑Fi", "12 stol"],
         types=[("Rus bilyardi", 55000), ("Pul", 45000), ("VIP", 90000)],
         reviews=[("Aziz T.", 5, "Stollar tekis, movut yangi. Kelganda stol tayyor turgan edi."), ("Rustam M.", 4, "Kechqurun odam ko‘p, oldindan bron qiling.")]),
    dict(id="aqua", name="«Aqua Sport»", full_name="«Aqua Sport» basseyni", sport="Suzish", district="Yunusobod", dist="2,0 km",
         rating=4.6, img="images/pool.jpg", map_left="15%", map_top="52%", prices=[["Yo‘lak", "60 000/soat"]], types=[("Yo‘lak", 60000)]),
    dict(id="olimp", name="«Olimp» korti", full_name="«Olimp» tennis korti", sport="Tennis", district="Mirzo Ulug‘bek", dist="3,4 km",
         rating=4.9, img="images/coach-tennis.jpg", map_left="62%", map_top="60%", prices=[["Kort", "180 000/soat"]], types=[("Kort", 180000)]),
    dict(id="streetball", name="Streetball Park", full_name="Streetball Park", sport="Basketbol", district="Chilonzor", dist="6,8 km",
         rating=4.5, img="images/basketball-cup.jpg", map_left="70%", map_top="20%", prices=[["Maydon", "120 000/soat"]], types=[("Maydon", 120000)]),
]

# Demo players. Ids are below any real Telegram id range used in practice.
PLAYERS = [
    (1, "Malika", "R", ["Tennis"], "Kuchli", 4.9, "#9EE6C8"),
    (2, "Aziz", "T", ["Bilyard"], "O‘rta", 4.6, "#FFD58A"),
    (3, "Sardor", "N", ["Padel"], "Boshlang‘ich", 4.7, "#B9C8FF"),
    (4, "Bobur", "O", ["Futbol"], "O‘rta", 4.8, "#FFB59A"),
    (5, "Davron", "I", ["Basketbol"], "O‘rta", 4.6, "#C8F25A"),
    (6, "Rustam", "M", ["Bilyard"], "O‘rta", 4.5, "#9EE6C8"),
]

# Busy start times at «Pirat», Rus bilyardi, for today + n days (from the design).
PIRAT_BUSY = [["18:00", "22:00"], ["19:00"], [], ["21:00"], [], ["18:00"]]

RULES = [
    ["Format", "Guruhlar 8×8, keyin pley-off 16 kishi"],
    ["Kirish to‘lovi", "50 000 so‘m · ro‘yxat 10-noyabrgacha"],
    ["Sovrinlar", "1-o‘rin 2,5 mln + kubok · 2-o‘rin 1,5 mln · 3-o‘rin 1 mln"],
]
ROUNDS = [
    {"label": "Chorak final", "matches": [["Aziz T.", "3", "Bobur O.", "1"], ["Rustam M.", "2", "Sardor N.", "3"], ["Jasur K.", "3", "Timur A.", "0"], ["Davron I.", "—", "Ulug‘bek S.", "—"]]},
    {"label": "Yarim final", "matches": [["Aziz T.", "—", "Sardor N.", "—"], ["Jasur K.", "—", "G‘olib 4-juft", "—"]]},
    {"label": "Final", "matches": [["—", "—", "—", "—"]]},
]
PARTICIPANTS = [["AT", "Aziz T.", "4.6", "#FFD58A"], ["BO", "Bobur O.", "4.8", "#FFB59A"], ["RM", "Rustam M.", "4.5", "#9EE6C8"],
                ["SN", "Sardor N.", "4.7", "#B9C8FF"], ["JK", "Jasur K.", "4.8", "#C8F25A"], ["TA", "Timur A.", "4.3", "#FFD58A"]]


def seed(db: Session) -> None:
    if db.scalar(select(Club.id).limit(1)):
        return

    for c in CLUBS:
        c = dict(c)
        types, reviews = c.pop("types"), c.pop("reviews", [])
        club = Club(**c)
        club.types = [ClubType(label=l, price=p) for l, p in types]
        club.reviews = [Review(author=a, stars=s, text=t) for a, s, t in reviews]
        db.add(club)

    for pid, first, last, sports, level, rating, color in PLAYERS:
        db.add(User(id=pid, first_name=first, last_name=last, sports=sports, level=level, rating=rating,
                    rating_count=20, onboarded=True, color=color, games_played=30))
    db.flush()

    pirat_rus = db.scalar(select(ClubType).where(ClubType.club_id == "pirat", ClubType.label == "Rus bilyardi"))
    for offset, times in enumerate(PIRAT_BUSY):
        for t in times:
            db.add(Booking(user_id=6, club_id="pirat", type_id=pirat_rus.id, day=today() + timedelta(days=offset), start=t, hours=1,
                           price=55000, total=55000, deposit=20000, pay_method="click", status="confirmed", reminded=True))

    saturday = next_weekday(5)
    games = [
        Game(sport="Futbol", level="O‘rta", day=today(), time="19:00", place="«Arena» · 6×6", max_players=12, extra_players=10, price_text="30 000/kishi"),
        Game(sport="Bilyard", level="Har qanday", day=today(), time="21:00", place="«Pirat» · Rus bilyardi", club_id="pirat", max_players=2, price_text="55 000/kishi", author_id=2),
        Game(sport="Padel", level="Boshlang‘ich", day=today() + timedelta(days=1), time="08:00", place="«Padel Club»", max_players=4, extra_players=2, price_text="75 000/kishi", author_id=3),
        Game(sport="Tennis", level="Kuchli", day=saturday, time="10:00", place="«Olimp» · juftlik", club_id="olimp", max_players=4, extra_players=1, price_text="90 000/kishi", author_id=1),
    ]
    games[1].players = [GamePlayer(user_id=2)]
    games[2].players = [GamePlayer(user_id=3)]
    games[3].players = [GamePlayer(user_id=1)]
    db.add_all(games)

    db.add(Tournament(
        id="pirat-cup", title="Pirat Cup 2026", sport="Bilyard", format="Yakka", img="images/billiards.jpg", status="upcoming",
        dates="12–14 noyabr", start_day=date(2026, 11, 12), club_id="pirat", venue="«Pirat»",
        max_players=64, seeded_players=32, prize="5 000 000 so‘m", fee=50000, rules=RULES,
        note="O‘yindan 15 daqiqa oldin keling. 10 daqiqa kechiksangiz texnik mag‘lubiyat.", rounds=ROUNDS, participants=PARTICIPANTS,
    ))

    if settings.dev_mode:
        _seed_dev_user(db, pirat_rus, saturday)
    db.commit()


def _seed_dev_user(db: Session, pirat_rus: ClubType, saturday) -> None:
    """The demo user's own data so every screen has something to show in development."""
    uid = settings.dev_user_id
    db.add(User(id=uid, first_name="Jasur", last_name="Karimov", username="jasur_k", phone="+998 90 123 45 67",
                roles=["p"], sports=["Futbol", "Bilyard"], level="O‘rta", areas=["Yunusobod"], onboarded=True,
                rating=4.8, rating_count=40, games_played=64, on_time_pct=96))
    db.add(Booking(user_id=uid, club_id="pirat", type_id=pirat_rus.id, day=today(), start="23:00", hours=1, price=55000,
                   total=55000, deposit=20000, pay_method="click", status="confirmed"))
    olimp = db.scalar(select(ClubType).where(ClubType.club_id == "olimp"))
    db.add(Booking(user_id=uid, club_id="olimp", type_id=olimp.id, day=saturday, start="19:00", hours=1, price=180000,
                   total=180000, deposit=20000, pay_method="payme", status="confirmed"))

    # A past game with Aziz T. so the "rate your partner" card appears.
    past = Game(sport="Futbol", level="O‘rta", day=today() - timedelta(days=2), time="19:00", place="«Arena» · 6×6",
                max_players=12, extra_players=8, price_text="30 000/kishi")
    past.players = [GamePlayer(user_id=uid), GamePlayer(user_id=2)]
    db.add(past)

    created = now() - timedelta(hours=3)
    db.add(Application(
        user_id=uid, status="info", moderator="Aziza K.",
        comment="Klubdan kortlarni band qilish bo‘yicha tasdiq hali kelmadi. Klub bilan kelishganingizni ko‘rsatuvchi xat yoki administrator kontaktini yuboring. Sovrin fondi manbasini ham yozing.",
        comment_fields=["Joy va sana", "Sovrinlar"],
        data={"name": "Chilonzor Padel Open", "sport": "Padel", "format": "Juftlik", "level": "Havaskor", "venue": "Padel Club «Chilonzor»",
              "club_id": None, "start_date": "2026-11-15", "end_date": "2026-11-16", "dates": "15–16.11", "players": "8–16 juftlik",
              "max_players": 16, "min_players": 8, "fee": 200000, "prizes": "1-o‘rin: 3 000 000 so‘m + kubok", "rules": ""},
        history=[{"title": "Ariza yuborildi", "at": stamp(created)}, {"title": "Admin ko‘ra boshladi", "at": stamp(created + timedelta(hours=2))},
                 {"title": "Ma’lumot so‘raldi", "at": stamp(created + timedelta(hours=3))}],
        created_at=created,
    ))
