"""Public view counter for tournament pages, with protection against inflating it.

A view is counted only when ALL of these hold:
  * the user agent is present and is not a known crawler/script;
  * this visitor has not already been counted on this tournament in the last 24 hours;
  * this visitor has not been counted on more than MAX_PER_HOUR tournaments in the last hour;
  * the slug looks like a slug, and the number of distinct slugs stays bounded.
The visitor is a salted hash of IP + user agent: no raw personal data is stored.
The landing additionally sends the request only after the page was visible for a few seconds.
"""
import hashlib
import hmac
import re
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import TournamentView, TournamentViewHit, now

router = APIRouter(prefix="/api/public/views", tags=["views"])

SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")
BOT_UA = re.compile(r"bot|crawl|spider|slurp|curl|wget|python|httpx|requests|java|go-http|axios|node-fetch|headless|phantom|lighthouse|preview|monitor|scrapy|postman", re.I)
WINDOW = timedelta(hours=24)
MAX_PER_HOUR = 30
MAX_SLUGS = 500
KEEP = timedelta(days=2)


def _salt() -> bytes:
    return (settings.view_salt or settings.notify_secret or settings.bot_token or "dev-salt").encode()


def _visitor(request: Request) -> str:
    ip = request.client.host if request.client else ""
    if settings.trust_proxy:  # behind our own proxy/tunnel; never enable when the API is reachable directly
        fwd = request.headers.get("x-forwarded-for", "")
        ip = fwd.split(",")[0].strip() or ip
    ua = request.headers.get("user-agent", "")
    return hmac.new(_salt(), f"{ip}|{ua}".encode(), hashlib.sha256).hexdigest()


def _check_slug(slug: str) -> str:
    if not SLUG.match(slug):
        raise HTTPException(400, "Noto‘g‘ri slug")
    return slug


@router.get("")
def many(slugs: str = Query("", max_length=2000), db: Session = Depends(get_db)):
    """View totals for up to 50 slugs: ?slugs=a,b,c"""
    wanted = [_check_slug(x) for x in slugs.split(",") if x][:50]
    rows = db.scalars(select(TournamentView).where(TournamentView.slug.in_(wanted))).all() if wanted else []
    found = {r.slug: r.total for r in rows}
    return {x: found.get(x, 0) for x in wanted}


@router.get("/{slug}")
def one(slug: str, db: Session = Depends(get_db)):
    row = db.get(TournamentView, _check_slug(slug))
    return {"views": row.total if row else 0}


@router.post("/{slug}")
def count(slug: str, request: Request, db: Session = Depends(get_db)):
    """Register a view if it passes the checks above; always answers with the current total."""
    _check_slug(slug)
    row = db.get(TournamentView, slug)
    total = row.total if row else 0
    ua = request.headers.get("user-agent", "")
    if len(ua) < 10 or BOT_UA.search(ua):
        return {"views": total, "counted": False}

    visitor = _visitor(request)
    t = now()
    if db.scalar(select(TournamentViewHit.id).where(
            TournamentViewHit.slug == slug, TournamentViewHit.visitor == visitor, TournamentViewHit.seen_at > t - WINDOW).limit(1)):
        return {"views": total, "counted": False}
    recent = db.scalar(select(func.count()).select_from(TournamentViewHit).where(
        TournamentViewHit.visitor == visitor, TournamentViewHit.seen_at > t - timedelta(hours=1)))
    if recent >= MAX_PER_HOUR:
        return {"views": total, "counted": False}
    if row is None and db.scalar(select(func.count()).select_from(TournamentView)) >= MAX_SLUGS:
        return {"views": 0, "counted": False}

    db.execute(delete(TournamentViewHit).where(TournamentViewHit.seen_at < t - KEEP))
    db.add(TournamentViewHit(slug=slug, visitor=visitor, seen_at=t))
    if row is None:
        try:
            db.add(TournamentView(slug=slug, total=1))
            db.flush()
        except IntegrityError:  # two first views at once
            db.rollback()
            db.add(TournamentViewHit(slug=slug, visitor=visitor, seen_at=t))
            db.execute(update(TournamentView).where(TournamentView.slug == slug).values(total=TournamentView.total + 1))
    else:
        db.execute(update(TournamentView).where(TournamentView.slug == slug).values(total=TournamentView.total + 1))
    db.commit()
    return {"views": (db.scalar(select(TournamentView.total).where(TournamentView.slug == slug)) or 0), "counted": True}
