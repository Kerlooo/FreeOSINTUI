import asyncio
import dataclasses
import ipaddress
import json
from urllib.parse import parse_qs

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app import reputation as rep
from app.main import app
from app.routers import reputation as router

TOR_BODY = "171.25.193.25\n80.67.167.81\n2001:67c:e60:c0c:192:42:116:16\n"
DROP_V4 = "\n".join(
    [
        '{"cidr":"1.10.16.0/20","sblid":"SBL256894","rir":"apnic"}',
        '{"cidr":"223.254.0.0/16","sblid":"SBL212803","rir":"apnic"}',
        '{"type":"metadata","timestamp":1790680442,"size":103368,"records":2}',
    ]
)
DROP_V6 = "\n".join(
    [
        '{"cidr":"2001:678:254::/48","sblid":"SBL697648","rir":"ripencc"}',
        '{"type":"metadata","timestamp":1790586842,"size":5759,"records":1}',
    ]
)


@pytest.fixture
def client():
    router.tor_cache.clear()
    router.drop_cache.clear()
    router.limiter._hits.clear()
    with TestClient(app) as c:
        yield c


@pytest.fixture
def with_key(monkeypatch):
    monkeypatch.setattr(router, "settings", dataclasses.replace(router.settings, abusech_auth_key="secret"))


@pytest.fixture
def without_key(monkeypatch):
    monkeypatch.setattr(router, "settings", dataclasses.replace(router.settings, abusech_auth_key=""))


def mock_lists():
    tor = respx.get(rep.TOR_EXIT_LIST_URL).mock(
        return_value=httpx.Response(200, text=TOR_BODY, headers={"Last-Modified": "Wed, 30 Sep 2026 09:05:15 GMT"})
    )
    v4 = respx.get(rep.DROP_V4_URL).mock(return_value=httpx.Response(200, text=DROP_V4))
    v6 = respx.get(rep.DROP_V6_URL).mock(return_value=httpx.Response(200, text=DROP_V6))
    return tor, v4, v6


# --- validation -------------------------------------------------------------------------------


def test_parse_inputs():
    assert str(rep.parse_ip(" 8.8.8.8 ")) == "8.8.8.8"
    assert str(rep.parse_ip("::ffff:1.2.3.4")) == "1.2.3.4"
    assert str(rep.parse_ip("2001:DB8::1")) == "2001:db8::1"
    assert rep.parse_ip("999.1.1.1") is None
    assert rep.parse_domain("Example.COM.") == "example.com"
    assert rep.parse_domain("localhost") is None
    assert rep.parse_domain("a/b.com") is None
    assert rep.parse_url("https://example.com/a?b=1") == "https://example.com/a?b=1"
    assert rep.parse_url("ftp://example.com/") is None
    assert rep.parse_url("http://exa mple.com/") is None
    assert rep.parse_url("http:///nohost") is None
    assert rep.parse_url("https://example.com/" + "a" * rep.MAX_URL_LENGTH) is None
    assert rep.parse_term("1.2.3.4") == "1.2.3.4"
    assert rep.parse_term("bad term!") is None


def test_endpoints_reject_bad_input(client, with_key):
    assert client.get("/api/reputation/tor", params={"ip": "example.com"}).status_code == 422
    assert client.get("/api/reputation/drop", params={"ip": "1.2.3"}).status_code == 422
    assert client.get("/api/reputation/urlhaus", params={"host": "not a host"}).status_code == 422
    assert client.get("/api/reputation/urlhaus", params={"url": "javascript:alert(1)"}).status_code == 422
    assert client.get("/api/reputation/urlhaus").status_code == 422
    assert client.get("/api/reputation/urlhaus", params={"host": "a.com", "url": "http://a.com"}).status_code == 422
    assert client.get("/api/reputation/threatfox", params={"term": "<script>"}).status_code == 422


# --- Tor --------------------------------------------------------------------------------------


