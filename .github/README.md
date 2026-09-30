<div align="center">

```
 _____               ___  ____ ___ _   _ _____     _   _ ___
|  ___| __ ___  ___ / _ \/ ___|_ _| \ | |_   _|   | | | |_ _|
| |_ | '__/ _ \/ _ \ | | \___ \| ||  \| | | |_____| | | || |
|  _|| | |  __/  __/ |_| |___) | || |\  | | |_____| |_| || |
|_|  |_|  \___|\___|\___/|____/___|_| \_| |_|      \___/|___|
```

**Free, source-available OSINT tools that run in your browser.**
No account. No paywall. No monthly limits.

**English** · [Italiano](README.it.md) · [Français](README.fr.md)

![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![SvelteKit](https://img.shields.io/badge/SvelteKit-static-ff3e00?logo=svelte&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776ab?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white)
![Tools](https://img.shields.io/badge/tools-20-00ff41)
![License](https://img.shields.io/badge/license-Apache%202.0%20%2B%20Commons%20Clause-blue)

</div>

---

## Why FreeOSINT-UI?

[OSINT-UI](https://osint-ui.com/) is a great collection of open-source intelligence tools, but only a handful of them are free, and even those are capped at a few uses per month. Everything else sits behind a subscription.

Most of those lookups don't need a paid service at all: they only need the right **free public sources** and a clean interface. FreeOSINT-UI brings them together:

- 🆓 **Free forever.** Every tool, with no limits apart from the rate limits of the public APIs themselves.
- 🔒 **Browser-first.** 15 of the 20 tools run entirely in your browser. Files you analyze never leave your device, and passwords you check are never sent anywhere (only 5 characters of their hash are).
- 👁️ **Passive only.** Public sources and public data. No active scanning, no logins, no bypassing access controls.
- 🧩 **Connected.** Tools link to each other: go from an email to its breaches, or from a phone number to ready-made Google dorks, in one click.

## 🛠️ Tools

| Category                   | Tool                          | What it does                                                                                                                                                    |
| -------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔎 Search                  | **Google Dork Generator**     | Ready-made Google dorks for a username, email, name, phone or domain, grouped by type (social, documents, code, pastes, site exposure) with direct search links |
| 👤 People & accounts       | **Username Analyzer** \*      | Checks a username on hundreds of websites using the [WhatsMyName](https://github.com/WebBreacher/WhatsMyName) detection rules                                   |
|                            | **Email Analyzer**            | Syntax, free or disposable provider, MX servers, SPF/DMARC protection, public Gravatar profile                                                                  |
|                            | **Phone Analyzer**            | Offline validation: country, line type, standard formats, WhatsApp/Telegram/search pivots                                                                       |
|                            | **Telegram OSINT** \*         | Account type, name, bio, subscribers or members and latest posts of a public account                                                                            |
|                            | **GitHub OSINT**              | Profile, repositories and languages, organizations, emails in public commits, SSH/GPG keys                                                                      |
| 🌐 Domains & network       | **Domain Analyzer**           | DNS records, email security, RDAP registration, subdomains from certificate transparency, Wayback Machine snapshots                                             |
|                            | **IP Analyzer**               | Approximate geolocation, ASN, reverse DNS, network owner and abuse contact, open ports and CVEs (passive, Shodan InternetDB)                                    |
|                            | **Lookalike Domain Finder**   | Typos, homoglyphs, IDN homographs, bitsquatting and TLD swaps of a domain, checked with DNS for registration and mail servers                                   |
|                            | **Passive Site Footprint †**  | Archived URLs of a site from Common Crawl and the Wayback Machine, without contacting it: subdomains, documents, backups, config files, admin paths             |
|                            | **Favicon Hash**              | Shodan favicon hash (mmh3), MD5 and SHA-256 of a favicon file, with Shodan/FOFA/ZoomEye/Censys search links                                                     |
| 🛡️ Threat intel & phishing | **Reputation Checker †**      | IP, domain, URL or email against OTX, StopForumSpam, Tor exits, Spamhaus DROP, URLhaus and ThreatFox                                                            |
|                            | **URL Analyzer †**            | Breaks down a suspicious link without opening it: look-alike hosts, hidden redirects, tracking parameters, short link expansion, urlscan.io and URLhaus         |
|                            | **Email Header Analyzer**     | Received path with hop delays, originating IP, SPF/DKIM/DMARC/ARC results and phishing triage findings                                                          |
| 💥 Breaches                | **Leak Check**                | Known data breaches for an email, and a k-anonymity check of whether a password has been exposed                                                                |
| 📁 Files & hashes          | **Hash Checker**              | MD5, SHA-1/2/3, BLAKE, CRC32 and more for text or files, plus hash identification and verification                                                              |
|                            | **Metadata Extractor**        | EXIF/GPS/XMP from images and metadata from PDF and Office files, plus reverse image search links                                                                |
| ⛓️ Blockchain              | **Crypto Tracer**             | Validates BTC/LTC/ETH addresses, shows balance and latest transactions, follows counterparties                                                                  |
| 🧰 Decoders & utilities    | **ID and Timestamp Decoder**  | Creation date hidden in X, Discord, Instagram, TikTok and Mastodon IDs, UUIDs, ULIDs, ObjectIds; Unix, FILETIME, Chrome, Cocoa and Excel timestamps             |
|                            | **MAC Address Vendor Lookup** | Vendor from the IEEE registries, every notation and EUI-64, randomized and locally administered addresses                                                       |

\* Needs the Python backend (see below). † Works with the static site alone; some sections need the backend. Every other tool works entirely with the static site.

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) **20.19+ or 22.12+** and npm
- For the backend only: [uv](https://docs.astral.sh/uv/) and Python **3.14+** (uv can install Python for you)

### Frontend

```sh
git clone https://github.com/Kerlooo/FreeOSINTUI.git
cd FreeOSINTUI
npm install
npm run dev
```

Open http://localhost:5173. That's it: 15 tools are already fully working, and 3 more partly.

### Backend (Username Analyzer and Telegram OSINT)

In a second terminal:

```sh
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

In development, Vite forwards `/api` requests to `http://127.0.0.1:8000`, so there is nothing else to configure. Interactive API docs are at http://localhost:8000/api/docs.

### Frontend and backend together

```sh
npm run dev:all
```

Starts both servers in one terminal, with `[web]` / `[api]` prefixed logs. Ctrl+C stops both, and if one of them crashes the other is stopped too.

### Useful commands

| Command                                             | What it does                                  |
| --------------------------------------------------- | --------------------------------------------- |
| `npm run dev`                                       | Start the development server                  |
| `npm run dev:all`                                   | Start frontend and backend together           |
| `npm run build`                                     | Build the static site into `build/`           |
| `npm run preview`                                   | Serve the production build locally            |
| `npm test`                                          | Run the frontend unit tests (Vitest)          |
| `npm run lint`                                      | Check formatting (Prettier) and code (ESLint) |
| `npm run format`                                    | Format the code with Prettier                 |
| `cd backend && uv run pytest`                       | Run the backend tests                         |
| `cd backend && uv run python scripts/update_wmn.py` | Refresh the bundled WhatsMyName site list     |

## 📦 Deployment

The frontend is a **fully static site**: upload the `build/` folder to any static host (GitHub Pages, Netlify, Cloudflare Pages, Vercel, nginx…).

The backend is optional. If you host it on another origin:

| Variable                | Where                 | Purpose                                                                                                                              |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_BASE`         | frontend (build time) | Backend origin, e.g. `https://api.example.com`. Defaults to same-origin `/api`                                                       |
| `ALLOWED_ORIGINS`       | backend               | Comma-separated origins allowed by CORS. Default: `http://localhost:5173,http://localhost:4173`                                      |
| `USERNAME_RATE_LIMIT`   | backend               | Username checks per minute per IP. Default: `1200`                                                                                   |
| `TELEGRAM_RATE_LIMIT`   | backend               | Telegram lookups per minute per IP. Default: `30`                                                                                    |
| `ABUSECH_AUTH_KEY`      | backend               | Optional free [abuse.ch](https://auth.abuse.ch/) Auth-Key for URLhaus and ThreatFox. Without it those sections show "not configured" |
| `REPUTATION_RATE_LIMIT` | backend               | Reputation lookups per minute per IP. Default: `30`                                                                                  |
| `URL_RATE_LIMIT`        | backend               | URL Analyzer backend lookups per minute per IP. Default: `30`                                                                        |
| `FOOTPRINT_RATE_LIMIT`  | backend               | Wayback footprint lookups per minute per IP. Default: `20`                                                                           |

> The rate limiter is in memory and keyed on the client IP. Behind a reverse proxy, all users would share one limit.

## 🧱 Tech stack

**Frontend**

- [SvelteKit](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/) (runes), plain JavaScript and CSS
- [`@sveltejs/adapter-static`](https://svelte.dev/docs/kit/adapter-static): every page is prerendered
- [Vite](https://vite.dev/), [Vitest](https://vitest.dev/), ESLint, Prettier
- [hash-wasm](https://github.com/Daninet/hash-wasm) (hashing), [exifr](https://github.com/MikeKovarik/exifr) (image metadata), [fflate](https://github.com/101arrowz/fflate) (Office/PDF decompression), [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) (phone numbers)

**Backend**

- [FastAPI](https://fastapi.tiangolo.com/) + [uvicorn](https://www.uvicorn.org/), [httpx](https://www.python-httpx.org/), [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)
- [uv](https://docs.astral.sh/uv/) for dependency management, pytest + respx for tests

**Architecture in one line:** tools run in the browser whenever a public API allows it. The backend exists only for what a browser can't do (sites blocked by CORS, pages that must be inspected server-side). It exposes one endpoint per tool with fixed targets and is never a generic proxy.

## 🗂️ Project structure

```
src/
├── routes/<tool>/+page.svelte   # one page per tool
├── lib/<tool>/                  # tool logic in plain JS, with *.spec.js tests
├── lib/components/              # UI components (one per file)
├── lib/tools.js                 # the list of tools shown in the home page and navbar
└── lib/net.js, dns/, rdap.js    # shared helpers for public APIs
backend/
├── app/                         # FastAPI app, one router per tool
├── data/wmn-data.json           # WhatsMyName site list
└── tests/
```

## 🙏 Data sources & credits

FreeOSINT-UI stands on the shoulders of these free public services and projects:

[WhatsMyName](https://github.com/WebBreacher/WhatsMyName) (CC BY-SA 4.0) · [XposedOrNot](https://xposedornot.com/) · [Have I Been Pwned – Pwned Passwords](https://haveibeenpwned.com/Passwords) · [Shodan InternetDB](https://internetdb.shodan.io/) · [rdap.org](https://rdap.org/) · [Google Public DNS](https://developers.google.com/speed/public-dns/docs/doh) · [crt.sh](https://crt.sh/) · [Cert Spotter](https://sslmate.com/certspotter/) · [Internet Archive](https://archive.org/) · [ipwho.is](https://ipwho.is/) · [Gravatar](https://gravatar.com/) · [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) · [mempool.space](https://mempool.space/) · [litecoinspace.org](https://litecoinspace.org/) · [Blockscout](https://www.blockscout.com/) · [GitHub REST API](https://docs.github.com/rest) · [AlienVault OTX](https://otx.alienvault.com/) · [StopForumSpam](https://www.stopforumspam.com/) · [Tor Project](https://www.torproject.org/) · [Spamhaus DROP](https://www.spamhaus.org/blocklists/do-not-route-or-peer/) · [abuse.ch URLhaus & ThreatFox](https://abuse.ch/) · [urlscan.io](https://urlscan.io/) · [Common Crawl](https://commoncrawl.org/) · [IEEE Registration Authority](https://standards.ieee.org/products-programs/regauth/)

Inspired by [OSINT-UI](https://osint-ui.com/).

## ⚖️ Responsible use

FreeOSINT-UI only queries public sources, but the results can still concern real people. Use it for legitimate purposes: security research, investigations you are authorized to carry out, and checking your own exposure. Respect the terms of service of each data source and the privacy laws of your country (e.g. GDPR). Results can be wrong or out of date: treat them as leads to verify, not as proof.

## 📜 License

FreeOSINT-UI is released under the **[Apache License 2.0](LICENSE) with the [Commons Clause](https://commonsclause.com/)**.

- ✅ **Use it freely**, for personal or business purposes, inside your company included.
- ✅ **Modify and share it**, as long as you keep the [LICENSE](LICENSE) and [NOTICE](../NOTICE) files, which credit the original author.
- ❌ **Don't sell it.** You may not offer FreeOSINT-UI, or a product or service whose value comes substantially from it, for a fee (paid hosting and paid support included).

Because of the no-selling condition this is a _source-available_ license, not an OSI-approved open-source one. The bundled WhatsMyName data (`backend/data/wmn-data.json`) keeps its own CC BY-SA 4.0 license.

## 👨‍💻 Author

Made by **kerlo**: [GitHub](https://github.com/Kerlooo) · [LinkedIn](https://www.linkedin.com/in/carlo-scaglione/)

If you find it useful, leave a ⭐ on the repository!
