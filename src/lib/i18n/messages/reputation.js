// Reputation Checker (/reputation).
export default {
	en: {
		metaDescription:
			'Check the reputation of an IP address, domain, URL or email address against public blocklists and threat-intelligence feeds: AlienVault OTX, StopForumSpam, Tor exit nodes, Spamhaus DROP, URLhaus and ThreatFox.',
		description:
			'Check an IP address, domain, URL or email address against public blocklists and threat-intelligence feeds. Each source answers on its own; a listing is a lead to verify, not proof of malicious activity.',
		heading: 'Indicator',
		inputLabel: 'IP address, domain, URL or email address',
		placeholder: 'e.g. 8.8.8.8, example.com, https://example.com/login or name@example.com',
		check: 'Check',
		hint: 'The type is detected automatically. Email addresses are only sent as an MD5 hash.',
		checking: 'Checking',
		'kind.ip': 'IP address',
		'kind.domain': 'domain',
		'kind.url': 'URL',
		'kind.email': 'email address',
		'error.empty': 'Enter an IP address, a domain, a URL or an email address.',
		'error.invalid': 'Not a valid IP address, domain, URL or email address.',
		'error.url': 'Not a valid URL.',
		'error.scheme': 'Only http:// and https:// URLs can be checked.',
		'error.urlTooLong': 'The URL is too long (at most {max} characters).',
		'special.title': '{label} address',
		'special.skipped':
			'It is not a public internet address, so no blocklist can list it. Remote lookups were skipped.',
		'summary.title': 'Summary',
		'summary.listed': {
			one: 'Listed by {count} of {total} sources checked.',
			other: 'Listed by {count} of {total} sources checked.'
		},
		'summary.none': 'Not listed by any of the {total} sources checked.',
		'summary.pending': {
			one: '{count} source still loading…',
			other: '{count} sources still loading…'
		},
		'summary.unavailable': {
			one: '{count} source unavailable.',
			other: '{count} sources unavailable.'
		},
		'summary.caution':
			'A listing is a lead, not proof: shared hosting, VPNs, dynamic addresses and old reports cause false positives. Check the source page and the date before drawing conclusions.',
		'status.listed': 'listed',
		'status.notListed': 'not listed',
		'status.unavailable': 'unavailable',
		'status.loading': 'loading…',
		checked: 'Checked',
		open: 'View on {source}',
		notConfigured:
			'Not configured: this source needs a free abuse.ch Auth-Key set as ABUSECH_AUTH_KEY on the backend.',
		backendUnavailable: 'Needs the Python backend, which is not running.',
		backendPartial:
			'The browser-side sources still work; Tor, Spamhaus DROP, URLhaus and ThreatFox need the backend. Start it with:',
		pivots: 'More on this indicator:',
		'pivot.ip': 'IP Analyzer',
		'pivot.domain': 'Domain Analyzer',
		tags: 'Tags',
		'date.otx': 'Latest pulse',
		'date.sfs': 'Last seen',
		'date.tor': 'List updated',
		'date.drop': 'List updated',
		'date.urlhaus': 'Latest activity',
		'date.threatfox': 'Latest sighting',
		'otx.note':
			'Community threat-intelligence pulses that mention this indicator. Anyone can publish a pulse.',
		'otx.pulses': 'Pulses',
		'otx.whitelisted': 'Whitelisted by',
		'otx.recent': 'Most recent pulses',
		'sfs.note': 'Reports of forum and comment spam, submitted by site owners.',
		'sfs.frequency': 'Reports',
		'sfs.confidence': 'Confidence',
		'sfs.torexit': 'Tor exit node',
		'tor.note': 'Current Tor exit node addresses, published by the Tor Project.',
		'tor.exitNodes': 'Exit nodes in the list',
		'drop.note':
			'"Don\'t Route Or Peer": address blocks hijacked or run by criminal operations. Matched by network range.',
		'drop.cidr': 'Listed range',
		'drop.sblid': 'SBL id',
		'drop.rir': 'Registry',
		'urlhaus.note': 'URLs used to distribute malware, and the hosts serving them.',
		'urlhaus.urlCount': 'Malware URLs',
		'urlhaus.online': 'Still online',
		'urlhaus.urlStatus': 'URL status',
		'urlhaus.threat': 'Threat',
		'urlhaus.firstSeen': 'First seen',
		'urlhaus.blacklists': 'Other blocklists',
		'threatfox.note': 'Indicators of compromise (C2 servers, payload hosts) shared by researchers.',
		'threatfox.count': 'Matching IOCs',
		'threatfox.recent': 'Matching IOCs',
		'threatfox.confidence': '{value}% confidence'
	},
	it: {
		metaDescription:
			'Controlla la reputazione di un indirizzo IP, dominio, URL o indirizzo email su blocklist pubbliche e feed di threat intelligence: AlienVault OTX, StopForumSpam, nodi di uscita Tor, Spamhaus DROP, URLhaus e ThreatFox.',
		description:
			"Controlla un indirizzo IP, dominio, URL o indirizzo email su blocklist pubbliche e feed di threat intelligence. Ogni fonte risponde per conto suo; una segnalazione è una pista da verificare, non la prova di un'attività malevola.",
		heading: 'Indicatore',
		inputLabel: 'Indirizzo IP, dominio, URL o indirizzo email',
		placeholder: 'es. 8.8.8.8, example.com, https://example.com/login o nome@example.com',
		check: 'Controlla',
		hint: 'Il tipo viene riconosciuto in automatico. Gli indirizzi email vengono inviati solo come hash MD5.',
		checking: 'Controllo di',
		'kind.ip': 'indirizzo IP',
		'kind.domain': 'dominio',
		'kind.url': 'URL',
		'kind.email': 'indirizzo email',
		'error.empty': 'Inserisci un indirizzo IP, un dominio, un URL o un indirizzo email.',
		'error.invalid': 'Non è un indirizzo IP, dominio, URL o indirizzo email valido.',
		'error.url': 'Non è un URL valido.',
		'error.scheme': 'Si possono controllare solo URL http:// e https://.',
		'error.urlTooLong': "L'URL è troppo lungo (al massimo {max} caratteri).",
		'special.title': 'Indirizzo {label}',
		'special.skipped':
			'Non è un indirizzo pubblico di internet, quindi nessuna blocklist può elencarlo. Le ricerche remote sono state saltate.',
		'summary.title': 'Riepilogo',
		'summary.listed': {
			one: 'Segnalato da {count} fonte su {total} controllate.',
			other: 'Segnalato da {count} fonti su {total} controllate.'
		},
		'summary.none': 'Non segnalato da nessuna delle {total} fonti controllate.',
		'summary.pending': {
			one: '{count} fonte ancora in caricamento…',
			other: '{count} fonti ancora in caricamento…'
		},
		'summary.unavailable': {
			one: '{count} fonte non disponibile.',
			other: '{count} fonti non disponibili.'
		},
		'summary.caution':
			'Una segnalazione è una pista, non una prova: hosting condivisi, VPN, indirizzi dinamici e segnalazioni vecchie causano falsi positivi. Controlla la pagina della fonte e la data prima di trarre conclusioni.',
		'status.listed': 'segnalato',
		'status.notListed': 'non segnalato',
		'status.unavailable': 'non disponibile',
		'status.loading': 'caricamento…',
		checked: 'Controllato',
		open: 'Vedi su {source}',
		notConfigured:
			'Non configurata: questa fonte richiede una Auth-Key gratuita di abuse.ch impostata come ABUSECH_AUTH_KEY sul backend.',
		backendUnavailable: 'Richiede il backend Python, che non è avviato.',
		backendPartial:
			'Le fonti interrogate dal browser funzionano comunque; Tor, Spamhaus DROP, URLhaus e ThreatFox richiedono il backend. Avvialo con:',
		pivots: 'Approfondisci questo indicatore:',
		'pivot.ip': 'IP Analyzer',
		'pivot.domain': 'Domain Analyzer',
		tags: 'Tag',
		'date.otx': 'Pulse più recente',
		'date.sfs': 'Ultima segnalazione',
		'date.tor': 'Lista aggiornata',
		'date.drop': 'Lista aggiornata',
		'date.urlhaus': 'Attività più recente',
		'date.threatfox': 'Avvistamento più recente',
		'otx.note':
			'Pulse di threat intelligence della community che citano questo indicatore. Chiunque può pubblicare un pulse.',
		'otx.pulses': 'Pulse',
		'otx.whitelisted': 'In whitelist per',
		'otx.recent': 'Pulse più recenti',
		'sfs.note': 'Segnalazioni di spam su forum e commenti, inviate dai gestori dei siti.',
		'sfs.frequency': 'Segnalazioni',
		'sfs.confidence': 'Affidabilità',
		'sfs.torexit': 'Nodo di uscita Tor',
		'tor.note': 'Indirizzi attuali dei nodi di uscita Tor, pubblicati dal Tor Project.',
		'tor.exitNodes': 'Nodi di uscita nella lista',
		'drop.note':
			'"Don\'t Route Or Peer": blocchi di indirizzi dirottati o gestiti da organizzazioni criminali. Confronto per intervallo di rete.',
		'drop.cidr': 'Intervallo segnalato',
		'drop.sblid': 'ID SBL',
		'drop.rir': 'Registro',
		'urlhaus.note': 'URL usati per distribuire malware e host che li ospitano.',
		'urlhaus.urlCount': 'URL di malware',
		'urlhaus.online': 'Ancora online',
		'urlhaus.urlStatus': "Stato dell'URL",
		'urlhaus.threat': 'Minaccia',
		'urlhaus.firstSeen': 'Prima segnalazione',
		'urlhaus.blacklists': 'Altre blocklist',
		'threatfox.note':
			'Indicatori di compromissione (server C2, host di payload) condivisi dai ricercatori.',
		'threatfox.count': 'IOC corrispondenti',
		'threatfox.recent': 'IOC corrispondenti',
		'threatfox.confidence': 'affidabilità {value}%'
	},
	fr: {
		metaDescription:
			"Vérifiez la réputation d'une adresse IP, d'un domaine, d'une URL ou d'une adresse e-mail sur des listes de blocage publiques et des flux de threat intelligence : AlienVault OTX, StopForumSpam, nœuds de sortie Tor, Spamhaus DROP, URLhaus et ThreatFox.",
		description:
			"Vérifiez une adresse IP, un domaine, une URL ou une adresse e-mail sur des listes de blocage publiques et des flux de threat intelligence. Chaque source répond séparément ; un signalement est une piste à vérifier, pas la preuve d'une activité malveillante.",
		heading: 'Indicateur',
		inputLabel: 'Adresse IP, domaine, URL ou adresse e-mail',
		placeholder: 'ex. 8.8.8.8, example.com, https://example.com/login ou nom@example.com',
		check: 'Vérifier',
		hint: "Le type est détecté automatiquement. Les adresses e-mail ne sont envoyées que sous forme d'empreinte MD5.",
		checking: 'Vérification de',
		'kind.ip': 'adresse IP',
		'kind.domain': 'domaine',
		'kind.url': 'URL',
		'kind.email': 'adresse e-mail',
		'error.empty': 'Saisissez une adresse IP, un domaine, une URL ou une adresse e-mail.',
		'error.invalid':
			"Ce n'est pas une adresse IP, un domaine, une URL ou une adresse e-mail valide.",
		'error.url': "Ce n'est pas une URL valide.",
		'error.scheme': 'Seules les URL http:// et https:// peuvent être vérifiées.',
		'error.urlTooLong': "L'URL est trop longue ({max} caractères au maximum).",
		'special.title': 'Adresse {label}',
		'special.skipped':
			"Ce n'est pas une adresse publique d'internet, aucune liste de blocage ne peut donc la répertorier. Les recherches distantes ont été ignorées.",
		'summary.title': 'Résumé',
		'summary.listed': {
			one: 'Signalé par {count} source sur {total} vérifiées.',
			other: 'Signalé par {count} sources sur {total} vérifiées.'
		},
		'summary.none': 'Signalé par aucune des {total} sources vérifiées.',
		'summary.pending': {
			one: '{count} source encore en chargement…',
			other: '{count} sources encore en chargement…'
		},
		'summary.unavailable': {
			one: '{count} source indisponible.',
			other: '{count} sources indisponibles.'
		},
		'summary.caution':
			'Un signalement est une piste, pas une preuve : hébergements mutualisés, VPN, adresses dynamiques et anciens signalements provoquent des faux positifs. Consultez la page de la source et la date avant de conclure.',
		'status.listed': 'signalé',
		'status.notListed': 'non signalé',
		'status.unavailable': 'indisponible',
		'status.loading': 'chargement…',
		checked: 'Vérifié',
		open: 'Voir sur {source}',
		notConfigured:
			'Non configurée : cette source nécessite une Auth-Key abuse.ch gratuite définie dans ABUSECH_AUTH_KEY sur le backend.',
		backendUnavailable: "Nécessite le backend Python, qui n'est pas démarré.",
		backendPartial:
			'Les sources interrogées par le navigateur fonctionnent toujours ; Tor, Spamhaus DROP, URLhaus et ThreatFox nécessitent le backend. Démarrez-le avec :',
		pivots: 'En savoir plus sur cet indicateur :',
		'pivot.ip': 'IP Analyzer',
		'pivot.domain': 'Domain Analyzer',
		tags: 'Tags',
		'date.otx': 'Pulse le plus récent',
		'date.sfs': 'Dernier signalement',
		'date.tor': 'Liste mise à jour',
		'date.drop': 'Liste mise à jour',
		'date.urlhaus': 'Activité la plus récente',
		'date.threatfox': 'Observation la plus récente',
		'otx.note':
			"Pulses de threat intelligence de la communauté qui mentionnent cet indicateur. N'importe qui peut publier un pulse.",
		'otx.pulses': 'Pulses',
		'otx.whitelisted': 'En liste blanche selon',
		'otx.recent': 'Pulses les plus récents',
		'sfs.note':
			'Signalements de spam sur des forums et des commentaires, envoyés par les gestionnaires de sites.',
		'sfs.frequency': 'Signalements',
		'sfs.confidence': 'Confiance',
		'sfs.torexit': 'Nœud de sortie Tor',
		'tor.note': 'Adresses actuelles des nœuds de sortie Tor, publiées par le Tor Project.',
		'tor.exitNodes': 'Nœuds de sortie dans la liste',
		'drop.note':
			"« Don't Route Or Peer » : blocs d'adresses détournés ou exploités par des organisations criminelles. Comparaison par plage réseau.",
		'drop.cidr': 'Plage signalée',
		'drop.sblid': 'ID SBL',
		'drop.rir': 'Registre',
		'urlhaus.note':
			'URL utilisées pour distribuer des logiciels malveillants, et hôtes qui les servent.',
		'urlhaus.urlCount': 'URL malveillantes',
		'urlhaus.online': 'Encore en ligne',
		'urlhaus.urlStatus': "État de l'URL",
		'urlhaus.threat': 'Menace',
		'urlhaus.firstSeen': 'Premier signalement',
		'urlhaus.blacklists': 'Autres listes de blocage',
		'threatfox.note':
			'Indicateurs de compromission (serveurs C2, hôtes de charges utiles) partagés par des chercheurs.',
		'threatfox.count': 'IOC correspondants',
		'threatfox.recent': 'IOC correspondants',
		'threatfox.confidence': 'confiance {value} %'
	}
};
