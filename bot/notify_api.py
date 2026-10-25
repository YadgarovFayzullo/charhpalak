"""Small HTTP endpoint the KiGo backend calls to send notifications through the bot.

POST /notify
Header: X-Notify-Secret: <NOTIFY_SECRET>
Body:   {"chat_id": 123, "event": "booking_confirmed", "data": {...}}
"""

import hmac
import logging

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError
from aiohttp import web

from notifications import EVENTS

log = logging.getLogger(__name__)


def build_app(bot: Bot, webapp_url: str, secret: str) -> web.Application:
    async def notify(request: web.Request) -> web.Response:
        if not secret or not hmac.compare_digest(request.headers.get("X-Notify-Secret", ""), secret):
            return web.json_response({"ok": False, "error": "forbidden"}, status=403)
        try:
            body = await request.json()
            chat_id = int(body["chat_id"])
            build = EVENTS[body["event"]]
        except (ValueError, KeyError, TypeError):
            return web.json_response({"ok": False, "error": "bad request", "events": list(EVENTS)}, status=400)

        text, keyboard = build(body.get("data") or {}, webapp_url)
        try:
            msg = await bot.send_message(chat_id, text, reply_markup=keyboard)
        except TelegramAPIError as e:
            log.warning("notify %s to %s failed: %s", body["event"], chat_id, e)
            return web.json_response({"ok": False, "error": str(e)}, status=502)
        return web.json_response({"ok": True, "message_id": msg.message_id})

    async def health(_: web.Request) -> web.Response:
        return web.json_response({"ok": True})

    app = web.Application()
    app.router.add_post("/notify", notify)
    app.router.add_get("/health", health)
    return app
