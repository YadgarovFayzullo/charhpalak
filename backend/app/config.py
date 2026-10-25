import os
from dataclasses import dataclass, field
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

TZ = ZoneInfo("Asia/Tashkent")


def _ids(raw: str) -> frozenset[int]:
    return frozenset(int(x) for x in raw.replace(" ", "").split(",") if x)


@dataclass(frozen=True)
class Settings:
    bot_token: str = field(default_factory=lambda: os.getenv("BOT_TOKEN", ""))
    database_url: str = field(default_factory=lambda: os.getenv("KIGO_DATABASE_URL", "sqlite:///./kigo.db"))
    bot_notify_url: str = field(default_factory=lambda: os.getenv("BOT_NOTIFY_URL", ""))
    notify_secret: str = field(default_factory=lambda: os.getenv("NOTIFY_SECRET", ""))
    admin_ids: frozenset[int] = field(default_factory=lambda: _ids(os.getenv("ADMIN_IDS", "")))
    cors_origins: list[str] = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "*").split(","))
    dev_mode: bool = field(default_factory=lambda: os.getenv("DEV_MODE", "0") == "1")
    dev_user_id: int = field(default_factory=lambda: int(os.getenv("DEV_USER_ID", "1000")))


settings = Settings()
