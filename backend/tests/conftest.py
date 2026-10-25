import os
import tempfile

# Configure before the app is imported: settings and the engine read the environment once.
_tmp = tempfile.mkdtemp()
os.environ.update({
    "KIGO_DATABASE_URL": f"sqlite:///{_tmp}/test.db",
    "DEV_MODE": "1",
    "DEV_USER_ID": "1000",
    "ADMIN_IDS": "1000",
    "BOT_TOKEN": "123456:TESTTOKEN",
    "BOT_NOTIFY_URL": "",
})

import pytest
from fastapi.testclient import TestClient

from app.db import Base, SessionLocal, engine
from app.main import app
from app.seed import seed


@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sent(monkeypatch):
    """Capture notifications instead of calling the bot."""
    calls = []
    fake = lambda chat_id, event, data: calls.append((chat_id, event, data)) or True
    import app.routers.bookings, app.routers.tournaments, app.routers.applications
    for mod in (app.routers.bookings, app.routers.tournaments, app.routers.applications):
        monkeypatch.setattr(mod, "notify", fake)
    return calls
