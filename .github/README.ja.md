<div align="center">

```
 _____               ___  ____ ___ _   _ _____     _   _ ___
|  ___| __ ___  ___ / _ \/ ___|_ _| \ | |_   _|   | | | |_ _|
| |_ | '__/ _ \/ _ \ | | \___ \| ||  \| | | |_____| | | || |
|  _|| | |  __/  __/ |_| |___) | || |\  | | |_____| |_| || |
|_|  |_|  \___|\___|\___/|____/___|_| \_| |_|      \___/|___|
```

**ブラウザで動作する、無料でソースが公開された OSINT ツール集。**
アカウント不要。ペイウォールなし。月間の利用制限なし。

[English](README.md) · [Italiano](README.it.md) · [Français](README.fr.md) · **日本語**

![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![SvelteKit](https://img.shields.io/badge/SvelteKit-static-ff3e00?logo=svelte&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776ab?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white)
![Tools](https://img.shields.io/badge/tools-20-00ff41)
![License](https://img.shields.io/badge/license-Apache%202.0%20%2B%20Commons%20Clause-blue)

</div>

---

## なぜ FreeOSINT-UI なのか?

[OSINT-UI](https://osint-ui.com/) はオープンソースインテリジェンス (OSINT) ツールの優れたコレクションですが、無料で使えるのはごく一部で、それらも月に数回までしか利用できません。それ以外はすべてサブスクリプションが必要です。

こうした調査の大半は、有料サービスをまったく必要としません。必要なのは、適切な**無料の公開ソース**と使いやすいインターフェースだけです。FreeOSINT-UI はそれらをひとつにまとめます:

- 🆓 **ずっと無料。** すべてのツールが対象で、公開 API 自体のレート制限以外に制限はありません。
- 🔒 **ブラウザファースト。** 20 個のツールのうち 15 個は、完全にブラウザ内で動作します。解析するファイルがデバイスの外に出ることはなく、チェックするパスワードがどこかに送信されることもありません (送信されるのはハッシュの 5 文字だけです)。
- 👁️ **パッシブのみ。** 公開ソースと公開データだけを使います。アクティブスキャンも、ログインも、アクセス制御の回避も行いません。
- 🧩 **連携。** ツール同士がリンクしています。メールアドレスからその漏えい情報へ、電話番号からすぐに使える Google dork へ、ワンクリックで移動できます。

## 🛠️ ツール

| カテゴリ                              | ツール                        | 機能                                                                                                                                                                                       |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🔎 検索                               | **Google Dork Generator**     | ユーザー名、メールアドレス、氏名、電話番号、ドメイン向けのすぐに使える Google dork を、種類別 (SNS、ドキュメント、コード、ペースト、サイトの露出) にまとめ、直接検索できるリンク付きで生成 |
| 👤 人物・アカウント                   | **Username Analyzer** \*      | [WhatsMyName](https://github.com/WebBreacher/WhatsMyName) の検出ルールを使い、数百のウェブサイトでユーザー名を確認                                                                         |
|                                       | **Email Analyzer**            | 構文、フリーメールまたは使い捨てプロバイダー、MX サーバー、SPF/DMARC による保護、公開 Gravatar プロフィール                                                                                |
|                                       | **Phone Analyzer**            | オフライン検証: 国、回線種別、標準フォーマット、WhatsApp/Telegram/検索へのピボット                                                                                                         |
|                                       | **Telegram OSINT** \*         | 公開アカウントのアカウント種別、名前、自己紹介、購読者数またはメンバー数、最新の投稿                                                                                                       |
|                                       | **GitHub OSINT**              | プロフィール、リポジトリと言語、Organization、公開コミットに含まれるメールアドレス、SSH/GPG 鍵                                                                                             |
| 🌐 ドメイン・ネットワーク             | **Domain Analyzer**           | DNS レコード、メールセキュリティ、RDAP 登録情報、Certificate Transparency から得たサブドメイン、Wayback Machine のスナップショット                                                         |
|                                       | **IP Analyzer**               | おおよその位置情報、ASN、逆引き DNS、ネットワーク所有者と abuse 連絡先、開いているポートと CVE (パッシブ、Shodan InternetDB)                                                               |
|                                       | **Lookalike Domain Finder**   | ドメインのタイポ、ホモグリフ、IDN ホモグラフ、ビットスクワッティング、TLD の入れ替えを生成し、登録状況とメールサーバーを DNS で確認                                                        |
|                                       | **Passive Site Footprint †**  | サイトに接触することなく、Common Crawl と Wayback Machine からアーカイブ済み URL を取得: サブドメイン、ドキュメント、バックアップ、設定ファイル、管理用パス                                |
|                                       | **Favicon Hash**              | favicon ファイルの Shodan favicon ハッシュ (mmh3)、MD5、SHA-256 と、Shodan/FOFA/ZoomEye/Censys の検索リンク                                                                                |
| 🛡️ 脅威インテリジェンス・フィッシング | **Reputation Checker †**      | IP、ドメイン、URL、メールアドレスを OTX、StopForumSpam、Tor 出口ノード、Spamhaus DROP、URLhaus、ThreatFox と照合                                                                           |
|                                       | **URL Analyzer †**            | 不審なリンクを開かずに分解: 類似ホスト、隠れたリダイレクト、トラッキングパラメータ、短縮リンクの展開、urlscan.io と URLhaus                                                                |
|                                       | **Email Header Analyzer**     | ホップごとの遅延を含む Received 経路、送信元 IP、SPF/DKIM/DMARC/ARC の結果、フィッシングのトリアージ所見                                                                                   |
| 💥 漏えい                             | **Leak Check**                | メールアドレスに関する既知のデータ漏えいと、パスワードが漏えいしているかどうかの k-匿名性によるチェック                                                                                    |
| 📁 ファイル・ハッシュ                 | **Hash Checker**              | テキストやファイルの MD5、SHA-1/2/3、BLAKE、CRC32 など、およびハッシュの識別と検証                                                                                                         |
|                                       | **Metadata Extractor**        | 画像の EXIF/GPS/XMP、PDF や Office ファイルのメタデータ、および画像の逆検索リンク                                                                                                          |
| ⛓️ ブロックチェーン                   | **Crypto Tracer**             | BTC/LTC/ETH アドレスを検証し、残高と最新のトランザクションを表示、取引相手を追跡                                                                                                           |
| 🧰 デコーダー・ユーティリティ         | **ID and Timestamp Decoder**  | X、Discord、Instagram、TikTok、Mastodon の ID、UUID、ULID、ObjectId に隠された作成日時。Unix、FILETIME、Chrome、Cocoa、Excel のタイムスタンプ                                              |
|                                       | **MAC Address Vendor Lookup** | IEEE レジストリに基づくベンダー、各種表記と EUI-64、ランダム化されたアドレスとローカル管理アドレス                                                                                         |

\* Python バックエンドが必要です (下記参照)。 † 静的サイトだけで動作しますが、一部のセクションはバックエンドが必要です。それ以外のツールはすべて、静的サイトだけで完全に動作します。

## 🚀 はじめに

### 前提条件

- [Node.js](https://nodejs.org/) **20.19 以上または 22.12 以上** と npm
- バックエンドを使う場合のみ: [uv](https://docs.astral.sh/uv/) と Python **3.14 以上** (Python は uv でインストールできます)

### フロントエンド

```sh
git clone https://github.com/Kerlooo/FreeOSINTUI.git
cd FreeOSINTUI
npm install
npm run dev
```

http://localhost:5173 を開きます。これだけで、15 個のツールが完全に動作し、さらに 3 個が部分的に動作します。

### バックエンド (Username Analyzer と Telegram OSINT)

別のターミナルで:

```sh
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

開発時は Vite が `/api` へのリクエストを `http://127.0.0.1:8000` に転送するため、ほかに設定するものはありません。対話的な API ドキュメントは http://localhost:8000/api/docs にあります。

### フロントエンドとバックエンドを同時に起動

```sh
npm run dev:all
```

ひとつのターミナルで両方のサーバーを起動し、ログには `[web]` / `[api]` のプレフィックスが付きます。Ctrl+C で両方が停止し、どちらかがクラッシュした場合はもう一方も停止します。

### 便利なコマンド

| コマンド                                            | 内容                                                 |
| --------------------------------------------------- | ---------------------------------------------------- |
| `npm run dev`                                       | 開発サーバーを起動                                   |
| `npm run dev:all`                                   | フロントエンドとバックエンドを同時に起動             |
| `npm run build`                                     | 静的サイトを `build/` にビルド                       |
| `npm run preview`                                   | 本番ビルドをローカルで配信                           |
| `npm test`                                          | フロントエンドのユニットテストを実行 (Vitest)        |
| `npm run lint`                                      | フォーマット (Prettier) とコード (ESLint) をチェック |
| `npm run format`                                    | Prettier でコードをフォーマット                      |
| `cd backend && uv run pytest`                       | バックエンドのテストを実行                           |
| `cd backend && uv run python scripts/update_wmn.py` | 同梱の WhatsMyName サイトリストを更新                |

## 📦 デプロイ

フロントエンドは**完全な静的サイト**です。`build/` フォルダを任意の静的ホスティング (GitHub Pages、Netlify、Cloudflare Pages、Vercel、nginx など) にアップロードしてください。

バックエンドは任意です。別のオリジンでホストする場合:

| 変数                    | 設定場所                  | 用途                                                                                                                                                                |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE`         | フロントエンド (ビルド時) | バックエンドのオリジン。例: `https://api.example.com`。デフォルトは同一オリジンの `/api`                                                                            |
| `ALLOWED_ORIGINS`       | バックエンド              | CORS で許可するオリジン (カンマ区切り)。デフォルト: `http://localhost:5173,http://localhost:4173`                                                                   |
| `USERNAME_RATE_LIMIT`   | バックエンド              | IP ごとの 1 分あたりのユーザー名チェック数。デフォルト: `1200`                                                                                                      |
| `TELEGRAM_RATE_LIMIT`   | バックエンド              | IP ごとの 1 分あたりの Telegram 検索数。デフォルト: `30`                                                                                                            |
| `ABUSECH_AUTH_KEY`      | バックエンド              | URLhaus と ThreatFox 用の、任意で設定できる無料の [abuse.ch](https://auth.abuse.ch/) Auth-Key。未設定の場合、これらのセクションには「not configured」と表示されます |
| `REPUTATION_RATE_LIMIT` | バックエンド              | IP ごとの 1 分あたりのレピュテーション検索数。デフォルト: `30`                                                                                                      |
| `URL_RATE_LIMIT`        | バックエンド              | IP ごとの 1 分あたりの URL Analyzer バックエンド検索数。デフォルト: `30`                                                                                            |
| `FOOTPRINT_RATE_LIMIT`  | バックエンド              | IP ごとの 1 分あたりの Wayback フットプリント検索数。デフォルト: `20`                                                                                               |

> レートリミッターはインメモリで、クライアント IP をキーにしています。リバースプロキシの背後では、すべてのユーザーがひとつの制限を共有することになります。

## 🧱 技術スタック

**フロントエンド**

- [SvelteKit](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/) (runes)、素の JavaScript と CSS
- [`@sveltejs/adapter-static`](https://svelte.dev/docs/kit/adapter-static): すべてのページをプリレンダリング
- [Vite](https://vite.dev/)、[Vitest](https://vitest.dev/)、ESLint、Prettier
- [hash-wasm](https://github.com/Daninet/hash-wasm) (ハッシュ計算)、[exifr](https://github.com/MikeKovarik/exifr) (画像メタデータ)、[fflate](https://github.com/101arrowz/fflate) (Office/PDF の展開)、[libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) (電話番号)

**バックエンド**

- [FastAPI](https://fastapi.tiangolo.com/) + [uvicorn](https://www.uvicorn.org/)、[httpx](https://www.python-httpx.org/)、[Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)
- 依存関係の管理に [uv](https://docs.astral.sh/uv/)、テストに pytest + respx

**アーキテクチャを一言で:** 公開 API が許す限り、ツールはブラウザ内で動作します。バックエンドは、ブラウザにはできないこと (CORS でブロックされるサイト、サーバー側で調べる必要があるページ) のためだけに存在します。ツールごとに接続先が固定されたエンドポイントをひとつずつ公開しており、汎用プロキシとして機能することはありません。

## 🗂️ プロジェクト構成

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

## 🙏 データソースとクレジット

FreeOSINT-UI は、以下の無料の公開サービスとプロジェクトの上に成り立っています:

[WhatsMyName](https://github.com/WebBreacher/WhatsMyName) (CC BY-SA 4.0) · [XposedOrNot](https://xposedornot.com/) · [Have I Been Pwned – Pwned Passwords](https://haveibeenpwned.com/Passwords) · [Shodan InternetDB](https://internetdb.shodan.io/) · [rdap.org](https://rdap.org/) · [Google Public DNS](https://developers.google.com/speed/public-dns/docs/doh) · [crt.sh](https://crt.sh/) · [Cert Spotter](https://sslmate.com/certspotter/) · [Internet Archive](https://archive.org/) · [ipwho.is](https://ipwho.is/) · [Gravatar](https://gravatar.com/) · [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) · [mempool.space](https://mempool.space/) · [litecoinspace.org](https://litecoinspace.org/) · [Blockscout](https://www.blockscout.com/) · [GitHub REST API](https://docs.github.com/rest) · [AlienVault OTX](https://otx.alienvault.com/) · [StopForumSpam](https://www.stopforumspam.com/) · [Tor Project](https://www.torproject.org/) · [Spamhaus DROP](https://www.spamhaus.org/blocklists/do-not-route-or-peer/) · [abuse.ch URLhaus & ThreatFox](https://abuse.ch/) · [urlscan.io](https://urlscan.io/) · [Common Crawl](https://commoncrawl.org/) · [IEEE Registration Authority](https://standards.ieee.org/products-programs/regauth/)

[OSINT-UI](https://osint-ui.com/) にインスパイアされています。

## ⚖️ 責任ある利用

FreeOSINT-UI が問い合わせるのは公開ソースだけですが、それでも結果は実在の人物に関わる可能性があります。セキュリティ研究、実施する権限のある調査、自分自身の露出状況の確認といった、正当な目的で使用してください。各データソースの利用規約と、お住まいの国のプライバシー関連法 (GDPR など) を遵守してください。結果は誤っていたり古くなっていたりする可能性があります。証拠としてではなく、検証すべき手がかりとして扱ってください。

## 📜 ライセンス

FreeOSINT-UI は **[Apache License 2.0](LICENSE) と [Commons Clause](https://commonsclause.com/)** のもとで公開されています。

- ✅ **自由に利用できます。** 個人利用でも業務利用でも、社内での利用も含めて構いません。
- ✅ **改変・共有できます。** ただし、原作者を明記している [LICENSE](LICENSE) と [NOTICE](../NOTICE) のファイルを保持する必要があります。
- ❌ **販売はできません。** FreeOSINT-UI そのもの、またはその価値の大部分が FreeOSINT-UI に由来する製品やサービスを、有償で提供することはできません (有償ホスティングや有償サポートを含みます)。

この販売禁止条件があるため、これは OSI 承認のオープンソースライセンスではなく、_ソースアベイラブル_ (source-available) ライセンスです。同梱の WhatsMyName データ (`backend/data/wmn-data.json`) には、独自の CC BY-SA 4.0 ライセンスが引き続き適用されます。

## 👨‍💻 作者

作者: **kerlo** — [GitHub](https://github.com/Kerlooo) · [LinkedIn](https://www.linkedin.com/in/carlo-scaglione/)

役に立ったら、リポジトリに ⭐ をお願いします!
