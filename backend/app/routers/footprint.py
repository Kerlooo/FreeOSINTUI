"""Passive Site Footprint: archived URLs from the Wayback Machine (its CDX API has no CORS)."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.config import settings
from app.footprint import DOMAIN_RE, MAX_LIMIT, cdx_url, fetch_capped, parse_cdx_text
from app.ratelimit import RateLimiter

router = APIRouter(prefix="/api/footprint", tags=["footprint"])
limiter = RateLimiter(settings.footprint_rate_limit)


@router.get("/wayback", dependencies=[Depends(limiter.dependency())])
async def wayback(
    request: Request,
    domain: str = Query(..., max_length=253),
    subdomains: bool = False,
    limit: int = Query(MAX_LIMIT, ge=1, le=MAX_LIMIT),
) -> dict:
    domain = domain.strip().lower().rstrip(".")
    if not DOMAIN_RE.fullmatch(domain):
        raise HTTPException(status_code=422, detail="Invalid domain: expected a hostname such as example.com.")

    # Fixed host: only web.archive.org CDX queries built from the validated domain.
    try:
        status, body, complete = await fetch_capped(request.app.state.http, cdx_url(domain, subdomains, limit))
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="web.archive.org did not answer in time.")
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach web.archive.org.")
    if status == 403:
        raise HTTPException(
            status_code=502,
            detail="web.archive.org refused the query (HTTP 403): the site may be excluded from the Wayback Machine.",
        )
    if status == 429:
        raise HTTPException(status_code=429, detail="web.archive.org is rate limiting requests. Try again in a minute.")
    if status != 200:
        raise HTTPException(status_code=502, detail=f"web.archive.org answered with HTTP {status}.")

    records = parse_cdx_text(body, complete=complete)[:limit]
    return {
        "domain": domain,
        "subdomains": subdomains,
        "limit": limit,
        "truncated": not complete or len(records) >= limit,
        "records": records,
    }
