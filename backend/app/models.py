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

    types: Mapped[list["ClubType"]] = relationship(order_by="ClubType.id", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(order_by="Review.id", cascade="all, delete-orphan")


class ClubType(Base):
    __tablename__ = "club_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubs.id"))
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
    status: Mapped[str] = mapped_column(String(16), default="review")  # review | info | approved | rejected
    comment: Mapped[str] = mapped_column(Text, default="")  # moderator's question
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
    __tablename__ = "business_leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[str] = mapped_column(String(16), default="club")  # club | coach
    club_name: Mapped[str] = mapped_column(String(120))
    sport: Mapped[str] = mapped_column(String(32))
    phone: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
