"""Telegram OSINT: public profile preview of a channel, group, bot or user."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import settings
from app.http import fetch_text
from app.ratelimit import RateLimiter
from app.telegram import USERNAME_RE, parse_channel_posts, parse_profile

router = APIRouter(prefix="/api/telegram", tags=["telegram"])
limiter = RateLimiter(settings.telegram_rate_limit)


async def _get(request: Request, path: str):
    # Fixed host: only https://t.me/<validated username> URLs are ever requested.
    return await fetch_text(request.app.state.http, "GET", f"https://t.me/{path}")


@router.get("/{username}", dependencies=[Depends(limiter.dependency())])
async def lookup(request: Request, username: str) -> dict:
    if not USERNAME_RE.fullmatch(username):
        raise HTTPException(
            status_code=422,
            detail="Invalid Telegram username: 5-32 characters, letters, digits and '_', starting with a letter.",
        )
    try:
        page = await _get(request, username)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="t.me did not answer in time.")
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach t.me.")
    if page.status != 200:
        raise HTTPException(status_code=502, detail=f"t.me answered with HTTP {page.status}.")

    profile = parse_profile(page.body, username)
    counters: dict = {}
    posts: list = []
    if profile["exists"] and profile["type"] == "channel":
        try:
            preview = await _get(request, f"s/{username}")
            if preview.status == 200:
                parsed = parse_channel_posts(preview.body)
                counters, posts = parsed["counters"], parsed["posts"]
        except httpx.HTTPError:
            pass  # Posts are optional: the profile is still useful without them.

    return {
        "username": username,
        "url": f"https://t.me/{username}",
        **{k: v for k, v in profile.items() if k != "has_preview"},
        "counters": counters,
        "posts": posts,
    }
