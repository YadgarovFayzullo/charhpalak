"""«Sozlamalar va rollar»: staff, permissions, tariffs and platform rules."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Staff, User
from ..notifier import notify
from . import store
from .auth import Admin, staff_user, require

router = APIRouter(prefix="/api/admin/team", tags=["admin team"])

COLORS = ["#B9C8FF", "#FFE4D6", "#9EE6C8", "#FFD58A", "#ECEFE9"]


def _state(db: Session) -> dict:
    staff = db.scalars(select(Staff).order_by(Staff.role, Staff.user_id)).all()
    return {
        "staff": [{"userId": s.user_id, "i": s.user.initials, "bg": s.color, "name": s.user.short_name or s.user.name,
                   "username": f"@{s.user.username}" if s.user.username else f"id {s.user_id}", "role": s.role} for s in staff],
        "roles": store.ROLES, "permissions": store.PERMISSIONS, "matrix": store.get(db, "matrix"),
        "rules": [[*r, bool(v)] for r, v in zip(store.RULES, store.get(db, "rules"))],
        "commissions": store.get(db, "commissions"),
    }


@router.get("")
def team(admin: Admin = Depends(staff_user), db: Session = Depends(get_db)):
    return _state(db)


class SettingsIn(BaseModel):
    matrix: list[list[int]] | None = None
    rules: list[bool] | None = None
    commissions: dict[str, str] | None = None
    roles: dict[int, int] | None = None  # user_id → role


@router.put("")
def save(body: SettingsIn, admin: Admin = Depends(staff_user), db: Session = Depends(get_db)):
    team_changes = body.matrix is not None or body.rules is not None or body.roles
    if team_changes and not store.can(db, admin.role, store.P_TEAM):
        raise HTTPException(403, f"Ruxsat yo‘q: {store.PERMISSIONS[store.P_TEAM]}")
    if body.commissions is not None and not store.can(db, admin.role, store.P_TARIFF):
        raise HTTPException(403, f"Ruxsat yo‘q: {store.PERMISSIONS[store.P_TARIFF]}")

    if body.matrix is not None:
        if len(body.matrix) != len(store.PERMISSIONS) or any(len(r) != len(store.ROLES) for r in body.matrix):
            raise HTTPException(400, "Jadval noto‘g‘ri")
        # Super admin always keeps every permission.
        store.put(db, "matrix", [[1, *[1 if v else 0 for v in r[1:]]] for r in body.matrix])
    if body.rules is not None:
        store.put(db, "rules", [1 if v else 0 for v in body.rules[: len(store.RULES)]])
    if body.commissions is not None:
        current = store.get(db, "commissions")
        current.update({k: v for k, v in body.commissions.items() if k in current})
        store.put(db, "commissions", current)
    if body.roles:
        for uid, role in body.roles.items():
            s = db.get(Staff, uid)
            if s and 0 <= role < len(store.ROLES):
                s.role = role
        supers = db.scalars(select(Staff).where(Staff.role == 0)).all()
        if not supers:
            db.rollback()
            raise HTTPException(400, "Kamida bitta Super admin qolishi kerak")
    store.log(db, admin.user, "sozlamalarni o‘zgartirdi")
    db.commit()
    return _state(db)


class InviteIn(BaseModel):
    username: str = Field(min_length=2, max_length=64)


@router.post("/staff")
def invite(body: InviteIn, tasks: BackgroundTasks, admin: Admin = Depends(require(store.P_TEAM)), db: Session = Depends(get_db)):
    """Add a person to the team. They must have opened the KiGo bot or mini app once."""
    username = body.username.strip().lstrip("@")
    user = db.scalar(select(User).where(User.username.ilike(username)))
    if not user:
        raise HTTPException(404, f"@{username} KiGo’ni hali ochmagan. Avval botga /start yozsin.")
    if db.get(Staff, user.id):
        raise HTTPException(409, "U allaqachon jamoada")
    count = len(db.scalars(select(Staff)).all())
    db.add(Staff(user_id=user.id, role=1, color=COLORS[count % len(COLORS)]))
    store.log(db, admin.user, f"@{username} ni jamoaga qo‘shdi")
    db.commit()
    tasks.add_task(notify, user.id, "staff_invited", {"by": admin.name, "role": store.ROLES[1]})
    return _state(db)
