"""Username Analyzer: checks one WhatsMyName site at a time for a username."""

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.config import settings
from app.http import fetch_text
from app.ratelimit import RateLimiter
from app.wmn import USERNAME_RE, load_sites, detect

router = APIRouter(prefix="/api/username", tags=["username"])
limiter = RateLimiter(settings.username_rate_limit)


@router.get("/sites")
async def list_sites() -> dict:
    sites = load_sites()
    return {
        "source": "WhatsMyName",
        "source_url": "https://github.com/WebBreacher/WhatsMyName",
        "license": "CC BY-SA 4.0",
        "sites": [
            {"id": s.id, "name": s.name, "category": s.category, "unreliable": s.unreliable}
            for s in sites.values()
        ],
    }


@router.get("/check", dependencies=[Depends(limiter.dependency())])
async def check_site(
    request: Request,
    username: Annotated[str, Query(max_length=64)],
    site: Annotated[str, Query(max_length=100)],
) -> dict:
    if not USERNAME_RE.fullmatch(username):
        raise HTTPException(status_code=422, detail="Invalid username: use letters, digits, '.', '_' or '-' (max 64).")
    target = load_sites().get(site)
    if target is None:
        raise HTTPException(status_code=404, detail="Unknown site.")

    result = {
        "site": target.id,
        "name": target.name,
        "category": target.category,
        "url": target.profile_url(username),
        "http_status": None,
        "status": "error",
        "reason": "",
    }
    if not target.account(username):
        result["reason"] = "Username is empty once characters unsupported by this site are removed."
        return result

    # The URL comes only from the bundled site list; redirects are not followed
    # (WhatsMyName uses 301/302 as "missing" codes, and it avoids leaving the fixed host).
    try:
        response = await fetch_text(
            request.app.state.http,
            "POST" if target.post_body else "GET",
            target.check_url(username),
            headers=target.headers or None,
            content=target.body(username),
        )
    except httpx.TimeoutException:
        result["reason"] = "The site did not answer in time."
        return result
    except httpx.HTTPError as error:
        result["reason"] = f"Request failed ({type(error).__name__})."
        return result

    result["http_status"] = response.status
    result["status"], result["reason"] = detect(target, response.status, response.body)
    return result
