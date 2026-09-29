"""Parsers for Telegram's public web previews (https://t.me/<username> and /s/<username>)."""

import re

from bs4 import BeautifulSoup, Tag

USERNAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_]{3,31}$")
EXCERPT_LENGTH = 400
MAX_POSTS = 10


def _text(node: Tag | None) -> str:
    """Visible text of a node, keeping <br> as line breaks."""
    if node is None:
        return ""
    for br in node.find_all("br"):
        br.replace_with("\n")
    lines = [re.sub(r"[ \t ]+", " ", line).strip() for line in node.get_text().split("\n")]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def _meta(soup: BeautifulSoup, prop: str) -> str:
    tag = soup.find("meta", attrs={"property": prop})
    return (tag.get("content") or "").strip() if tag else ""


def _excerpt(text: str, length: int = EXCERPT_LENGTH) -> str:
    return text if len(text) <= length else text[: length - 1].rstrip() + "…"


def detect_type(button: str, extras: list[str], has_preview: bool, page_title: str) -> str:
    joined = " ".join(extras).lower()
    if button == "start bot" or page_title.startswith("Telegram: Launch"):
        return "bot"
    if "member" in joined:
        return "group"
    if "subscriber" in joined or has_preview:
        return "channel"
    if button == "send message":
        return "user"
    return "unknown"


def parse_profile(html: str, username: str) -> dict:
    """Parses https://t.me/<username>. Missing accounts render a page with no title block."""
    soup = BeautifulSoup(html, "html.parser")
    result: dict = {
        "exists": False,
        "type": None,
        "title": None,
        "verified": False,
        "description": None,
        "image": None,
        "extra": [],
        "has_preview": False,
    }
    title_node = soup.select_one(".tgme_page_title")
    title = _text(title_node).replace("✔", "").strip() if title_node else ""
    if not title:
        return result

    extras = [_text(n) for n in soup.select(".tgme_page_extra") if not n.select(".tgme_page_extra")]
    extras = [e for e in extras if e]
    button = _text(soup.select_one(".tgme_action_button_new")).lower()
    preview = soup.select_one("a.tgme_page_context_link")
    has_preview = bool(preview and preview.get("href", "").lower() == f"/s/{username.lower()}")
    page_title = _text(soup.find("title"))
    image = soup.select_one("img.tgme_page_photo_image")

    result.update(
        exists=True,
        type=detect_type(button, extras, has_preview, page_title),
        title=title,
        verified=bool(title_node.select_one(".verified-icon")),
        description=_text(soup.select_one(".tgme_page_description")) or _meta(soup, "og:description") or None,
        image=(image.get("src") if image else None) or None,
        extra=extras,
        has_preview=has_preview,
    )
    return result


def parse_channel_posts(html: str, limit: int = MAX_POSTS) -> dict:
    """Parses https://t.me/s/<username>: latest posts (newest first) and channel counters."""
    soup = BeautifulSoup(html, "html.parser")
    counters = {}
    for counter in soup.select(".tgme_channel_info_counter"):
        value = _text(counter.select_one(".counter_value"))
        kind = _text(counter.select_one(".counter_type"))
        if value and kind:
            counters[kind] = value

    posts = []
    for message in soup.select(".tgme_widget_message[data-post]"):
        post_id = message.get("data-post", "")
        date_link = message.select_one("a.tgme_widget_message_date")
        time_node = date_link.select_one("time[datetime]") if date_link else None
        text = _text(message.select_one(".tgme_widget_message_text.js-message_text"))
        media = bool(
            message.select_one(
                ".tgme_widget_message_photo_wrap, .tgme_widget_message_video_player, "
                ".tgme_widget_message_document, .tgme_widget_message_roundvideo_player"
            )
        )
        posts.append(
            {
                "id": post_id,
                "url": f"https://t.me/{post_id}" if re.fullmatch(r"[A-Za-z0-9_]+/\d+", post_id) else None,
                "date": time_node.get("datetime") if time_node else None,
                "views": _text(message.select_one(".tgme_widget_message_views")) or None,
                "text": _excerpt(text),
                "media": media,
            }
        )
    posts.reverse()
    return {"counters": counters, "posts": posts[:limit]}
