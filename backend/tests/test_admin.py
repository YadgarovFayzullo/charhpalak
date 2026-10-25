"""CRM endpoints and their effect on the mini app (one shared database)."""

from datetime import timedelta

from app.utils import today
from tests.conftest import admin_login
from tests.test_api import init_data

TOMORROW = (today() + timedelta(days=1)).isoformat()


def tg(uid, first="Test"):
    return {"Authorization": "tma " + init_data({"id": uid, "first_name": first, "username": f"user{uid}"})}


def test_me_and_dashboard(client, admin):
    me = client.get("/api/admin/me", headers=admin).json()
    assert me["roleName"] == "Super admin" and all(me["can"])
    assert me["badges"]["requests"] >= 5
    d = client.get("/api/admin/dashboard", params={"period": 1}, headers=admin).json()
    assert len(d["kpis"]) == 4 and len(d["bars"]) == 7 and d["queue"]
    assert d["feed"][0][3] == "admin panelga kirdi"


def test_moderator_permissions(client, admin):
    client.get("/api/me", headers=tg(50, "Mod"))  # the person opens the app once
    client.post("/api/admin/team/staff", headers=admin, json={"username": "user50"})
    mod = admin_login(client, 50)
    assert client.get("/api/admin/requests", headers=mod).status_code == 200
    # Default matrix: moderators cannot edit content or move money.
    assert client.put("/api/admin/content", headers=mod, json={"on": {}}).status_code == 403
    assert client.post("/api/admin/payments/1/refund", headers=mod, json={"approve": True}).status_code == 403
    # Super admin grants content rights → allowed.
    team = client.get("/api/admin/team", headers=admin).json()
    matrix = team["matrix"]
    matrix[2][1] = 1
    client.put("/api/admin/team", headers=admin, json={"matrix": matrix})
    assert client.put("/api/admin/content", headers=mod, json={"on": {}}).status_code == 200


def test_cannot_remove_last_super_admin(client, admin):
    assert client.put("/api/admin/team", headers=admin, json={"roles": {"1000": 1}}).status_code == 400


def test_block_user_locks_mini_app(client, admin):
    client.get("/api/me", headers=tg(60))
    client.patch("/api/me", headers=tg(60), json={"onboarded": True, "sports": ["Futbol"]})
    rows = client.get("/api/admin/directory", params={"tab": "foyd", "q": "user60"}, headers=admin).json()["rows"]
    assert len(rows) == 1
    client.patch("/api/admin/directory/foyd/60", headers=admin, json={"blocked": True})
    assert client.get("/api/me", headers=tg(60)).status_code == 403
    client.patch("/api/admin/directory/foyd/60", headers=admin, json={"blocked": False})
    client.patch("/api/admin/directory/foyd/60", headers=admin, json={"toggle": 0, "value": False})  # can_book off
    club = client.get("/api/clubs/olimp", headers=tg(60)).json()
    r = client.post("/api/bookings", headers=tg(60), json={"club_id": "olimp", "type_id": club["types"][0]["id"], "date": TOMORROW, "start": "20:00", "hours": 1, "pay_method": "club"})
    assert r.status_code == 403


def test_club_toggles(client, admin):
    client.patch("/api/admin/directory/klub/olimp", headers=admin, json={"toggle": 2, "value": False})  # bookable off
    club = client.get("/api/clubs/olimp").json()
    r = client.post("/api/bookings", json={"club_id": "olimp", "type_id": club["types"][0]["id"], "date": TOMORROW, "start": "20:00", "hours": 1, "pay_method": "club"})
    assert r.status_code == 403
    client.patch("/api/admin/directory/klub/olimp", headers=admin, json={"blocked": True})
    assert client.get("/api/clubs/olimp").status_code == 404
    assert "olimp" not in {c["id"] for c in client.get("/api/clubs").json()}


def test_late_cancel_becomes_refund_request(client, sent, admin):
    seeded = [r for r in client.get("/api/admin/payments", headers=admin).json()["rows"] if r["st"] == "refreq"]
    assert len(seeded) == 1
    r = client.post(f"/api/admin/payments/{seeded[0]['id']}/refund", headers=admin, json={"approve": True}).json()
    assert r["st"] == "refunded" and sent[-1][1] == "refund_approved"
    assert client.post(f"/api/admin/payments/{seeded[0]['id']}/refund", headers=admin, json={"approve": True}).status_code == 400


