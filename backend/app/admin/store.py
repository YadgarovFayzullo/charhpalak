"""CRM settings kept in the `settings` table, with defaults from the design."""

import copy

from sqlalchemy.orm import Session

from ..models import Activity, Setting, User

ROLES = ["Super admin", "Moderator", "Kontent menejer", "Moliya"]

# Permission rows, in the order of the «Rollar va ruxsatlar» table.
P_VIEW, P_DECIDE, P_CONTENT, P_MONEY, P_COMPLAINTS, P_TARIFF, P_BLOCK, P_TEAM = range(8)
PERMISSIONS = [
    "Arizalarni ko‘rish",
    "Arizani tasdiqlash / rad etish",
    "Landing va ilova kontentini tahrirlash",
    "Pul qaytarish va payout",
    "Shikoyat va sharhlarni hal qilish",
    "Tarif va komissiyani o‘zgartirish",
    "Foydalanuvchi va klubni bloklash",
    "Jamoa va rollarni boshqarish",
]

RULES = [
    ["Yangi arizada adminlarga Telegram xabar", "har bir yangi ariza bo‘yicha"],
    ["24 soatda ko‘rilmasa ogohlantirish", "bosh adminga boradi"],
    ["Klub KiGo’da bo‘lsa, roziligini avtomatik so‘rash", "turnir arizalari uchun"],
    ["Ishonchli tashkilotchini avtomatik tasdiqlash", "3+ turnir, shikoyatsiz"],
    ["Bron 2 soatdan oldin bekor qilinsa avtomatik qaytarish", "100% pul qaytadi"],
    ["Sharhlarda so‘kinishni avtomatik filtrlash", "moderatsiyaga tushadi"],
]
R_NOTIFY_ADMINS, R_ESCALATE, R_ASK_CLUB, R_AUTO_APPROVE, R_AUTO_REFUND, R_FILTER = range(6)

DEFAULTS = {
    "matrix": [[1, 1, 1, 1], [1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1], [1, 1, 0, 0], [1, 0, 0, 1], [1, 1, 0, 0], [1, 0, 0, 0]],
    "rules": [1, 1, 1, 0, 1, 1],
    "commissions": {"club_tariff": "300 000 so‘m", "club_commission": "1–2%", "coach": "5%", "tournament": "", "sponsor": "", "trial": ""},
    # Landing / mini app blocks. on: "<page>:<block>" → bool overrides the block's default.
    "content": {"on": {}, "hero": "general", "mode": "Avtomatik", "sponsors": ["Padel Store", "Sport Market", "Hydro"], "version": 0},
}


def get(db: Session, key: str):
    row = db.get(Setting, key)
    return copy.deepcopy(row.value) if row else copy.deepcopy(DEFAULTS[key])


def put(db: Session, key: str, value) -> None:
    row = db.get(Setting, key)
    if row:
        row.value = value
    else:
        db.add(Setting(key=key, value=value))


def can(db: Session, role: int, perm: int) -> bool:
    return role == 0 or bool(get(db, "matrix")[perm][role])


def rule(db: Session, idx: int) -> bool:
    return bool(get(db, "rules")[idx])


def log(db: Session, user: User | None, text: str) -> None:
    db.add(Activity(user_id=user.id if user else None, text=text[:240]))
