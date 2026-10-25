import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    bot_token: str
    webapp_url: str
    backend_url: str
    notify_secret: str
    notify_host: str
    notify_port: int


def load_config() -> Config:
    token = os.getenv("BOT_TOKEN")
    webapp_url = os.getenv("WEBAPP_URL")
    if not token or not webapp_url:
        raise SystemExit("BOT_TOKEN va WEBAPP_URL .env faylida bo‘lishi kerak (.env.example ga qarang)")
    if not webapp_url.startswith("https://"):
        raise SystemExit("WEBAPP_URL https:// bilan boshlanishi kerak: Telegram faqat HTTPS mini ilovani ochadi")
    return Config(
        bot_token=token,
        webapp_url=webapp_url.rstrip("/") + "/",
        backend_url=os.getenv("BACKEND_URL", "http://127.0.0.1:8010").rstrip("/"),
        notify_secret=os.getenv("NOTIFY_SECRET", ""),
        notify_host=os.getenv("NOTIFY_HOST", "127.0.0.1"),
        notify_port=int(os.getenv("NOTIFY_PORT", "8081")),
    )
