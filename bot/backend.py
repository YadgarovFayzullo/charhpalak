"""Calls from the bot to the KiGo backend, authenticated with the shared NOTIFY_SECRET."""

import logging

import aiohttp
from aiogram.types import User

log = logging.getLogger(__name__)


class Backend:
    def __init__(self, url: str, secret: str):
        self.url, self.secret = url, secret

    async def post(self, path: str, payload: dict) -> dict:
        try:
            async with aiohttp.ClientSession() as s:
                async with s.post(self.url + path, json=payload, headers={"X-Notify-Secret": self.secret}, timeout=aiohttp.ClientTimeout(total=10)) as r:
                    return await r.json()
        except (aiohttp.ClientError, TimeoutError, ValueError) as e:
            log.warning("backend %s failed: %s", path, e)
            return {"ok": False, "reason": "Server bilan aloqa yo‘q, keyinroq urinib ko‘ring."}

    @staticmethod
    def who(user: User) -> dict:
        return {"user_id": user.id, "first_name": user.first_name or "", "last_name": user.last_name or "", "username": user.username or ""}

    async def seen(self, user: User) -> None:
        await self.post("/api/admin/bot/seen", self.who(user))

    async def login_check(self, token: str, user: User) -> dict:
        return await self.post("/api/admin/login/check", {"token": token, **self.who(user)})

    async def login_confirm(self, token: str, user: User, approve: bool) -> dict:
        return await self.post("/api/admin/login/confirm", {"token": token, "approve": approve, **self.who(user)})
