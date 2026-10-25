import os
import re
from pathlib import Path

from dotenv import dotenv_values

# Tests run against the `kigo_test` database of the local Postgres (backend/docker-compose.yml).
# Configure before the app is imported: settings and the engine read the environment once.
_env = dotenv_values(Path(__file__).resolve().parent.parent / ".env")
_main_url = os.getenv("KIGO_DATABASE_URL") or _env.get("KIGO_DATABASE_URL", "")
os.environ.update({
    "KIGO_DATABASE_URL": os.getenv("KIGO_TEST_DATABASE_URL") or re.sub(r"/[^/]+$", "/kigo_test", _main_url),
    "DEV_MODE": "1",
    "DEV_USER_ID": "1000",
    "ADMIN_IDS": "1000",
    "BOT_TOKEN": "123456:TESTTOKEN",
    "BOT_NOTIFY_URL": "",
    "NOTIFY_SECRET": "test-secret",
    "SEED_DEMO": "1",
})

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine
from app.main import app


@pytest.fixture
def client():
    # Fresh schema for every test: drop everything, then the app's startup runs migrations and seeds.
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public"))
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sent(monkeypatch):
    """Capture notifications instead of calling the bot."""
    calls = []
    fake = lambda chat_id, event, data: calls.append((chat_id, event, data)) or True
    import app.routers.bookings, app.routers.tournaments, app.routers.applications, app.routers.users
    import app.admin.requests, app.admin.tournaments, app.admin.payments, app.admin.complaints, app.admin.team
    for mod in (app.routers.bookings, app.routers.tournaments, app.routers.applications, app.routers.users,
                app.admin.requests, app.admin.tournaments, app.admin.payments, app.admin.complaints, app.admin.team):
        monkeypatch.setattr(mod, "notify", fake)
    return calls


BOT = {"X-Notify-Secret": "test-secret"}


def admin_login(client, user_id=1000) -> dict:
    """Sign in to the CRM the way the bot does it; returns auth headers."""
    token = client.post("/api/admin/login").json()["token"]
    r = client.post("/api/admin/login/confirm", headers=BOT, json={"token": token, "user_id": user_id}).json()
    assert r["ok"], r
    assert client.get(f"/api/admin/login/{token}").json()["status"] == "ok"
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin(client):
    return admin_login(client)
