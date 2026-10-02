# Contributing to FreeOSINT-UI

Thanks for your interest in FreeOSINT-UI! Bug reports, new data sources, translations and new tools are all welcome.

By contributing you agree that your contribution is released under the project [license](LICENSE) (Apache 2.0 with the Commons Clause).

## Ground rules

- **Passive OSINT only.** Tools query public sources and public data. No active scanning, no logins, no bypassing access controls or rate limits, no scraping behind authentication.
- **Free sources only.** No API that needs a paid plan. A free API key is acceptable only when there is no keyless alternative, and it must stay on the backend.
- **Browser first.** If a lookup works from the browser (the source allows CORS), it stays client-only. The Python backend is only for what a browser can't do.
- **No generic proxy.** Backend endpoints have fixed target sites or APIs, one endpoint per tool. Never an endpoint that fetches an arbitrary URL.
- **Privacy.** Files and passwords never leave the user's device. Don't add analytics, trackers or third-party scripts.

## Getting started

Prerequisites: Node.js 20.19+ or 22.12+, and for the backend [uv](https://docs.astral.sh/uv/) with Python 3.14+.

```sh
git clone https://github.com/Kerlooo/FreeOSINTUI.git
cd FreeOSINTUI
npm install
cd backend && uv sync && cd ..
npm run dev:all   # frontend on :5173, backend on :8000
```

The backend is needed only by Username Analyzer and Telegram OSINT; `npm run dev` alone is enough for the other tools.

## Before opening a pull request

```sh
npm run lint                  # Prettier + ESLint
npm test                      # frontend unit tests (Vitest)
npm run build                 # the static build must succeed
cd backend && uv run pytest   # only if you touched the backend
```

## How the code is organized

- **SvelteKit + Svelte 5 with runes** (`$state`, `$derived`, `$effect`, `$props`). No `export let`, `$:` or stores for local state. Plain JavaScript and CSS, no TypeScript.
- **Static site.** No `+server.js`, `+page.server.js`, `hooks.server.js` or form actions. Every page is prerendered, so query parameters are read in `onMount`.
- **One tool = one route** in `src/routes/<tool>/`. The logic lives in plain JS modules in `src/lib/<tool>/`, with tests next to them as `*.spec.js` (they run in Node, without a DOM).
- **Register the tool** in `src/lib/tools.js` with a `category`; the home page and the navbar read that list.
- **Reuse shared modules** instead of calling `fetch` directly: `src/lib/net.js`, `src/lib/dns/doh.js`, `src/lib/rdap.js`, `src/lib/api.js` (backend client).
- **Components** go in `src/lib/components/`, one per file. Tool-specific components are prefixed with the tool name (e.g. `DomainSection.svelte`).
- **Internal links** use `resolve()` from `$app/paths`.
- **Backend**: one router per tool in `backend/app/routers/`, logic in `backend/app/<tool>.py`, outbound requests through `app/http.py`, tests with respx fakes (no real network in tests).

## Translations

The site is in English, Italian, French and Japanese. No visible text is hard-coded:

- Every string goes through `t('namespace.key')`, with the messages in `src/lib/i18n/messages/<namespace>.js`.
- A new string must be added in **all four languages**. `catalog.spec.js` fails if a key or a `{placeholder}` is missing in one of them.
- If you don't speak Italian, French or Japanese, add the English text and say so in the pull request: a maintainer will translate it.

Code, comments, identifiers and backend messages are in English.

## Style

- Colors are CSS variables defined in `:root` in `src/app.css`; don't hard-code colors in components.
- Neon green on black, monospace font: keep the existing look.
- The layout must work on phones (about 360px wide) without horizontal scrolling.

## Commits and pull requests

- One topic per pull request. Keep it small when you can.
- Commit messages: short, one line, imperative mood (e.g. `Add IP Analyzer`, `Fix IPv6 RDAP lookup`).
- Fill in the pull request template, and add screenshots for UI changes (desktop and mobile).

## Adding a data source or a tool

Open an issue first with the **New tool or data source** template, so we can check that the source is free, public, passive and usable from the browser before you write code.

## Security

Don't report vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).
