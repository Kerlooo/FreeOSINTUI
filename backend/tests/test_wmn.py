import pytest

from app.wmn import USERNAME_RE, Site, detect, load_sites, parse_sites


def make_site(**overrides) -> Site:
    values = dict(
        id="example",
        name="Example",
        category="social",
        uri_check="https://example.com/{account}",
        e_code=200,
        e_string="profile-header",
        m_code=404,
        m_string="Page not found",
    )
    values.update(overrides)
    return Site(**values)


def test_found_requires_code_and_string():
    site = make_site()
    assert detect(site, 200, "<div class='profile-header'>")[0] == "found"
    assert detect(site, 200, "<html>nothing here</html>")[0] == "unknown"


def test_not_found_by_code_and_string():
    site = make_site()
    assert detect(site, 404, "Page not found")[0] == "not_found"
    assert detect(site, 404, "something else")[0] == "unknown"


def test_not_found_by_code_only_when_no_m_string():
    site = make_site(m_code=302, m_string="")
    assert detect(site, 302, "")[0] == "not_found"


def test_same_code_distinguished_by_strings():
    site = make_site(e_code=200, e_string='"taken":true', m_code=200, m_string='"taken":false')
    assert detect(site, 200, '{"taken":true}')[0] == "found"
    assert detect(site, 200, '{"taken":false}')[0] == "not_found"


def test_blocked_is_unknown():
    status, reason = detect(make_site(), 403, "Access denied")
    assert status == "unknown"
    assert "blocked" in reason


def test_urls_and_bad_chars():
    site = make_site(uri_pretty="https://example.com/u/{account}", strip_bad_char=".")
    assert site.check_url("john.doe") == "https://example.com/johndoe"
    assert site.profile_url("john.doe") == "https://example.com/u/johndoe"


def test_post_site_without_pretty_url_has_no_profile_url():
    site = make_site(uri_check="https://example.com/api", post_body='{"u":"{account}"}')
    assert site.body("john") == '{"u":"john"}'
    assert site.profile_url("john") is None


def test_parse_sites_skips_invalid_and_dedupes_ids():
    base = {"uri_check": "https://a.com/{account}", "e_code": 200, "e_string": "x", "m_code": 404, "m_string": "", "cat": "misc"}
    sites = parse_sites(
        {
            "sites": [
                {**base, "name": "Foo"},
                {**base, "name": "foo!"},
                {**base, "name": "Bar", "valid": False},
                {**base, "name": "Baz", "uri_check": "ftp://x/{account}"},
                {**base, "name": "Cf", "protection": ["cloudflare"]},
            ]
        }
    )
    assert [s.id for s in sites] == ["foo", "foo-2", "cf"]
    assert sites[2].unreliable is True


def test_bundled_data_loads():
    sites = load_sites()
    assert len(sites) > 500
    assert "github-user" in sites


@pytest.mark.parametrize("name,ok", [("torvalds", True), ("john.doe_1-x", True), ("", False), ("a b", False), ("x/../y", False), ("a" * 65, False)])
def test_username_regex(name, ok):
    assert bool(USERNAME_RE.fullmatch(name)) is ok
