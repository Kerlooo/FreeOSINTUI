# Security policy

## Supported versions

Only the latest version on the `main` branch receives security fixes.

## Reporting a vulnerability

Please **don't open a public issue** for security problems.

Report them privately through [GitHub private vulnerability reporting](https://github.com/Kerlooo/FreeOSINTUI/security/advisories/new) (Security tab → Report a vulnerability). Include:

- what the problem is and where (tool, file, endpoint);
- steps to reproduce or a proof of concept;
- the impact you expect.

You'll get an answer as soon as possible. Once the fix is released, you'll be credited in the advisory, unless you prefer otherwise.

## Scope

In scope:

- the frontend (e.g. XSS through data returned by a lookup, unsafe handling of uploaded files);
- the Python backend in `backend/` (e.g. SSRF, a way to use an endpoint as a generic proxy, bypassing the rate limiter, crashes from crafted input).

Out of scope:

- vulnerabilities of the third-party services the tools query (XposedOrNot, Shodan InternetDB, crt.sh, etc.): report those to their owners;
- the content of public data returned by those services;
- rate limits of third-party APIs.
