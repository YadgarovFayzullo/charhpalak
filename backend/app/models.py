from datetime import date, datetime

from sqlalchemy import JSON, BigInteger, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def now() -> datetime:
    from .config import TZ
    return datetime.now(TZ).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)  # Telegram user id
    first_name: Mapped[str] = mapped_column(String(64), default="")
    last_name: Mapped[str] = mapped_column(String(64), default="")
    username: Mapped[str] = mapped_column(String(64), default="")
    phone: Mapped[str] = mapped_column(String(32), default="")
    roles: Mapped[list] = mapped_column(JSON, default=list)
    sports: Mapped[list] = mapped_column(JSON, default=list)
    level: Mapped[str] = mapped_column(String(32), default="")
    areas: Mapped[list] = mapped_column(JSON, default=list)
    onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    on_time_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str] = mapped_column(String(9), default="#C8F25A")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    # Moderation (set from the CRM)
    blocked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    warned: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    can_book: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    can_apply: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    can_chat: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    no_shows: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    city: Mapped[str] = mapped_column(String(40), default="Toshkent", server_default="Toshkent")

    @property
    def name(self) -> str:
        return " ".join(p for p in (self.first_name, self.last_name) if p) or "Foydalanuvchi"

    @property
    def short_name(self) -> str:
        return f"{self.first_name} {self.last_name[:1]}." if self.last_name else self.first_name

    @property
    def initials(self) -> str:
        return "".join(p[0] for p in self.name.split()[:2]).upper()


class Club(Base):
    __tablename__ = "clubs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    full_name: Mapped[str] = mapped_column(String(120))
    sport: Mapped[str] = mapped_column(String(32))
    district: Mapped[str] = mapped_column(String(48))
    dist: Mapped[str] = mapped_column(String(16), default="")
    rating: Mapped[float] = mapped_column(Float, default=0)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    img: Mapped[str] = mapped_column(String(200), default="")
    photos: Mapped[int] = mapped_column(Integer, default=1)
    map_left: Mapped[str] = mapped_column(String(8), default="50%")
    map_top: Mapped[str] = mapped_column(String(8), default="50%")
    prices: Mapped[list] = mapped_column(JSON, default=list)  # [[label, "55 000/soat"], ...]
    amenities: Mapped[list] = mapped_column(JSON, default=list)
    # Partnership and visibility (set from the CRM)
    owner: Mapped[str] = mapped_column(String(80), default="", server_default="")
    tariff: Mapped[str] = mapped_column(String(40), default="300 000 + 1%", server_default="300 000 + 1%")
    commission_pct: Mapped[float] = mapped_column(Float, default=1.0, server_default="1")
    next_payment: Mapped[str] = mapped_column(String(24), default="", server_default="")
    billing: Mapped[str] = mapped_column(String(8), default="trial", server_default="trial")  # ok | trial | debt
    crm_connected: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    featured: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")  # site «Tavsiya klublar»
    nearby: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")  # app «Yaqin atrofda»
    bookable: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    blocked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")

    types: Mapped[list["ClubType"]] = relationship(order_by="ClubType.id", cascade="all, delete-orphan", back_populates="club")
    reviews: Mapped[list["Review"]] = relationship(order_by="Review.id", cascade="all, delete-orphan")


