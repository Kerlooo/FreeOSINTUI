"""Reputation Checker: blocklist membership and threat-intel lookups for an IP, domain or URL.

Only fixed sources are contacted. A user-supplied URL is never fetched: it is only sent as a
lookup term to abuse.ch.

DNSBLs (e.g. Spamhaus ZEN) are deliberately not queried: through public resolvers such as
Google DNS-over-HTTPS, Spamhaus answers 127.255.255.254 ("query refused") for every name,
which would read as a listing and produce false positives.
"""

import asyncio
import ipaddress
import json
import re
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from urllib.parse import urlsplit

TOR_EXIT_LIST_URL = "https://check.torproject.org/torbulkexitlist"
DROP_V4_URL = "https://www.spamhaus.org/drop/drop_v4.json"
DROP_V6_URL = "https://www.spamhaus.org/drop/drop_v6.json"
URLHAUS_HOST_URL = "https://urlhaus-api.abuse.ch/v1/host/"
URLHAUS_URL_URL = "https://urlhaus-api.abuse.ch/v1/url/"
THREATFOX_URL = "https://threatfox-api.abuse.ch/api/v1/"

TOR_TTL = 60 * 60
DROP_TTL = 12 * 60 * 60
MAX_URL_LENGTH = 2048

DOMAIN_RE = re.compile(
    r"(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})"
)


# --- Input validation -------------------------------------------------------------------------


def parse_ip(value: str) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
    value = value.strip()
    if not value or len(value) > 64:
        return None
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        return None
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        return ip.ipv4_mapped
    return ip


def parse_domain(value: str) -> str | None:
    value = value.strip().lower().rstrip(".")
    return value if DOMAIN_RE.fullmatch(value) else None


def parse_url(value: str) -> str | None:
    """Accepts an absolute http(s) URL with a valid host. The URL is never fetched."""
    value = value.strip()
    if not value or len(value) > MAX_URL_LENGTH:
        return None
    if any(c.isspace() or ord(c) < 0x20 or ord(c) == 0x7F for c in value):
        return None
    try:
        parts = urlsplit(value)
        host = parts.hostname
    except ValueError:
        return None
    if parts.scheme.lower() not in ("http", "https") or not host:
        return None
    if parse_ip(host) is None and parse_domain(host) is None:
        return None
    return value


def parse_term(value: str) -> str | None:
    """ThreatFox search term: an IP, a domain or an http(s) URL."""
    ip = parse_ip(value)
    if ip is not None:
        return str(ip)
    return parse_domain(value) or parse_url(value)


# --- Cached lists -----------------------------------------------------------------------------


@dataclass
class CachedList:
    data: object
    date: str | None  # when the source generated the list, ISO 8601
    fetched_at: float


class ListCache:
    """Downloads a list once and keeps it for `ttl` seconds.

    Concurrent callers wait for the same download. When a refresh fails, the previous (stale)
    copy is kept and served; with no copy at all the error propagates.
    """

    def __init__(self, ttl: float, clock: Callable[[], float] = time.monotonic):
        self.ttl = ttl
        self.clock = clock
        self._value: CachedList | None = None
        self._lock = asyncio.Lock()

    def clear(self) -> None:
        self._value = None

    async def get(self, loader: Callable[[], Awaitable[tuple[object, str | None]]]) -> CachedList:
        if self._fresh():
            return self._value  # type: ignore[return-value]
        async with self._lock:
            if self._fresh():
                return self._value  # type: ignore[return-value]
            try:
                data, date = await loader()
            except Exception:
                if self._value is not None:
                    return self._value
                raise
            self._value = CachedList(data=data, date=date, fetched_at=self.clock())
            return self._value

    def _fresh(self) -> bool:
        return self._value is not None and self.clock() - self._value.fetched_at < self.ttl


