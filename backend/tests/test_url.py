import dataclasses

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app.main import app
from app.routers import url as url_router
from app.url import (
    InvalidInput,
    meta_refresh_target,
    parse_urlhaus,
    parse_urlscan,
    resolve_location,
    urlscan_search_url,
    validate_scan_host,
    validate_short_url,
)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# --- validation -------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "raw",
    [
        "https://bit.ly/abc",
        "http://t.co/xyz?amp=1",
        "https://BIT.LY/abc",
        "https://tinyurl.com",
    ],
)
def test_validate_short_url_accepts_allow_list(raw):
    assert validate_short_url(raw).startswith(("https://", "http://"))


@pytest.mark.parametrize(
    "raw",
    [
        "https://evil.com/abc",
        "https://bit.ly.evil.com/abc",
        "https://evil.com#bit.ly",
        "https://evil.com/?bit.ly",
        "https://bit.ly@evil.com/abc",
        "https://user:pass@bit.ly/abc",
        "https://bit.ly:8080/abc",
        "https://bit.ly:443/abc",
        "https://127.0.0.1/abc",
        "http://[::1]/abc",
        "http://2130706433/abc",
        "ftp://bit.ly/abc",
        "javascript:alert(1)",
        "bit.ly/abc",
        "https://bit.ly./abc",
        "https://bit.ly\\@evil.com/",
        "https://bit.ly/a b",
        "https://sub.bit.ly/abc",
        "",
    ],
)
def test_validate_short_url_rejects(raw):
    with pytest.raises(InvalidInput):
        validate_short_url(raw)


def test_validate_short_url_drops_fragment():
    assert validate_short_url("https://bit.ly/abc#frag") == "https://bit.ly/abc"


def test_resolve_location():
    assert resolve_location("https://bit.ly/abc", "https://example.com/x") == "https://example.com/x"
    assert resolve_location("https://bit.ly/abc", "/other") == "https://bit.ly/other"
    assert resolve_location("https://bit.ly/abc", None) is None
    assert resolve_location("https://bit.ly/abc", "javascript:alert(1)") is None


def test_meta_refresh():
    body = '<html><meta http-equiv="refresh" content="0;URL=https://example.com/?a=1&amp;b=2"></html>'
    assert meta_refresh_target(body) == "https://example.com/?a=1&b=2"
    assert meta_refresh_target("<html></html>") is None


def test_validate_scan_host():
    assert validate_scan_host("Example.COM.") == "example.com"
    assert validate_scan_host("8.8.8.8") == "8.8.8.8"
    for bad in ["", "a b.com", "evil.com/x", "example", "xn--.com", "exa_mple.com", "1.2.3.999", "-a.com"]:
        with pytest.raises(InvalidInput):
            validate_scan_host(bad)


def test_urlscan_search_url():
    assert "page.domain%3Aexample.com%20OR%20task.domain%3Aexample.com" in urlscan_search_url("example.com")
    assert "page.ip%3A%228.8.8.8%22" in urlscan_search_url("8.8.8.8")


def test_parse_urlscan():
    uuid = "01a0f1b6-d05c-718c-80b8-8fa47236c3c0"
    data = {
        "total": 1,
        "results": [
            {
                "_id": uuid,
                "task": {"time": "2026-09-30T09:48:11.011Z", "url": "https://example.com/", "tags": ["phishing"]},
                "page": {"url": "https://example.com/", "domain": "example.com", "ip": "1.2.3.4", "status": "200"},
                "verdicts": {"overall": {"malicious": True, "score": 100}},
            },
            {"_id": "../../evil", "task": {}, "page": {}},
        ],
    }
    parsed = parse_urlscan(data)
    assert parsed["total"] == 1
    assert len(parsed["results"]) == 1
    result = parsed["results"][0]
    assert result["malicious"] is True
    assert result["tags"] == ["phishing"]
    assert result["result_url"] == f"https://urlscan.io/result/{uuid}/"


def test_parse_urlhaus():
    assert parse_urlhaus({"query_status": "no_results"}) == {"configured": True, "listed": False}
    listed = parse_urlhaus(
        {
            "query_status": "ok",
            "url_status": "online",
            "threat": "malware_download",
            "tags": ["elf"],
            "urlhaus_reference": "https://urlhaus.abuse.ch/url/1/",
            "blacklists": {"surbl": "not listed"},
            "payloads": [{}, {}],
        }
    )
    assert listed["listed"] is True
    assert listed["payload_count"] == 2
    with pytest.raises(ValueError):
        parse_urlhaus({"query_status": "invalid_url"})


# --- endpoints --------------------------------------------------------------------------------


