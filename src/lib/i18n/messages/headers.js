// Email Header Analyzer (/headers).
export default {
	en: {
		metaDescription:
			'Analyze raw email headers offline: sender and reply addresses, Received delivery path with hop delays, originating IP, SPF, DKIM, DMARC and ARC results, and phishing triage findings.',
		description:
			'Paste the raw headers of an email (or the whole message source) to see who sent it, the path it took, how long each hop lasted, whether SPF, DKIM and DMARC passed and what may deserve a closer look. Everything is parsed locally: nothing leaves your browser.',
		inputHeading: 'Headers',
		inputLabel: 'Raw email headers',
		placeholder:
			'Paste the raw headers or the whole message source (.eml). In most mail clients: "Show original" or "View source".',
		loadExample: 'Load example',
		clear: 'Clear',
		fileHint: 'Or open an .eml or .txt file: it is read locally, never uploaded.',
		fileError: 'Could not read the file: {error}',
		statusIdle: 'Results update as you paste. Nothing leaves your browser.',
		statusParsed: {
			one: '{count} header field parsed.',
			other: '{count} header fields parsed.'
		},
		statusIgnored: {
			one: '{count} line was not a header field and was ignored.',
			other: '{count} lines were not header fields and were ignored.'
		},
		statusNone: 'No header fields found. Each field starts with a line like "Name: value".',
		exampleNote:
			'Example with fake data (reserved example domains and documentation IP addresses).',
		empty: 'Paste email headers, open a file or load the example to analyze them.',

		findingsHeading: 'Findings',
		findingsNone: 'Nothing notable found in the headers.',
		findingsNote:
			'Triage heuristics: each finding may have a legitimate explanation. Headers added before the message reached your provider can be forged by the sender.',
		'severity.high': 'high',
		'severity.medium': 'medium',
		'severity.low': 'low',
		'severity.info': 'info',

		summaryHeading: 'Summary',

		originHeading: 'Sender IP',
		originLikely: 'Likely originating IP',
		originHop: 'Seen at',
		originHopValue: 'hop {number} ({host})',
		originNone: 'No public IP address found in the Received chain.',
		originNote:
			'The first external hop of the chain, private and loopback addresses skipped. Webmail and relays often hide the real client, and hops before your provider can be forged.',
		sourceIpHeading: 'IP headers added by the sending service',
		internal: 'internal',

		chainHeading: 'Delivery path',
		chainOrder: 'Oldest hop first: from the origin to the recipient.',
		chainCount: { one: '{count} hop', other: '{count} hops' },
		chainTotal: 'Total delivery time: {duration}',
		chainEmpty: 'No Received headers.',
		hop: 'Hop {number}',
		'hop.from': 'From',
		'hop.rdns': 'Reverse DNS',
		'hop.helo': 'HELO',
		'hop.ips': 'IP',
		'hop.by': 'By',
		'hop.with': 'Protocol',
		'hop.id': 'ID',
		'hop.for': 'For',
		'hop.date': 'Time',
		'hop.raw': 'Raw header',
		delay: '+{duration}',
		delaySlow: 'slow',
		delayNegative: 'clock skew',
		noDate: 'no timestamp',

		authHeading: 'Authentication',
		authNotReported: 'not reported',
		authVerdictNote:
			'Results from the topmost Authentication-Results header, added by the receiving server.',
		authResultsHeading: 'Authentication-Results',
		authServer: 'Server: {server}',
		authServerUnknown: 'Server not stated',
		authTopmost: 'added by the receiving server',
		authLower: 'added earlier, may be forged',
		authArcResultsHeading: 'ARC-Authentication-Results',
		authInstance: 'instance {number}',
		receivedSpfHeading: 'Received-SPF',
		dkimHeading: 'DKIM signatures',
		'dkim.domain': 'Domain (d=)',
		'dkim.selector': 'Selector (s=)',
		'dkim.algorithm': 'Algorithm (a=)',
		'dkim.canonicalization': 'Canonicalization (c=)',
		'dkim.headers': 'Signed headers (h=)',
		'dkim.identity': 'Identity (i=)',
		'dkim.timestamp': 'Signed at (t=)',
		'dkim.expiration': 'Expires (x=)',
		arcHeading: 'ARC chain',
		'arc.instance': 'Instance (i=)',
		'arc.domain': 'Domain (d=)',
		'arc.selector': 'Selector (s=)',
		'arc.cv': 'Chain validation (cv=)',
		comment: 'Comment',
		authNone: 'No authentication headers found.',

		otherHeading: 'Other X- headers ({count})',
		allHeading: 'All headers ({count})',

		pivotHeading: 'Pivot',
		pivotIps: 'IP addresses',
		pivotDomains: 'Domains',
		pivotEmails: 'Email addresses',
		pivotHint:
			'These links open other tools of this site with the value filled in: only then are lookups made, from your browser, to the public sources those tools use.',
		pivotDorks: 'Dorks',

		'finding.missingFrom.title': 'No From header',
		'finding.missingFrom.detail':
			'The message has no From address. Legitimate mail almost always has one: its absence may indicate a malformed or crafted message.',
		'finding.multipleFrom.title': 'Several From addresses',
		'finding.multipleFrom.detail':
			'The From header lists {count} addresses. This is rare and may be used to confuse mail clients about who sent the message.',
		'finding.returnPathMismatch.title': 'Return-Path in another domain',
		'finding.returnPathMismatch.detail':
			'Bounces go to {returnPath} while the visible sender is {from}. Common with newsletters and mailing services, but it may also indicate spoofing.',
		'finding.replyToDiffers.title': 'Reply-To differs from From',
		'finding.replyToDiffers.detail':
			'Replies go to {replyTo} instead of {from}. Often legitimate (help desks, mailing lists), but it may indicate an attempt to redirect answers.',
		'finding.displayNameEmail.title': 'Display name shows another address',
		'finding.displayNameEmail.detail':
			'The display name contains {name}, but the actual sender is {address}. Mail clients that show only the name may make the message look like it comes from someone else.',
		'finding.dmarcFail.title': 'DMARC failed',
		'finding.dmarcFail.detail':
			'The receiving server reports that the From domain did not pass DMARC: the message may not come from where it claims.',
		'finding.dmarcNone.title': 'No DMARC verdict',
		'finding.dmarcNone.detail':
			'The From domain publishes no DMARC policy or it was not applied, so the visible sender domain is not verified.',
		'finding.spfFail.title': 'SPF {result}',
		'finding.spfFail.detail':
			'The sending server is not authorized by the SPF record of the envelope domain ({result}). This may indicate spoofing, or simply forwarding.',
		'finding.spfNone.title': 'SPF {result}',
		'finding.spfNone.detail':
			'The SPF record of the envelope domain gives no verdict ({result}) for the sending server.',
		'finding.dkimFail.title': 'DKIM {result}',
		'finding.dkimFail.detail':
			'A DKIM signature did not verify ({result}): the message may have been modified in transit, or the signature may not be genuine.',
		'finding.dkimNone.title': 'No DKIM signature',
		'finding.dkimNone.detail':
			'The message is not signed with DKIM, so its content and sender domain cannot be verified cryptographically.',
		'finding.authError.title': '{method} {result}',
		'finding.authError.detail':
			'The {method} check could not be completed ({result}): usually a temporary or DNS configuration problem.',
		'finding.noAuthResults.title': 'No authentication results',
		'finding.noAuthResults.detail':
			'No Authentication-Results or Received-SPF header found. Paste the full headers as shown by your mail client ("Show original" or "View source").',
		'finding.dkimNotAligned.title': 'DKIM domain not aligned with From',
		'finding.dkimNotAligned.detail':
			'The message is signed by {domains}, not by {from}. Normal for mail sent through a third-party service, but the signature does not vouch for the From domain.',
		'finding.authPass.title': 'SPF, DKIM and DMARC passed',
		'finding.authPass.detail':
			'The receiving server verified the sender domain. This does not make the message safe: look-alike domains pass authentication too.',
		'finding.messageIdUnrelated.title': 'Message-ID from another domain',
		'finding.messageIdUnrelated.detail':
			'The Message-ID was generated under {domain}, unrelated to {from}. Often a mailing service, but it may indicate the message was not sent by servers of the From domain.',
		'finding.dateDrift.title': 'Date differs from the first Received time',
		'finding.dateDrift.detail':
			'The first Received timestamp is {duration} away from the Date header. This may indicate a wrong clock on the sender side, a delayed send or a forged date.',
		'finding.clockSkew.title': 'Negative delay between hops',
		'finding.clockSkew.detail': {
			one: '{count} hop has a timestamp earlier than the previous one: server clocks are out of sync, or a Received header may have been altered.',
			other:
				'{count} hops have a timestamp earlier than the previous one: server clocks are out of sync, or Received headers may have been altered.'
		},
		'finding.slowHop.title': 'Slow delivery hop',
		'finding.slowHop.detail': {
			one: '{count} hop took more than 10 minutes. Delays usually come from queues, greylisting or spam filtering.',
			other:
				'{count} hops took more than 10 minutes. Delays usually come from queues, greylisting or spam filtering.'
		},
		'finding.noReceived.title': 'No Received headers',
		'finding.noReceived.detail':
			'The delivery path is not available: paste the full headers, not just the visible fields.',
		'finding.suspiciousMailer.title': 'Mass-mailing software',
		'finding.suspiciousMailer.detail':
			'The X-Mailer or User-Agent ({mailer}) is a script or bulk-mail tool. It has legitimate uses but is also often seen in spam and phishing.'
	},
	it: {
		metaDescription:
			"Analizza gli header di un'email offline: mittente e indirizzi di risposta, percorso Received con i ritardi tra i salti, IP di origine, risultati SPF, DKIM, DMARC e ARC e segnalazioni per il triage del phishing.",
		description:
			"Incolla gli header grezzi di un'email (o l'intero sorgente del messaggio) per vedere chi l'ha inviata, il percorso seguito, quanto è durato ogni salto, se SPF, DKIM e DMARC sono stati superati e cosa merita un controllo più attento. Tutto viene analizzato in locale: nulla lascia il tuo browser.",
		inputHeading: 'Header',
		inputLabel: "Header grezzi dell'email",
		placeholder:
			'Incolla gli header grezzi o l\'intero sorgente del messaggio (.eml). Nella maggior parte dei client: "Mostra originale" o "Visualizza sorgente".',
		loadExample: 'Carica esempio',
		clear: 'Svuota',
		fileHint: 'Oppure apri un file .eml o .txt: viene letto in locale, mai caricato.',
		fileError: 'Impossibile leggere il file: {error}',
		statusIdle: 'I risultati si aggiornano mentre incolli. Nulla lascia il tuo browser.',
		statusParsed: {
			one: '{count} campo header analizzato.',
			other: '{count} campi header analizzati.'
		},
		statusIgnored: {
			one: '{count} riga non era un campo header ed è stata ignorata.',
			other: '{count} righe non erano campi header e sono state ignorate.'
		},
		statusNone: 'Nessun campo header trovato. Ogni campo inizia con una riga come "Nome: valore".',
		exampleNote:
			'Esempio con dati fittizi (domini di esempio riservati e indirizzi IP di documentazione).',
		empty: "Incolla gli header di un'email, apri un file o carica l'esempio per analizzarli.",

		findingsHeading: 'Segnalazioni',
		findingsNone: 'Nulla di rilevante negli header.',
		findingsNote:
			'Euristiche di triage: ogni segnalazione può avere una spiegazione legittima. Gli header aggiunti prima che il messaggio raggiungesse il tuo provider possono essere falsificati dal mittente.',
		'severity.high': 'alta',
		'severity.medium': 'media',
		'severity.low': 'bassa',
		'severity.info': 'info',

		summaryHeading: 'Riepilogo',

		originHeading: 'IP del mittente',
		originLikely: 'Probabile IP di origine',
		originHop: 'Visto in',
		originHopValue: 'salto {number} ({host})',
		originNone: 'Nessun indirizzo IP pubblico trovato nella catena Received.',
		originNote:
			'Il primo salto esterno della catena, esclusi gli indirizzi privati e di loopback. Webmail e relay spesso nascondono il client reale, e i salti precedenti al tuo provider possono essere falsificati.',
		sourceIpHeading: 'Header IP aggiunti dal servizio di invio',
		internal: 'interno',

		chainHeading: 'Percorso di consegna',
		chainOrder: "Salto più vecchio per primo: dall'origine al destinatario.",
		chainCount: { one: '{count} salto', other: '{count} salti' },
		chainTotal: 'Tempo totale di consegna: {duration}',
		chainEmpty: 'Nessun header Received.',
		hop: 'Salto {number}',
		'hop.from': 'Da',
		'hop.rdns': 'DNS inverso',
		'hop.helo': 'HELO',
		'hop.ips': 'IP',
		'hop.by': 'Ricevuto da',
		'hop.with': 'Protocollo',
		'hop.id': 'ID',
		'hop.for': 'Per',
		'hop.date': 'Ora',
		'hop.raw': 'Header grezzo',
		delay: '+{duration}',
		delaySlow: 'lento',
		delayNegative: 'orologi non allineati',
		noDate: 'senza orario',

		authHeading: 'Autenticazione',
		authNotReported: 'non indicato',
		authVerdictNote:
			"Risultati dell'header Authentication-Results più in alto, aggiunto dal server di destinazione.",
		authResultsHeading: 'Authentication-Results',
		authServer: 'Server: {server}',
		authServerUnknown: 'Server non indicato',
		authTopmost: 'aggiunto dal server di destinazione',
		authLower: 'aggiunto prima, potrebbe essere falsificato',
		authArcResultsHeading: 'ARC-Authentication-Results',
		authInstance: 'istanza {number}',
		receivedSpfHeading: 'Received-SPF',
		dkimHeading: 'Firme DKIM',
		'dkim.domain': 'Dominio (d=)',
		'dkim.selector': 'Selettore (s=)',
		'dkim.algorithm': 'Algoritmo (a=)',
		'dkim.canonicalization': 'Canonicalizzazione (c=)',
		'dkim.headers': 'Header firmati (h=)',
		'dkim.identity': 'Identità (i=)',
		'dkim.timestamp': 'Firmato il (t=)',
		'dkim.expiration': 'Scade il (x=)',
		arcHeading: 'Catena ARC',
		'arc.instance': 'Istanza (i=)',
		'arc.domain': 'Dominio (d=)',
		'arc.selector': 'Selettore (s=)',
		'arc.cv': 'Validazione catena (cv=)',
		comment: 'Commento',
		authNone: 'Nessun header di autenticazione trovato.',

		otherHeading: 'Altri header X- ({count})',
		allHeading: 'Tutti gli header ({count})',

		pivotHeading: 'Pivot',
		pivotIps: 'Indirizzi IP',
		pivotDomains: 'Domini',
		pivotEmails: 'Indirizzi email',
		pivotHint:
			'Questi link aprono altri strumenti del sito con il valore già inserito: solo allora partono le ricerche, dal tuo browser, verso le fonti pubbliche usate da quegli strumenti.',
		pivotDorks: 'Dork',

		'finding.missingFrom.title': 'Nessun header From',
		'finding.missingFrom.detail':
			'Il messaggio non ha un indirizzo From. La posta legittima ne ha quasi sempre uno: la sua assenza può indicare un messaggio malformato o costruito ad arte.',
		'finding.multipleFrom.title': 'Più indirizzi From',
		'finding.multipleFrom.detail':
			"L'header From elenca {count} indirizzi. È raro e può servire a confondere i client di posta su chi ha inviato il messaggio.",
		'finding.returnPathMismatch.title': 'Return-Path in un altro dominio',
		'finding.returnPathMismatch.detail':
			'I rimbalzi vanno a {returnPath} mentre il mittente visibile è {from}. Comune con newsletter e servizi di invio, ma può anche indicare spoofing.',
		'finding.replyToDiffers.title': 'Reply-To diverso da From',
		'finding.replyToDiffers.detail':
			'Le risposte vanno a {replyTo} invece che a {from}. Spesso è legittimo (help desk, mailing list), ma può indicare un tentativo di deviare le risposte.',
		'finding.displayNameEmail.title': 'Il nome visualizzato mostra un altro indirizzo',
		'finding.displayNameEmail.detail':
			'Il nome visualizzato contiene {name}, ma il mittente effettivo è {address}. I client che mostrano solo il nome possono far sembrare che il messaggio arrivi da qualcun altro.',
		'finding.dmarcFail.title': 'DMARC non superato',
		'finding.dmarcFail.detail':
			'Il server di destinazione segnala che il dominio From non ha superato DMARC: il messaggio potrebbe non provenire da dove dichiara.',
		'finding.dmarcNone.title': 'Nessun esito DMARC',
		'finding.dmarcNone.detail':
			'Il dominio From non pubblica una policy DMARC o non è stata applicata, quindi il dominio del mittente visibile non è verificato.',
		'finding.spfFail.title': 'SPF {result}',
		'finding.spfFail.detail':
			'Il server di invio non è autorizzato dal record SPF del dominio della busta ({result}). Può indicare spoofing, o semplicemente un inoltro.',
		'finding.spfNone.title': 'SPF {result}',
		'finding.spfNone.detail':
			'Il record SPF del dominio della busta non dà un esito ({result}) per il server di invio.',
		'finding.dkimFail.title': 'DKIM {result}',
		'finding.dkimFail.detail':
			'Una firma DKIM non è stata verificata ({result}): il messaggio potrebbe essere stato modificato durante il transito, o la firma potrebbe non essere autentica.',
		'finding.dkimNone.title': 'Nessuna firma DKIM',
		'finding.dkimNone.detail':
			'Il messaggio non è firmato con DKIM, quindi contenuto e dominio del mittente non possono essere verificati crittograficamente.',
		'finding.authError.title': '{method} {result}',
		'finding.authError.detail':
			'Il controllo {method} non è stato completato ({result}): di solito un problema temporaneo o di configurazione DNS.',
		'finding.noAuthResults.title': 'Nessun risultato di autenticazione',
		'finding.noAuthResults.detail':
			'Nessun header Authentication-Results o Received-SPF trovato. Incolla gli header completi come li mostra il tuo client di posta ("Mostra originale" o "Visualizza sorgente").',
		'finding.dkimNotAligned.title': 'Dominio DKIM non allineato con From',
		'finding.dkimNotAligned.detail':
			'Il messaggio è firmato da {domains}, non da {from}. Normale per la posta inviata tramite un servizio terzo, ma la firma non garantisce per il dominio From.',
		'finding.authPass.title': 'SPF, DKIM e DMARC superati',
		'finding.authPass.detail':
			"Il server di destinazione ha verificato il dominio del mittente. Questo non rende sicuro il messaggio: anche i domini sosia superano l'autenticazione.",
		'finding.messageIdUnrelated.title': 'Message-ID di un altro dominio',
		'finding.messageIdUnrelated.detail':
			'Il Message-ID è stato generato sotto {domain}, non collegato a {from}. Spesso è un servizio di invio, ma può indicare che il messaggio non è stato inviato dai server del dominio From.',
		'finding.dateDrift.title': 'Date diverso dal primo orario Received',
		'finding.dateDrift.detail':
			"Il primo timestamp Received dista {duration} dall'header Date. Può indicare un orologio errato dal lato del mittente, un invio ritardato o una data falsificata.",
		'finding.clockSkew.title': 'Ritardo negativo tra i salti',
		'finding.clockSkew.detail': {
			one: '{count} salto ha un orario precedente a quello prima: gli orologi dei server non sono allineati, o un header Received potrebbe essere stato alterato.',
			other:
				'{count} salti hanno un orario precedente a quello prima: gli orologi dei server non sono allineati, o degli header Received potrebbero essere stati alterati.'
		},
		'finding.slowHop.title': 'Salto di consegna lento',
		'finding.slowHop.detail': {
			one: '{count} salto ha impiegato più di 10 minuti. I ritardi di solito dipendono da code, greylisting o filtri antispam.',
			other:
				'{count} salti hanno impiegato più di 10 minuti. I ritardi di solito dipendono da code, greylisting o filtri antispam.'
		},
		'finding.noReceived.title': 'Nessun header Received',
		'finding.noReceived.detail':
			'Il percorso di consegna non è disponibile: incolla gli header completi, non solo i campi visibili.',
		'finding.suspiciousMailer.title': 'Software di invio massivo',
		'finding.suspiciousMailer.detail':
			"L'X-Mailer o lo User-Agent ({mailer}) è uno script o uno strumento di invio massivo. Ha usi legittimi, ma compare spesso anche in spam e phishing."
	},
	fr: {
		metaDescription:
			"Analysez les en-têtes d'un e-mail hors ligne : expéditeur et adresses de réponse, chemin Received avec les délais entre sauts, IP d'origine, résultats SPF, DKIM, DMARC et ARC, et signalements pour le tri du phishing.",
		description:
			"Collez les en-têtes bruts d'un e-mail (ou la source complète du message) pour voir qui l'a envoyé, le chemin suivi, la durée de chaque saut, si SPF, DKIM et DMARC ont réussi et ce qui mérite un examen plus attentif. Tout est analysé localement : rien ne quitte votre navigateur.",
		inputHeading: 'En-têtes',
		inputLabel: "En-têtes bruts de l'e-mail",
		placeholder:
			"Collez les en-têtes bruts ou la source complète du message (.eml). Dans la plupart des clients : « Afficher l'original » ou « Afficher la source ».",
		loadExample: "Charger l'exemple",
		clear: 'Effacer',
		fileHint: 'Ou ouvrez un fichier .eml ou .txt : il est lu localement, jamais envoyé.',
		fileError: 'Impossible de lire le fichier : {error}',
		statusIdle:
			'Les résultats se mettent à jour pendant que vous collez. Rien ne quitte votre navigateur.',
		statusParsed: {
			one: "{count} champ d'en-tête analysé.",
			other: "{count} champs d'en-tête analysés."
		},
		statusIgnored: {
			one: "{count} ligne n'était pas un champ d'en-tête et a été ignorée.",
			other: "{count} lignes n'étaient pas des champs d'en-tête et ont été ignorées."
		},
		statusNone:
			"Aucun champ d'en-tête trouvé. Chaque champ commence par une ligne comme « Nom: valeur ».",
		exampleNote:
			"Exemple avec des données fictives (domaines d'exemple réservés et adresses IP de documentation).",
		empty:
			"Collez les en-têtes d'un e-mail, ouvrez un fichier ou chargez l'exemple pour les analyser.",

		findingsHeading: 'Signalements',
		findingsNone: 'Rien de notable dans les en-têtes.',
		findingsNote:
			"Heuristiques de tri : chaque signalement peut avoir une explication légitime. Les en-têtes ajoutés avant que le message n'atteigne votre fournisseur peuvent être falsifiés par l'expéditeur.",
		'severity.high': 'élevée',
		'severity.medium': 'moyenne',
		'severity.low': 'faible',
		'severity.info': 'info',

		summaryHeading: 'Résumé',

		originHeading: "IP de l'expéditeur",
		originLikely: "IP d'origine probable",
		originHop: 'Vue au',
		originHopValue: 'saut {number} ({host})',
		originNone: 'Aucune adresse IP publique trouvée dans la chaîne Received.',
		originNote:
			'Le premier saut externe de la chaîne, adresses privées et de bouclage exclues. Les webmails et les relais masquent souvent le vrai client, et les sauts antérieurs à votre fournisseur peuvent être falsifiés.',
		sourceIpHeading: "En-têtes IP ajoutés par le service d'envoi",
		internal: 'interne',

		chainHeading: 'Chemin de livraison',
		chainOrder: "Saut le plus ancien en premier : de l'origine au destinataire.",
		chainCount: { one: '{count} saut', other: '{count} sauts' },
		chainTotal: 'Durée totale de livraison : {duration}',
		chainEmpty: 'Aucun en-tête Received.',
		hop: 'Saut {number}',
		'hop.from': 'De',
		'hop.rdns': 'DNS inverse',
		'hop.helo': 'HELO',
		'hop.ips': 'IP',
		'hop.by': 'Reçu par',
		'hop.with': 'Protocole',
		'hop.id': 'ID',
		'hop.for': 'Pour',
		'hop.date': 'Heure',
		'hop.raw': 'En-tête brut',
		delay: '+{duration}',
		delaySlow: 'lent',
		delayNegative: 'horloges décalées',
		noDate: 'sans horodatage',

		authHeading: 'Authentification',
		authNotReported: 'non indiqué',
		authVerdictNote:
			"Résultats de l'en-tête Authentication-Results le plus haut, ajouté par le serveur de réception.",
		authResultsHeading: 'Authentication-Results',
		authServer: 'Serveur : {server}',
		authServerUnknown: 'Serveur non indiqué',
		authTopmost: 'ajouté par le serveur de réception',
		authLower: 'ajouté avant, peut être falsifié',
		authArcResultsHeading: 'ARC-Authentication-Results',
		authInstance: 'instance {number}',
		receivedSpfHeading: 'Received-SPF',
		dkimHeading: 'Signatures DKIM',
		'dkim.domain': 'Domaine (d=)',
		'dkim.selector': 'Sélecteur (s=)',
		'dkim.algorithm': 'Algorithme (a=)',
		'dkim.canonicalization': 'Canonicalisation (c=)',
		'dkim.headers': 'En-têtes signés (h=)',
		'dkim.identity': 'Identité (i=)',
		'dkim.timestamp': 'Signé le (t=)',
		'dkim.expiration': 'Expire le (x=)',
		arcHeading: 'Chaîne ARC',
		'arc.instance': 'Instance (i=)',
		'arc.domain': 'Domaine (d=)',
		'arc.selector': 'Sélecteur (s=)',
		'arc.cv': 'Validation de la chaîne (cv=)',
		comment: 'Commentaire',
		authNone: "Aucun en-tête d'authentification trouvé.",

		otherHeading: 'Autres en-têtes X- ({count})',
		allHeading: 'Tous les en-têtes ({count})',

		pivotHeading: 'Pivot',
		pivotIps: 'Adresses IP',
		pivotDomains: 'Domaines',
		pivotEmails: 'Adresses e-mail',
		pivotHint:
			"Ces liens ouvrent d'autres outils du site avec la valeur déjà saisie : ce n'est qu'alors que des requêtes partent, depuis votre navigateur, vers les sources publiques utilisées par ces outils.",
		pivotDorks: 'Dorks',

		'finding.missingFrom.title': "Pas d'en-tête From",
		'finding.missingFrom.detail':
			"Le message n'a pas d'adresse From. Le courrier légitime en a presque toujours une : son absence peut indiquer un message mal formé ou fabriqué.",
		'finding.multipleFrom.title': 'Plusieurs adresses From',
		'finding.multipleFrom.detail':
			"L'en-tête From contient {count} adresses. C'est rare et peut servir à tromper les clients de messagerie sur l'expéditeur réel.",
		'finding.returnPathMismatch.title': 'Return-Path dans un autre domaine',
		'finding.returnPathMismatch.detail':
			"Les rebonds vont à {returnPath} alors que l'expéditeur visible est {from}. Courant avec les newsletters et les services d'envoi, mais cela peut aussi indiquer une usurpation.",
		'finding.replyToDiffers.title': 'Reply-To différent de From',
		'finding.replyToDiffers.detail':
			'Les réponses vont à {replyTo} au lieu de {from}. Souvent légitime (support, listes de diffusion), mais cela peut indiquer une tentative de détourner les réponses.',
		'finding.displayNameEmail.title': 'Le nom affiché montre une autre adresse',
		'finding.displayNameEmail.detail':
			"Le nom affiché contient {name}, mais l'expéditeur réel est {address}. Les clients qui n'affichent que le nom peuvent faire croire que le message vient de quelqu'un d'autre.",
		'finding.dmarcFail.title': 'Échec DMARC',
		'finding.dmarcFail.detail':
			"Le serveur de réception indique que le domaine From n'a pas passé DMARC : le message ne provient peut-être pas de là où il le prétend.",
		'finding.dmarcNone.title': 'Pas de verdict DMARC',
		'finding.dmarcNone.detail':
			"Le domaine From ne publie pas de politique DMARC ou elle n'a pas été appliquée : le domaine de l'expéditeur visible n'est donc pas vérifié.",
		'finding.spfFail.title': 'SPF {result}',
		'finding.spfFail.detail':
			"Le serveur d'envoi n'est pas autorisé par l'enregistrement SPF du domaine de l'enveloppe ({result}). Cela peut indiquer une usurpation, ou simplement un transfert.",
		'finding.spfNone.title': 'SPF {result}',
		'finding.spfNone.detail':
			"L'enregistrement SPF du domaine de l'enveloppe ne donne pas de verdict ({result}) pour le serveur d'envoi.",
		'finding.dkimFail.title': 'DKIM {result}',
		'finding.dkimFail.detail':
			"Une signature DKIM n'a pas été vérifiée ({result}) : le message a peut-être été modifié en transit, ou la signature n'est peut-être pas authentique.",
		'finding.dkimNone.title': 'Pas de signature DKIM',
		'finding.dkimNone.detail':
			"Le message n'est pas signé avec DKIM : son contenu et le domaine de l'expéditeur ne peuvent pas être vérifiés cryptographiquement.",
		'finding.authError.title': '{method} {result}',
		'finding.authError.detail':
			"La vérification {method} n'a pas pu aboutir ({result}) : généralement un problème temporaire ou de configuration DNS.",
		'finding.noAuthResults.title': "Aucun résultat d'authentification",
		'finding.noAuthResults.detail':
			"Aucun en-tête Authentication-Results ou Received-SPF trouvé. Collez les en-têtes complets tels que les affiche votre client de messagerie (« Afficher l'original » ou « Afficher la source »).",
		'finding.dkimNotAligned.title': 'Domaine DKIM non aligné avec From',
		'finding.dkimNotAligned.detail':
			'Le message est signé par {domains}, pas par {from}. Normal pour un courrier envoyé via un service tiers, mais la signature ne garantit pas le domaine From.',
		'finding.authPass.title': 'SPF, DKIM et DMARC réussis',
		'finding.authPass.detail':
			"Le serveur de réception a vérifié le domaine de l'expéditeur. Cela ne rend pas le message sûr : les domaines sosies passent aussi l'authentification.",
		'finding.messageIdUnrelated.title': "Message-ID d'un autre domaine",
		'finding.messageIdUnrelated.detail':
			"Le Message-ID a été généré sous {domain}, sans rapport avec {from}. Souvent un service d'envoi, mais cela peut indiquer que le message n'a pas été envoyé par les serveurs du domaine From.",
		'finding.dateDrift.title': 'Date éloignée de la première heure Received',
		'finding.dateDrift.detail':
			"Le premier horodatage Received est à {duration} de l'en-tête Date. Cela peut indiquer une horloge erronée chez l'expéditeur, un envoi différé ou une date falsifiée.",
		'finding.clockSkew.title': 'Délai négatif entre les sauts',
		'finding.clockSkew.detail': {
			one: '{count} saut a un horodatage antérieur au précédent : les horloges des serveurs sont décalées, ou un en-tête Received a peut-être été modifié.',
			other:
				'{count} sauts ont un horodatage antérieur au précédent : les horloges des serveurs sont décalées, ou des en-têtes Received ont peut-être été modifiés.'
		},
		'finding.slowHop.title': 'Saut de livraison lent',
		'finding.slowHop.detail': {
			one: "{count} saut a pris plus de 10 minutes. Les retards viennent généralement des files d'attente, du greylisting ou du filtrage antispam.",
			other:
				"{count} sauts ont pris plus de 10 minutes. Les retards viennent généralement des files d'attente, du greylisting ou du filtrage antispam."
		},
		'finding.noReceived.title': "Pas d'en-tête Received",
		'finding.noReceived.detail':
			"Le chemin de livraison n'est pas disponible : collez les en-têtes complets, pas seulement les champs visibles.",
		'finding.suspiciousMailer.title': "Logiciel d'envoi en masse",
		'finding.suspiciousMailer.detail':
			"Le X-Mailer ou le User-Agent ({mailer}) est un script ou un outil d'envoi en masse. Il a des usages légitimes, mais apparaît aussi souvent dans le spam et le phishing."
	}
};