def http_date_to_iso(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(UTC).isoformat()
    except (TypeError, ValueError):
        return None


def timestamp_to_iso(value) -> str | None:
    try:
        return datetime.fromtimestamp(int(value), UTC).isoformat()
    except (TypeError, ValueError, OverflowError, OSError):
        return None


# --- Tor exit list ----------------------------------------------------------------------------


def parse_tor_list(body: str) -> frozenset[str]:
    """One exit address per line; normalized so lookups compare canonical forms."""
    addresses = set()
    for line in body.splitlines():
        ip = parse_ip(line.split("#", 1)[0])
        if ip is not None:
            addresses.add(str(ip))
    return frozenset(addresses)


# --- Spamhaus DROP ----------------------------------------------------------------------------


@dataclass(frozen=True)
class DropEntry:
    network: ipaddress.IPv4Network | ipaddress.IPv6Network
    sblid: str | None
    rir: str | None


def parse_drop(body: str) -> tuple[list[DropEntry], str | None]:
    """Parses a DROP NDJSON file: one `{"cidr", "sblid", "rir"}` object per line plus a
    final `{"type": "metadata", "timestamp": ...}` line."""
    entries: list[DropEntry] = []
    date = None
    for line in body.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except ValueError:
            continue
        if not isinstance(item, dict):
            continue
        if item.get("type") == "metadata":
            date = timestamp_to_iso(item.get("timestamp"))
            continue
        try:
            network = ipaddress.ip_network(str(item.get("cidr")), strict=False)
        except ValueError:
            continue
        entries.append(DropEntry(network, item.get("sblid"), item.get("rir")))
    return entries, date


def find_drop(entries: list[DropEntry], ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> DropEntry | None:
    return next((e for e in entries if e.network.version == ip.version and ip in e.network), None)


# --- abuse.ch ---------------------------------------------------------------------------------


def summarize_urlhaus_host(data: dict) -> dict:
    status = data.get("query_status")
    if status == "no_results":
        return {"status": "not_listed", "date": None, "details": {}}
    if status != "ok":
        raise ValueError(f"URLhaus: {status}")
    urls = data.get("urls") or []
    latest = max((u.get("date_added") or "" for u in urls), default="") or None
    return {
        "status": "listed",
        "date": latest or data.get("firstseen"),
        "reference": data.get("urlhaus_reference"),
        "details": {
            "url_count": _int(data.get("url_count"), len(urls)),
            "online": sum(1 for u in urls if u.get("url_status") == "online"),
            "firstseen": data.get("firstseen"),
            "blacklists": {k: v for k, v in (data.get("blacklists") or {}).items() if v},
            "threats": sorted({u["threat"] for u in urls if u.get("threat")}),
            "tags": sorted({tag for u in urls for tag in (u.get("tags") or []) if tag})[:10],
        },
    }


def summarize_urlhaus_url(data: dict) -> dict:
    status = data.get("query_status")
    if status == "no_results":
        return {"status": "not_listed", "date": None, "details": {}}
    if status != "ok":
        raise ValueError(f"URLhaus: {status}")
    return {
        "status": "listed",
        "date": data.get("last_online") or data.get("date_added"),
        "reference": data.get("urlhaus_reference"),
        "details": {
            "url_status": data.get("url_status"),
            "threat": data.get("threat"),
            "date_added": data.get("date_added"),
            "tags": [tag for tag in (data.get("tags") or []) if tag][:10],
        },
    }


def summarize_threatfox(data: dict) -> dict:
    status = data.get("query_status")
    if status in ("no_result", "no_results"):
        return {"status": "not_listed", "date": None, "details": {}}
    if status != "ok":
        raise ValueError(f"ThreatFox: {status}")
    iocs = data.get("data") or []
    if not isinstance(iocs, list) or not iocs:
        return {"status": "not_listed", "date": None, "details": {}}
    dates = [i.get("last_seen") or i.get("first_seen") or "" for i in iocs]
    return {
        "status": "listed",
        "date": max(dates) or None,
        "details": {
            "count": len(iocs),
            "iocs": [
                {
                    "ioc": i.get("ioc"),
                    "threat_type": i.get("threat_type_desc") or i.get("threat_type"),
                    "malware": i.get("malware_printable"),
                    "confidence": i.get("confidence_level"),
                    "first_seen": i.get("first_seen"),
                    "last_seen": i.get("last_seen"),
                    "tags": [tag for tag in (i.get("tags") or []) if tag][:5],
                }
                for i in iocs[:10]
            ],
        },
    }


def _int(value, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
