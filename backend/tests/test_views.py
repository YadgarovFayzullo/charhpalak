UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15"}


def test_counts_once_per_visitor_per_day(client):
    assert client.get("/api/public/views/tennis-open").json() == {"views": 0}
    first = client.post("/api/public/views/tennis-open", headers=UA).json()
    assert first == {"views": 1, "counted": True}
    again = client.post("/api/public/views/tennis-open", headers=UA).json()
    assert again == {"views": 1, "counted": False}
    # another visitor (other user agent) is counted
    other = client.post("/api/public/views/tennis-open", headers={"User-Agent": UA["User-Agent"] + " Edg/120"}).json()
    assert other == {"views": 2, "counted": True}
    # and the same visitor on another tournament too
    assert client.post("/api/public/views/futbol-kubogi", headers=UA).json()["counted"] is True
    assert client.get("/api/public/views?slugs=tennis-open,futbol-kubogi,none").json() == {"tennis-open": 2, "futbol-kubogi": 1, "none": 0}


def test_bots_and_bad_slugs_are_ignored(client):
    for ua in ("", "curl/8.4.0", "python-requests/2.31", "Googlebot/2.1 (+http://www.google.com/bot.html)"):
        r = client.post("/api/public/views/tennis-open", headers={"User-Agent": ua}).json()
        assert r["counted"] is False
    assert client.post("/api/public/views/BAD SLUG!", headers=UA).status_code in (400, 404)
    assert client.post("/api/public/views/" + "a" * 80, headers=UA).status_code == 400
    assert client.get("/api/public/views/tennis-open").json() == {"views": 0}


def test_one_visitor_cannot_flood_many_tournaments(client):
    counted = [client.post(f"/api/public/views/t-{i}", headers=UA).json()["counted"] for i in range(40)]
    assert sum(counted) == 30
