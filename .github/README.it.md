<div align="center">

```
 _____               ___  ____ ___ _   _ _____     _   _ ___
|  ___| __ ___  ___ / _ \/ ___|_ _| \ | |_   _|   | | | |_ _|
| |_ | '__/ _ \/ _ \ | | \___ \| ||  \| | | |_____| | | || |
|  _|| | |  __/  __/ |_| |___) | || |\  | | |_____| |_| || |
|_|  |_|  \___|\___|\___/|____/___|_| \_| |_|      \___/|___|
```

**Strumenti OSINT gratuiti e source-available che funzionano nel tuo browser.**
Nessun account. Nessun paywall. Nessun limite mensile.

[English](README.md) · **Italiano** · [Français](README.fr.md)

![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![SvelteKit](https://img.shields.io/badge/SvelteKit-static-ff3e00?logo=svelte&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776ab?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white)
![Tools](https://img.shields.io/badge/tools-12-00ff41)
![License](https://img.shields.io/badge/license-Apache%202.0%20%2B%20Commons%20Clause-blue)

</div>

---

## Perché FreeOSINT-UI?

[OSINT-UI](https://osint-ui.com/) è un'ottima raccolta di strumenti di open-source intelligence, ma solo pochi sono gratuiti, e anche quelli sono limitati a pochi utilizzi al mese. Tutto il resto richiede un abbonamento.

La maggior parte di quelle ricerche non ha affatto bisogno di un servizio a pagamento: servono solo le giuste **fonti pubbliche gratuite** e un'interfaccia pulita. FreeOSINT-UI le mette insieme:

- 🆓 **Gratis per sempre.** Tutti gli strumenti, senza limiti oltre ai rate limit delle API pubbliche stesse.
- 🔒 **Prima di tutto nel browser.** 10 strumenti su 12 funzionano interamente nel tuo browser. I file che analizzi non lasciano mai il tuo dispositivo e le password che controlli non vengono mai inviate da nessuna parte (solo 5 caratteri del loro hash).
- 👁️ **Solo passivo.** Fonti pubbliche e dati pubblici. Nessuna scansione attiva, nessun login, nessun aggiramento dei controlli di accesso.
- 🧩 **Collegati tra loro.** Gli strumenti si rimandano l'uno all'altro: passa da un'email ai suoi data breach, o da un numero di telefono a Google dork già pronti, con un clic.

## 🛠️ Strumenti

| Categoria            | Strumento                     | Cosa fa                                                                                                                                                                       |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔎 Ricerca           | **Generatore di Google Dork** | Google dork già pronti per uno username, un'email, un nome, un telefono o un dominio, raggruppati per tipo (social, documenti, codice, paste, esposizione del sito) con link diretti alla ricerca |
| 👤 Persone e account | **Analisi Username** \*       | Controlla uno username su centinaia di siti web usando le regole di rilevamento di [WhatsMyName](https://github.com/WebBreacher/WhatsMyName)                                  |
|                      | **Analisi Email**             | Sintassi, provider gratuito o usa e getta, server MX, protezione SPF/DMARC, profilo Gravatar pubblico                                                                         |
|                      | **Analisi Telefono**          | Verifica offline: paese, tipo di linea, formati standard, ricerche collegate su WhatsApp/Telegram/motori di ricerca                                                           |
|                      | **Telegram OSINT** \*         | Tipo di account, nome, bio, iscritti o membri e ultimi post di un account pubblico                                                                                            |
|                      | **GitHub OSINT**              | Profilo, repository e linguaggi, organizzazioni, email nei commit pubblici, chiavi SSH/GPG                                                                                    |
| 🌐 Domini e rete     | **Analisi Dominio**           | Record DNS, sicurezza email, registrazione RDAP, sottodomini dalla certificate transparency, snapshot della Wayback Machine                                                    |
|                      | **Analisi IP**                | Geolocalizzazione approssimativa, ASN, DNS inverso, proprietario della rete e contatto abuse, porte aperte e CVE (passivo, Shodan InternetDB)                                  |
| 💥 Data breach       | **Controllo Leak**            | Data breach noti per un'email e controllo con k-anonymity per sapere se una password è stata esposta                                                                          |
| 📁 File e hash       | **Verifica Hash**             | MD5, SHA-1/2/3, BLAKE, CRC32 e altri per testo o file, più identificazione e verifica degli hash                                                                              |
|                      | **Estrattore di Metadati**    | EXIF/GPS/XMP dalle immagini e metadati da file PDF e Office, più link per la ricerca inversa delle immagini                                                                   |
| ⛓️ Blockchain        | **Tracciamento Crypto**       | Verifica indirizzi BTC/LTC/ETH, mostra saldo e ultime transazioni, segue le controparti                                                                                       |

\* Richiede il backend Python (vedi sotto). Tutti gli altri strumenti funzionano con il solo sito statico.

## 🚀 Per iniziare

### Prerequisiti

- [Node.js](https://nodejs.org/) **20.19+ o 22.12+** e npm
- Solo per il backend: [uv](https://docs.astral.sh/uv/) e Python **3.14+** (uv può installare Python al posto tuo)

### Frontend

```sh
git clone https://github.com/Kerlooo/FreeOSINTUI.git
cd FreeOSINTUI
npm install
npm run dev
```

Apri http://localhost:5173. Tutto qui: 10 strumenti sono già completamente funzionanti.

### Backend (Analisi Username e Telegram OSINT)

In un secondo terminale:

```sh
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

In sviluppo, Vite inoltra le richieste `/api` a `http://127.0.0.1:8000`, quindi non c'è altro da configurare. La documentazione interattiva delle API è su http://localhost:8000/api/docs.

### Frontend e backend insieme

```sh
npm run dev:all
```

Avvia entrambi i server in un solo terminale, con log prefissati da `[web]` / `[api]`. Ctrl+C li ferma entrambi e, se uno dei due va in crash, viene fermato anche l'altro.

### Comandi utili

| Comando                                             | Cosa fa                                               |
| --------------------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                                       | Avvia il server di sviluppo                           |
| `npm run dev:all`                                   | Avvia frontend e backend insieme                      |
| `npm run build`                                     | Compila il sito statico in `build/`                   |
| `npm run preview`                                   | Serve in locale la build di produzione                |
| `npm test`                                          | Esegue i test unitari del frontend (Vitest)           |
| `npm run lint`                                      | Controlla formattazione (Prettier) e codice (ESLint)  |
| `npm run format`                                    | Formatta il codice con Prettier                       |
| `cd backend && uv run pytest`                       | Esegue i test del backend                             |
| `cd backend && uv run python scripts/update_wmn.py` | Aggiorna la lista di siti WhatsMyName inclusa         |

## 📦 Deploy

Il frontend è un **sito completamente statico**: carica la cartella `build/` su qualsiasi hosting statico (GitHub Pages, Netlify, Cloudflare Pages, Vercel, nginx…).

Il backend è facoltativo. Se lo ospiti su un'altra origine:

| Variabile             | Dove                        | Scopo                                                                                                   |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE`       | frontend (in fase di build) | Origine del backend, ad es. `https://api.example.com`. Predefinito: stessa origine `/api`               |
| `ALLOWED_ORIGINS`     | backend                     | Origini consentite da CORS, separate da virgole. Predefinito: `http://localhost:5173,http://localhost:4173` |
| `USERNAME_RATE_LIMIT` | backend                     | Controlli di username al minuto per IP. Predefinito: `1200`                                             |
| `TELEGRAM_RATE_LIMIT` | backend                     | Ricerche Telegram al minuto per IP. Predefinito: `30`                                                   |

> Il rate limiter è in memoria e basato sull'IP del client. Dietro un reverse proxy, tutti gli utenti condividerebbero un unico limite.

## 🧱 Stack tecnologico

**Frontend**

- [SvelteKit](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/) (runes), JavaScript e CSS puri
- [`@sveltejs/adapter-static`](https://svelte.dev/docs/kit/adapter-static): ogni pagina è prerenderizzata
- [Vite](https://vite.dev/), [Vitest](https://vitest.dev/), ESLint, Prettier
- [hash-wasm](https://github.com/Daninet/hash-wasm) (hashing), [exifr](https://github.com/MikeKovarik/exifr) (metadati delle immagini), [fflate](https://github.com/101arrowz/fflate) (decompressione Office/PDF), [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) (numeri di telefono)

**Backend**

- [FastAPI](https://fastapi.tiangolo.com/) + [uvicorn](https://www.uvicorn.org/), [httpx](https://www.python-httpx.org/), [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)
- [uv](https://docs.astral.sh/uv/) per la gestione delle dipendenze, pytest + respx per i test

**L'architettura in una riga:** gli strumenti funzionano nel browser ogni volta che un'API pubblica lo permette. Il backend esiste solo per ciò che un browser non può fare (siti bloccati da CORS, pagine da analizzare lato server). Espone un endpoint per strumento con destinazioni fisse e non è mai un proxy generico.

## 🗂️ Struttura del progetto

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

## 🙏 Fonti dei dati e crediti

FreeOSINT-UI poggia sulle spalle di questi servizi e progetti pubblici gratuiti:

[WhatsMyName](https://github.com/WebBreacher/WhatsMyName) (CC BY-SA 4.0) · [XposedOrNot](https://xposedornot.com/) · [Have I Been Pwned – Pwned Passwords](https://haveibeenpwned.com/Passwords) · [Shodan InternetDB](https://internetdb.shodan.io/) · [rdap.org](https://rdap.org/) · [Google Public DNS](https://developers.google.com/speed/public-dns/docs/doh) · [crt.sh](https://crt.sh/) · [Cert Spotter](https://sslmate.com/certspotter/) · [Internet Archive](https://archive.org/) · [ipwho.is](https://ipwho.is/) · [Gravatar](https://gravatar.com/) · [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) · [mempool.space](https://mempool.space/) · [litecoinspace.org](https://litecoinspace.org/) · [Blockscout](https://www.blockscout.com/) · [GitHub REST API](https://docs.github.com/rest)

Ispirato da [OSINT-UI](https://osint-ui.com/).

## ⚖️ Uso responsabile

FreeOSINT-UI interroga solo fonti pubbliche, ma i risultati possono comunque riguardare persone reali. Usalo per scopi legittimi: ricerca sulla sicurezza, indagini che sei autorizzato a svolgere e verifica della tua esposizione. Rispetta i termini di servizio di ogni fonte di dati e le leggi sulla privacy del tuo paese (ad es. il GDPR). I risultati possono essere errati o non aggiornati: trattali come piste da verificare, non come prove.

## 📜 Licenza

FreeOSINT-UI è rilasciato con **[Apache License 2.0](LICENSE) e [Commons Clause](https://commonsclause.com/)**.

- ✅ **Usalo liberamente**, per scopi personali o professionali, anche all'interno della tua azienda.
- ✅ **Modificalo e condividilo**, purché tu mantenga i file [LICENSE](LICENSE) e [NOTICE](../NOTICE), che citano l'autore originale.
- ❌ **Non venderlo.** Non puoi offrire a pagamento FreeOSINT-UI, né un prodotto o servizio il cui valore derivi in modo sostanziale da esso (hosting e supporto a pagamento compresi).

A causa della condizione che ne vieta la vendita, questa è una licenza _source-available_, non una licenza open source approvata dall'OSI. I dati WhatsMyName inclusi (`backend/data/wmn-data.json`) mantengono la propria licenza CC BY-SA 4.0.

## 👨‍💻 Autore

Realizzato da **kerlo**: [GitHub](https://github.com/Kerlooo) · [LinkedIn](https://www.linkedin.com/in/carlo-scaglione/)

Se lo trovi utile, lascia una ⭐ al repository!
