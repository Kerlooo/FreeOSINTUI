import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app.main import app
from app.ratelimit import RateLimiter
from tests.test_telegram_parser import load


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_sites(client):
    data = client.get("/api/username/sites").json()
    assert data["license"] == "CC BY-SA 4.0"
    assert {"id", "name", "category", "unreliable"} <= set(data["sites"][0])


@respx.mock
def test_check_found(client):
    respx.get("https://api.github.com/users/torvalds").mock(return_value=httpx.Response(200, json={"id": 1024025}))
    data = client.get("/api/username/check", params={"username": "torvalds", "site": "github-user"}).json()
    assert data["status"] == "found"
    assert data["url"] == "https://github.com/torvalds"
    assert data["http_status"] == 200


@respx.mock
def test_check_timeout_is_error(client):
    respx.get("https://api.github.com/users/torvalds").mock(side_effect=httpx.ConnectTimeout("slow"))
    data = client.get("/api/username/check", params={"username": "torvalds", "site": "github-user"}).json()
    assert data["status"] == "error"


def test_check_rejects_bad_input(client):
    assert client.get("/api/username/check", params={"username": "a/b", "site": "github-user"}).status_code == 422
    assert client.get("/api/username/check", params={"username": "ab", "site": "nope"}).status_code == 404


@respx.mock
def test_telegram_channel(client):
    respx.get("https://t.me/durov").mock(return_value=httpx.Response(200, text=load("channel.html")))
    respx.get("https://t.me/s/durov").mock(return_value=httpx.Response(200, text=load("channel_posts.html")))
    data = client.get("/api/telegram/durov").json()
    assert data["exists"] is True
    assert data["type"] == "channel"
    assert len(data["posts"]) == 3
    assert data["counters"]["subscribers"] == "9.44M"


@respx.mock
def test_telegram_missing(client):
    respx.get("https://t.me/nonexistentxyz12345q").mock(return_value=httpx.Response(200, text=load("not_found.html")))
    data = client.get("/api/telegram/nonexistentxyz12345q").json()
    assert data["exists"] is False
    assert data["posts"] == []


def test_telegram_rejects_bad_username(client):
    assert client.get("/api/telegram/ab").status_code == 422


def test_rate_limiter_window():
    now = [0.0]
    limiter = RateLimiter(2, window=60, clock=lambda: now[0])
    assert limiter.allow("ip") and limiter.allow("ip")
    assert not limiter.allow("ip")
    assert limiter.allow("other")
    now[0] = 61
    assert limiter.allow("ip")
