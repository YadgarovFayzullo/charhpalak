"""Send notifications through the bot's /notify API (see bot/notify_api.py)."""

import logging

import httpx

from .config import settings

log = logging.getLogger(__name__)


def notify(chat_id: int, event: str, data: dict) -> bool:
    if not settings.bot_notify_url:
        log.info("notify (disabled) %s → %s: %s", event, chat_id, data)
        return False
    try:
        r = httpx.post(
            settings.bot_notify_url,
            json={"chat_id": chat_id, "event": event, "data": data},
            headers={"X-Notify-Secret": settings.notify_secret},
            timeout=10,
        )
        r.raise_for_status()
        return True
    except httpx.HTTPError as e:
        # A failed notification must never break the user's request.
        log.warning("notify %s → %s failed: %s", event, chat_id, e)
        return False
