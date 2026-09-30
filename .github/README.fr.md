<div align="center">

```
 _____               ___  ____ ___ _   _ _____     _   _ ___
|  ___| __ ___  ___ / _ \/ ___|_ _| \ | |_   _|   | | | |_ _|
| |_ | '__/ _ \/ _ \ | | \___ \| ||  \| | | |_____| | | || |
|  _|| | |  __/  __/ |_| |___) | || |\  | | |_____| |_| || |
|_|  |_|  \___|\___|\___/|____/___|_| \_| |_|      \___/|___|
```

**Des outils OSINT gratuits, au code source disponible, qui fonctionnent dans votre navigateur.**
Pas de compte. Pas de paywall. Pas de limite mensuelle.

[English](README.md) · [Italiano](README.it.md) · **Français**

![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![SvelteKit](https://img.shields.io/badge/SvelteKit-static-ff3e00?logo=svelte&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776ab?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white)
![Tools](https://img.shields.io/badge/tools-20-00ff41)
![License](https://img.shields.io/badge/license-Apache%202.0%20%2B%20Commons%20Clause-blue)

</div>

---

## Pourquoi FreeOSINT-UI ?

[OSINT-UI](https://osint-ui.com/) est une excellente collection d'outils de renseignement en sources ouvertes, mais seuls quelques-uns sont gratuits, et même ceux-là sont limités à quelques utilisations par mois. Tout le reste est réservé aux abonnés.

La plupart de ces recherches n'ont pas du tout besoin d'un service payant : il leur suffit des bonnes **sources publiques gratuites** et d'une interface claire. FreeOSINT-UI les réunit :

- 🆓 **Gratuit pour toujours.** Tous les outils, sans autre limite que les limites de débit des API publiques elles-mêmes.
- 🔒 **Navigateur d'abord.** 15 des 20 outils fonctionnent entièrement dans votre navigateur. Les fichiers que vous analysez ne quittent jamais votre appareil, et les mots de passe que vous vérifiez ne sont jamais envoyés nulle part (seuls 5 caractères de leur hash le sont).
- 👁️ **Uniquement passif.** Sources publiques et données publiques. Pas de scan actif, pas de connexion à des comptes, pas de contournement des contrôles d'accès.
- 🧩 **Connectés.** Les outils sont liés entre eux : passez d'un e-mail à ses fuites de données, ou d'un numéro de téléphone à des Google dorks prêts à l'emploi, en un clic.

## 🛠️ Outils

| Catégorie                   | Outil                                        | Fonction                                                                                                                                                                                                                          |
| --------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔎 Recherche                | **Générateur de Google Dorks**               | Des Google dorks prêts à l'emploi pour un nom d'utilisateur, un e-mail, un nom, un téléphone ou un domaine, regroupés par type (réseaux sociaux, documents, code, pastes, exposition du site) avec des liens de recherche directs |
| 👤 Personnes et comptes     | **Analyse de Nom d'utilisateur** \*          | Vérifie un nom d'utilisateur sur des centaines de sites web grâce aux règles de détection de [WhatsMyName](https://github.com/WebBreacher/WhatsMyName)                                                                            |
|                             | **Analyse E-mail**                           | Syntaxe, fournisseur gratuit ou jetable, serveurs MX, protection SPF/DMARC, profil Gravatar public                                                                                                                                |
|                             | **Analyse de Téléphone**                     | Validation hors ligne : pays, type de ligne, formats standard, pivots vers WhatsApp/Telegram/la recherche                                                                                                                         |
|                             | **Telegram OSINT** \*                        | Type de compte, nom, bio, abonnés ou membres et derniers messages d'un compte public                                                                                                                                              |
|                             | **GitHub OSINT**                             | Profil, dépôts et langages, organisations, e-mails dans les commits publics, clés SSH/GPG                                                                                                                                         |
| 🌐 Domaines et réseau       | **Analyse de Domaine**                       | Enregistrements DNS, sécurité e-mail, enregistrement RDAP, sous-domaines issus de la certificate transparency, captures de la Wayback Machine                                                                                     |
|                             | **Analyse IP**                               | Géolocalisation approximative, ASN, DNS inverse, propriétaire du réseau et contact abuse, ports ouverts et CVE (passif, Shodan InternetDB)                                                                                        |
|                             | **Recherche de Domaines Similaires**         | Fautes de frappe, homoglyphes, homographes IDN, bitsquatting et changements de TLD d'un domaine, vérifiés par DNS (enregistrement et serveurs de messagerie)                                                                      |
|                             | **Empreinte Passive du Site †**              | URL archivées d'un site via Common Crawl et la Wayback Machine, sans le contacter : sous-domaines, documents, sauvegardes, fichiers de configuration, chemins admin                                                               |
|                             | **Hash de Favicon**                          | Hash favicon de Shodan (mmh3), MD5 et SHA-256 d'un fichier favicon, avec liens de recherche Shodan/FOFA/ZoomEye/Censys                                                                                                            |
| 🛡️ Threat intel et phishing | **Vérification de Réputation †**             | IP, domaine, URL ou e-mail sur OTX, StopForumSpam, sorties Tor, Spamhaus DROP, URLhaus et ThreatFox                                                                                                                               |
|                             | **Analyse d'URL †**                          | Décortique un lien suspect sans l'ouvrir : hôtes sosies, redirections cachées, paramètres de suivi, liens courts, urlscan.io et URLhaus                                                                                           |
|                             | **Analyse d'En-têtes E-mail**                | Chemin Received avec délais entre sauts, IP d'origine, résultats SPF/DKIM/DMARC/ARC et signalements de tri du phishing                                                                                                            |
| 💥 Fuites de données        | **Vérification de Fuites**                   | Fuites de données connues pour un e-mail, et vérification par k-anonymity de l'exposition d'un mot de passe                                                                                                                       |
| 📁 Fichiers et hash         | **Vérificateur de Hash**                     | MD5, SHA-1/2/3, BLAKE, CRC32 et d'autres pour du texte ou des fichiers, plus identification et vérification de hash                                                                                                               |
|                             | **Extracteur de Métadonnées**                | EXIF/GPS/XMP des images et métadonnées des fichiers PDF et Office, plus des liens de recherche d'image inversée                                                                                                                   |
| ⛓️ Blockchain               | **Traceur Crypto**                           | Valide les adresses BTC/LTC/ETH, affiche le solde et les dernières transactions, suit les contreparties                                                                                                                           |
| 🧰 Décodeurs et utilitaires | **Décodeur d'Identifiants et d'Horodatages** | Date de création cachée dans les identifiants X, Discord, Instagram, TikTok et Mastodon, UUID, ULID, ObjectId ; horodatages Unix, FILETIME, Chrome, Cocoa et Excel                                                                |
|                             | **Fabricant d'Adresse MAC**                  | Fabricant d'après les registres IEEE, toutes les notations et EUI-64, adresses aléatoires et administrées localement                                                                                                              |

\* Nécessite le backend Python (voir ci-dessous). † Fonctionne avec le seul site statique ; certaines sections nécessitent le backend. Tous les autres outils fonctionnent entièrement avec le site statique.

## 🚀 Démarrage

### Prérequis

- [Node.js](https://nodejs.org/) **20.19+ ou 22.12+** et npm
- Pour le backend uniquement : [uv](https://docs.astral.sh/uv/) et Python **3.14+** (uv peut installer Python pour vous)

### Frontend

```sh
git clone https://github.com/Kerlooo/FreeOSINTUI.git
cd FreeOSINTUI
npm install
npm run dev
```

Ouvrez http://localhost:5173. C'est tout : 15 outils sont déjà entièrement fonctionnels, et 3 autres en partie.

### Backend (Analyse de Nom d'utilisateur et Telegram OSINT)

Dans un second terminal :

```sh
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

En développement, Vite redirige les requêtes `/api` vers `http://127.0.0.1:8000` : il n'y a rien d'autre à configurer. La documentation interactive de l'API se trouve sur http://localhost:8000/api/docs.

### Frontend et backend ensemble

```sh
npm run dev:all
```

Lance les deux serveurs dans un seul terminal, avec des logs préfixés par `[web]` / `[api]`. Ctrl+C arrête les deux, et si l'un d'eux plante, l'autre est arrêté aussi.

### Commandes utiles

| Commande                                            | Fonction                                                |
| --------------------------------------------------- | ------------------------------------------------------- |
| `npm run dev`                                       | Lance le serveur de développement                       |
| `npm run dev:all`                                   | Lance le frontend et le backend ensemble                |
| `npm run build`                                     | Génère le site statique dans `build/`                   |
| `npm run preview`                                   | Sert le build de production en local                    |
| `npm test`                                          | Exécute les tests unitaires du frontend (Vitest)        |
| `npm run lint`                                      | Vérifie la mise en forme (Prettier) et le code (ESLint) |
| `npm run format`                                    | Met en forme le code avec Prettier                      |
| `cd backend && uv run pytest`                       | Exécute les tests du backend                            |
| `cd backend && uv run python scripts/update_wmn.py` | Met à jour la liste de sites WhatsMyName incluse        |

## 📦 Déploiement

Le frontend est un **site entièrement statique** : déposez le dossier `build/` sur n'importe quel hébergeur statique (GitHub Pages, Netlify, Cloudflare Pages, Vercel, nginx…).

Le backend est facultatif. Si vous l'hébergez sur une autre origine :

| Variable                | Où                            | Rôle                                                                                                                                              |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE`         | frontend (au moment du build) | Origine du backend, par ex. `https://api.example.com`. Par défaut, `/api` sur la même origine                                                     |
| `ALLOWED_ORIGINS`       | backend                       | Origines autorisées par CORS, séparées par des virgules. Par défaut : `http://localhost:5173,http://localhost:4173`                               |
| `USERNAME_RATE_LIMIT`   | backend                       | Vérifications de noms d'utilisateur par minute et par IP. Par défaut : `1200`                                                                     |
| `TELEGRAM_RATE_LIMIT`   | backend                       | Recherches Telegram par minute et par IP. Par défaut : `30`                                                                                       |
| `ABUSECH_AUTH_KEY`      | backend                       | Auth-Key gratuite et facultative d'[abuse.ch](https://auth.abuse.ch/) pour URLhaus et ThreatFox. Sans elle, ces sections sont « non configurées » |
| `REPUTATION_RATE_LIMIT` | backend                       | Recherches de réputation par minute et par IP. Par défaut : `30`                                                                                  |
| `URL_RATE_LIMIT`        | backend                       | Recherches backend de l'Analyse d'URL par minute et par IP. Par défaut : `30`                                                                     |
| `FOOTPRINT_RATE_LIMIT`  | backend                       | Recherches Wayback de l'empreinte par minute et par IP. Par défaut : `20`                                                                         |

> Le limiteur de débit est en mémoire et se base sur l'IP du client. Derrière un reverse proxy, tous les utilisateurs partageraient une même limite.

## 🧱 Stack technique

**Frontend**

- [SvelteKit](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/) (runes), JavaScript et CSS simples
- [`@sveltejs/adapter-static`](https://svelte.dev/docs/kit/adapter-static) : chaque page est prérendue
- [Vite](https://vite.dev/), [Vitest](https://vitest.dev/), ESLint, Prettier
- [hash-wasm](https://github.com/Daninet/hash-wasm) (hachage), [exifr](https://github.com/MikeKovarik/exifr) (métadonnées d'images), [fflate](https://github.com/101arrowz/fflate) (décompression Office/PDF), [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) (numéros de téléphone)

**Backend**

- [FastAPI](https://fastapi.tiangolo.com/) + [uvicorn](https://www.uvicorn.org/), [httpx](https://www.python-httpx.org/), [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)
- [uv](https://docs.astral.sh/uv/) pour la gestion des dépendances, pytest + respx pour les tests

**L'architecture en une ligne :** les outils s'exécutent dans le navigateur chaque fois qu'une API publique le permet. Le backend n'existe que pour ce qu'un navigateur ne peut pas faire (sites bloqués par CORS, pages à inspecter côté serveur). Il expose un endpoint par outil, avec des cibles fixes, et n'est jamais un proxy générique.

## 🗂️ Structure du projet

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

## 🙏 Sources de données et remerciements

FreeOSINT-UI repose sur ces services et projets publics gratuits :

[WhatsMyName](https://github.com/WebBreacher/WhatsMyName) (CC BY-SA 4.0) · [XposedOrNot](https://xposedornot.com/) · [Have I Been Pwned – Pwned Passwords](https://haveibeenpwned.com/Passwords) · [Shodan InternetDB](https://internetdb.shodan.io/) · [rdap.org](https://rdap.org/) · [Google Public DNS](https://developers.google.com/speed/public-dns/docs/doh) · [crt.sh](https://crt.sh/) · [Cert Spotter](https://sslmate.com/certspotter/) · [Internet Archive](https://archive.org/) · [ipwho.is](https://ipwho.is/) · [Gravatar](https://gravatar.com/) · [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) · [mempool.space](https://mempool.space/) · [litecoinspace.org](https://litecoinspace.org/) · [Blockscout](https://www.blockscout.com/) · [GitHub REST API](https://docs.github.com/rest) · [AlienVault OTX](https://otx.alienvault.com/) · [StopForumSpam](https://www.stopforumspam.com/) · [Tor Project](https://www.torproject.org/) · [Spamhaus DROP](https://www.spamhaus.org/blocklists/do-not-route-or-peer/) · [abuse.ch URLhaus & ThreatFox](https://abuse.ch/) · [urlscan.io](https://urlscan.io/) · [Common Crawl](https://commoncrawl.org/) · [IEEE Registration Authority](https://standards.ieee.org/products-programs/regauth/)

Inspiré par [OSINT-UI](https://osint-ui.com/).

## ⚖️ Utilisation responsable

FreeOSINT-UI n'interroge que des sources publiques, mais les résultats peuvent tout de même concerner des personnes réelles. Utilisez-le à des fins légitimes : recherche en sécurité, enquêtes que vous êtes autorisé à mener et vérification de votre propre exposition. Respectez les conditions d'utilisation de chaque source de données et les lois sur la vie privée de votre pays (par ex. le RGPD). Les résultats peuvent être erronés ou obsolètes : considérez-les comme des pistes à vérifier, pas comme des preuves.

## 📜 Licence

FreeOSINT-UI est distribué sous la **[licence Apache 2.0](LICENSE) avec la [Commons Clause](https://commonsclause.com/)**.

- ✅ **Utilisez-le librement**, à des fins personnelles ou professionnelles, y compris au sein de votre entreprise.
- ✅ **Modifiez-le et partagez-le**, à condition de conserver les fichiers [LICENSE](LICENSE) et [NOTICE](../NOTICE), qui mentionnent l'auteur original.
- ❌ **Ne le vendez pas.** Vous ne pouvez pas proposer contre rémunération FreeOSINT-UI, ni un produit ou service dont la valeur provient essentiellement de celui-ci (hébergement payant et support payant inclus).

En raison de cette interdiction de vente, il s'agit d'une licence _source-available_ (code source disponible), et non d'une licence open source approuvée par l'OSI. Les données WhatsMyName incluses (`backend/data/wmn-data.json`) conservent leur propre licence CC BY-SA 4.0.

## 👨‍💻 Auteur

Réalisé par **kerlo** : [GitHub](https://github.com/Kerlooo) · [LinkedIn](https://www.linkedin.com/in/carlo-scaglione/)

Si vous le trouvez utile, laissez une ⭐ sur le dépôt !
