"""Shared outbound HTTP client with timeouts and a response size cap."""

from dataclasses import dataclass

import httpx

from app.config import USER_AGENT, settings

DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class FetchResult:
    status: int
    body: str
    url: str


def create_client(transport: httpx.AsyncBaseTransport | None = None) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers=DEFAULT_HEADERS,
        timeout=httpx.Timeout(settings.request_timeout),
        follow_redirects=False,
        max_redirects=3,
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        transport=transport,
    )


async def fetch_text(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    content: str | None = None,
    follow_redirects: bool = False,
    max_bytes: int | None = None,
) -> FetchResult:
    """Fetches a URL and returns status and decoded body, reading at most `max_bytes`.

    A larger body is truncated rather than rejected: callers only look for markers in it.
    """
    limit = max_bytes or settings.max_response_bytes
    request = client.build_request(method, url, headers=headers, content=content)
    response = await client.send(request, stream=True, follow_redirects=follow_redirects)
    try:
        chunks: list[bytes] = []
        size = 0
        async for chunk in response.aiter_bytes():
            chunks.append(chunk)
            size += len(chunk)
            if size >= limit:
                break
        raw = b"".join(chunks)[:limit]
    finally:
        await response.aclose()
    encoding = response.charset_encoding or "utf-8"
    try:
        body = raw.decode(encoding, errors="replace")
    except LookupError:
        body = raw.decode("utf-8", errors="replace")
    return FetchResult(status=response.status_code, body=body, url=str(response.url))
