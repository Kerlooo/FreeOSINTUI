"""WhatsMyName site list (https://github.com/WebBreacher/WhatsMyName, CC BY-SA 4.0).

Loads the bundled `data/wmn-data.json` and implements the WhatsMyName detection rules:
an account exists when the HTTP status equals `e_code` AND `e_string` is in the body,
and is missing when the status equals `m_code` AND `m_string` (if any) is in the body.
"""

import json
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from app.config import DATA_DIR

WMN_FILE = DATA_DIR / "wmn-data.json"
USERNAME_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
PLACEHOLDER = "{account}"


@dataclass(frozen=True)
class Site:
    id: str
    name: str
    category: str
    uri_check: str
    e_code: int
    e_string: str
    m_code: int
    m_string: str
    uri_pretty: str | None = None
    post_body: str | None = None
    headers: dict[str, str] = field(default_factory=dict)
    strip_bad_char: str = ""
    protection: tuple[str, ...] = ()

    @property
    def unreliable(self) -> bool:
        """Sites behind bot protection (Cloudflare, captcha...) often give wrong results."""
        return bool(self.protection)

    def account(self, username: str) -> str:
        return "".join(c for c in username if c not in self.strip_bad_char)

    def check_url(self, username: str) -> str:
        return self.uri_check.replace(PLACEHOLDER, self.account(username))

    def body(self, username: str) -> str | None:
        return self.post_body.replace(PLACEHOLDER, self.account(username)) if self.post_body else None

    def profile_url(self, username: str) -> str | None:
        """URL a human can open; None when the check is an API call with no public page."""
        template = self.uri_pretty or (None if self.post_body else self.uri_check)
        if not template or PLACEHOLDER not in template:
            return None
        return template.replace(PLACEHOLDER, self.account(username))


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "site"


def parse_sites(data: dict) -> list[Site]:
    sites: list[Site] = []
    seen: set[str] = set()
    for raw in data.get("sites", []):
        if raw.get("valid") is False:
            continue
        uri = raw.get("uri_check", "")
        if not uri.startswith(("https://", "http://")):
            continue
        base = slugify(raw["name"])
        site_id, n = base, 2
        while site_id in seen:
            site_id, n = f"{base}-{n}", n + 1
        seen.add(site_id)
        sites.append(
            Site(
                id=site_id,
                name=raw["name"],
                category=raw.get("cat", "misc"),
                uri_check=uri,
                uri_pretty=raw.get("uri_pretty"),
                post_body=raw.get("post_body"),
                headers=dict(raw.get("headers") or {}),
                e_code=int(raw["e_code"]),
                e_string=raw.get("e_string", ""),
                m_code=int(raw["m_code"]),
                m_string=raw.get("m_string", ""),
                strip_bad_char=raw.get("strip_bad_char", ""),
                protection=tuple(raw.get("protection") or ()),
            )
        )
    return sites


@lru_cache(maxsize=1)
def load_sites(path: Path = WMN_FILE) -> dict[str, Site]:
    with path.open(encoding="utf-8") as f:
        return {site.id: site for site in parse_sites(json.load(f))}


def detect(site: Site, status: int, body: str) -> tuple[str, str]:
    """Returns (status, reason) where status is "found", "not_found" or "unknown"."""
    if status == site.e_code and site.e_string in body:
        return "found", f"HTTP {status} and the profile marker is present"
    if status == site.m_code and (not site.m_string or site.m_string in body):
        if site.m_string:
            return "not_found", f"HTTP {status} and the 'not found' marker is present"
        return "not_found", f"HTTP {status} (expected for missing accounts)"
    if status in (403, 429, 503):
        return "unknown", f"HTTP {status}: blocked or rate limited by the site"
    return "unknown", f"HTTP {status} did not match the expected responses"