class ClubType(Base):
    __tablename__ = "club_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubs.id"))
    club: Mapped["Club"] = relationship(back_populates="types")
    label: Mapped[str] = mapped_column(String(48))
    price: Mapped[int] = mapped_column(Integer)  # so'm per hour
    units: Mapped[int] = mapped_column(Integer, default=1)  # tables/courts of this type


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubs.id"))
    author: Mapped[str] = mapped_column(String(64))
    stars: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10), default="shown", server_default="shown")  # pending | shown | masked | deleted


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    club_id: Mapped[str] = mapped_column(ForeignKey("clubs.id"))
    type_id: Mapped[int] = mapped_column(ForeignKey("club_types.id"))
    day: Mapped[date] = mapped_column(Date)
    start: Mapped[str] = mapped_column(String(5))  # "19:00"
    hours: Mapped[int] = mapped_column(Integer)
    price: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    deposit: Mapped[int] = mapped_column(Integer)
    pay_method: Mapped[str] = mapped_column(String(16))  # click | payme | club
    status: Mapped[str] = mapped_column(String(20))  # awaiting_payment | confirmed | cancelled
    invite: Mapped[bool] = mapped_column(Boolean, default=False)
    contact_name: Mapped[str] = mapped_column(String(80), default="")
    contact_phone: Mapped[str] = mapped_column(String(32), default="")
    refunded: Mapped[bool] = mapped_column(Boolean, default=False)
    # "" | requested (late cancel, waits for an admin) | refunded | denied
    refund_status: Mapped[str] = mapped_column(String(10), default="", server_default="")
    reminded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    club: Mapped[Club] = relationship()
    type: Mapped[ClubType] = relationship()


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    sport: Mapped[str] = mapped_column(String(32))
    level: Mapped[str] = mapped_column(String(32))
    day: Mapped[date] = mapped_column(Date)
    time: Mapped[str] = mapped_column(String(5))
    place: Mapped[str] = mapped_column(String(120))
    club_id: Mapped[str | None] = mapped_column(ForeignKey("clubs.id"), nullable=True)
    max_players: Mapped[int] = mapped_column(Integer)
    extra_players: Mapped[int] = mapped_column(Integer, default=0)  # people who joined outside the app
    price_text: Mapped[str] = mapped_column(String(40))
    to_group: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    players: Mapped[list["GamePlayer"]] = relationship(cascade="all, delete-orphan", order_by="GamePlayer.id")


