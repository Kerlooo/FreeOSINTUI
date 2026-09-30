"""URL Analyzer: shortener expansion (allow-listed hosts only), urlscan.io search, URLhaus lookup.

The analyzed URL itself is never fetched. The only outbound requests go to:
- a fixed allow-list of URL shortener hosts (one request, redirects never followed);
- urlscan.io search API (existing public scans, no submissions);
- URLhaus API (abuse.ch, only when ABUSECH_AUTH_KEY is set).
"""

import re
from urllib.parse import quote, urljoin, urlsplit

# Hosts whose only job is redirecting short links. Exact match only.
SHORTENER_HOSTS = frozenset(
    {
        "bit.ly",
        "bitly.com",
        "t.co",
        "tinyurl.com",
        "goo.gl",
        "ow.ly",
        "is.gd",
        "buff.ly",
        "rebrand.ly",
        "cutt.ly",
        "shorturl.at",
        "www.shorturl.at",
        "rb.gy",
        "t.ly",
        "tiny.cc",
        "lnkd.in",
        "s.id",
    }
)

MAX_URL_LENGTH = 2048

# Letters, digits, hyphens; labels of 1-63 chars; at least one dot; TLD with a letter; ASCII only.
HOSTNAME_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?=[a-z0-9-]*[a-z])[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$")
IPV4_RE = re.compile(r"^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$")

META_REFRESH_RE = re.compile(
    r"""<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)""",
    re.IGNORECASE,
)


class InvalidInput(ValueError):
    """Raised when an input is rejected; the message is safe to show to the user."""


def _has_bad_chars(value: str) -> bool:
    return any(ord(c) < 0x21 or ord(c) == 0x7F or c == "\\" for c in value)


def validate_short_url(raw: str) -> str:
    """Returns a normalized short URL if it points to an allow-listed shortener, else raises."""
    if not raw or len(raw) > MAX_URL_LENGTH:
        raise InvalidInput("URL missing or too long.")
    if _has_bad_chars(raw) or not raw.isascii():
        raise InvalidInput("URL contains characters that are not allowed.")
    parts = urlsplit(raw)
    if parts.scheme.lower() not in ("http", "https"):
        raise InvalidInput("Only http and https URLs can be expanded.")
    netloc = parts.netloc.lower()
    if "@" in netloc:
        raise InvalidInput("URLs with user information cannot be expanded.")
    if ":" in netloc or parts.port is not None:
        raise InvalidInput("URLs with an explicit port cannot be expanded.")
    host = parts.hostname or ""
    if host != netloc or host not in SHORTENER_HOSTS:
        raise InvalidInput("This host is not a supported URL shortener.")
    path = parts.path or "/"
    query = f"?{parts.query}" if parts.query else ""
    return f"{parts.scheme.lower()}://{host}{path}{query}"


def resolve_location(base: str, location: str | None) -> str | None:
    """Absolute redirect target, or None when missing or not http(s)."""
    if not location:
        return None
    target = urljoin(base, location.strip())
    if urlsplit(target).scheme.lower() not in ("http", "https"):
        return None
    return target


def meta_refresh_target(body: str) -> str | None:
    match = META_REFRESH_RE.search(body or "")
    return match.group(1).replace("&amp;", "&") if match else None


def is_shortener_url(url: str | None) -> bool:
    if not url:
        return False
    try:
        validate_short_url(url)
    except InvalidInput:
        return False
    return True


def validate_scan_host(raw: str) -> str:
    host = (raw or "").strip().lower().rstrip(".")
    if IPV4_RE.fullmatch(host) or HOSTNAME_RE.fullmatch(host):
        return host
    raise InvalidInput("Invalid host: use an ASCII (punycode) hostname or an IPv4 address.")


def urlscan_search_url(host: str, size: int = 10) -> str:
    if IPV4_RE.fullmatch(host):
        query = f'page.ip:"{host}"'
    else:
        query = f"page.domain:{host} OR task.domain:{host}"
    return f"https://urlscan.io/api/v1/search/?q={quote(query)}&size={size}"


def parse_urlscan(data: dict) -> dict:
    results = []
    for item in (data or {}).get("results", []) or []:
        task = item.get("task") or {}
        page = item.get("page") or {}
        verdicts = (item.get("verdicts") or {}).get("overall") or {}
        uuid = item.get("_id") or task.get("uuid")
        if not isinstance(uuid, str) or not re.fullmatch(r"[0-9a-f-]{36}", uuid):
            continue
        results.append(
            {
                "uuid": uuid,
                "time": task.get("time"),
                "task_url": task.get("url"),
                "page_url": page.get("url"),
                "page_domain": page.get("domain"),
                "ip": page.get("ip"),
                "country": page.get("country"),
                "status": page.get("status"),
                "title": page.get("title"),
                "malicious": verdicts.get("malicious"),
                "score": verdicts.get("score"),
                "tags": [t for t in (task.get("tags") or []) if isinstance(t, str)][:10],
                "result_url": f"https://urlscan.io/result/{uuid}/",
                "screenshot_url": f"https://urlscan.io/screenshots/{uuid}.png",
            }
        )
    return {"total": (data or {}).get("total", len(results)), "results": results}


def validate_lookup_url(raw: str) -> str:
    if not raw or len(raw) > MAX_URL_LENGTH:
        raise InvalidInput("URL missing or too long.")
    if _has_bad_chars(raw):
        raise InvalidInput("URL contains characters that are not allowed.")
    parts = urlsplit(raw)
    if parts.scheme.lower() not in ("http", "https") or not parts.netloc:
        raise InvalidInput("Only http and https URLs can be looked up.")
    return raw


def parse_urlhaus(data: dict) -> dict:
    status = (data or {}).get("query_status")
    if status == "no_results":
        return {"configured": True, "listed": False}
    if status != "ok":
        raise ValueError(f"URLhaus query status: {status}")
    blacklists = data.get("blacklists") or {}
    return {
        "configured": True,
        "listed": True,
        "url_status": data.get("url_status"),
        "threat": data.get("threat"),
        "tags": [t for t in (data.get("tags") or []) if isinstance(t, str)],
        "date_added": data.get("date_added"),
        "last_online": data.get("last_online"),
        "reference": data.get("urlhaus_reference"),
        "blacklists": {k: v for k, v in blacklists.items() if isinstance(v, str)},
        "payload_count": len(data.get("payloads") or []),
    }
