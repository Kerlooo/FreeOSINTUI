// Tool names, descriptions and categories (src/lib/tools.js).
export default {
	en: {
		'category.search': 'Search',
		'category.people': 'People & accounts',
		'category.network': 'Domains & network',
		'category.breaches': 'Breaches',
		'category.files': 'Files & hashes',
		'category.blockchain': 'Blockchain',
		'dorks.name': 'Google Dork Generator',
		'dorks.description':
			'Generate Google dorks for a username, email, name, phone number or domain, grouped by type (social, documents, code, pastes) with direct search links.',
		'hash.name': 'Hash Checker',
		'hash.description':
			'Compute MD5, SHA-1, SHA-2, SHA-3, BLAKE and CRC32 hashes of text or files, identify an unknown hash and verify it.',
		'domain.name': 'Domain Analyzer',
		'domain.description':
			'Analyze a domain: DNS records, SPF/DMARC email security, RDAP registration data, subdomains from certificate transparency and Wayback Machine snapshots.',
		'ip.name': 'IP Analyzer',
		'ip.description':
			'Analyze an IPv4/IPv6 address or hostname: approximate geolocation, ASN and ISP, reverse DNS, RDAP network owner and abuse contact, and open ports and CVEs from Shodan InternetDB (passive).',
		'email.name': 'Email Analyzer',
		'email.description':
			'Analyze an email address: syntax, free or disposable provider, role address, MX mail servers, SPF/DMARC protection and public Gravatar profile.',
		'leaks.name': 'Leak Check',
		'leaks.description':
			'Check which known data breaches include an email address, and whether a password has been exposed (k-anonymity: the password never leaves your browser).',
		'username.name': 'Username Analyzer',
		'username.description':
			'Check whether a username exists on hundreds of websites and social networks (WhatsMyName list). Requires the Python backend.',
		'phone.name': 'Phone Analyzer',
		'phone.description':
			'Validate a phone number offline: country, number type (mobile, fixed line, VoIP, toll free), standard formats and WhatsApp, Telegram and Google search links.',
		'telegram.name': 'Telegram OSINT',
		'telegram.description':
			'Look up a Telegram username: account type (channel, group, bot, user), name, bio, subscribers or members and latest channel posts. Requires the Python backend.',
		'crypto.name': 'Crypto Tracer',
		'crypto.description':
			'Detect and validate a Bitcoin, Litecoin or Ethereum address, then trace its balance, totals and latest transactions, following counterparties with one click.',
		'github.name': 'GitHub OSINT',
		'github.description':
			'Investigate a GitHub user: profile, repositories and top languages, organizations, emails leaked in public commits, SSH and GPG keys.',
		'metadata.name': 'Metadata Extractor',
		'metadata.description':
			'Read hidden metadata from images (EXIF, GPS with map links, XMP, IPTC), PDFs and Office documents: camera, location, author, software and dates. The file never leaves your browser.',
		'category.threat': 'Threat intel & phishing',
		'category.utilities': 'Decoders & utilities',
		'lookalike.name': 'Lookalike Domain Finder',
		'lookalike.description':
			'Generate typos, homoglyphs, IDN homographs, bitsquatting and TLD swaps of a domain and check with DNS which ones are registered and have mail servers (phishing risk).',
		'favicon.name': 'Favicon Hash',
		'favicon.description':
			'Compute the Shodan favicon hash (mmh3), MD5 and SHA-256 of a favicon file locally and search Shodan, FOFA, ZoomEye, Censys and urlscan.io for servers using the same icon.'
	},
	it: {
		'category.search': 'Ricerca',
		'category.people': 'Persone e account',
		'category.network': 'Domini e rete',
		'category.breaches': 'Data breach',
		'category.files': 'File e hash',
		'category.blockchain': 'Blockchain',
		'dorks.name': 'Generatore di Google Dork',
		'dorks.description':
			"Genera Google dork per uno username, un'email, un nome, un numero di telefono o un dominio, raggruppati per tipo (social, documenti, codice, paste) con link diretti alla ricerca.",
		'hash.name': 'Verifica Hash',
		'hash.description':
			'Calcola gli hash MD5, SHA-1, SHA-2, SHA-3, BLAKE e CRC32 di testo o file, identifica un hash sconosciuto e verificalo.',
		'domain.name': 'Analisi Dominio',
		'domain.description':
			'Analizza un dominio: record DNS, sicurezza email SPF/DMARC, dati di registrazione RDAP, sottodomini dalla certificate transparency e snapshot della Wayback Machine.',
		'ip.name': 'Analisi IP',
		'ip.description':
			'Analizza un indirizzo IPv4/IPv6 o un hostname: geolocalizzazione approssimativa, ASN e ISP, DNS inverso, proprietario della rete e contatto abuse da RDAP, porte aperte e CVE da Shodan InternetDB (passivo).',
		'email.name': 'Analisi Email',
		'email.description':
			'Analizza un indirizzo email: sintassi, provider gratuito o usa e getta, indirizzo di ruolo, server di posta MX, protezione SPF/DMARC e profilo Gravatar pubblico.',
		'leaks.name': 'Controllo Leak',
		'leaks.description':
			'Controlla in quali data breach noti compare un indirizzo email e se una password è stata esposta (k-anonymity: la password non lascia mai il tuo browser).',
		'username.name': 'Analisi Username',
		'username.description':
			'Controlla se uno username esiste su centinaia di siti web e social network (lista WhatsMyName). Richiede il backend Python.',
		'phone.name': 'Analisi Telefono',
		'phone.description':
			'Verifica un numero di telefono offline: paese, tipo di numero (mobile, fisso, VoIP, numero verde), formati standard e link di ricerca per WhatsApp, Telegram e Google.',
		'telegram.name': 'Telegram OSINT',
		'telegram.description':
			'Cerca uno username Telegram: tipo di account (canale, gruppo, bot, utente), nome, bio, iscritti o membri e ultimi post del canale. Richiede il backend Python.',
		'crypto.name': 'Tracciamento Crypto',
		'crypto.description':
			'Rileva e verifica un indirizzo Bitcoin, Litecoin o Ethereum, poi traccia saldo, totali e ultime transazioni, seguendo le controparti con un clic.',
		'github.name': 'GitHub OSINT',
		'github.description':
			'Indaga su un utente GitHub: profilo, repository e linguaggi principali, organizzazioni, email esposte nei commit pubblici, chiavi SSH e GPG.',
		'metadata.name': 'Estrattore di Metadati',
		'metadata.description':
			'Leggi i metadati nascosti di immagini (EXIF, GPS con link alla mappa, XMP, IPTC), PDF e documenti Office: fotocamera, posizione, autore, software e date. Il file non lascia mai il tuo browser.',
		'category.threat': 'Threat intel e phishing',
		'category.utilities': 'Decoder e utility',
		'lookalike.name': 'Ricerca Domini Simili',
		'lookalike.description':
			'Genera errori di battitura, omoglifi, omografi IDN, bitsquatting e cambi di TLD di un dominio e verifica via DNS quali sono registrati e hanno server di posta (rischio phishing).',
		'favicon.name': 'Hash Favicon',
		'favicon.description':
			'Calcola in locale l’hash favicon di Shodan (mmh3), MD5 e SHA-256 di un file favicon e cerca su Shodan, FOFA, ZoomEye, Censys e urlscan.io i server che usano la stessa icona.'
	},
	fr: {
		'category.search': 'Recherche',
		'category.people': 'Personnes et comptes',
		'category.network': 'Domaines et réseau',
		'category.breaches': 'Fuites de données',
		'category.files': 'Fichiers et hash',
		'category.blockchain': 'Blockchain',
		'dorks.name': 'Générateur de Google Dorks',
		'dorks.description':
			"Générez des Google dorks pour un nom d'utilisateur, un e-mail, un nom, un numéro de téléphone ou un domaine, regroupés par type (réseaux sociaux, documents, code, pastes) avec des liens de recherche directs.",
		'hash.name': 'Vérificateur de Hash',
		'hash.description':
			"Calculez les hash MD5, SHA-1, SHA-2, SHA-3, BLAKE et CRC32 d'un texte ou d'un fichier, identifiez un hash inconnu et vérifiez-le.",
		'domain.name': 'Analyse de Domaine',
		'domain.description':
			"Analysez un domaine : enregistrements DNS, sécurité e-mail SPF/DMARC, données d'enregistrement RDAP, sous-domaines issus de la certificate transparency et captures de la Wayback Machine.",
		'ip.name': 'Analyse IP',
		'ip.description':
			"Analysez une adresse IPv4/IPv6 ou un nom d'hôte : géolocalisation approximative, ASN et FAI, DNS inverse, propriétaire du réseau et contact abuse via RDAP, ports ouverts et CVE depuis Shodan InternetDB (passif).",
		'email.name': 'Analyse E-mail',
		'email.description':
			'Analysez une adresse e-mail : syntaxe, fournisseur gratuit ou jetable, adresse de rôle, serveurs de messagerie MX, protection SPF/DMARC et profil Gravatar public.',
		'leaks.name': 'Vérification de Fuites',
		'leaks.description':
			'Vérifiez dans quelles fuites de données connues figure une adresse e-mail, et si un mot de passe a été exposé (k-anonymity : le mot de passe ne quitte jamais votre navigateur).',
		'username.name': "Analyse de Nom d'utilisateur",
		'username.description':
			"Vérifiez si un nom d'utilisateur existe sur des centaines de sites web et réseaux sociaux (liste WhatsMyName). Nécessite le backend Python.",
		'phone.name': 'Analyse de Téléphone',
		'phone.description':
			'Validez un numéro de téléphone hors ligne : pays, type de numéro (mobile, fixe, VoIP, numéro gratuit), formats standard et liens de recherche WhatsApp, Telegram et Google.',
		'telegram.name': 'Telegram OSINT',
		'telegram.description':
			"Recherchez un nom d'utilisateur Telegram : type de compte (canal, groupe, bot, utilisateur), nom, bio, abonnés ou membres et derniers messages du canal. Nécessite le backend Python.",
		'crypto.name': 'Traceur Crypto',
		'crypto.description':
			'Détectez et validez une adresse Bitcoin, Litecoin ou Ethereum, puis tracez son solde, ses totaux et ses dernières transactions, en suivant les contreparties en un clic.',
		'github.name': 'GitHub OSINT',
		'github.description':
			'Enquêtez sur un utilisateur GitHub : profil, dépôts et langages principaux, organisations, e-mails exposés dans les commits publics, clés SSH et GPG.',
		'metadata.name': 'Extracteur de Métadonnées',
		'metadata.description':
			'Lisez les métadonnées cachées des images (EXIF, GPS avec liens vers la carte, XMP, IPTC), des PDF et des documents Office : appareil photo, lieu, auteur, logiciel et dates. Le fichier ne quitte jamais votre navigateur.',
		'category.threat': 'Threat intel et phishing',
		'category.utilities': 'Décodeurs et utilitaires',
		'lookalike.name': 'Recherche de Domaines Similaires',
		'lookalike.description':
			'Générez fautes de frappe, homoglyphes, homographes IDN, bitsquatting et changements de TLD d’un domaine et vérifiez par DNS lesquels sont enregistrés et ont des serveurs de messagerie (risque de phishing).',
		'favicon.name': 'Hash de Favicon',
		'favicon.description':
			'Calculez localement le hash favicon de Shodan (mmh3), le MD5 et le SHA-256 d’un fichier favicon et cherchez sur Shodan, FOFA, ZoomEye, Censys et urlscan.io les serveurs utilisant la même icône.'
	}
};
