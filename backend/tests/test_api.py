import hashlib
import hmac
import json
import time
from datetime import timedelta
from urllib.parse import urlencode

from app.utils import today

TOMORROW = (today() + timedelta(days=1)).isoformat()


def init_data(user: dict, token: str = "123456:TESTTOKEN") -> str:
    fields = {"auth_date": str(int(time.time())), "user": json.dumps(user)}
    check = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    fields["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(fields)


# ---------- auth & profile ----------

def test_telegram_auth_creates_user(client):
    h = {"Authorization": "tma " + init_data({"id": 777, "first_name": "Ali", "last_name": "Valiyev", "username": "ali"})}
    me = client.get("/api/me", headers=h).json()
    assert (me["id"], me["name"], me["username"], me["onboarded"]) == (777, "Ali Valiyev", "@ali", False)


def test_invisible_characters_are_stripped_from_names(client):
    h = {"Authorization": "tma " + init_data({"id": 783, "first_name": "ㅤFayzullo Yadgarov"})}
    me = client.get("/api/me", headers=h).json()
    assert (me["name"], me["initials"]) == ("Fayzullo Yadgarov", "FY")


def test_forged_init_data_is_rejected(client):
    h = {"Authorization": "tma " + init_data({"id": 777, "first_name": "Ali"}, token="999:OTHER")}
    assert client.get("/api/me", headers=h).status_code == 401


def test_onboarding_saves_profile(client):
    h = {"Authorization": "tma " + init_data({"id": 778, "first_name": "Vali"})}
    r = client.patch("/api/me", headers=h, json={"roles": ["p"], "sports": ["Padel"], "level": "Kuchli", "areas": ["Chilonzor"], "onboarded": True})
    assert r.json()["sports"] == ["Padel"] and r.json()["onboarded"] is True


# ---------- clubs ----------

def test_club_list_filters(client):
    assert {c["id"] for c in client.get("/api/clubs").json()} == {"pirat", "aqua", "olimp", "streetball"}
    assert [c["id"] for c in client.get("/api/clubs", params={"sport": "Tennis"}).json()] == ["olimp"]
    assert {c["id"] for c in client.get("/api/clubs", params={"max_price": 100000}).json()} == {"pirat", "aqua"}


def test_club_detail_has_busy_slots(client):
    club = client.get("/api/clubs/pirat").json()
    rus = str(club["types"][0]["id"])
    assert club["busy"][rus][1] == ["19:00"]  # tomorrow, from the seed
    assert client.get("/api/clubs/nope").status_code == 404


# ---------- bookings ----------

def book(client, **kw):
    club = client.get("/api/clubs/pirat").json()
    body = {"club_id": "pirat", "type_id": club["types"][0]["id"], "date": TOMORROW, "start": "20:00", "hours": 2, "pay_method": "click"}
    return client.post("/api/bookings", json={**body, **kw})


def test_booking_payment_flow(client, sent):
    b = book(client).json()
    assert (b["status"], b["total"], b["deposit"], b["atClub"]) == ("awaiting_payment", 110000, 20000, 90000)
    assert sent == []

    paid = client.post(f"/api/bookings/{b['id']}/pay").json()
    assert paid["status"] == "confirmed" and paid["paid"] == 20000
    assert sent[0][:2] == (1000, "booking_confirmed")

    club = client.get("/api/clubs/pirat").json()
    assert {"20:00", "21:00"} <= set(club["busy"][str(club["types"][0]["id"])][1])


def test_pay_at_club_confirms_immediately(client, sent):
    b = book(client, pay_method="club").json()
    assert (b["status"], b["deposit"]) == ("confirmed", 0)
    assert sent[0][1] == "booking_confirmed"


def test_double_booking_is_rejected(client):
    assert book(client).status_code == 201
    assert book(client, start="21:00", hours=1).status_code == 409
    assert book(client, start="19:00").status_code == 409  # seeded busy slot


def test_cancel_refunds_deposit_early(client):
    b = book(client, pay_method="payme").json()
    client.post(f"/api/bookings/{b['id']}/pay")
    c = client.post(f"/api/bookings/{b['id']}/cancel").json()
    assert (c["status"], c["refunded"]) == ("cancelled", True)
    assert client.post(f"/api/bookings/{b['id']}/cancel").status_code == 400


def test_cannot_touch_other_users_booking(client):
    b = book(client).json()
    other = {"Authorization": "tma " + init_data({"id": 779, "first_name": "X"})}
    assert client.post(f"/api/bookings/{b['id']}/cancel", headers=other).status_code == 404


# ---------- games ----------

def test_join_and_leave_game(client):
    bilyard = next(g for g in client.get("/api/games").json() if g["sport"] == "Bilyard")
    assert (bilyard["have"], bilyard["left"]) == (1, 1)
    joined = client.post(f"/api/games/{bilyard['id']}/join").json()
    assert joined["joined"] and joined["left"] == 0
    other = {"Authorization": "tma " + init_data({"id": 780, "first_name": "Y"})}
    assert client.post(f"/api/games/{bilyard['id']}/join", headers=other).status_code == 409
    assert client.post(f"/api/games/{bilyard['id']}/join").json()["joined"] is False


def test_create_game(client):
    g = client.post("/api/games", json={"sport": "Futbol", "level": "O‘rta", "date": TOMORROW, "time": "19:00",
                                        "place": "«Arena» · 6×6", "need": 2, "price": "30 000 so‘m"}).json()
    assert (g["have"], g["max"], g["mine"], g["joined"]) == (1, 3, True, True)
    assert any(x["id"] == g["id"] for x in client.get("/api/games", params={"mine": True}).json())


# ---------- tournaments ----------

def test_tournament_registration(client):
    t = client.post("/api/tournaments/pirat-cup/register").json()
    assert t["registered"] and t["count"] == 33 and t["group"]
    assert client.post("/api/tournaments/pirat-cup/register").json()["registered"] is False


# ---------- applications (organizer side + CRM moderation) ----------

APP = {"name": "Yunusobod Tennis Cup", "sport": "Tennis", "format": "Yakka", "level": "O‘rta", "venue": "«Olimp» korti",
       "club_id": "olimp", "start_date": "2026-12-05", "end_date": "2026-12-06", "max_players": 16, "min_players": 8, "fee": 100000}


def test_application_full_cycle(client, sent, admin):
    a = client.post("/api/applications", json=APP).json()
    assert a["status"] == "rev" and any(e == "application_received" for _, e, _ in sent)
    key = f"a{a['id']}"
    crm = {i["key"]: i for i in client.get("/api/admin/requests", headers=admin).json()["items"]}
    assert crm[key]["st"] == "new"

    assert client.post(f"/api/admin/requests/{key}/open", headers=admin).json()["st"] == "rev"
    info = client.post(f"/api/admin/requests/{key}/request-info", headers=admin, json={"comment": "Kortlar bandmi?", "fields": ["Joy va sana"]}).json()
    assert info["st"] == "info" and sent[-1] == (1000, "info_requested", {"comment": "Kortlar bandmi?", "title": APP["name"], "deadline": "72 soat"})
    assert client.get("/api/applications").json()[0]["status"] == "info"

    assert client.post(f"/api/applications/{a['id']}/answer", json={"answer": "Ha, kelishilgan"}).json()["status"] == "rev"

    # Approval needs the whole checklist.
    assert client.post(f"/api/admin/requests/{key}/approve", headers=admin, json={}).status_code == 400
    client.put(f"/api/admin/requests/{key}/checks", headers=admin, json={"checks": list(range(6))})
    ok = client.post(f"/api/admin/requests/{key}/approve", headers=admin, json={"places": {"feat": True, "banner": True}, "slot": 0}).json()
    assert ok["st"] == "pub" and sent[-1][1] == "application_approved"
    assert [h[0] for h in ok["history"]][-2:] == ["Tasdiqlandi", "E’lon qilindi"]

    mine = client.get("/api/applications").json()[0]
    t = client.get(f"/api/tournaments/{mine['tournamentId']}").json()
    assert (t["title"], t["max"], t["banner"]) == ("Yunusobod Tennis Cup", 16, True)
    featured = [r for r in client.get("/api/admin/tournaments", headers=admin).json() if r["featured"]]
    assert sorted(featured, key=lambda r: r["featured"])[0]["id"] == t["id"]

    other = {"Authorization": "tma " + init_data({"id": 781, "first_name": "Zafar", "last_name": "Q"})}
    client.post(f"/api/tournaments/{t['id']}/register", headers=other)
    assert sent[-1][:2] == (1000, "new_participant")


def test_reject_and_resubmit(client, sent, admin):
    a = client.post("/api/applications", json=APP).json()
    no = client.post(f"/api/admin/requests/a{a['id']}/reject", headers=admin, json={"reason": "Sana band"}).json()
    assert no["st"] == "no" and sent[-1][1] == "application_rejected"
    again = client.put(f"/api/applications/{a['id']}", json={**APP, "start_date": "2026-12-12", "end_date": "2026-12-13"}).json()
    assert again["status"] == "rev" and again["history"][-1]["title"] == "Qayta yuborildi"
    crm = {i["key"]: i for i in client.get("/api/admin/requests", headers=admin).json()["items"]}
    assert crm[f"a{a['id']}"]["st"] == "new"


def test_admin_needs_session_and_staff(client):
    assert client.get("/api/admin/requests").status_code == 401
    token = client.post("/api/admin/login").json()["token"]
    from tests.conftest import BOT
    r = client.post("/api/admin/login/confirm", headers=BOT, json={"token": token, "user_id": 2}).json()
    assert r["ok"] is False and client.get(f"/api/admin/login/{token}").json()["status"] == "denied"
    assert client.post("/api/admin/login/confirm", json={"token": token, "user_id": 1000}).status_code == 403  # no bot secret


# ---------- ratings ----------

def test_pending_rating_and_rate(client):
    pending = client.get("/api/me").json()["pendingRating"]
    assert pending["name"] == "Aziz T."
    r = client.post("/api/ratings", json={"game_id": pending["gameId"], "user_id": pending["userId"], "stars": 5}).json()
    assert r["pendingRating"] is None
    assert client.post("/api/ratings", json={"game_id": pending["gameId"], "user_id": pending["userId"], "stars": 5}).status_code == 409
