"""Simple in-memory, per-IP, fixed-window rate limiter (single process only)."""

import time
from collections.abc import Callable

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, limit: int, window: float = 60.0, clock: Callable[[], float] = time.monotonic):
        self.limit = limit
        self.window = window
        self.clock = clock
        self._hits: dict[str, tuple[float, int]] = {}

    def allow(self, key: str) -> bool:
        now = self.clock()
        start, count = self._hits.get(key, (now, 0))
        if now - start >= self.window:
            start, count = now, 0
        if count >= self.limit:
            return False
        self._hits[key] = (start, count + 1)
        if len(self._hits) > 10_000:
            self._prune(now)
        return True

    def _prune(self, now: float) -> None:
        self._hits = {k: v for k, v in self._hits.items() if now - v[0] < self.window}

    def dependency(self) -> Callable[[Request], None]:
        def check(request: Request) -> None:
            client = request.client.host if request.client else "unknown"
            if not self.allow(client):
                raise HTTPException(status_code=429, detail="Too many requests. Try again in a minute.")

        return check
