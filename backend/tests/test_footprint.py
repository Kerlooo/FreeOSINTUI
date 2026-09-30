from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app import footprint
from app.footprint import DOMAIN_RE, cdx_url, parse_cdx_text
from app.main import app
from app.routers import footprint as footprint_router

CDX = "https://web.archive.org/cdx/search/cdx"

BODY = (
    "20100101000000 http://example.com/ text/html 200\n"
    "20110203040506 http://example.com/files/report.pdf application/pdf 200\n"
    "20120101000000 http://example.com/old%20page warc/revisit -\n"
    "garbage line\n"
    "20130101000000 http://example.com/a b c text/html 404\n"
)


@pytest.fixture
def client():
    footprint_router.limiter._hits.clear()
    with TestClient(app) as c:
        yield c


def test_domain_validation():
    for ok in ("example.com", "a.b.example.co.uk", "xn--bcher-kva.example", "my-site.io"):
        assert DOMAIN_RE.fullmatch(ok), ok
    for bad in ("example", "-a.com", "a-.com", "exa_mple.com", "1.2.3.4", "*.example.com",
                "example.com/x", "example.com:80", "web.archive.org@evil.com", "a..com", ""):
        assert not DOMAIN_RE.fullmatch(bad), bad


def test_cdx_url():
    parts = urlsplit(cdx_url("example.com", True, 100))
    assert f"{parts.scheme}://{parts.netloc}{parts.path}" == CDX
    query = parse_qs(parts.query)
    assert query["url"] == ["*.example.com"]
    assert query["collapse"] == ["urlkey"]
    assert query["limit"] == ["100"]
    assert parse_qs(urlsplit(cdx_url("example.com", False, 5)).query)["url"] == ["example.com/*"]


def test_parse_cdx_text():
    records = parse_cdx_text(BODY)
    assert records[0] == {"timestamp": "20100101000000", "url": "http://example.com/", "mime": "text/html", "status": "200"}
    assert records[2] == {"timestamp": "20120101000000", "url": "http://example.com/old%20page", "mime": "warc/revisit", "status": None}
    assert records[3]["url"] == "http://example.com/a b c"
    assert len(records) == 4


def test_parse_truncated_drops_partial_line():
    body = "20100101000000 http://example.com/ text/html 200\n20110101000000 http://example.com/cut text/ht"
    assert len(parse_cdx_text(body, complete=False)) == 1


@respx.mock
def test_wayback_endpoint(client):
    route = respx.get(url__startswith=CDX).mock(return_value=httpx.Response(200, text=BODY))
    data = client.get("/api/footprint/wayback", params={"domain": "Example.com", "subdomains": "true", "limit": 3}).json()
    assert route.called
    sent = parse_qs(urlsplit(str(route.calls.last.request.url)).query)
    assert sent["url"] == ["*.example.com"]
    assert sent["limit"] == ["3"]
    assert data["domain"] == "example.com"
    assert data["subdomains"] is True
    assert len(data["records"]) == 3
    assert data["truncated"] is True


@respx.mock
def test_wayback_empty(client):
    respx.get(url__startswith=CDX).mock(return_value=httpx.Response(200, text=""))
    data = client.get("/api/footprint/wayback", params={"domain": "example.com"}).json()
    assert data["records"] == []
    assert data["truncated"] is False
    assert data["limit"] == footprint.MAX_LIMIT


@respx.mock
def test_wayback_upstream_errors(client):
    respx.get(url__startswith=CDX).mock(return_value=httpx.Response(403, text="blocked"))
    response = client.get("/api/footprint/wayback", params={"domain": "example.com"})
    assert response.status_code == 502
    assert "excluded" in response.json()["detail"]


@respx.mock
def test_wayback_timeout(client):
    respx.get(url__startswith=CDX).mock(side_effect=httpx.ReadTimeout("slow"))
    assert client.get("/api/footprint/wayback", params={"domain": "example.com"}).status_code == 504


@respx.mock
def test_wayback_size_cap(client, monkeypatch):
    monkeypatch.setattr(footprint, "MAX_BYTES", 60)
    respx.get(url__startswith=CDX).mock(return_value=httpx.Response(200, text=BODY))
    data = client.get("/api/footprint/wayback", params={"domain": "example.com"}).json()
    assert len(data["records"]) == 1
    assert data["truncated"] is True


def test_wayback_rejects_bad_input(client):
    for params in (
        {"domain": "not a domain"},
        {"domain": "example.com/x"},
        {"domain": "127.0.0.1"},
        {"domain": "example.com", "limit": 0},
        {"domain": "example.com", "limit": footprint.MAX_LIMIT + 1},
        {"domain": "example.com", "subdomains": "maybe"},
        {},
    ):
        assert client.get("/api/footprint/wayback", params=params).status_code == 422, params


@respx.mock
def test_wayback_rate_limited(client, monkeypatch):
    respx.get(url__startswith=CDX).mock(return_value=httpx.Response(200, text=""))
    monkeypatch.setattr(footprint_router.limiter, "limit", 2)
    codes = [client.get("/api/footprint/wayback", params={"domain": "example.com"}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]
