"""Identify the user from Telegram.WebApp.initData.

The mini app sends `Authorization: tma <initData>`. The signature is checked with the
bot token, so the user id cannot be forged. With DEV_MODE=1 a request without the header
acts as DEV_USER_ID, so the webapp can be developed in a plain browser.
"""

import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User

MAX_AGE = 24 * 3600


def validate_init_data(init_data: str, bot_token: str, max_age: int = MAX_AGE) -> dict | None:
    fields = dict(parse_qsl(init_data, keep_blank_values=True))
    received = fields.pop("hash", None)
    if not received or not bot_token:
        return None
    check_string = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
    secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received):
        return None
    if max_age and time.time() - int(fields.get("auth_date", 0)) > max_age:
        return None
    if "user" in fields:
        fields["user"] = json.loads(fields["user"])
    return fields


def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if authorization and authorization.startswith("tma "):
        data = validate_init_data(authorization[4:], settings.bot_token)
        if not data or "user" not in data:
            raise HTTPException(401, "initData yaroqsiz yoki eskirgan")
        tg = data["user"]
        user = db.get(User, tg["id"])
        if not user:
            user = User(id=tg["id"])
            db.add(user)
        # Keep the profile in sync with Telegram on every request.
        user.first_name = tg.get("first_name", "")
        user.last_name = tg.get("last_name", "")
        user.username = tg.get("username", "")
        db.commit()
        return user

    if settings.dev_mode:
        user = db.get(User, settings.dev_user_id)
        if not user:
            user = User(id=settings.dev_user_id, first_name="Jasur", last_name="Karimov", username="jasur_k")
            db.add(user)
            db.commit()
        return user

    raise HTTPException(401, "Telegram orqali oching")


def admin_user(user: User = Depends(current_user)) -> User:
    if user.id not in settings.admin_ids:
        raise HTTPException(403, "Faqat adminlar uchun")
    return user
