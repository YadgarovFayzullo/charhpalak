"""Demo data from the KiGo design. Loaded once, into an empty database."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .models import Application, Booking, BusinessLead, Club, ClubType, Coach, Complaint, Game, GamePlayer, Review, Tournament, User, now
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
        organizer_name="«Pirat» klubi", collected="1,6 mln", featured_pos=1,
    ))

    _seed_crm(db, pirat_rus)
    if settings.dev_mode:
        _seed_dev_user(db, pirat_rus, saturday)
    db.commit()


# Partnership data for the CRM «Klublar» tab: id → fields
CLUB_BILLING = {
    "pirat": dict(owner="Rustam M. · @pirat_billiard", tariff="300 000 + 1%", commission_pct=1, next_payment="1-noyabr", billing="ok", crm_connected=True, featured=True),
    "aqua": dict(owner="Akmal N.", tariff="300 000 + 2%", commission_pct=2, next_payment="22-noyabr", billing="trial"),
    "olimp": dict(owner="Ibrohim Q.", tariff="300 000 + 1%", commission_pct=1, next_payment="14-noyabr", billing="ok", crm_connected=True, featured=True),
    "streetball": dict(owner="Sanjar B.", tariff="300 000 + 2%", commission_pct=2, next_payment="5-oktabr", billing="debt", crm_connected=True),
}

# Extra demo people who send requests in the CRM
CRM_USERS = [
    (7, "Jamshid", "Usmonov", "jamshid3x3", "+998 97 777 03 03", "#FFB59A"),
    (8, "Run", "Tashkent", "runtashkent", "+998 90 900 90 90", "#B9C8FF"),
    (9, "Sardor", "X", "sard0r_x", "+998 97 000 00 40", "#ECEFE9"),
]


def _seed_crm(db: Session, pirat_rus: ClubType) -> None:
    """Demo content for every CRM screen, from the KiGo Admin design."""
    for cid, fields in CLUB_BILLING.items():
        club = db.get(Club, cid)
        for k, v in fields.items():
            setattr(club, k, v)

    for uid, first, last, username, phone, color in CRM_USERS:
        db.add(User(id=uid, first_name=first, last_name=last, username=username, phone=phone, color=color, onboarded=True,
                    sports=["Basketbol"], city="Samarqand" if uid == 9 else "Toshkent", warned=1 if uid == 9 else 0, no_shows=3 if uid == 9 else 0))
    db.get(User, 1).username, db.get(User, 1).phone = "malika_chess", "+998 93 410 22 10"
    db.flush()

    created = now()
    db.add_all([
        Tournament(id="autumn-3x3", title="Autumn 3x3 League", sport="Basketbol", format="Jamoa", img="images/basketball-cup.jpg", status="live",
                   dates="20 okt – 3 noy", start_day=date(2026, 10, 20), club_id="streetball", venue="Streetball Park", max_players=16, seeded_players=16,
                   prize="2 mln + forma", fee=150000, organizer_id=7, organizer_name="Jamshid U.", collected="2,4 mln", featured_pos=2),
        Tournament(id="futsal-kubogi", title="Futsal Kubogi", sport="Futbol", format="Jamoa", status="finished", dates="1–5 okt",
                   start_day=date(2026, 10, 1), venue="Arena FC", max_players=12, seeded_players=12, prize="—", organizer_name="Arena FC", collected="3,6 mln"),
        Application(user_id=1, status="info", moderator="Aziza K.", comment="Maktab zali bilan kelishuv xatini yuboring.", comment_fields=["Joy va sana"],
                    data={"name": "Yunusobod Chess Cup", "sport": "Shaxmat", "format": "Yakka", "level": "Havaskor", "venue": "Boshqa joy: Yunusobod 4-kvartal, maktab zali",
                          "club_id": None, "start_date": "2026-11-02", "end_date": "2026-11-02", "time": "09:00", "dates": "2.11", "players": "24–48 kishi",
                          "max_players": 48, "min_players": 24, "fee": 0, "prizes": "Kubok va medallar", "rules": "Shveytsariya tizimi, 7 tur"},
                    history=[{"title": "Ariza yuborildi", "at": stamp(created - timedelta(hours=5)), "who": "Malika R."},
                             {"title": "Admin ko‘ra boshladi", "at": stamp(created - timedelta(hours=4)), "who": "Aziza K."},
                             {"title": "Ma’lumot so‘raldi", "at": stamp(created - timedelta(hours=3)), "who": "Aziza K."}],
                    created_at=created - timedelta(hours=5)),
        Application(user_id=7, status="review", moderator="Aziza K.", checks=[0],
                    data={"name": "Street 3x3 Autumn", "sport": "Basketbol", "format": "Jamoa", "level": "O‘rta", "venue": "Magic City maydoni",
                          "club_id": None, "start_date": "2026-11-09", "end_date": "2026-11-09", "time": "10:00", "dates": "9.11", "players": "12–24 jamoa",
                          "max_players": 24, "min_players": 12, "fee": 150000, "prizes": "2 mln + forma", "rules": "3x3, olimpiya tizimi"},
                    history=[{"title": "Ariza yuborildi", "at": stamp(created - timedelta(hours=2)), "who": "Jamshid U."},
                             {"title": "Admin ko‘ra boshladi", "at": stamp(created - timedelta(hours=1)), "who": "Aziza K."}],
                    created_at=created - timedelta(hours=2)),
        Application(user_id=8, status="rejected", reason="Sana band. Yangi Toshkent bog‘ida shu kuni boshqa tadbir.",
                    data={"name": "Night Run 10K", "sport": "Yugurish", "format": "Yakka", "level": "Havaskor", "venue": "Yangi Toshkent bog‘i",
                          "club_id": None, "start_date": "2026-11-20", "end_date": "2026-11-20", "time": "21:00", "dates": "20.11", "players": "100–300 kishi",
                          "max_players": 300, "min_players": 100, "fee": 120000, "prizes": "", "rules": ""},
                    history=[{"title": "Ariza yuborildi", "at": stamp(created - timedelta(days=5)), "who": "RunTashkent"},
                             {"title": "Rad etildi", "at": stamp(created - timedelta(days=4)), "who": "sabab yuborildi"}],
                    created_at=created - timedelta(days=5)),
    ])

    def lead(kind, name, contact, tg, phone, sub, details, files, status, hours, **kw):
        return BusinessLead(kind=kind, club_name=name, contact=contact, telegram=tg, phone=phone, sport=sub.split(" · ")[0], sub=sub,
                            details=details, files=files, status=status, created_at=created - timedelta(hours=hours),
                            history=[{"title": "Ariza yuborildi", "at": stamp(created - timedelta(hours=hours)), "who": contact}], **kw)

    db.add_all([
        lead("club", "«Shox» bilyard klubi", "Shoxrux Aliyev", "@shox_club", "+998 99 111 22 33", "Bilyard · 8 stol · Sergeli",
             [["Manzil", "Sergeli, Yangi Sergeli ko‘chasi 12"], ["Stollar", "8 ta: 6 rus, 2 pul"], ["Ish vaqti", "12:00–03:00"], ["Narx", "45 000 so‘m / soat"], ["Tarif", "300 000 so‘m/oy + 1–2%"]],
             ["guvohnoma.pdf", "rasmlar (12)"], "new", 26),
        lead("club", "Tennis Park Yunusobod", "Akmal N.", "@tennispark", "+998 90 555 66 77", "Tennis · 6 kort",
             [["Manzil", "Yunusobod 11"], ["Kortlar", "6 ta, 2 yopiq"], ["Tarif", "300 000 so‘m/oy + 1–2%"]], ["guvohnoma.pdf"], "approved", 60, checks=[0, 1, 2, 3, 4]),
        lead("club", "Arena FC mini-futbol", "Sanjar B.", "@arenafc", "+998 93 300 30 30", "Futbol · 2 maydon",
             [["Manzil", "Mirzo Ulug‘bek"], ["Maydon", "2 ta, sun’iy o‘t"], ["Tarif", "300 000 so‘m/oy + 1–2%"]], ["rasmlar (6)"], "review", 8),
        lead("coach", "Dilnoza Sobirova", "Dilnoza Sobirova", "@dilnoza_swim", "+998 94 123 00 11", "Suzish · bolalar va kattalar",
             [["Sport", "Suzish"], ["Tajriba", "8 yil, sport ustasi nomzodi"], ["Qayerda", "«Aqua» basseyni"], ["Narx", "150 000 so‘m / dars"], ["Komissiya", "5% har bir darsdan"]],
             ["sertifikat.pdf"], "review", 3),
        lead("coach", "Timur Azimov", "Timur Azimov", "@timur_tennis", "+998 90 222 11 00", "Tennis · yakka darslar",
             [["Sport", "Tennis"], ["Tajriba", "5 yil"], ["Narx", "200 000 so‘m / dars"], ["Komissiya", "5% har bir darsdan"]], ["diplom.jpg"], "new", 1),
        lead("sponsor", "Padel Store", "Padel Store Tashkent", "@padelstore", "+998 71 250 50 50", "Homiylik: Chilonzor Padel Open",
             [["Kompaniya", "MChJ «Padel Store»"], ["Turnir", "Chilonzor Padel Open"], ["Hissa", "Sovrin raketkalar + 1 mln so‘m"], ["Paket", "[paket narxi belgilanmagan]"]],
             ["logo.svg"], "new", 1),
    ])

    db.add_all([
        Coach(name="Dilnoza Sobirova", place="«Aqua» basseyni", sport="Suzish", price=150000, lessons_month=64, telegram="@dilnoza_swim", status="ok", color="#9EE6C8",
              details=[["Telegram", "@dilnoza_swim"], ["Komissiya", "5% har bir darsdan"], ["Shu oy", "9,6 mln · KiGo ulushi 480 000"], ["Reyting", "★ 4.9 · 41 sharh"], ["Sertifikat", "tekshirilgan"]]),
        Coach(name="Otabek Karimov", place="Streetball Park", sport="Futbol", price=120000, lessons_month=22, telegram="@otabek_coach", status="ok", color="#B9C8FF",
              details=[["Telegram", "@otabek_coach"], ["Komissiya", "5%"], ["Shu oy", "2,6 mln"], ["Reyting", "★ 4.5"], ["Sertifikat", "tekshirilgan"]]),
    ])

    # A late cancellation waiting for a refund decision
    db.add(Booking(user_id=2, club_id="pirat", type_id=pirat_rus.id, day=today(), start="18:00", hours=2, price=55000, total=110000, deposit=20000,
                   pay_method="payme", status="cancelled", refund_status="requested", contact_name="Aziz T.", reminded=True))

    aqua = db.get(Club, "aqua")
    bad = Review(author="Anvar T.", stars=1, text="Eng yomon joy, suv sovuq, ...", status="pending")
    good = Review(author="Aziz T.", stars=5, text="Zo‘r joy, stollar yangi, bar ham yaxshi.", status="pending")
    aqua.reviews.append(bad)
    db.get(Club, "pirat").reviews.append(good)
    db.flush()
    db.add_all([
        Complaint(kind="complaint", title="Klub bron qilingan stolni bermadi", sub="Aziz T. → «Pirat»", priority="Shoshilinch", priority_cls="s-no", from_user_id=2,
                  details=[["Bron", "B-88407 · 110 000 so‘m"], ["Kimdan", "Aziz T."], ["Kimga", "«Pirat» klubi"], ["Avvalgi", "bu klubga 0 shikoyat"]],
                  text="Keldim, stol boshqa odamga berilgan ekan. Pul qaytarilmadi, administrator «tizimda ko‘rinmayapti» dedi.", files=["chek.jpg"],
                  reply="Pul to‘liq qaytariladi. Klubga ogohlantirish berildi.", options=["Pulni qaytarish", "Klubga ogohlantirish", "Klub bilan bog‘lanish", "Asossiz"],
                  created_at=created - timedelta(minutes=35)),
        Complaint(kind="complaint", title="O‘yinchi chatda haqorat qildi", sub="Bobur O. → Sardor X.", priority="O‘rta", priority_cls="s-rev", from_user_id=4,
                  details=[["O‘yin", "Padel · 23-okt"], ["Kimdan", "Bobur O."], ["Kimga", "Sardor X."], ["Avvalgi", "2 ta shikoyat"]],
                  text="O‘yin chatida so‘kindi va keyingi o‘yinga kelmadi.", files=["skrinshot.png"],
                  reply="Foydalanuvchiga ogohlantirish berildi. Takrorlansa 30 kunga bloklanadi.", options=["Ogohlantirish", "7 kunga bloklash", "Butunlay bloklash", "Asossiz"],
                  created_at=created - timedelta(hours=3)),
        Complaint(kind="complaint", title="Turnir sovrini berilmadi", sub="Rustam M. → Futsal Kubogi", priority="O‘rta", priority_cls="s-rev", from_user_id=6,
                  details=[["Turnir", "Futsal Kubogi · yakunlangan"], ["Kimdan", "Rustam M."], ["Kimga", "Arena FC (tashkilotchi)"], ["Avvalgi", "0"]],
                  text="2-o‘rin sovrini va’da qilingan edi, 1 haftadan beri javob yo‘q.", reply="Tashkilotchi bilan bog‘lanildi, 3 kun ichida beriladi.",
                  options=["Tashkilotchiga yozish", "Payout to‘xtatish", "Tashkilotchini cheklash", "Asossiz"], created_at=created - timedelta(days=1)),
        Complaint(kind="review", title="★ 1 · «Eng yomon joy, ...»", sub="«Aqua Sport» sahifasida", priority="Avto-filtr", priority_cls="s-info", review_id=bad.id,
                  details=[["Kim", "Anvar T."], ["Bron", "bor"], ["Filtr", "so‘kinish topildi"], ["Klub javobi", "yo‘q"]], text=bad.text,
                  options=["Ko‘rsatish", "So‘zlarni yashirib ko‘rsatish", "O‘chirish"], created_at=created - timedelta(hours=1)),
        Complaint(kind="review", title="★ 5 · «Zo‘r joy, stollar yangi»", sub="«Pirat» sahifasida", priority="Tekshiruv", priority_cls="s-rev", review_id=good.id,
                  details=[["Kim", "Aziz T."], ["Bron", "bor"], ["Filtr", "toza"], ["Klub javobi", "yo‘q"]], text=good.text,
                  options=["Ko‘rsatish", "O‘chirish"], created_at=created - timedelta(hours=2)),
        Complaint(kind="review", title="★ 2 · «Murabbiy kechikdi»", sub="Otabek K. profilida", priority="Klub e’tirozi", priority_cls="s-no",
                  details=[["Kim", "Laylo M."], ["Dars", "bor"], ["E’tiroz", "murabbiy: «mijoz kechikdi»"], ["Klub javobi", "bor"]],
                  text="Murabbiy 20 daqiqa kechikdi, dars qisqardi.", options=["Ko‘rsatish", "O‘chirish", "Ikkala tomondan dalil so‘rash"], created_at=created - timedelta(days=1)),
    ])


def _seed_dev_user(db: Session, pirat_rus: ClubType, saturday) -> None:
    """The demo user's own data so every screen has something to show in development."""
    uid = settings.dev_user_id
    db.add(User(id=uid, first_name="Jasur", last_name="Karimov", username="jasur_k", phone="+998 90 123 45 67",
                roles=["p"], sports=["Futbol", "Bilyard"], level="O‘rta", areas=["Yunusobod"], onboarded=True,
                rating=4.8, rating_count=40, games_played=64, on_time_pct=96))
    db.flush()  # Postgres checks foreign keys: the user row must exist before their bookings
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
