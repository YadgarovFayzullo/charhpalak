import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, SessionLocal, engine
from .reminders import reminder_loop
from .routers import applications, bookings, clubs, games, tournaments, users
from .seed import seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    task = asyncio.create_task(reminder_loop())
    if settings.dev_mode:
        logging.warning("DEV_MODE=1: initData siz so‘rovlar demo foydalanuvchi nomidan bajariladi")
    yield
    task.cancel()


app = FastAPI(title="KiGo API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

for module in (users, clubs, bookings, games, tournaments, applications):
    app.include_router(module.router)
app.include_router(applications.admin)


@app.get("/health")
def health():
    return {"ok": True}
