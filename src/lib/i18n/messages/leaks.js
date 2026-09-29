// Leak Check: page, breach cards, password input and XposedOrNot errors.
export default {
	en: {
		metaDescription:
			'Check whether an email address appears in known data breaches and whether a password has been exposed, using k-anonymity so the password never leaves your browser.',
		intro:
			'Find out which known data breaches include an email address, or whether a password appears in breached password lists.',
		inputHeading: 'What to check',
		modeLabel: 'Check type',
		'mode.email': 'Email',
		'mode.password': 'Password',
		check: 'Check',
		unexpectedError: 'Unexpected error.',

		'email.label': 'Email address',
		'email.placeholder': 'e.g. john.doe@example.com',
		'email.note':
			'The address is sent to XposedOrNot. Only breach metadata (name, date, data types) is shown, never the leaked data itself.',
		'email.heading': 'Breaches',
		'email.checking': 'Checking known breaches…',
		'email.found': {
			one: 'appears in {total} known breach.',
			other: 'appears in {total} known breaches.'
		},
		'email.advice':
			'Change the password on these services and anywhere it was reused, and enable two-factor authentication.',
		'email.notFound': "was not found in XposedOrNot's breach database.",
		'email.notFoundNote':
			'This does not prove it was never leaked: only publicly known breaches are indexed.',
		'email.empty': 'Enter an email address to see the breaches that include it.',
		'email.rateLimited':
			'Could not reach XposedOrNot. It may be rate limiting this browser: wait a minute and try again.',

		'password.label': 'Password',
		'password.placeholder': 'Password to check',
		'password.show': 'show',
		'password.hide': 'hide',
		'password.note':
			'Your password never leaves the browser: it is hashed locally with SHA-1 and only the first 5 characters of the hash are sent (k-anonymity). The API returns hundreds of matching hashes and the comparison happens here. Even so, avoid typing passwords you still use anywhere they are not needed.',
		'password.heading': 'Result',
		'password.checking': 'Checking…',
		'password.stale': 'The password changed: press Check again.',
		'password.exposed': {
			one: 'Exposed: this password appeared {total} time in data breaches. Do not use it.',
			other: 'Exposed: this password appeared {total} times in data breaches. Do not use it.'
		},
		'password.notFound': 'Not found in known breaches.',
		'password.notFoundNote':
			'That does not make it strong: use a long, unique password for every account (a password manager helps).',
		'password.sent': 'Sent to the API: only the hash prefix',
		'password.clear': 'clear password',
		'password.empty': 'Enter a password to check it against Have I Been Pwned.',

		'breach.records': {
			one: '{total} record',
			other: '{total} records'
		},
		'breach.unverified': 'unverified',
		'breach.exposedData': 'Exposed data types',
		'breach.noDetails': 'No details available in the breach catalog.',

		'credits.sources': 'Sources:',
		'credits.emailBreaches': '(email breaches) and',
		'credits.passwords': '(passwords). Thanks to both projects for their free public APIs.'
	},
	it: {
		metaDescription:
			'Controlla se un indirizzo email compare in data breach noti e se una password è stata esposta, con k-anonymity: la password non lascia mai il tuo browser.',
		intro:
			'Scopri in quali data breach noti compare un indirizzo email, o se una password è presente nelle liste di password violate.',
		inputHeading: 'Cosa controllare',
		modeLabel: 'Tipo di controllo',
		'mode.email': 'Email',
		'mode.password': 'Password',
		check: 'Controlla',
		unexpectedError: 'Errore imprevisto.',

		'email.label': 'Indirizzo email',
		'email.placeholder': 'es. john.doe@example.com',
		'email.note':
			"L'indirizzo viene inviato a XposedOrNot. Vengono mostrati solo i metadati dei breach (nome, data, tipi di dati), mai i dati trapelati.",
		'email.heading': 'Data breach',
		'email.checking': 'Controllo dei breach noti…',
		'email.found': {
			one: 'compare in {total} data breach noto.',
			other: 'compare in {total} data breach noti.'
		},
		'email.advice':
			"Cambia la password su questi servizi e ovunque sia stata riutilizzata, e attiva l'autenticazione a due fattori.",
		'email.notFound': 'non è stato trovato nel database dei breach di XposedOrNot.',
		'email.notFoundNote':
			'Questo non prova che non sia mai trapelato: sono indicizzati solo i breach pubblicamente noti.',
		'email.empty': 'Inserisci un indirizzo email per vedere i breach in cui compare.',
		'email.rateLimited':
			'Impossibile raggiungere XposedOrNot. Forse sta limitando le richieste di questo browser: attendi un minuto e riprova.',

		'password.label': 'Password',
		'password.placeholder': 'Password da controllare',
		'password.show': 'mostra',
		'password.hide': 'nascondi',
		'password.note':
			"La tua password non lascia mai il browser: viene calcolato localmente l'hash SHA-1 e vengono inviati solo i primi 5 caratteri dell'hash (k-anonymity). L'API restituisce centinaia di hash corrispondenti e il confronto avviene qui. Evita comunque di digitare password che usi ancora dove non serve.",
		'password.heading': 'Risultato',
		'password.checking': 'Controllo in corso…',
		'password.stale': 'La password è cambiata: premi di nuovo Controlla.',
		'password.exposed': {
			one: 'Esposta: questa password è comparsa {total} volta in data breach. Non usarla.',
			other: 'Esposta: questa password è comparsa {total} volte in data breach. Non usarla.'
		},
		'password.notFound': 'Non trovata nei breach noti.',
		'password.notFoundNote':
			'Questo non la rende robusta: usa una password lunga e unica per ogni account (un password manager aiuta).',
		'password.sent': "Inviato all'API: solo il prefisso dell'hash",
		'password.clear': 'cancella password',
		'password.empty': 'Inserisci una password per controllarla su Have I Been Pwned.',

		'breach.records': {
			one: '{total} record',
			other: '{total} record'
		},
		'breach.unverified': 'non verificato',
		'breach.exposedData': 'Tipi di dati esposti',
		'breach.noDetails': 'Nessun dettaglio disponibile nel catalogo dei breach.',

		'credits.sources': 'Fonti:',
		'credits.emailBreaches': '(breach delle email) e',
		'credits.passwords':
			'(password). Grazie a entrambi i progetti per le loro API pubbliche gratuite.'
	},
	fr: {
		metaDescription:
			'Vérifiez si une adresse e-mail figure dans des fuites de données connues et si un mot de passe a été exposé, avec la k-anonymity : le mot de passe ne quitte jamais votre navigateur.',
		intro:
			'Découvrez quelles fuites de données connues incluent une adresse e-mail, ou si un mot de passe figure dans des listes de mots de passe divulgués.',
		inputHeading: 'Que vérifier',
		modeLabel: 'Type de vérification',
		'mode.email': 'E-mail',
		'mode.password': 'Mot de passe',
		check: 'Vérifier',
		unexpectedError: 'Erreur inattendue.',

		'email.label': 'Adresse e-mail',
		'email.placeholder': 'ex. john.doe@example.com',
		'email.note':
			"L'adresse est envoyée à XposedOrNot. Seules les métadonnées des fuites (nom, date, types de données) sont affichées, jamais les données divulguées elles-mêmes.",
		'email.heading': 'Fuites',
		'email.checking': 'Vérification des fuites connues…',
		'email.found': {
			one: 'figure dans {total} fuite connue.',
			other: 'figure dans {total} fuites connues.'
		},
		'email.advice':
			"Changez le mot de passe sur ces services et partout où il a été réutilisé, et activez l'authentification à deux facteurs.",
		'email.notFound': "n'a pas été trouvée dans la base de fuites de XposedOrNot.",
		'email.notFoundNote':
			"Cela ne prouve pas qu'elle n'a jamais fuité : seules les fuites publiquement connues sont indexées.",
		'email.empty': "Saisissez une adresse e-mail pour voir les fuites qui l'incluent.",
		'email.rateLimited':
			'Impossible de joindre XposedOrNot. Il limite peut-être les requêtes de ce navigateur : attendez une minute et réessayez.',

		'password.label': 'Mot de passe',
		'password.placeholder': 'Mot de passe à vérifier',
		'password.show': 'afficher',
		'password.hide': 'masquer',
		'password.note':
			"Votre mot de passe ne quitte jamais le navigateur : il est haché localement en SHA-1 et seuls les 5 premiers caractères du hash sont envoyés (k-anonymity). L'API renvoie des centaines de hash correspondants et la comparaison se fait ici. Évitez tout de même de saisir des mots de passe que vous utilisez encore là où ce n'est pas nécessaire.",
		'password.heading': 'Résultat',
		'password.checking': 'Vérification…',
		'password.stale': 'Le mot de passe a changé : appuyez de nouveau sur Vérifier.',
		'password.exposed': {
			one: "Exposé : ce mot de passe est apparu {total} fois dans des fuites de données. Ne l'utilisez pas.",
			other:
				"Exposé : ce mot de passe est apparu {total} fois dans des fuites de données. Ne l'utilisez pas."
		},
		'password.notFound': 'Introuvable dans les fuites connues.',
		'password.notFoundNote':
			'Cela ne le rend pas robuste pour autant : utilisez un mot de passe long et unique pour chaque compte (un gestionnaire de mots de passe aide).',
		'password.sent': "Envoyé à l'API : uniquement le préfixe du hash",
		'password.clear': 'effacer le mot de passe',
		'password.empty': 'Saisissez un mot de passe pour le vérifier sur Have I Been Pwned.',

		'breach.records': {
			one: '{total} enregistrement',
			other: '{total} enregistrements'
		},
		'breach.unverified': 'non vérifiée',
		'breach.exposedData': 'Types de données exposées',
		'breach.noDetails': 'Aucun détail disponible dans le catalogue des fuites.',

		'credits.sources': 'Sources :',
		'credits.emailBreaches': "(fuites d'e-mails) et",
		'credits.passwords':
			'(mots de passe). Merci aux deux projets pour leurs API publiques gratuites.'
	}
};