def test_tournament_featured_banner_stop(client, sent, admin):
    rows = client.get("/api/admin/tournaments", headers=admin).json()
    assert {r["id"]: r["st"] for r in rows}["autumn-3x3"] == "run"
    assert any(r.get("application") for r in rows)  # applications under review are listed too
    # Only live tournaments can be featured.
    assert client.post("/api/admin/tournaments/futsal-kubogi/featured", headers=admin, json={"on": True}).status_code == 400
    rows = client.put("/api/admin/tournaments/featured", headers=admin, json={"ids": ["autumn-3x3", "pirat-cup"]}).json()
    assert {r["id"]: r["featured"] for r in rows}["autumn-3x3"] == 1
    client.post("/api/admin/tournaments/pirat-cup/banner", headers=admin, json={"on": True})
    assert client.get("/api/tournaments/pirat-cup").json()["banner"] is True

    client.post("/api/tournaments/pirat-cup/register", headers=tg(70))
    client.post("/api/admin/tournaments/pirat-cup/stop", headers=admin, json={"reason": "Ko‘chirildi"})
    t = client.get("/api/tournaments/pirat-cup").json()
    assert (t["status"], t["banner"]) == ("To‘xtatilgan", False)
    assert (70, "tournament_stopped") in [(c, e) for c, e, _ in sent]
    assert client.post("/api/tournaments/pirat-cup/register", headers=tg(71)).status_code == 400


def test_content_controls_mini_app_home(client, admin):
    assert client.get("/api/content").json()["app"]["games"] is True
    c = client.get("/api/admin/content", headers=admin).json()
    client.put("/api/admin/content", headers=admin, json={"on": {**c["on"], "ilova:games": False}, "hero": "pirat-cup", "sponsors": c["sponsors"], "changes": 1})
    assert client.get("/api/content").json()["app"]["games"] is False


def test_review_moderation_hides_review(client, admin):
    items = client.get("/api/admin/complaints", headers=admin).json()
    bad = next(i for i in items if i["kind"] == "review" and i["title"].startswith("★ 1"))
    assert "Anvar T." not in {r["name"] for r in client.get("/api/clubs/aqua").json()["reviews"]}  # pending → hidden
    client.patch(f"/api/admin/complaints/{bad['id']}", headers=admin, json={"actions": [1], "status": "done"})
    shown = {r["name"]: r["text"] for r in client.get("/api/clubs/aqua").json()["reviews"]}
    assert "yashirdi" in shown["Anvar T."]


def test_complaint_reply_goes_to_user(client, sent, admin):
    c = next(i for i in client.get("/api/admin/complaints", headers=admin).json() if i["kind"] == "complaint")
    client.patch(f"/api/admin/complaints/{c['id']}", headers=admin, json={"reply": "Pul qaytariladi", "status": "done"})
    assert sent[-1][1] == "complaint_reply"


def test_lead_from_mini_app_to_crm(client, sent, admin):
    r = client.post("/api/business-leads", headers=tg(80, "Kamola"), json={"kind": "coach", "club_name": "Kamola Y.", "sport": "Tennis", "phone": "+998 90 000 00 80"}).json()
    assert ("admin_new_request" in [e for _, e, _ in sent])
    key = f"l{r['id']}"
    client.put(f"/api/admin/requests/{key}/checks", headers=admin, json={"checks": [0, 1, 2, 3]})
    ok = client.post(f"/api/admin/requests/{key}/approve", headers=admin, json={"places": {"feat": True}}).json()
    assert ok["st"] == "ok" and sent[-1][:2] == (80, "lead_approved")
    coaches = client.get("/api/admin/directory", params={"tab": "murabbiy"}, headers=admin).json()["rows"]
    assert "Kamola Y." in {c["name"] for c in coaches}


def test_invite_requires_known_user(client, admin):
    assert client.post("/api/admin/team/staff", headers=admin, json={"username": "@nobody_here"}).status_code == 404
