"""CRM sign-in through the Telegram bot.

1. The CRM calls POST /api/admin/login and shows a t.me link with a one-time token.
2. The admin opens it; the bot asks to confirm and calls POST /api/admin/login/confirm.
3. The CRM polls GET /api/admin/login/{token}; once confirmed the token is the session
   (sent as `Authorization: Bearer <token>`), valid for 7 days.
Only users in the `staff` table can sign in.
"""

import hmac
import secrets
from dataclasses import dataclass
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import clean_name
from ..config import settings
from ..db import get_db
from ..models import AdminSession, BusinessLead, Application, Complaint, Staff, User, now
from . import store

router = APIRouter(prefix="/api/admin", tags=["admin auth"])

LOGIN_TTL = timedelta(minutes=10)
SESSION_TTL = timedelta(days=7)


@dataclass
class Admin:
    user: User
    role: int

    @property
    def name(self) -> str:
        return self.user.short_name or self.user.name


def staff_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> Admin:
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    s = db.get(AdminSession, token) if token else None
    if not s or s.status != "ok" or s.expires_at < now():
        raise HTTPException(401, "Qayta kiring")
    staff = db.get(Staff, s.user_id)
    if not staff:
        raise HTTPException(403, "Siz jamoada emassiz")
    return Admin(user=staff.user, role=staff.role)


def require(perm: int):
    def dep(admin: Admin = Depends(staff_user), db: Session = Depends(get_db)) -> Admin:
        if not store.can(db, admin.role, perm):
            raise HTTPException(403, f"Ruxsat yo‘q: {store.PERMISSIONS[perm]}")
        return admin
    return dep


def check_bot(secret: str | None) -> None:
    if not settings.notify_secret or not hmac.compare_digest(secret or "", settings.notify_secret):
        raise HTTPException(403, "forbidden")


def ensure_admins(db: Session) -> None:
    """ADMIN_IDS from the environment are always Super admins."""
    for uid in settings.admin_ids:
        if not db.get(User, uid):
            db.add(User(id=uid))
            db.flush()
        staff = db.get(Staff, uid)
        if not staff:
            db.add(Staff(user_id=uid, role=0))
        elif staff.role != 0:
            staff.role = 0
    db.commit()


@router.post("/login")
def start_login(db: Session = Depends(get_db)):
    token = secrets.token_urlsafe(24)
    db.add(AdminSession(token=token, status="pending", expires_at=now() + LOGIN_TTL))
    db.commit()
    return {"token": token, "link": f"https://t.me/{settings.bot_username}?start=login_{token}"}


@router.get("/login/{token}")
def poll_login(token: str, db: Session = Depends(get_db)):
    s = db.get(AdminSession, token)
    if not s or s.expires_at < now():
        return {"status": "expired"}
    return {"status": s.status}


class ConfirmIn(BaseModel):
    token: str
    user_id: int
    first_name: str = ""
    last_name: str = ""
    username: str = ""
    approve: bool = True


@router.post("/login/check")
def bot_check(body: ConfirmIn, x_notify_secret: str | None = Header(default=None), db: Session = Depends(get_db)):
    """Called by the bot before asking the user to confirm."""
    check_bot(x_notify_secret)
    s = db.get(AdminSession, body.token)
    if not s or s.status != "pending" or s.expires_at < now():
        return {"ok": False, "reason": "Havola eskirgan. CRM’da qayta «Kirish» ni bosing."}
    if not db.get(Staff, body.user_id):
        return {"ok": False, "reason": "Siz KiGo jamoasida emassiz. Bosh admin sizni «Sozlamalar»dan taklif qilishi kerak."}
    return {"ok": True}


@router.post("/login/confirm")
def bot_confirm(body: ConfirmIn, x_notify_secret: str | None = Header(default=None), db: Session = Depends(get_db)):
    check_bot(x_notify_secret)
    s = db.get(AdminSession, body.token)
    if not s or s.status != "pending" or s.expires_at < now():
        return {"ok": False, "reason": "Havola eskirgan"}
    staff = db.get(Staff, body.user_id)
    if not staff or not body.approve:
        s.status = "denied"
        db.commit()
        return {"ok": False, "reason": "Kirish bekor qilindi" if staff else "Siz KiGo jamoasida emassiz"}
    user = staff.user
    if body.first_name:
        user.first_name, user.last_name = clean_name(body.first_name), clean_name(body.last_name)
    if body.username:
        user.username = body.username
    s.status, s.user_id, s.expires_at = "ok", body.user_id, now() + SESSION_TTL
    store.log(db, user, "admin panelga kirdi")
    db.commit()
    return {"ok": True, "name": user.name}


class SeenIn(BaseModel):
    user_id: int
    first_name: str = ""
    last_name: str = ""
    username: str = ""


@router.post("/bot/seen")
def bot_seen(body: SeenIn, x_notify_secret: str | None = Header(default=None), db: Session = Depends(get_db)):
    """The bot reports everyone who presses /start, so they can be found by @username (e.g. team invites)."""
    check_bot(x_notify_secret)
    user = db.get(User, body.user_id)
    if not user:
        user = User(id=body.user_id)
        db.add(user)
    user.first_name, user.last_name = clean_name(body.first_name), clean_name(body.last_name)
    user.username = body.username
    db.commit()
    return {"ok": True}


@router.post("/logout")
def logout(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    s = db.get(AdminSession, token) if token else None
    if s:
        db.delete(s)
        db.commit()
    return {"ok": True}


def badges(db: Session) -> dict:
    open_apps = db.scalar(select(func.count()).select_from(Application).where(Application.status.in_(("new", "review", "info"))))
    open_leads = db.scalar(select(func.count()).select_from(BusinessLead).where(BusinessLead.status.in_(("new", "review", "info"))))
    new_clubs = db.scalar(select(func.count()).select_from(BusinessLead).where(BusinessLead.kind.in_(("club", "coach")), BusinessLead.status == "new"))
    complaints = db.scalar(select(func.count()).select_from(Complaint).where(Complaint.status == "open"))
    return {"requests": open_apps + open_leads, "clubs": new_clubs, "complaints": complaints}


@router.get("/me")
def me(admin: Admin = Depends(staff_user), db: Session = Depends(get_db)):
    staff = db.get(Staff, admin.user.id)
    return {
        "id": admin.user.id,
        "name": admin.name,
        "initials": admin.user.initials,
        "color": staff.color,
        "role": admin.role,
        "roleName": store.ROLES[admin.role],
        "can": [store.can(db, admin.role, p) for p in range(len(store.PERMISSIONS))],
        "badges": badges(db),
    }
