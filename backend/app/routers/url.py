"""URL Analyzer: unshortener for allow-listed shorteners, urlscan.io search, URLhaus lookup."""

import json
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.config import settings
from app.http import fetch_text
from app.ratelimit import RateLimiter
from app.url import (
    InvalidInput,
    is_shortener_url,
    meta_refresh_target,
    parse_urlhaus,
    parse_urlscan,
    resolve_location,
    urlscan_search_url,
    validate_lookup_url,
    validate_scan_host,
    validate_short_url,
)

router = APIRouter(prefix="/api/url", tags=["url"])
expand_limiter = RateLimiter(settings.url_rate_limit)
urlscan_limiter = RateLimiter(settings.url_rate_limit)
urlhaus_limiter = RateLimiter(settings.url_rate_limit)

URLHAUS_API = "https://urlhaus-api.abuse.ch/v1/url/"
REDIRECT_CODES = {301, 302, 303, 307, 308}


def _bad_input(error: InvalidInput) -> HTTPException:
    return HTTPException(status_code=422, detail=str(error))


def _upstream_error(name: str, error: httpx.HTTPError) -> HTTPException:
    if isinstance(error, httpx.TimeoutException):
        return HTTPException(status_code=504, detail=f"{name} did not answer in time.")
    return HTTPException(status_code=502, detail=f"Could not reach {name}.")


async def _send(client: httpx.AsyncClient, method: str, url: str, max_bytes: int = 64 * 1024):
    """Sends one request without following redirects; returns status, Location and a capped body."""
    response = await client.send(client.build_request(method, url), stream=True, follow_redirects=False)
    try:
        body = b""
        if method == "GET":
            async for chunk in response.aiter_bytes():
                body += chunk
                if len(body) >= max_bytes:
                    break
    finally:
        await response.aclose()
    return response.status_code, response.headers.get("location"), body[:max_bytes].decode("utf-8", "replace")


async def _request_location(client: httpx.AsyncClient, url: str) -> tuple[str, int, str | None]:
    """One HEAD request; GET instead when HEAD is refused or answers 200 without a Location
    (some shorteners serve a meta refresh page). Redirects are never followed, so only the
    allow-listed shortener is contacted.
    """
    status, location, _ = await _send(client, "HEAD", url)
    if status in (405, 501) or (status == 200 and not location):
        status, location, body = await _send(client, "GET", url)
        if status in REDIRECT_CODES and location:
            return "GET", status, location
        return "GET", status, meta_refresh_target(body) if status == 200 else None
    return "HEAD", status, location if status in REDIRECT_CODES else None


@router.get("/expand", dependencies=[Depends(expand_limiter.dependency())])
async def expand(request: Request, url: str = Query(..., max_length=2048)) -> dict:
    try:
        short = validate_short_url(url)
    except InvalidInput as error:
        raise _bad_input(error)
    try:
        method, status, location = await _request_location(request.app.state.http, short)
    except httpx.HTTPError as error:
        raise _upstream_error("The shortener", error)
    target = resolve_location(short, location)
    return {
        "url": short,
        "method": method,
        "status": status,
        "location": target,
        "location_is_shortener": is_shortener_url(target),
    }


@router.get("/urlscan", dependencies=[Depends(urlscan_limiter.dependency())])
async def urlscan(request: Request, host: str = Query(..., max_length=253)) -> dict:
    try:
        valid = validate_scan_host(host)
    except InvalidInput as error:
        raise _bad_input(error)
    search = urlscan_search_url(valid)
    try:
        page = await fetch_text(request.app.state.http, "GET", search, headers={"Accept": "application/json"})
    except httpx.HTTPError as error:
        raise _upstream_error("urlscan.io", error)
    if page.status == 429:
        raise HTTPException(status_code=429, detail="urlscan.io is rate limiting requests. Try again in a minute.")
    if page.status != 200:
        raise HTTPException(status_code=502, detail=f"urlscan.io answered with HTTP {page.status}.")
    try:
        data = json.loads(page.body)
    except ValueError:
        raise HTTPException(status_code=502, detail="urlscan.io returned an invalid response.")
    return {
        "host": valid,
        "search_url": f"https://urlscan.io/search/#{valid}",
        **parse_urlscan(data),
    }


@router.get("/urlhaus", dependencies=[Depends(urlhaus_limiter.dependency())])
async def urlhaus(request: Request, url: str = Query(..., max_length=2048)) -> dict:
    try:
        valid = validate_lookup_url(url)
    except InvalidInput as error:
        raise _bad_input(error)
    key = settings.abusech_auth_key
    if not key:
        return {"configured": False}
    try:
        page = await fetch_text(
            request.app.state.http,
            "POST",
            URLHAUS_API,
            headers={
                "Auth-Key": key,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            content=urlencode({"url": valid}),
        )
    except httpx.HTTPError as error:
        raise _upstream_error("URLhaus", error)
    if page.status in (401, 403):
        raise HTTPException(status_code=502, detail="URLhaus rejected the configured Auth-Key.")
    if page.status != 200:
        raise HTTPException(status_code=502, detail=f"URLhaus answered with HTTP {page.status}.")
    try:
        return parse_urlhaus(json.loads(page.body))
    except ValueError:
        raise HTTPException(status_code=502, detail="URLhaus returned an invalid response.")
