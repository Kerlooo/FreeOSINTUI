// Favicon Hash (/favicon).
export default {
	en: {
		metaDescription:
			'Compute the Shodan favicon hash (MurmurHash3), MD5 and SHA-256 of a favicon file locally and search Shodan, FOFA, ZoomEye, Censys and urlscan.io for sites using the same icon.',
		description:
			'Hash a favicon the way internet scanners do and find other servers showing the same icon: phishing kits, hidden origins behind a CDN, admin panels of the same product. The file is hashed in your browser and never uploaded.',
		fileHeading: 'Favicon file',
		whyUpload:
			'FreeOSINT-UI does not download favicons for you: fetching an arbitrary host would need a proxy open to abuse. Open the favicon in your browser, save it and drop the file here.',
		siteLabel: 'Site (optional)',
		sitePlaceholder: 'example.com',
		siteInvalid: 'Enter a domain or an http(s) URL.',
		openFavicon: 'Open {url}',
		siteHint:
			'Not every site serves /favicon.ico: if it fails, look for <link rel="icon"> in the page source.',
		exactBytes:
			'Use the file exactly as served: converting or re-saving the image changes every hash.',
		tooLarge: 'The file is {size}: a favicon should be a few KB. Choose a smaller file.',
		readError: 'Could not read the file: {message}',
		notImage:
			'This does not look like an image (it may be an HTML error page saved as favicon.ico). The hashes are still computed, but they will not match any real icon.',
		chooseFile: 'Choose a favicon file to hash it.',
		computing: 'Hashing…',
		'row.format': 'Detected format',
		'row.mime': 'Type reported by the browser',
		'row.size': 'Size',
		'row.bytes': { one: '{count} byte', other: '{count} bytes' },
		'preview.alt': 'Preview of {name}',
		'preview.dimensions': '{size} px',
		'preview.unsupported': 'Your browser cannot display this image.',
		hashesHeading: 'Hashes',
		'hash.mmh3': 'Shodan favicon hash (mmh3)',
		'hash.md5': 'MD5',
		'hash.sha256': 'SHA-256',
		mmh3Note:
			'MurmurHash3 (32-bit, signed) of the base64 of the file, wrapped every 76 characters: the value Shodan and FOFA index. ZoomEye and Censys use the MD5, urlscan.io the SHA-256.',
		searchHeading: 'Search',
		searchNote:
			'Most engines need a free account to use these filters, and each one only indexes the hosts it has scanned: no result does not mean the icon is unique.',
		searchBy: 'by {hash}',
		urlscanNote: 'matches any resource loaded by a scanned page, not only favicons',
		copyQuery: 'Copy query'
	},
	it: {
		metaDescription:
			"Calcola in locale l'hash favicon di Shodan (MurmurHash3), MD5 e SHA-256 di un file favicon e cerca su Shodan, FOFA, ZoomEye, Censys e urlscan.io i siti che usano la stessa icona.",
		description:
			"Calcola l'hash di una favicon come fanno gli scanner di Internet e trova altri server che mostrano la stessa icona: kit di phishing, origini nascoste dietro una CDN, pannelli di amministrazione dello stesso prodotto. Il file viene elaborato nel tuo browser e non viene mai caricato.",
		fileHeading: 'File favicon',
		whyUpload:
			'FreeOSINT-UI non scarica le favicon al posto tuo: contattare un host qualsiasi richiederebbe un proxy esposto ad abusi. Apri la favicon nel browser, salvala e trascina qui il file.',
		siteLabel: 'Sito (facoltativo)',
		sitePlaceholder: 'example.com',
		siteInvalid: 'Inserisci un dominio o un URL http(s).',
		openFavicon: 'Apri {url}',
		siteHint:
			'Non tutti i siti espongono /favicon.ico: se non funziona, cerca <link rel="icon"> nel sorgente della pagina.',
		exactBytes:
			"Usa il file esattamente come viene servito: convertire o salvare di nuovo l'immagine cambia tutti gli hash.",
		tooLarge:
			'Il file pesa {size}: una favicon dovrebbe pesare pochi KB. Scegli un file più piccolo.',
		readError: 'Impossibile leggere il file: {message}',
		notImage:
			"Non sembra un'immagine (potrebbe essere una pagina di errore HTML salvata come favicon.ico). Gli hash vengono comunque calcolati, ma non corrisponderanno a nessuna icona reale.",
		chooseFile: "Scegli un file favicon per calcolarne l'hash.",
		computing: 'Calcolo in corso…',
		'row.format': 'Formato rilevato',
		'row.mime': 'Tipo indicato dal browser',
		'row.size': 'Dimensione',
		'row.bytes': { one: '{count} byte', other: '{count} byte' },
		'preview.alt': 'Anteprima di {name}',
		'preview.dimensions': '{size} px',
		'preview.unsupported': 'Il tuo browser non riesce a mostrare questa immagine.',
		hashesHeading: 'Hash',
		'hash.mmh3': 'Hash favicon di Shodan (mmh3)',
		'hash.md5': 'MD5',
		'hash.sha256': 'SHA-256',
		mmh3Note:
			'MurmurHash3 (32 bit, con segno) del base64 del file, andando a capo ogni 76 caratteri: il valore indicizzato da Shodan e FOFA. ZoomEye e Censys usano l’MD5, urlscan.io lo SHA-256.',
		searchHeading: 'Ricerca',
		searchNote:
			'La maggior parte dei motori richiede un account gratuito per usare questi filtri, e ognuno indicizza solo gli host che ha scansionato: nessun risultato non significa che l’icona sia unica.',
		searchBy: 'per {hash}',
		urlscanNote: 'trova qualsiasi risorsa caricata da una pagina scansionata, non solo le favicon',
		copyQuery: 'Copia query'
	},
	fr: {
		metaDescription:
			'Calculez localement le hash favicon de Shodan (MurmurHash3), le MD5 et le SHA-256 d’un fichier favicon et cherchez sur Shodan, FOFA, ZoomEye, Censys et urlscan.io les sites qui utilisent la même icône.',
		description:
			'Calculez le hash d’une favicon comme le font les scanners d’Internet et trouvez d’autres serveurs affichant la même icône : kits de phishing, origines cachées derrière un CDN, panneaux d’administration du même produit. Le fichier est traité dans votre navigateur et n’est jamais envoyé.',
		fileHeading: 'Fichier favicon',
		whyUpload:
			'FreeOSINT-UI ne télécharge pas les favicons à votre place : contacter un hôte quelconque nécessiterait un proxy ouvert aux abus. Ouvrez la favicon dans votre navigateur, enregistrez-la et déposez le fichier ici.',
		siteLabel: 'Site (facultatif)',
		sitePlaceholder: 'example.com',
		siteInvalid: 'Saisissez un domaine ou une URL http(s).',
		openFavicon: 'Ouvrir {url}',
		siteHint:
			'Tous les sites ne servent pas /favicon.ico : en cas d’échec, cherchez <link rel="icon"> dans le code source de la page.',
		exactBytes:
			'Utilisez le fichier tel qu’il est servi : convertir ou réenregistrer l’image change tous les hashs.',
		tooLarge:
			'Le fichier fait {size} : une favicon devrait peser quelques Ko. Choisissez un fichier plus petit.',
		readError: 'Impossible de lire le fichier : {message}',
		notImage:
			'Ceci ne ressemble pas à une image (il peut s’agir d’une page d’erreur HTML enregistrée comme favicon.ico). Les hashs sont tout de même calculés, mais ne correspondront à aucune icône réelle.',
		chooseFile: 'Choisissez un fichier favicon pour en calculer le hash.',
		computing: 'Calcul en cours…',
		'row.format': 'Format détecté',
		'row.mime': 'Type indiqué par le navigateur',
		'row.size': 'Taille',
		'row.bytes': { one: '{count} octet', other: '{count} octets' },
		'preview.alt': 'Aperçu de {name}',
		'preview.dimensions': '{size} px',
		'preview.unsupported': 'Votre navigateur ne peut pas afficher cette image.',
		hashesHeading: 'Hashs',
		'hash.mmh3': 'Hash favicon de Shodan (mmh3)',
		'hash.md5': 'MD5',
		'hash.sha256': 'SHA-256',
		mmh3Note:
			'MurmurHash3 (32 bits, signé) du base64 du fichier, avec un retour à la ligne tous les 76 caractères : la valeur indexée par Shodan et FOFA. ZoomEye et Censys utilisent le MD5, urlscan.io le SHA-256.',
		searchHeading: 'Recherche',
		searchNote:
			'La plupart des moteurs demandent un compte gratuit pour utiliser ces filtres, et chacun n’indexe que les hôtes qu’il a scannés : aucun résultat ne signifie pas que l’icône est unique.',
		searchBy: 'par {hash}',
		urlscanNote: 'trouve toute ressource chargée par une page scannée, pas seulement les favicons',
		copyQuery: 'Copier la requête'
	},
	ja: {
		metaDescription:
			'favicon ファイルの Shodan favicon ハッシュ (MurmurHash3)、MD5、SHA-256 をローカルで計算し、同じアイコンを使うサイトを Shodan、FOFA、ZoomEye、Censys、urlscan.io で検索します。',
		description:
			'インターネットスキャナーと同じ方法で favicon をハッシュ化し、同じアイコンを表示している他のサーバーを見つけます: フィッシングキット、CDN の背後に隠れたオリジン、同じ製品の管理画面など。ファイルはブラウザ内でハッシュ化され、アップロードされることはありません。',
		fileHeading: 'favicon ファイル',
		whyUpload:
			'FreeOSINT-UI は favicon を代わりにダウンロードしません。任意のホストへアクセスするには、悪用される恐れのあるプロキシが必要になるためです。ブラウザで favicon を開いて保存し、そのファイルをここにドロップしてください。',
		siteLabel: 'サイト (任意)',
		sitePlaceholder: 'example.com',
		siteInvalid: 'ドメインまたは http(s) の URL を入力してください。',
		openFavicon: '{url} を開く',
		siteHint:
			'すべてのサイトが /favicon.ico を提供しているわけではありません。開けない場合は、ページのソースで <link rel="icon"> を探してください。',
		exactBytes:
			'配信されたままのファイルを使ってください。画像を変換したり保存し直したりすると、すべてのハッシュが変わります。',
		tooLarge:
			'ファイルサイズが {size} です。favicon は通常数 KB です。もっと小さいファイルを選択してください。',
		readError: 'ファイルを読み込めませんでした: {message}',
		notImage:
			'画像ではないようです (favicon.ico として保存された HTML のエラーページかもしれません)。ハッシュは計算されますが、実際のアイコンとは一致しません。',
		chooseFile: 'ハッシュを計算する favicon ファイルを選択してください。',
		computing: 'ハッシュを計算中…',
		'row.format': '検出された形式',
		'row.mime': 'ブラウザが報告した種類',
		'row.size': 'サイズ',
		'row.bytes': { other: '{count} バイト' },
		'preview.alt': '{name} のプレビュー',
		'preview.dimensions': '{size} px',
		'preview.unsupported': 'お使いのブラウザではこの画像を表示できません。',
		hashesHeading: 'ハッシュ',
		'hash.mmh3': 'Shodan favicon ハッシュ (mmh3)',
		'hash.md5': 'MD5',
		'hash.sha256': 'SHA-256',
		mmh3Note:
			'ファイルの base64 を 76 文字ごとに改行したものの MurmurHash3 (32 ビット、符号付き) で、Shodan と FOFA がインデックスしている値です。ZoomEye と Censys は MD5、urlscan.io は SHA-256 を使います。',
		searchHeading: '検索',
		searchNote:
			'これらのフィルターを使うには、ほとんどの検索エンジンで無料アカウントが必要です。また、各エンジンは自分がスキャンしたホストしかインデックスしていないため、結果がなくてもアイコンが唯一とは限りません。',
		searchBy: '{hash} で検索',
		urlscanNote: 'favicon だけでなく、スキャンされたページが読み込んだあらゆるリソースに一致します',
		copyQuery: 'クエリをコピー'
	}
};