@respx.mock
def test_tor_listed_and_cached(client):
    tor, _, _ = mock_lists()
    data = client.get("/api/reputation/tor", params={"ip": "171.25.193.25"}).json()
    assert data["status"] == "listed"
    assert data["date"] == "2026-09-30T09:05:15+00:00"
    assert data["details"]["exit_nodes"] == 3
    ipv6 = client.get("/api/reputation/tor", params={"ip": "2001:67c:e60:c0c:192:42:116:16"}).json()
    assert ipv6["status"] == "listed"
    assert client.get("/api/reputation/tor", params={"ip": "8.8.8.8"}).json()["status"] == "not_listed"
    assert tor.call_count == 1


@respx.mock
def test_tor_upstream_error(client):
    respx.get(rep.TOR_EXIT_LIST_URL).mock(return_value=httpx.Response(500))
    response = client.get("/api/reputation/tor", params={"ip": "8.8.8.8"})
    assert response.status_code == 502
    assert "HTTP 500" in response.json()["detail"]


@respx.mock
def test_tor_timeout(client):
    respx.get(rep.TOR_EXIT_LIST_URL).mock(side_effect=httpx.ConnectTimeout("slow"))
    assert client.get("/api/reputation/tor", params={"ip": "8.8.8.8"}).status_code == 504


# --- DROP -------------------------------------------------------------------------------------


def test_parse_drop_and_match():
    v4, date = rep.parse_drop(DROP_V4 + "\nnot json\n")
    v6, _ = rep.parse_drop(DROP_V6)
    entries = v4 + v6
    assert len(entries) == 3
    assert date == "2026-09-29T11:14:02+00:00"
    assert rep.find_drop(entries, ipaddress.ip_address("1.10.31.255")).sblid == "SBL256894"
    assert rep.find_drop(entries, ipaddress.ip_address("1.10.32.0")) is None
    assert rep.find_drop(entries, ipaddress.ip_address("2001:678:254:ffff::1")).sblid == "SBL697648"
    assert rep.find_drop(entries, ipaddress.ip_address("2001:678:255::1")) is None


@respx.mock
def test_drop_endpoint(client):
    _, v4, v6 = mock_lists()
    data = client.get("/api/reputation/drop", params={"ip": "223.254.1.2"}).json()
    assert data["status"] == "listed"
    assert data["details"] == {"cidr": "223.254.0.0/16", "sblid": "SBL212803", "rir": "apnic"}
    assert data["date"] == "2026-09-29T11:14:02+00:00"
    v6data = client.get("/api/reputation/drop", params={"ip": "2001:678:254::1"}).json()
    assert v6data["status"] == "listed"
    assert client.get("/api/reputation/drop", params={"ip": "8.8.8.8"}).json()["status"] == "not_listed"
    assert v4.call_count == 1 and v6.call_count == 1


# --- cache ------------------------------------------------------------------------------------


def test_list_cache_ttl_and_stale_fallback():
    now = [0.0]
    cache = rep.ListCache(60, clock=lambda: now[0])
    calls = []

    async def ok():
        calls.append(1)
        return {"a"}, "d1"

    async def fail():
        calls.append(1)
        raise httpx.ConnectError("down")

    async def run():
        first = await cache.get(ok)
        assert first.data == {"a"}
        await cache.get(ok)
        assert len(calls) == 1  # fresh: no reload
        now[0] = 61
        stale = await cache.get(fail)  # expired, refresh fails: previous copy is served
        assert stale.data == {"a"} and len(calls) == 2
        cache.clear()
        with pytest.raises(httpx.ConnectError):
            await cache.get(fail)

    asyncio.run(run())


def test_list_cache_single_download_for_concurrent_callers():
    cache = rep.ListCache(60)
    calls = []

    async def slow():
        calls.append(1)
        await asyncio.sleep(0.01)
        return set(), None

    async def run():
        await asyncio.gather(*(cache.get(slow) for _ in range(5)))

    asyncio.run(run())
    assert len(calls) == 1


# --- abuse.ch ---------------------------------------------------------------------------------


def test_abusech_not_configured(client, without_key):
    host = client.get("/api/reputation/urlhaus", params={"host": "example.com"}).json()
    assert host["status"] == "not_configured"
    assert host["checked"] == "example.com"
    fox = client.get("/api/reputation/threatfox", params={"term": "1.2.3.4"}).json()
    assert fox["status"] == "not_configured"


