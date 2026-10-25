"""«Landing va ilova»: which blocks show on kigo.uz and on the mini app home screen."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Tournament
from . import store
from .auth import Admin, require, staff_user

router = APIRouter(prefix="/api/admin/content", tags=["admin content"])

SITE = [
    ["hero", "Bosh banner (hero)", "Sahifa tepasi: sarlavha, rasm, asosiy tugma", True],
    ["sport", "Sport turlari", "Bilyard, futbol, padel… tugmalari", True],
    ["tur", "Tanlangan turnirlar", "4 ta karta · Turnirlar bo‘limidan", True],
    ["club", "Tavsiya klublar", "Reyting bo‘yicha yoki qo‘lda", True],
    ["coach", "Murabbiylar", "Tasdiqlangan murabbiylar", False],
    ["cta", "«O‘z turniringizni o‘tkazing»", "Tashkilotchilar uchun ariza tugmasi", True],
    ["part", "Hamkorlik", "Klub, murabbiy, tashkilotchi, homiy", True],
    ["spons", "Homiylar logotiplari", "Tasdiqlangan homiylar", True],
    ["faq", "Ko‘p so‘raladigan savollar", "6 ta savol", True],
    ["shop", "Do‘kon (tez kunda)", "Kutish ro‘yxatiga yozilish", False],
]
APP = [
    ["hero", "Bosh ekran banneri", "1 ta katta karta, eng tepada", True],
    ["quick", "Tezkor tugmalar", "Joy bron, sherik topish, turnirlar", True],
    ["near", "Yaqin atrofda", "Joylashuv bo‘yicha klublar", True],
    ["tur", "Turnirlar karuseli", "Tanlangan turnirlar bilan bir xil", True],
    ["games", "Ochiq o‘yinlar", "Sherik kerak o‘yinlar", True],
    ["shop", "Do‘kon banneri", "Tez kunda", False],
]


def app_blocks(db: Session) -> dict:
    on = store.get(db, "content")["on"]
    return {b[0]: on.get(f"ilova:{b[0]}", b[3]) for b in APP}


def featured(db: Session) -> list[dict]:
    rows = db.scalars(select(Tournament).where(Tournament.featured_pos.is_not(None)).order_by(Tournament.featured_pos)).all()
    return [{"id": t.id, "name": t.title, "start": t.start_day.isoformat() if t.start_day else None} for t in rows]


@router.get("")
def get_content(admin: Admin = Depends(staff_user), db: Session = Depends(get_db)):
    return {"site": SITE, "app": APP, "featured": featured(db), **store.get(db, "content")}


class ContentIn(BaseModel):
    on: dict[str, bool]
    hero: str = "general"  # tournament id or "general"
    mode: str = "Avtomatik"
    sponsors: list[str] = []
    featured: list[str] | None = None  # tournament ids in site order; None = leave as is
    changes: int = 0


@router.put("")
def publish(body: ContentIn, admin: Admin = Depends(require(store.P_CONTENT)), db: Session = Depends(get_db)):
    content = store.get(db, "content")
    content.update(on=body.on, hero=body.hero, mode=body.mode, sponsors=body.sponsors, version=content["version"] + 1)
    store.put(db, "content", content)
    if body.featured is not None:
        # Featured order is stored on tournaments, shared with «Turnirlar».
        for t in db.scalars(select(Tournament).where(Tournament.featured_pos.is_not(None))).all():
            t.featured_pos = None
        for i, tid in enumerate(body.featured[:4]):
            t = db.get(Tournament, tid)
            if t:
                t.featured_pos = i + 1
    store.log(db, admin.user, f"landing va ilovada {body.changes or 1} ta o‘zgarishni e’lon qildi")
    db.commit()
    return get_content(admin, db)
