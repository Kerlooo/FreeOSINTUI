from pathlib import Path

import pytest

from app.telegram import USERNAME_RE, parse_channel_posts, parse_profile

FIXTURES = Path(__file__).parent / "fixtures"


def load(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_channel_profile():
    result = parse_profile(load("channel.html"), "durov")
    assert result["exists"] is True
    assert result["type"] == "channel"
    assert result["title"] == "Pavel Durov"
    assert result["verified"] is True
    assert result["description"] == "Founder of Telegram."
    assert result["image"].startswith("https://cdn4.telesco.pe/")
    assert result["extra"] == ["10 590 827 subscribers"]
    assert result["has_preview"] is True


def test_group_profile():
    result = parse_profile(load("group.html"), "python")
    assert result["type"] == "group"
    assert result["title"] == "Python"
    assert result["extra"] == ["95 350 members, 4 651 online"]
    assert "A group about the Python programming language." in result["description"]


def test_user_profile():
    result = parse_profile(load("user.html"), "levlam")
    assert result["exists"] is True
    assert result["type"] == "user"
    assert result["title"] == "Aliaksei Levin"
    assert result["extra"] == ["@levlam"]
    assert result["verified"] is False


def test_bot_profile():
    result = parse_profile(load("bot.html"), "BotFather")
    assert result["type"] == "bot"
    assert result["title"] == "BotFather"
    assert result["verified"] is True
    assert result["extra"] == ["@BotFather", "7 737 419 monthly users"]


def test_missing_profile():
    result = parse_profile(load("not_found.html"), "nonexistentxyz12345q")
    assert result["exists"] is False
    assert result["type"] is None
    assert result["title"] is None


def test_channel_posts_newest_first():
    parsed = parse_channel_posts(load("channel_posts.html"))
    assert parsed["counters"]["subscribers"] == "9.44M"
    posts = parsed["posts"]
    assert [p["id"] for p in posts] == ["telegram/460", "telegram/459", "telegram/441"]
    first = posts[-1]
    assert first["url"] == "https://t.me/telegram/441"
    assert first["date"] == "2026-05-14T16:08:31+00:00"
    assert first["views"] == "1.5M"
    assert first["text"].startswith("Bot-to-Bot Communication.")
    assert first["media"] is True


def test_channel_posts_limit():
    assert len(parse_channel_posts(load("channel_posts.html"), limit=2)["posts"]) == 2


@pytest.mark.parametrize("name", ["durov", "Bot_Father", "abcd1"])
def test_valid_usernames(name):
    assert USERNAME_RE.fullmatch(name)


@pytest.mark.parametrize("name", ["abc", "1durov", "_durov", "du-rov", "a" * 33, "durov/../x", "t.me"])
def test_invalid_usernames(name):
    assert not USERNAME_RE.fullmatch(name)
