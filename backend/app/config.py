"""Settings read from environment variables."""

import os
from dataclasses import dataclass, field
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

DEFAULT_ORIGINS = "http://localhost:5173,http://localhost:4173"

# Realistic desktop browser User-Agent: many sites block obvious bots.
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0"


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    allowed_origins: list[str] = field(default_factory=list)
    request_timeout: float = 10.0
    max_response_bytes: int = 2 * 1024 * 1024
    # Requests per minute per client IP, per tool.
    username_rate_limit: int = 1200
    telegram_rate_limit: int = 30


def load_settings() -> Settings:
    origins = os.environ.get("ALLOWED_ORIGINS", DEFAULT_ORIGINS)
    return Settings(
        allowed_origins=[o.strip() for o in origins.split(",") if o.strip()],
        username_rate_limit=_int_env("USERNAME_RATE_LIMIT", 1200),
        telegram_rate_limit=_int_env("TELEGRAM_RATE_LIMIT", 30),
    )


settings = load_settings()
