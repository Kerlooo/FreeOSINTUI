"""Reputation Checker: Tor exit list, Spamhaus DROP, abuse.ch URLhaus and ThreatFox.

Every endpoint contacts fixed hosts only. Tor and DROP lists are downloaded once, cached in
memory and answered locally; abuse.ch lookups need ABUSECH_AUTH_KEY and report
`not_configured` without it.
"""

import json
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app import reputation as rep
from app.config import settings
from app.http import FetchResult, fetch_text
from app.ratelimit import RateLimiter

router = APIRouter(prefix="/api/reputation", tags=["reputation"])
limiter = RateLimiter(settings.reputation_rate_limit)

tor_cache = rep.ListCache(rep.TOR_TTL)
drop_cache = rep.ListCache(rep.DROP_TTL)

INVALID_IP = "Invalid IP address."
INVALID_HOST = "Invalid host: expected an IP address or a domain name."
INVALID_URL = f"Invalid URL: expected an http(s) URL of at most {rep.MAX_URL_LENGTH} characters."
INVALID_TERM = "Invalid search term: expected an IP address, a domain or an http(s) URL."


def _auth_key() -> str:
    return settings.abusech_auth_key


async def _fetch(request: Request, method: str, url: str, name: str, **kwargs) -> FetchResult:
    try:
        result = await fetch_text(request.app.state.http, method, url, **kwargs)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"{name} did not answer in time.")
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail=f"Could not reach {name}.")
    if result.status in (401, 403) and "abuse.ch" in name:
        raise HTTPException(status_code=502, detail=f"{name} rejected the Auth-Key (ABUSECH_AUTH_KEY).")
    if result.status != 200:
        raise HTTPException(status_code=502, detail=f"{name} answered with HTTP {result.status}.")
    return result


def _require_ip(ip: str):
    parsed = rep.parse_ip(ip)
    if parsed is None:
        raise HTTPException(status_code=422, detail=INVALID_IP)
    return parsed


@router.get("/tor", dependencies=[Depends(limiter.dependency())])
async def tor(request: Request, ip: str) -> dict:
    address = _require_ip(ip)

    async def load():
        result = await _fetch(request, "GET", rep.TOR_EXIT_LIST_URL, "check.torproject.org")
        date = rep.http_date_to_iso(result.headers.get("last-modified"))
        return rep.parse_tor_list(result.body), date

    cached = await tor_cache.get(load)
    listed = str(address) in cached.data  # type: ignore[operator]
    return {
        "source": "tor",
        "checked": str(address),
        "status": "listed" if listed else "not_listed",
        "date": cached.date,
        "details": {"exit_nodes": len(cached.data)},  # type: ignore[arg-type]
    }


@router.get("/drop", dependencies=[Depends(limiter.dependency())])
async def drop(request: Request, ip: str) -> dict:
    address = _require_ip(ip)

    async def load():
        entries: list[rep.DropEntry] = []
        dates: list[str] = []
        for url in (rep.DROP_V4_URL, rep.DROP_V6_URL):
            result = await _fetch(request, "GET", url, "spamhaus.org")
            parsed, date = rep.parse_drop(result.body)
            entries.extend(parsed)
            if date:
                dates.append(date)
        return entries, max(dates) if dates else None

    cached = await drop_cache.get(load)
    match = rep.find_drop(cached.data, address)  # type: ignore[arg-type]
    return {
        "source": "drop",
        "checked": str(address),
        "status": "listed" if match else "not_listed",
        "date": cached.date,
        "details": {"cidr": str(match.network), "sblid": match.sblid, "rir": match.rir} if match else {},
    }


def _not_configured(source: str, checked: str) -> dict:
    return {"source": source, "checked": checked, "status": "not_configured", "date": None, "details": {}}


def _parse_json(body: str, name: str) -> dict:
    try:
        data = json.loads(body)
    except ValueError:
        raise HTTPException(status_code=502, detail=f"{name} returned an invalid response.")
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail=f"{name} returned an invalid response.")
    return data


@router.get("/urlhaus", dependencies=[Depends(limiter.dependency())])
async def urlhaus(request: Request, host: str | None = None, url: str | None = None) -> dict:
    if (host is None) == (url is None):
        raise HTTPException(status_code=422, detail="Pass exactly one of 'host' or 'url'.")
    if host is not None:
        ip = rep.parse_ip(host)
        checked = str(ip) if ip is not None else rep.parse_domain(host)
        if not checked:
            raise HTTPException(status_code=422, detail=INVALID_HOST)
        endpoint, form, summarize = rep.URLHAUS_HOST_URL, {"host": checked}, rep.summarize_urlhaus_host
    else:
        checked = rep.parse_url(url or "")
        if not checked:
            raise HTTPException(status_code=422, detail=INVALID_URL)
        endpoint, form, summarize = rep.URLHAUS_URL_URL, {"url": checked}, rep.summarize_urlhaus_url

    key = _auth_key()
    if not key:
        return _not_configured("urlhaus", checked)
    # The URL is only sent as a form field to URLhaus, never requested.
    result = await _fetch(
        request,
        "POST",
        endpoint,
        "urlhaus-api.abuse.ch",
        headers={"Auth-Key": key, "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        content=urlencode(form),
    )
    try:
        summary = summarize(_parse_json(result.body, "URLhaus"))
    except ValueError as error:
        raise HTTPException(status_code=502, detail=str(error))
    return {"source": "urlhaus", "checked": checked, "kind": "host" if host is not None else "url", **summary}


@router.get("/threatfox", dependencies=[Depends(limiter.dependency())])
async def threatfox(request: Request, term: str) -> dict:
    checked = rep.parse_term(term)
    if not checked:
        raise HTTPException(status_code=422, detail=INVALID_TERM)
    key = _auth_key()
    if not key:
        return _not_configured("threatfox", checked)
    result = await _fetch(
        request,
        "POST",
        rep.THREATFOX_URL,
        "threatfox-api.abuse.ch",
        headers={"Auth-Key": key, "Content-Type": "application/json", "Accept": "application/json"},
        content=json.dumps({"query": "search_ioc", "search_term": checked}),
    )
    try:
        summary = rep.summarize_threatfox(_parse_json(result.body, "ThreatFox"))
    except ValueError as error:
        raise HTTPException(status_code=502, detail=str(error))
    return {"source": "threatfox", "checked": checked, **summary}