@respx.mock
def test_expand_allowed_host(client):
    route = respx.head("https://bit.ly/abc").mock(
        return_value=httpx.Response(301, headers={"Location": "https://example.com/landing"})
    )
    data = client.get("/api/url/expand", params={"url": "https://bit.ly/abc"}).json()
    assert route.call_count == 1
    assert data["location"] == "https://example.com/landing"
    assert data["location_is_shortener"] is False
    assert data["method"] == "HEAD"


@respx.mock
def test_expand_chain_flag(client):
    respx.head("https://t.co/abc").mock(return_value=httpx.Response(301, headers={"Location": "https://bit.ly/x"}))
    data = client.get("/api/url/expand", params={"url": "https://t.co/abc"}).json()
    assert data["location_is_shortener"] is True


@respx.mock
def test_expand_relative_location(client):
    respx.head("https://shorturl.at/abc").mock(return_value=httpx.Response(301, headers={"Location": "/abc?x=1"}))
    data = client.get("/api/url/expand", params={"url": "https://shorturl.at/abc"}).json()
    assert data["location"] == "https://shorturl.at/abc?x=1"


@respx.mock
def test_expand_no_location(client):
    respx.head("https://bit.ly/missing").mock(return_value=httpx.Response(404))
    data = client.get("/api/url/expand", params={"url": "https://bit.ly/missing"}).json()
    assert data["location"] is None
    assert data["status"] == 404


@respx.mock
def test_expand_head_not_allowed_falls_back_to_get(client):
    respx.head("https://is.gd/abc").mock(return_value=httpx.Response(405))
    respx.get("https://is.gd/abc").mock(
        return_value=httpx.Response(302, headers={"Location": "https://example.org/"})
    )
    data = client.get("/api/url/expand", params={"url": "https://is.gd/abc"}).json()
    assert data["method"] == "GET"
    assert data["location"] == "https://example.org/"


@respx.mock
def test_expand_meta_refresh(client):
    respx.head("https://t.co/abc").mock(return_value=httpx.Response(200))
    respx.get("https://t.co/abc").mock(
        return_value=httpx.Response(200, text='<meta http-equiv="refresh" content="0;URL=https://example.net/">')
    )
    data = client.get("/api/url/expand", params={"url": "https://t.co/abc"}).json()
    assert data["location"] == "https://example.net/"


@respx.mock
@pytest.mark.parametrize(
    "raw",
    [
        "https://evil.com/abc",
        "https://127.0.0.1/abc",
        "http://169.254.169.254/latest/meta-data/",
        "https://bit.ly.evil.com/abc",
        "https://evil.com#bit.ly",
        "https://bit.ly@evil.com/abc",
        "https://bit.ly:8443/abc",
    ],
)
def test_expand_rejects_ssrf(client, raw):
    response = client.get("/api/url/expand", params={"url": raw})
    assert response.status_code == 422
    assert len(respx.calls) == 0


@respx.mock
def test_expand_upstream_timeout(client):
    respx.head("https://bit.ly/slow").mock(side_effect=httpx.ConnectTimeout("slow"))
    assert client.get("/api/url/expand", params={"url": "https://bit.ly/slow"}).status_code == 504


@respx.mock
def test_urlscan_endpoint(client):
    respx.get(url__startswith="https://urlscan.io/api/v1/search/").mock(
        return_value=httpx.Response(200, json={"total": 0, "results": []})
    )
    data = client.get("/api/url/urlscan", params={"host": "example.com"}).json()
    assert data == {"host": "example.com", "search_url": "https://urlscan.io/search/#example.com", "total": 0, "results": []}
    assert client.get("/api/url/urlscan", params={"host": "evil.com/x"}).status_code == 422


def test_urlhaus_not_configured(client, monkeypatch):
    monkeypatch.setattr(url_router, "settings", dataclasses.replace(url_router.settings, abusech_auth_key=""))
    assert client.get("/api/url/urlhaus", params={"url": "https://example.com/"}).json() == {"configured": False}


@respx.mock
def test_urlhaus_configured(client, monkeypatch):
    monkeypatch.setattr(url_router, "settings", dataclasses.replace(url_router.settings, abusech_auth_key="k"))
    route = respx.post("https://urlhaus-api.abuse.ch/v1/url/").mock(
        return_value=httpx.Response(200, json={"query_status": "no_results"})
    )
    data = client.get("/api/url/urlhaus", params={"url": "https://example.com/"}).json()
    assert data == {"configured": True, "listed": False}
    sent = route.calls[0].request
    assert sent.headers["Auth-Key"] == "k"
    assert sent.content == b"url=https%3A%2F%2Fexample.com%2F"


def test_urlhaus_rejects_bad_url(client):
    assert client.get("/api/url/urlhaus", params={"url": "javascript:alert(1)"}).status_code == 422
