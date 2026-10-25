"""«Shikoyatlar va sharhlar»."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Complaint, Review
from ..notifier import notify
from ..utils import stamp
from . import store
from .auth import Admin, require

router = APIRouter(prefix="/api/admin/complaints", tags=["admin complaints"])

# Review moderation actions → Review.status
REVIEW_ACTIONS = {"Ko‘rsatish": "shown", "So‘zlarni yashirib ko‘rsatish": "masked", "O‘chirish": "deleted"}


def item(c: Complaint) -> dict:
    return {
        "id": c.id, "kind": c.kind, "title": c.title, "sub": c.sub, "priority": c.priority, "priorityCls": c.priority_cls,
        "when": stamp(c.created_at), "details": c.details, "text": c.text, "files": c.files, "reply": c.reply,
        "options": c.options, "actions": c.actions, "status": c.status,
    }


@router.get("")
def complaints(admin: Admin = Depends(require(store.P_VIEW)), db: Session = Depends(get_db)):
    rows = db.scalars(select(Complaint).order_by(Complaint.status.desc(), Complaint.created_at.desc())).all()
    return [item(c) for c in rows]


class UpdateIn(BaseModel):
    actions: list[int] | None = None
    reply: str | None = Field(default=None, max_length=4000)
    status: str | None = Field(default=None, pattern="^(open|done)$")


@router.patch("/{cid}")
def update(cid: int, body: UpdateIn, tasks: BackgroundTasks, admin: Admin = Depends(require(store.P_COMPLAINTS)), db: Session = Depends(get_db)):
    c = db.get(Complaint, cid)
    if not c:
        raise HTTPException(404, "Topilmadi")
    if body.actions is not None:
        c.actions = sorted({i for i in body.actions if 0 <= i < len(c.options)})
    if body.reply is not None:
        c.reply = body.reply
    if body.status and body.status != c.status:
        c.status = body.status
        if c.status == "done":
            if c.kind == "review" and c.review_id:
                chosen = [c.options[i] for i in c.actions if c.options[i] in REVIEW_ACTIONS]
                review = db.get(Review, c.review_id)
                if review and chosen:
                    review.status = REVIEW_ACTIONS[chosen[-1]]
            store.log(db, admin.user, f"«{c.title}» {'shikoyatini' if c.kind == 'complaint' else 'sharhini'} hal qildi")
            if c.kind == "complaint" and c.from_user_id and c.reply.strip():
                tasks.add_task(notify, c.from_user_id, "complaint_reply", {"title": c.title, "reply": c.reply})
    db.commit()
    return item(c)
