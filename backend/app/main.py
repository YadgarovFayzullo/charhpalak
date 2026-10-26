import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .admin import auth as admin_auth, complaints, content, dashboard, directory, payments, requests, team
from .admin import tournaments as admin_tournaments
from .config import settings
from .db import SessionLocal, migrate
from .reminders import reminder_loop
from .routers import applications, bookings, clubs, games, tournaments, users, views
from .seed import seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    migrate()
    with SessionLocal() as db:
        if os.getenv("SEED_DEMO", "1") == "1":
            seed(db)
        admin_auth.ensure_admins(db)
    task = asyncio.create_task(reminder_loop())
    if settings.dev_mode:
        logging.warning("DEV_MODE=1: initData siz so‘rovlar demo foydalanuvchi nomidan bajariladi")
    yield
    task.cancel()


app = FastAPI(title="KiGo API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

for module in (users, clubs, bookings, games, tournaments, applications, views):
    app.include_router(module.router)
for module in (admin_auth, dashboard, requests, admin_tournaments, content, directory, payments, complaints, team):
    app.include_router(module.router)


@app.get("/health")
def health():
    return {"ok": True}
