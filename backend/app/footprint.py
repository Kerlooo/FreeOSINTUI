"""Passive Site Footprint: archived URLs of a domain from the Wayback Machine CDX API.

Only web.archive.org is contacted, never the target site.
"""

import re
from urllib.parse import urlencode

import httpx

CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx"
MAX_LIMIT = 5000
# A CDX line is ~100-300 bytes: 8 MB is far more than MAX_LIMIT lines, but still bounded.
MAX_BYTES = 8 * 1024 * 1024
TIMEOUT = 30.0

# Lowercase hostname with at least one dot: labels of 1-63 letters, digits or '-'
# (not at the ends), TLD of letters or punycode. No IPs, ports, paths or wildcards.
DOMAIN_RE = re.compile(r"(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})")
TIMESTAMP_RE = re.compile(r"\d{14}")


def cdx_url(domain: str, subdomains: bool, limit: int) -> str:
    """CDX query for one capture per URL (collapse=urlkey), plain text output.

    Text output is read line by line, so a body cut at MAX_BYTES still parses.
    """
    params = {
        "url": f"*.{domain}" if subdomains else f"{domain}/*",
        "fl": "timestamp,original,mimetype,statuscode",
        "collapse": "urlkey",
        "limit": str(limit),
    }
    return f"{CDX_ENDPOINT}?{urlencode(params, safe='*/')}"


def parse_cdx_text(body: str, *, complete: bool = True) -> list[dict]:
    """Parses "timestamp original mimetype statuscode" lines; malformed lines are skipped.

    When the body was truncated (`complete=False`) the last, possibly partial, line is dropped.
    """
    lines = body.split("\n")
    if not complete:
        lines = lines[:-1]
    records = []
    for line in lines:
        parts = line.strip().split(" ")
        if len(parts) < 4 or not TIMESTAMP_RE.fullmatch(parts[0]):
            continue
        timestamp, *middle, mime, status = parts
        url = " ".join(middle)
        if not url:
            continue
        records.append(
            {
                "timestamp": timestamp,
                "url": url,
                "mime": None if mime in ("-", "unk", "") else mime,
                "status": status if re.fullmatch(r"\d{3}", status) else None,
            }
        )
    return records


async def fetch_capped(client: httpx.AsyncClient, url: str) -> tuple[int, str, bool]:
    """GETs `url` (no redirects) with a longer timeout and reads at most MAX_BYTES.

    Returns status, decoded body and whether the whole body was read.
    """
    request = client.build_request("GET", url, headers={"Accept": "text/plain"}, timeout=TIMEOUT)
    response = await client.send(request, stream=True, follow_redirects=False)
    complete = True
    try:
        chunks: list[bytes] = []
        size = 0
        async for chunk in response.aiter_bytes():
            chunks.append(chunk)
            size += len(chunk)
            if size >= MAX_BYTES:
                complete = False
                break
        raw = b"".join(chunks)[:MAX_BYTES]
    finally:
        await response.aclose()
    return response.status_code, raw.decode("utf-8", errors="replace"), complete
