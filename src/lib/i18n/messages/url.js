// URL Analyzer (/url).
export default {
	en: {
		metaDescription:
			'Analyze a suspicious URL without opening it: refang/defang, IDN and look-alike letters, obfuscated IPs, tracking parameters, hidden redirects, short links, urlscan.io, URLhaus and Wayback.',
		description:
			'Break down a suspicious link without opening it: host tricks (look-alike letters, user@host, numeric IPs), tracking parameters, redirect targets hidden in the query, short link expansion and existing reputation data.',
		heading: 'URL',
		inputLabel: 'URL to analyze',
		placeholder: 'e.g. hxxps://login-paypal[.]example[.]com/?next=…',
		analyze: 'Analyze',
		hint: 'The URL is analyzed in your browser and never opened. Defanged URLs (hxxp, [.], [at]) are accepted.',
		loading: 'Loading…',
		'error.empty': 'Enter a URL.',
		'error.invalid': 'This is not a valid URL.',
		'error.scheme':
			'Only http and https URLs can be analyzed ({scheme}: URLs can run code or embed content directly: do not open them).',

		'overview.title': 'Breakdown',
		'row.scheme': 'Scheme',
		'row.user': 'User info',
		'row.password': 'Password',
		'row.passwordPresent': 'present (hidden)',
		'row.host': 'Host',
		'row.rawHost': 'Host as written',
		'row.hostUnicode': 'Host (Unicode)',
		'row.hostAscii': 'Host (Punycode)',
		'row.registrable': 'Registered domain',
		'row.subdomain': 'Subdomain',
		'row.suffix': 'Public suffix',
		'row.scripts': 'Scripts',
		'row.ip': 'IP address',
		'row.port': 'Port',
		'row.path': 'Path',
		'row.fragment': 'Fragment',
		'row.defanged': 'Defanged',
		'row.cleaned': 'Without tracking',
		copyUrl: 'Copy URL',
		copyDefanged: 'Copy defanged URL',
		copyCleaned: 'Copy URL without tracking',
		'pivot.domain': 'Domain Analyzer →',
		'pivot.ip': 'IP Analyzer →',
		'pivot.analyze': 'analyze →',

		'findings.title': 'Findings',
		'findings.note': 'Signs worth checking, not a verdict: legitimate links can show them too.',
		'findings.none': 'Nothing unusual found in the URL itself.',
		'severity.warning': 'warning',
		'severity.notice': 'notice',
		'severity.info': 'info',
		'finding.userinfo':
			'The URL contains user info ("{user}@"): the browser ignores it and goes to {host}. It is a common trick to make a link look like another site.',
		'finding.ipObfuscated':
			'The host "{raw}" is an IPv4 address written in an unusual form (decimal, octal or hex); browsers read it as {ip}.',
		'finding.ipLiteral': 'The host is an IP address ({ip}) instead of a domain name.',
		'finding.ipSpecial': '{ip} is in a special-purpose range: {label}.',
		'finding.lookalike':
			'The host {host} uses letters that look like Latin ones; it reads as "{skeleton}".',
		'finding.mixedScript': 'Labels mixing different alphabets: {labels}.',
		'finding.idn': 'Internationalized domain name: {ascii} is displayed as {unicode}.',
		'finding.brand':
			'The host contains the name {brands}, but the registered domain is {domain}. Check that it really belongs to that brand.',
		'finding.deepSubdomain': {
			one: 'Long subdomain chain ({count} level).',
			other:
				'Long subdomain chain ({count} levels), sometimes used to push the real domain out of view.'
		},
		'finding.longHost': 'Very long hostname ({length} characters).',
		'finding.hosting':
			'Hosted under {suffix}, a free hosting or dynamic DNS service: anyone can create a subdomain there.',
		'finding.dotless': 'The host "{host}" has no dot (internal name or unusual form).',
		'finding.embedded': {
			one: 'The URL carries another URL in a redirect parameter.',
			other: 'The URL carries {count} other URLs in redirect parameters.'
		},
		'finding.embeddedOther': {
			one: 'A query parameter contains a URL.',
			other: '{count} query parameters contain URLs.'
		},
		'finding.nested': 'Redirect targets are nested {count} levels deep.',
		'finding.redirector': 'Known redirector or link wrapper: {name}.',
		'finding.shortener':
			'{host} is a URL shortener: the real destination is hidden until the link is expanded.',
		'finding.http': 'Plain HTTP: the connection would not be encrypted.',
		'finding.port': 'Non-default port {port}.',
		'finding.tracking': {
			one: '{count} tracking parameter can be removed.',
			other: '{count} tracking parameters can be removed.'
		},
		'finding.refanged': 'The input was defanged and has been restored.',
		'finding.schemeAdded': 'No scheme given: https:// was assumed.',

		'redirector.google': 'Google redirect',
		'redirector.facebook': 'Facebook link shim',
		'redirector.instagram': 'Instagram link shim',
		'redirector.safelinks': 'Microsoft Safe Links',
		'redirector.urldefense': 'Proofpoint URL Defense',
		'redirector.youtube': 'YouTube redirect',
		'redirector.vk': 'VK away page',
		'redirector.linkedin': 'LinkedIn redirect',
		'redirector.slack': 'Slack redirect',
		'redirector.steam': 'Steam link filter',

		'params.title': 'Query parameters',
		'params.name': 'Name',
		'params.value': 'Value',
		'params.tracking': 'tracking',
		'params.embedded': 'URL',
		'params.empty': 'No query parameters.',

		'embedded.title': 'Embedded URLs',
		'embedded.note': 'URLs found inside this one, decoded offline. None of them is opened.',
		'embedded.query': 'parameter "{param}"',
		'embedded.fragment': 'fragment parameter "{param}"',
		'embedded.wrapper': 'link wrapper target',
		'embedded.redirect': 'redirect',
		'encoding.plain': 'plain',
		'encoding.percent': 'URL-encoded',
		'encoding.base64': 'base64',
		'encoding.urldefense': 'URL Defense',
		'embedded.chain': 'Final target after nested redirects',

		'expand.title': 'Short link expansion',
		'expand.source': 'backend',
		'expand.note':
			'Asks the shortener where the link points, without following it. Only known shortener hosts are contacted.',
		'expand.hop': 'HTTP {status}',
		'expand.final': 'Destination',
		'expand.noLocation': 'The shortener did not return a destination (unknown or disabled link).',
		'expand.truncated': 'Stopped after {count} short links.',

		'urlscan.title': 'Existing urlscan.io scans',
		'urlscan.note':
			'Public scans that other people already ran for this host. No new scan is submitted.',
		'urlscan.empty': 'No public scans for this host.',
		'urlscan.total': {
			one: '{count} public scan.',
			other: '{count} public scans, latest shown.'
		},
		'urlscan.malicious': 'malicious',
		'urlscan.noVerdict': 'no verdict',
		'urlscan.result': 'result ↗',
		'urlscan.screenshot': 'screenshot ↗',
		'urlscan.searchAll': 'Search on urlscan.io ↗',

		'urlhaus.title': 'URLhaus',
		'urlhaus.note': 'abuse.ch database of URLs used to spread malware.',
		'urlhaus.notConfigured':
			'Not configured: set ABUSECH_AUTH_KEY on the backend (free key from abuse.ch) to enable it.',
		'urlhaus.notListed': 'This exact URL is not listed on URLhaus.',
		'urlhaus.listed': 'Listed on URLhaus.',
		'urlhaus.row.status': 'Status',
		'urlhaus.row.threat': 'Threat',
		'urlhaus.row.tags': 'Tags',
		'urlhaus.row.added': 'Added',
		'urlhaus.row.lastOnline': 'Last online',
		'urlhaus.row.payloads': 'Payloads',
		'urlhaus.row.blacklists': 'Blocklists',
		'urlhaus.row.reference': 'Entry',

		'wayback.title': 'Wayback Machine',
		'wayback.note': 'Closest archived copy of this exact URL.',
		'wayback.none': 'No archived copy of this exact URL.',
		'wayback.snapshot': 'Closest snapshot',
		'wayback.date': 'Date',
		'wayback.status': 'HTTP status',
		'wayback.history': 'All captures'
	},
	it: {
		metaDescription:
			'Analizza un URL sospetto senza aprirlo: refang/defang, IDN e lettere somiglianti, IP offuscati, parametri di tracciamento, redirect nascosti, link brevi, urlscan.io, URLhaus e Wayback.',
		description:
			"Scomponi un link sospetto senza aprirlo: trucchi sull'host (lettere somiglianti, user@host, IP numerici), parametri di tracciamento, destinazioni di redirect nascoste nella query, espansione dei link brevi e dati di reputazione esistenti.",
		heading: 'URL',
		inputLabel: 'URL da analizzare',
		placeholder: 'es. hxxps://login-paypal[.]example[.]com/?next=…',
		analyze: 'Analizza',
		hint: "L'URL viene analizzato nel tuo browser e non viene mai aperto. Sono accettati URL defanged (hxxp, [.], [at]).",
		loading: 'Caricamento…',
		'error.empty': 'Inserisci un URL.',
		'error.invalid': 'Questo non è un URL valido.',
		'error.scheme':
			'Si possono analizzare solo URL http e https (gli URL {scheme}: possono eseguire codice o incorporare contenuti: non aprirli).',

		'overview.title': 'Scomposizione',
		'row.scheme': 'Schema',
		'row.user': 'Info utente',
		'row.password': 'Password',
		'row.passwordPresent': 'presente (nascosta)',
		'row.host': 'Host',
		'row.rawHost': 'Host come scritto',
		'row.hostUnicode': 'Host (Unicode)',
		'row.hostAscii': 'Host (Punycode)',
		'row.registrable': 'Dominio registrato',
		'row.subdomain': 'Sottodominio',
		'row.suffix': 'Suffisso pubblico',
		'row.scripts': 'Alfabeti',
		'row.ip': 'Indirizzo IP',
		'row.port': 'Porta',
		'row.path': 'Percorso',
		'row.fragment': 'Frammento',
		'row.defanged': 'Defanged',
		'row.cleaned': 'Senza tracciamento',
		copyUrl: "Copia l'URL",
		copyDefanged: "Copia l'URL defanged",
		copyCleaned: "Copia l'URL senza tracciamento",
		'pivot.domain': 'Domain Analyzer →',
		'pivot.ip': 'IP Analyzer →',
		'pivot.analyze': 'analizza →',

		'findings.title': 'Rilevazioni',
		'findings.note':
			'Segnali da verificare, non un verdetto: anche i link legittimi possono mostrarli.',
		'findings.none': "Niente di insolito nell'URL in sé.",
		'severity.warning': 'attenzione',
		'severity.notice': 'nota',
		'severity.info': 'info',
		'finding.userinfo':
			'L\'URL contiene info utente ("{user}@"): il browser le ignora e va su {host}. È un trucco comune per far sembrare un link un altro sito.',
		'finding.ipObfuscated':
			'L\'host "{raw}" è un indirizzo IPv4 scritto in forma insolita (decimale, ottale o esadecimale); i browser lo leggono come {ip}.',
		'finding.ipLiteral': "L'host è un indirizzo IP ({ip}) invece di un nome di dominio.",
		'finding.ipSpecial': '{ip} è in un intervallo a uso speciale: {label}.',
		'finding.lookalike':
			'L\'host {host} usa lettere che somigliano a quelle latine; si legge come "{skeleton}".',
		'finding.mixedScript': 'Etichette che mescolano alfabeti diversi: {labels}.',
		'finding.idn': 'Nome di dominio internazionalizzato: {ascii} viene mostrato come {unicode}.',
		'finding.brand':
			"L'host contiene il nome {brands}, ma il dominio registrato è {domain}. Verifica che appartenga davvero a quel marchio.",
		'finding.deepSubdomain': {
			one: 'Catena di sottodomini lunga ({count} livello).',
			other:
				'Catena di sottodomini lunga ({count} livelli), a volte usata per spingere il vero dominio fuori dalla vista.'
		},
		'finding.longHost': 'Nome host molto lungo ({length} caratteri).',
		'finding.hosting':
			'Ospitato sotto {suffix}, un servizio di hosting gratuito o DNS dinamico: chiunque può crearci un sottodominio.',
		'finding.dotless': 'L\'host "{host}" non ha punti (nome interno o forma insolita).',
		'finding.embedded': {
			one: "L'URL contiene un altro URL in un parametro di redirect.",
			other: "L'URL contiene altri {count} URL in parametri di redirect."
		},
		'finding.embeddedOther': {
			one: 'Un parametro della query contiene un URL.',
			other: '{count} parametri della query contengono URL.'
		},
		'finding.nested': 'Le destinazioni di redirect sono annidate su {count} livelli.',
		'finding.redirector': 'Redirector o wrapper di link noto: {name}.',
		'finding.shortener':
			'{host} è un accorciatore di URL: la vera destinazione resta nascosta finché il link non viene espanso.',
		'finding.http': 'HTTP semplice: la connessione non sarebbe cifrata.',
		'finding.port': 'Porta non predefinita {port}.',
		'finding.tracking': {
			one: '{count} parametro di tracciamento può essere rimosso.',
			other: '{count} parametri di tracciamento possono essere rimossi.'
		},
		'finding.refanged': "L'input era defanged ed è stato ripristinato.",
		'finding.schemeAdded': 'Nessuno schema indicato: è stato assunto https://.',

		'redirector.google': 'Redirect di Google',
		'redirector.facebook': 'Link shim di Facebook',
		'redirector.instagram': 'Link shim di Instagram',
		'redirector.safelinks': 'Microsoft Safe Links',
		'redirector.urldefense': 'Proofpoint URL Defense',
		'redirector.youtube': 'Redirect di YouTube',
		'redirector.vk': 'Pagina di uscita di VK',
		'redirector.linkedin': 'Redirect di LinkedIn',
		'redirector.slack': 'Redirect di Slack',
		'redirector.steam': 'Filtro link di Steam',

		'params.title': 'Parametri della query',
		'params.name': 'Nome',
		'params.value': 'Valore',
		'params.tracking': 'tracciamento',
		'params.embedded': 'URL',
		'params.empty': 'Nessun parametro nella query.',

		'embedded.title': 'URL incorporati',
		'embedded.note': 'URL trovati dentro questo, decodificati in locale. Nessuno viene aperto.',
		'embedded.query': 'parametro "{param}"',
		'embedded.fragment': 'parametro del frammento "{param}"',
		'embedded.wrapper': 'destinazione del wrapper',
		'embedded.redirect': 'redirect',
		'encoding.plain': 'in chiaro',
		'encoding.percent': 'URL-encoded',
		'encoding.base64': 'base64',
		'encoding.urldefense': 'URL Defense',
		'embedded.chain': 'Destinazione finale dopo i redirect annidati',

		'expand.title': 'Espansione link breve',
		'expand.source': 'backend',
		'expand.note':
			"Chiede all'accorciatore dove punta il link, senza seguirlo. Vengono contattati solo host di accorciatori noti.",
		'expand.hop': 'HTTP {status}',
		'expand.final': 'Destinazione',
		'expand.noLocation':
			"L'accorciatore non ha restituito una destinazione (link sconosciuto o disattivato).",
		'expand.truncated': 'Interrotto dopo {count} link brevi.',

		'urlscan.title': 'Scansioni urlscan.io esistenti',
		'urlscan.note':
			'Scansioni pubbliche già eseguite da altre persone per questo host. Non viene inviata nessuna nuova scansione.',
		'urlscan.empty': 'Nessuna scansione pubblica per questo host.',
		'urlscan.total': {
			one: '{count} scansione pubblica.',
			other: '{count} scansioni pubbliche, mostrate le più recenti.'
		},
		'urlscan.malicious': 'malevolo',
		'urlscan.noVerdict': 'nessun verdetto',
		'urlscan.result': 'risultato ↗',
		'urlscan.screenshot': 'screenshot ↗',
		'urlscan.searchAll': 'Cerca su urlscan.io ↗',

		'urlhaus.title': 'URLhaus',
		'urlhaus.note': 'Database di abuse.ch degli URL usati per diffondere malware.',
		'urlhaus.notConfigured':
			'Non configurato: imposta ABUSECH_AUTH_KEY sul backend (chiave gratuita di abuse.ch) per attivarlo.',
		'urlhaus.notListed': 'Questo URL esatto non è presente su URLhaus.',
		'urlhaus.listed': 'Presente su URLhaus.',
		'urlhaus.row.status': 'Stato',
		'urlhaus.row.threat': 'Minaccia',
		'urlhaus.row.tags': 'Tag',
		'urlhaus.row.added': 'Aggiunto',
		'urlhaus.row.lastOnline': 'Ultima volta online',
		'urlhaus.row.payloads': 'Payload',
		'urlhaus.row.blacklists': 'Blocklist',
		'urlhaus.row.reference': 'Voce',

		'wayback.title': 'Wayback Machine',
		'wayback.note': 'Copia archiviata più vicina di questo URL esatto.',
		'wayback.none': 'Nessuna copia archiviata di questo URL esatto.',
		'wayback.snapshot': 'Snapshot più vicino',
		'wayback.date': 'Data',
		'wayback.status': 'Stato HTTP',
		'wayback.history': 'Tutte le catture'
	},
	fr: {
		metaDescription:
			'Analysez une URL suspecte sans l’ouvrir : refang/defang, IDN et lettres sosies, IP obfusquées, paramètres de suivi, redirections cachées, liens courts, urlscan.io, URLhaus et Wayback.',
		description:
			'Décortiquez un lien suspect sans l’ouvrir : astuces sur l’hôte (lettres sosies, user@host, IP numériques), paramètres de suivi, destinations de redirection cachées dans la requête, expansion des liens courts et données de réputation existantes.',
		heading: 'URL',
		inputLabel: 'URL à analyser',
		placeholder: 'ex. hxxps://login-paypal[.]example[.]com/?next=…',
		analyze: 'Analyser',
		hint: 'L’URL est analysée dans votre navigateur et n’est jamais ouverte. Les URL defanged (hxxp, [.], [at]) sont acceptées.',
		loading: 'Chargement…',
		'error.empty': 'Saisissez une URL.',
		'error.invalid': 'Ce n’est pas une URL valide.',
		'error.scheme':
			'Seules les URL http et https peuvent être analysées (les URL {scheme}: peuvent exécuter du code ou intégrer du contenu : ne les ouvrez pas).',

		'overview.title': 'Décomposition',
		'row.scheme': 'Schéma',
		'row.user': 'Infos utilisateur',
		'row.password': 'Mot de passe',
		'row.passwordPresent': 'présent (masqué)',
		'row.host': 'Hôte',
		'row.rawHost': 'Hôte tel qu’écrit',
		'row.hostUnicode': 'Hôte (Unicode)',
		'row.hostAscii': 'Hôte (Punycode)',
		'row.registrable': 'Domaine enregistré',
		'row.subdomain': 'Sous-domaine',
		'row.suffix': 'Suffixe public',
		'row.scripts': 'Écritures',
		'row.ip': 'Adresse IP',
		'row.port': 'Port',
		'row.path': 'Chemin',
		'row.fragment': 'Fragment',
		'row.defanged': 'Defanged',
		'row.cleaned': 'Sans suivi',
		copyUrl: 'Copier l’URL',
		copyDefanged: 'Copier l’URL defanged',
		copyCleaned: 'Copier l’URL sans suivi',
		'pivot.domain': 'Domain Analyzer →',
		'pivot.ip': 'IP Analyzer →',
		'pivot.analyze': 'analyser →',

		'findings.title': 'Constats',
		'findings.note':
			'Des signes à vérifier, pas un verdict : des liens légitimes peuvent aussi les présenter.',
		'findings.none': 'Rien d’inhabituel dans l’URL elle-même.',
		'severity.warning': 'attention',
		'severity.notice': 'remarque',
		'severity.info': 'info',
		'finding.userinfo':
			'L’URL contient des infos utilisateur (« {user}@ ») : le navigateur les ignore et va sur {host}. C’est une astuce courante pour faire passer un lien pour un autre site.',
		'finding.ipObfuscated':
			'L’hôte « {raw} » est une adresse IPv4 écrite sous une forme inhabituelle (décimale, octale ou hexadécimale) ; les navigateurs la lisent comme {ip}.',
		'finding.ipLiteral': 'L’hôte est une adresse IP ({ip}) au lieu d’un nom de domaine.',
		'finding.ipSpecial': '{ip} fait partie d’une plage à usage spécial : {label}.',
		'finding.lookalike':
			'L’hôte {host} utilise des lettres qui ressemblent à des lettres latines ; il se lit « {skeleton} ».',
		'finding.mixedScript': 'Étiquettes mélangeant plusieurs écritures : {labels}.',
		'finding.idn': 'Nom de domaine internationalisé : {ascii} s’affiche comme {unicode}.',
		'finding.brand':
			'L’hôte contient le nom {brands}, mais le domaine enregistré est {domain}. Vérifiez qu’il appartient vraiment à cette marque.',
		'finding.deepSubdomain': {
			one: 'Longue chaîne de sous-domaines ({count} niveau).',
			other:
				'Longue chaîne de sous-domaines ({count} niveaux), parfois utilisée pour repousser le vrai domaine hors de vue.'
		},
		'finding.longHost': 'Nom d’hôte très long ({length} caractères).',
		'finding.hosting':
			'Hébergé sous {suffix}, un service d’hébergement gratuit ou de DNS dynamique : n’importe qui peut y créer un sous-domaine.',
		'finding.dotless':
			'L’hôte « {host} » ne contient aucun point (nom interne ou forme inhabituelle).',
		'finding.embedded': {
			one: 'L’URL contient une autre URL dans un paramètre de redirection.',
			other: 'L’URL contient {count} autres URL dans des paramètres de redirection.'
		},
		'finding.embeddedOther': {
			one: 'Un paramètre de la requête contient une URL.',
			other: '{count} paramètres de la requête contiennent des URL.'
		},
		'finding.nested': 'Les destinations de redirection sont imbriquées sur {count} niveaux.',
		'finding.redirector': 'Redirecteur ou enveloppe de lien connu : {name}.',
		'finding.shortener':
			'{host} est un raccourcisseur d’URL : la vraie destination reste cachée tant que le lien n’est pas développé.',
		'finding.http': 'HTTP simple : la connexion ne serait pas chiffrée.',
		'finding.port': 'Port non standard {port}.',
		'finding.tracking': {
			one: '{count} paramètre de suivi peut être supprimé.',
			other: '{count} paramètres de suivi peuvent être supprimés.'
		},
		'finding.refanged': 'L’entrée était defanged et a été restaurée.',
		'finding.schemeAdded': 'Aucun schéma indiqué : https:// a été supposé.',

		'redirector.google': 'Redirection Google',
		'redirector.facebook': 'Link shim de Facebook',
		'redirector.instagram': 'Link shim d’Instagram',
		'redirector.safelinks': 'Microsoft Safe Links',
		'redirector.urldefense': 'Proofpoint URL Defense',
		'redirector.youtube': 'Redirection YouTube',
		'redirector.vk': 'Page de sortie VK',
		'redirector.linkedin': 'Redirection LinkedIn',
		'redirector.slack': 'Redirection Slack',
		'redirector.steam': 'Filtre de liens Steam',

		'params.title': 'Paramètres de la requête',
		'params.name': 'Nom',
		'params.value': 'Valeur',
		'params.tracking': 'suivi',
		'params.embedded': 'URL',
		'params.empty': 'Aucun paramètre de requête.',

		'embedded.title': 'URL intégrées',
		'embedded.note': 'URL trouvées dans celle-ci, décodées localement. Aucune n’est ouverte.',
		'embedded.query': 'paramètre « {param} »',
		'embedded.fragment': 'paramètre du fragment « {param} »',
		'embedded.wrapper': 'destination de l’enveloppe',
		'embedded.redirect': 'redirection',
		'encoding.plain': 'en clair',
		'encoding.percent': 'encodée URL',
		'encoding.base64': 'base64',
		'encoding.urldefense': 'URL Defense',
		'embedded.chain': 'Destination finale après les redirections imbriquées',

		'expand.title': 'Expansion du lien court',
		'expand.source': 'backend',
		'expand.note':
			'Demande au raccourcisseur où pointe le lien, sans le suivre. Seuls des hôtes de raccourcisseurs connus sont contactés.',
		'expand.hop': 'HTTP {status}',
		'expand.final': 'Destination',
		'expand.noLocation':
			'Le raccourcisseur n’a renvoyé aucune destination (lien inconnu ou désactivé).',
		'expand.truncated': 'Arrêté après {count} liens courts.',

		'urlscan.title': 'Analyses urlscan.io existantes',
		'urlscan.note':
			'Analyses publiques déjà lancées par d’autres personnes pour cet hôte. Aucune nouvelle analyse n’est soumise.',
		'urlscan.empty': 'Aucune analyse publique pour cet hôte.',
		'urlscan.total': {
			one: '{count} analyse publique.',
			other: '{count} analyses publiques, les plus récentes affichées.'
		},
		'urlscan.malicious': 'malveillant',
		'urlscan.noVerdict': 'aucun verdict',
		'urlscan.result': 'résultat ↗',
		'urlscan.screenshot': 'capture ↗',
		'urlscan.searchAll': 'Rechercher sur urlscan.io ↗',

		'urlhaus.title': 'URLhaus',
		'urlhaus.note': 'Base d’abuse.ch des URL utilisées pour diffuser des logiciels malveillants.',
		'urlhaus.notConfigured':
			'Non configuré : définissez ABUSECH_AUTH_KEY sur le backend (clé gratuite d’abuse.ch) pour l’activer.',
		'urlhaus.notListed': 'Cette URL exacte ne figure pas sur URLhaus.',
		'urlhaus.listed': 'Répertoriée sur URLhaus.',
		'urlhaus.row.status': 'Statut',
		'urlhaus.row.threat': 'Menace',
		'urlhaus.row.tags': 'Tags',
		'urlhaus.row.added': 'Ajoutée',
		'urlhaus.row.lastOnline': 'Dernière fois en ligne',
		'urlhaus.row.payloads': 'Charges utiles',
		'urlhaus.row.blacklists': 'Listes de blocage',
		'urlhaus.row.reference': 'Fiche',

		'wayback.title': 'Wayback Machine',
		'wayback.note': 'Copie archivée la plus proche de cette URL exacte.',
		'wayback.none': 'Aucune copie archivée de cette URL exacte.',
		'wayback.snapshot': 'Instantané le plus proche',
		'wayback.date': 'Date',
		'wayback.status': 'Statut HTTP',
		'wayback.history': 'Toutes les captures'
	}
};