class GamePlayer(Base):
    __tablename__ = "game_players"
    __table_args__ = (UniqueConstraint("game_id", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    user: Mapped[User] = relationship()


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("from_user_id", "to_user_id", "game_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    stars: Mapped[int] = mapped_column(Integer)


class Tournament(Base):
    __tablename__ = "tournaments"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    sport: Mapped[str] = mapped_column(String(32))
    format: Mapped[str] = mapped_column(String(48))
    img: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(16), default="upcoming")  # upcoming | live | finished
    dates: Mapped[str] = mapped_column(String(48))
    start_day: Mapped[date | None] = mapped_column(Date, nullable=True)
    club_id: Mapped[str | None] = mapped_column(ForeignKey("clubs.id"), nullable=True)
    venue: Mapped[str] = mapped_column(String(120))
    max_players: Mapped[int] = mapped_column(Integer)
    seeded_players: Mapped[int] = mapped_column(Integer, default=0)
    prize: Mapped[str] = mapped_column(String(80), default="")
    fee: Mapped[int] = mapped_column(Integer, default=0)
    rules: Mapped[list] = mapped_column(JSON, default=list)  # [[title, text], ...]
    note: Mapped[str] = mapped_column(Text, default="")
    rounds: Mapped[list] = mapped_column(JSON, default=list)  # [{label, matches: [[a, as, b, bs]]}]
    participants: Mapped[list] = mapped_column(JSON, default=list)  # seeded [[initials, name, rating, color]]
    organizer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    organizer_name: Mapped[str] = mapped_column(String(80), default="", server_default="")
    collected: Mapped[str] = mapped_column(String(24), default="", server_default="")  # seeded money label
    featured_pos: Mapped[int | None] = mapped_column(Integer, nullable=True)  # site «Tanlangan turnirlar», 1..4
    banner: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")  # mini app home banner
    stop_reason: Mapped[str] = mapped_column(Text, default="", server_default="")

    entries: Mapped[list["TournamentEntry"]] = relationship(cascade="all, delete-orphan")


class TournamentEntry(Base):
    __tablename__ = "tournament_entries"
    __table_args__ = (UniqueConstraint("tournament_id", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament_id: Mapped[str] = mapped_column(ForeignKey("tournaments.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    group: Mapped[str] = mapped_column(String(4), default="")

    user: Mapped[User] = relationship()


class Application(Base):
    """A request to host a tournament, moderated by admins."""

    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    data: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(16), default="new")  # new | review | info | approved | rejected
    comment: Mapped[str] = mapped_column(Text, default="")  # moderator's question
    checks: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")  # ticked checklist items
    note: Mapped[str] = mapped_column(Text, default="", server_default="")  # internal, admins only
    allow_resend: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    comment_fields: Mapped[list] = mapped_column(JSON, default=list)
    moderator: Mapped[str] = mapped_column(String(64), default="")
    answer: Mapped[str] = mapped_column(Text, default="")
    reason: Mapped[str] = mapped_column(Text, default="")
    history: Mapped[list] = mapped_column(JSON, default=list)  # [{"title", "at"}]
    tournament_id: Mapped[str | None] = mapped_column(ForeignKey("tournaments.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    user: Mapped[User] = relationship()

    @property
    def number(self) -> str:
        return f"T-{self.id + 141:04d}"


class BusinessLead(Base):
    """A club, coach or sponsor asking to join; moderated in the CRM like applications."""

    __tablename__ = "business_leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(16), default="club")  # club | coach | sponsor
    club_name: Mapped[str] = mapped_column(String(120))
    sport: Mapped[str] = mapped_column(String(32))
    phone: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    contact: Mapped[str] = mapped_column(String(80), default="", server_default="")  # person's name when no user
    telegram: Mapped[str] = mapped_column(String(64), default="", server_default="")
    sub: Mapped[str] = mapped_column(String(120), default="", server_default="")
    details: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")  # [[label, value]]
    files: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    status: Mapped[str] = mapped_column(String(16), default="new", server_default="new")  # new | review | info | approved | rejected
    checks: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    comment: Mapped[str] = mapped_column(Text, default="", server_default="")
    reason: Mapped[str] = mapped_column(Text, default="", server_default="")
    note: Mapped[str] = mapped_column(Text, default="", server_default="")
    moderator: Mapped[str] = mapped_column(String(64), default="", server_default="")
    history: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")

    user: Mapped[User | None] = relationship()

    @property
    def number(self) -> str:
        prefix = {"club": "K", "coach": "M", "sponsor": "H"}[self.kind]
        return f"{prefix}-{self.id + 48:03d}"


class Coach(Base):
    __tablename__ = "coaches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(80))
    place: Mapped[str] = mapped_column(String(80), default="")
    sport: Mapped[str] = mapped_column(String(32))
    price: Mapped[int] = mapped_column(Integer, default=0)
    lessons_month: Mapped[int] = mapped_column(Integer, default=0)
    telegram: Mapped[str] = mapped_column(String(64), default="")
    rating: Mapped[str] = mapped_column(String(24), default="—")
    status: Mapped[str] = mapped_column(String(8), default="rev")  # ok | rev
    color: Mapped[str] = mapped_column(String(9), default="#9EE6C8")
    details: Mapped[list] = mapped_column(JSON, default=list)
    on_site: Mapped[bool] = mapped_column(Boolean, default=True)
    on_club_page: Mapped[bool] = mapped_column(Boolean, default=True)
    bookable: Mapped[bool] = mapped_column(Boolean, default=True)
    blocked: Mapped[bool] = mapped_column(Boolean, default=False)


class Complaint(Base):
    """User complaints and reviews waiting for moderation (kind = complaint | review)."""

    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(10), default="complaint")
    title: Mapped[str] = mapped_column(String(160))
    sub: Mapped[str] = mapped_column(String(160), default="")
    priority: Mapped[str] = mapped_column(String(24), default="O‘rta")
    priority_cls: Mapped[str] = mapped_column(String(8), default="s-rev")
    details: Mapped[list] = mapped_column(JSON, default=list)
    text: Mapped[str] = mapped_column(Text, default="")
    files: Mapped[list] = mapped_column(JSON, default=list)
    reply: Mapped[str] = mapped_column(Text, default="")
    options: Mapped[list] = mapped_column(JSON, default=list)  # possible actions
    actions: Mapped[list] = mapped_column(JSON, default=list)  # chosen action indexes
    status: Mapped[str] = mapped_column(String(8), default="open")  # open | done
    from_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    review_id: Mapped[int | None] = mapped_column(ForeignKey("reviews.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Setting(Base):
    """Platform settings and CRM-managed content as JSON values (landing, permissions, rules...)."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[dict | list] = mapped_column(JSON)


class Staff(Base):
    """People who can sign in to the CRM. role indexes ROLES in admin/permissions.py."""

    __tablename__ = "staff"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    role: Mapped[int] = mapped_column(Integer, default=1)
    color: Mapped[str] = mapped_column(String(9), default="#FFE4D6")

    user: Mapped[User] = relationship()


class AdminSession(Base):
    __tablename__ = "admin_sessions"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)  # set when confirmed in the bot
    status: Mapped[str] = mapped_column(String(10), default="pending")  # pending | ok | denied
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    expires_at: Mapped[datetime] = mapped_column(DateTime)


class Activity(Base):
    """CRM audit log, shown as «So‘nggi harakatlar» on the dashboard."""

    __tablename__ = "activity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    text: Mapped[str] = mapped_column(String(240))
    at: Mapped[datetime] = mapped_column(DateTime, default=now)

    user: Mapped[User | None] = relationship()
