"""Validate Telegram.WebApp.initData sent by the mini app to the backend.

https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""

import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl


def validate_init_data(init_data: str, bot_token: str, max_age: int = 24 * 3600) -> dict | None:
    """Return the parsed fields (with `user` decoded) if the signature is valid and fresh, else None."""
    fields = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = fields.pop("hash", None)
    if not received_hash:
        return None

    check_string = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
    secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        return None

    if max_age and time.time() - int(fields.get("auth_date", 0)) > max_age:
        return None

    if "user" in fields:
        fields["user"] = json.loads(fields["user"])
    return fields