@respx.mock
def test_urlhaus_host_listed(client, with_key):
    route = respx.post(rep.URLHAUS_HOST_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "query_status": "ok",
                "urlhaus_reference": "https://urlhaus.abuse.ch/host/bad.example/",
                "host": "bad.example",
                "firstseen": "2026-01-01 10:00:00 UTC",
                "url_count": "2",
                "blacklists": {"spamhaus_dbl": "abused_legit_malware", "surbl": "not listed"},
                "urls": [
                    {"url_status": "online", "date_added": "2026-09-01 10:00:00 UTC", "threat": "malware_download", "tags": ["elf", "mirai"]},
                    {"url_status": "offline", "date_added": "2026-08-01 10:00:00 UTC", "threat": "malware_download", "tags": None},
                ],
            },
        )
    )
    data = client.get("/api/reputation/urlhaus", params={"host": "Bad.Example"}).json()
    assert data["status"] == "listed"
    assert data["kind"] == "host"
    assert data["date"] == "2026-09-01 10:00:00 UTC"
    assert data["details"]["url_count"] == 2
    assert data["details"]["online"] == 1
    assert data["details"]["tags"] == ["elf", "mirai"]
    request = route.calls.last.request
    assert request.headers["Auth-Key"] == "secret"
    assert parse_qs(request.content.decode()) == {"host": ["bad.example"]}


@respx.mock
def test_urlhaus_url_not_listed_is_sent_not_fetched(client, with_key):
    target = respx.get("http://evil.example/payload.exe")
    route = respx.post(rep.URLHAUS_URL_URL).mock(return_value=httpx.Response(200, json={"query_status": "no_results"}))
    data = client.get("/api/reputation/urlhaus", params={"url": "http://evil.example/payload.exe"}).json()
    assert data["status"] == "not_listed"
    assert parse_qs(route.calls.last.request.content.decode()) == {"url": ["http://evil.example/payload.exe"]}
    assert not target.called


@respx.mock
def test_urlhaus_bad_key(client, with_key):
    respx.post(rep.URLHAUS_HOST_URL).mock(return_value=httpx.Response(401, json={"error": "Unauthorized"}))
    response = client.get("/api/reputation/urlhaus", params={"host": "example.com"})
    assert response.status_code == 502
    assert "Auth-Key" in response.json()["detail"]


@respx.mock
def test_threatfox_listed(client, with_key):
    route = respx.post(rep.THREATFOX_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "query_status": "ok",
                "data": [
                    {
                        "ioc": "1.2.3.4:443",
                        "threat_type": "botnet_cc",
                        "threat_type_desc": "Botnet C&C",
                        "malware_printable": "Cobalt Strike",
                        "confidence_level": 75,
                        "first_seen": "2026-09-01 00:00:00 UTC",
                        "last_seen": None,
                        "tags": ["cs"],
                    }
                ],
            },
        )
    )
    data = client.get("/api/reputation/threatfox", params={"term": "1.2.3.4"}).json()
    assert data["status"] == "listed"
    assert data["date"] == "2026-09-01 00:00:00 UTC"
    assert data["details"]["iocs"][0]["malware"] == "Cobalt Strike"
    body = json.loads(route.calls.last.request.content)
    assert body == {"query": "search_ioc", "search_term": "1.2.3.4"}
    assert route.calls.last.request.headers["Auth-Key"] == "secret"


@respx.mock
def test_threatfox_no_result_and_error(client, with_key):
    respx.post(rep.THREATFOX_URL).mock(
        side_effect=[
            httpx.Response(200, json={"query_status": "no_result", "data": "Your search did not yield any results"}),
            httpx.Response(200, json={"query_status": "illegal_search_term"}),
        ]
    )
    assert client.get("/api/reputation/threatfox", params={"term": "example.com"}).json()["status"] == "not_listed"
    response = client.get("/api/reputation/threatfox", params={"term": "example.com"})
    assert response.status_code == 502
    assert "illegal_search_term" in response.json()["detail"]


def test_rate_limited(client, without_key):
    router.limiter._hits.clear()
    codes = [
        client.get("/api/reputation/threatfox", params={"term": "1.2.3.4"}).status_code
        for _ in range(router.limiter.limit + 1)
    ]
    assert codes[-1] == 429
    router.limiter._hits.clear()
