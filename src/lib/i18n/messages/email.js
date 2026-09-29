// Email Analyzer: page, components, address parsing and mail server verdicts.
export default {
	en: {
		metaDescription:
			'Analyze an email address: syntax, free or disposable provider, role address, MX mail servers, SPF and DMARC, and public Gravatar profile.',
		intro:
			'Enter an email address to check its syntax, provider type, disposable domain, mail servers, SPF/DMARC protection and public Gravatar profile.',
		inputHeading: 'Email address',
		inputLabel: 'Email address',
		placeholder: 'e.g. john.doe@example.com',
		analyze: 'Analyze',
		privacyNote:
			'Only public sources are queried: DNS over HTTPS (Google), a public disposable-domain list and Gravatar. Nothing is sent to the address or its mail server.',
		unexpectedError: 'Unexpected error.',
		lookingUp: 'Looking up…',

		'error.empty': 'Enter an email address.',
		'error.shape': 'An email address looks like name@example.com.',
		'error.localTooLong': 'The part before @ is longer than 64 characters.',
		'error.localInvalid': 'The part before @ contains invalid characters.',
		'error.domainInvalid': 'The domain is not valid.',
		'error.domainExample': 'The domain is not valid (e.g. example.com).',

		'address.title': 'Address',
		'address.normalized': 'Normalized',
		'address.local': 'Local part',
		'address.tag': 'Plus tag',
		'address.domain': 'Domain',
		'address.syntax': 'Syntax',
		'address.valid': 'Valid',
		'address.freeProvider': 'Free provider',
		'address.freeYes': 'Yes — {provider}',
		'address.freeNo': 'No (custom domain)',
		'address.role': 'Role address',
		'address.roleYes': 'Yes — likely a shared or team mailbox, not a person',
		'address.roleNo': 'No — looks personal',

		'disposable.title': 'Disposable domain',
		'disposable.yes': 'Disposable:',
		'disposable.yesDetail': 'is a throwaway email service.',
		'disposable.no': 'Not listed as disposable.',
		'disposable.checkedBefore': 'Checked against {count} domains of the',
		'disposable.checkedAfter': ' list. New throwaway services may be missing.',

		'mail.title': 'Mail server',
		'mail.receiving': 'Receiving',
		'mail.note':
			'A valid mail server only means the domain accepts mail; it does not prove this specific mailbox exists.',
		'mail.priority': 'Priority',
		'mail.server': 'Mail server',
		'mail.nullMx': '(null MX)',

		'badge.good': 'OK',
		'badge.warn': 'WEAK',
		'badge.bad': 'RISK',

		'verdict.mx.null': 'Null MX: the domain explicitly declares it does not accept mail.',
		'verdict.mx.good': {
			one: 'The domain can receive mail ({count} mail server).',
			other: 'The domain can receive mail ({count} mail servers).'
		},
		'verdict.mx.fallback':
			"No MX record: mail may still be delivered to the domain's own address (A/AAAA fallback), but this is unusual.",
		'verdict.mx.none': 'No MX and no address record: this domain cannot receive mail.',
		'verdict.spf.none': 'No SPF record: any server can send mail claiming to be from this domain.',
		'verdict.spf.fail': 'Strict (-all): mail from unlisted servers should be rejected.',
		'verdict.spf.softfail':
			'Soft (~all): mail from unlisted servers is marked suspicious but usually accepted.',
		'verdict.spf.neutral': 'Neutral (?all): the record does not say anything useful.',
		'verdict.spf.pass': 'Permissive (+all): any server is allowed to send for this domain.',
		'verdict.spf.redirect':
			'Delegated with redirect to {target}: the actual policy is defined there.',
		'verdict.spf.noAll':
			'No "all" rule: the policy for unlisted servers is unclear (treated as neutral).',
		'verdict.dmarc.none':
			'No DMARC record: receivers get no instructions for spoofed mail from this domain.',
		'verdict.dmarc.partial': ' (applied to {percent}% of mail)',
		'verdict.dmarc.reject': 'Reject: spoofed mail should be refused{partial}.',
		'verdict.dmarc.quarantine': 'Quarantine: spoofed mail should go to spam{partial}.',
		'verdict.dmarc.monitor':
			'Monitoring only (p=none): spoofed mail is reported but still delivered.',
		'verdict.dmarc.invalid': 'The DMARC record has no valid policy (p=).',

		'gravatar.note':
			'Gravatar receives only the SHA-256 hash of the address. Profiles are public and self-declared.',
		'gravatar.avatarAlt': 'Gravatar avatar',
		'gravatar.noAvatar': 'No Gravatar avatar for this address.',
		'gravatar.loadingAvatar': 'Loading avatar…',
		'gravatar.name': 'Name',
		'gravatar.profile': 'Profile',
		'gravatar.location': 'Location',
		'gravatar.jobTitle': 'Job title',
		'gravatar.company': 'Company',
		'gravatar.pronouns': 'Pronouns',
		'gravatar.about': 'About',
		'gravatar.accounts': 'Verified accounts',
		'gravatar.noProfile': 'No public Gravatar profile for this address.',

		'links.title': 'Next steps',
		'links.leaks': '— see which known data breaches include this address.',
		'links.dorks': '— ready-made Google searches for this address.'
	},
	it: {
		metaDescription:
			'Analizza un indirizzo email: sintassi, provider gratuito o usa e getta, indirizzo di ruolo, server di posta MX, SPF e DMARC e profilo Gravatar pubblico.',
		intro:
			'Inserisci un indirizzo email per verificarne sintassi, tipo di provider, dominio usa e getta, server di posta, protezione SPF/DMARC e profilo Gravatar pubblico.',
		inputHeading: 'Indirizzo email',
		inputLabel: 'Indirizzo email',
		placeholder: 'es. john.doe@example.com',
		analyze: 'Analizza',
		privacyNote:
			"Vengono interrogate solo fonti pubbliche: DNS over HTTPS (Google), una lista pubblica di domini usa e getta e Gravatar. Nulla viene inviato all'indirizzo o al suo server di posta.",
		unexpectedError: 'Errore imprevisto.',
		lookingUp: 'Ricerca in corso…',

		'error.empty': 'Inserisci un indirizzo email.',
		'error.shape': 'Un indirizzo email ha la forma nome@example.com.',
		'error.localTooLong': 'La parte prima della @ supera i 64 caratteri.',
		'error.localInvalid': 'La parte prima della @ contiene caratteri non validi.',
		'error.domainInvalid': 'Il dominio non è valido.',
		'error.domainExample': 'Il dominio non è valido (es. example.com).',

		'address.title': 'Indirizzo',
		'address.normalized': 'Normalizzato',
		'address.local': 'Parte locale',
		'address.tag': 'Tag plus',
		'address.domain': 'Dominio',
		'address.syntax': 'Sintassi',
		'address.valid': 'Valida',
		'address.freeProvider': 'Provider gratuito',
		'address.freeYes': 'Sì — {provider}',
		'address.freeNo': 'No (dominio personalizzato)',
		'address.role': 'Indirizzo di ruolo',
		'address.roleYes': 'Sì — probabilmente una casella condivisa o di team, non una persona',
		'address.roleNo': 'No — sembra personale',

		'disposable.title': 'Dominio usa e getta',
		'disposable.yes': 'Usa e getta:',
		'disposable.yesDetail': 'è un servizio di email temporanee.',
		'disposable.no': 'Non risulta usa e getta.',
		'disposable.checkedBefore': 'Verificato su {count} domini della lista',
		'disposable.checkedAfter': '. I servizi temporanei più recenti potrebbero mancare.',

		'mail.title': 'Server di posta',
		'mail.receiving': 'Ricezione',
		'mail.note':
			'Un server di posta valido indica solo che il dominio accetta email; non prova che questa specifica casella esista.',
		'mail.priority': 'Priorità',
		'mail.server': 'Server di posta',
		'mail.nullMx': '(null MX)',

		'badge.good': 'OK',
		'badge.warn': 'DEBOLE',
		'badge.bad': 'RISCHIO',

		'verdict.mx.null': 'Null MX: il dominio dichiara esplicitamente di non accettare email.',
		'verdict.mx.good': {
			one: 'Il dominio può ricevere email ({count} server di posta).',
			other: 'Il dominio può ricevere email ({count} server di posta).'
		},
		'verdict.mx.fallback':
			"Nessun record MX: la posta potrebbe comunque essere consegnata all'indirizzo del dominio stesso (fallback A/AAAA), ma è insolito.",
		'verdict.mx.none':
			'Nessun MX e nessun record di indirizzo: questo dominio non può ricevere email.',
		'verdict.spf.none':
			'Nessun record SPF: qualsiasi server può inviare email spacciandosi per questo dominio.',
		'verdict.spf.fail':
			'Rigido (-all): le email da server non elencati dovrebbero essere rifiutate.',
		'verdict.spf.softfail':
			'Morbido (~all): le email da server non elencati sono segnate come sospette ma di solito accettate.',
		'verdict.spf.neutral': 'Neutro (?all): il record non dice nulla di utile.',
		'verdict.spf.pass': 'Permissivo (+all): qualsiasi server può inviare per questo dominio.',
		'verdict.spf.redirect': 'Delegato con redirect a {target}: la policy effettiva è definita lì.',
		'verdict.spf.noAll':
			'Nessuna regola "all": la policy per i server non elencati non è chiara (trattata come neutra).',
		'verdict.dmarc.none':
			'Nessun record DMARC: i destinatari non ricevono istruzioni per le email contraffatte da questo dominio.',
		'verdict.dmarc.partial': ' (applicata al {percent}% delle email)',
		'verdict.dmarc.reject': 'Reject: le email contraffatte dovrebbero essere rifiutate{partial}.',
		'verdict.dmarc.quarantine':
			'Quarantine: le email contraffatte dovrebbero finire nello spam{partial}.',
		'verdict.dmarc.monitor':
			'Solo monitoraggio (p=none): le email contraffatte vengono segnalate ma comunque consegnate.',
		'verdict.dmarc.invalid': 'Il record DMARC non ha una policy valida (p=).',

		'gravatar.note':
			"Gravatar riceve solo l'hash SHA-256 dell'indirizzo. I profili sono pubblici e autodichiarati.",
		'gravatar.avatarAlt': 'Avatar Gravatar',
		'gravatar.noAvatar': 'Nessun avatar Gravatar per questo indirizzo.',
		'gravatar.loadingAvatar': 'Caricamento avatar…',
		'gravatar.name': 'Nome',
		'gravatar.profile': 'Profilo',
		'gravatar.location': 'Località',
		'gravatar.jobTitle': 'Ruolo',
		'gravatar.company': 'Azienda',
		'gravatar.pronouns': 'Pronomi',
		'gravatar.about': 'Descrizione',
		'gravatar.accounts': 'Account verificati',
		'gravatar.noProfile': 'Nessun profilo Gravatar pubblico per questo indirizzo.',

		'links.title': 'Prossimi passi',
		'links.leaks': '— scopri in quali data breach noti compare questo indirizzo.',
		'links.dorks': '— ricerche Google già pronte per questo indirizzo.'
	},
	fr: {
		metaDescription:
			'Analysez une adresse e-mail : syntaxe, fournisseur gratuit ou jetable, adresse de rôle, serveurs de messagerie MX, SPF et DMARC, et profil Gravatar public.',
		intro:
			'Saisissez une adresse e-mail pour vérifier sa syntaxe, le type de fournisseur, un domaine jetable, les serveurs de messagerie, la protection SPF/DMARC et le profil Gravatar public.',
		inputHeading: 'Adresse e-mail',
		inputLabel: 'Adresse e-mail',
		placeholder: 'ex. john.doe@example.com',
		analyze: 'Analyser',
		privacyNote:
			"Seules des sources publiques sont interrogées : DNS over HTTPS (Google), une liste publique de domaines jetables et Gravatar. Rien n'est envoyé à l'adresse ni à son serveur de messagerie.",
		unexpectedError: 'Erreur inattendue.',
		lookingUp: 'Recherche en cours…',

		'error.empty': 'Saisissez une adresse e-mail.',
		'error.shape': 'Une adresse e-mail a la forme nom@example.com.',
		'error.localTooLong': 'La partie avant @ dépasse 64 caractères.',
		'error.localInvalid': 'La partie avant @ contient des caractères invalides.',
		'error.domainInvalid': "Le domaine n'est pas valide.",
		'error.domainExample': "Le domaine n'est pas valide (ex. example.com).",

		'address.title': 'Adresse',
		'address.normalized': 'Normalisée',
		'address.local': 'Partie locale',
		'address.tag': 'Tag plus',
		'address.domain': 'Domaine',
		'address.syntax': 'Syntaxe',
		'address.valid': 'Valide',
		'address.freeProvider': 'Fournisseur gratuit',
		'address.freeYes': 'Oui — {provider}',
		'address.freeNo': 'Non (domaine personnalisé)',
		'address.role': 'Adresse de rôle',
		'address.roleYes': "Oui — probablement une boîte partagée ou d'équipe, pas une personne",
		'address.roleNo': 'Non — semble personnelle',

		'disposable.title': 'Domaine jetable',
		'disposable.yes': 'Jetable :',
		'disposable.yesDetail': "est un service d'e-mails jetables.",
		'disposable.no': 'Non répertorié comme jetable.',
		'disposable.checkedBefore': 'Vérifié parmi {count} domaines de la liste',
		'disposable.checkedAfter': '. Les nouveaux services jetables peuvent manquer.',

		'mail.title': 'Serveur de messagerie',
		'mail.receiving': 'Réception',
		'mail.note':
			'Un serveur de messagerie valide signifie seulement que le domaine accepte les e-mails ; cela ne prouve pas que cette boîte précise existe.',
		'mail.priority': 'Priorité',
		'mail.server': 'Serveur de messagerie',
		'mail.nullMx': '(null MX)',

		'badge.good': 'OK',
		'badge.warn': 'FAIBLE',
		'badge.bad': 'RISQUE',

		'verdict.mx.null': "Null MX : le domaine déclare explicitement ne pas accepter d'e-mails.",
		'verdict.mx.good': {
			one: 'Le domaine peut recevoir des e-mails ({count} serveur de messagerie).',
			other: 'Le domaine peut recevoir des e-mails ({count} serveurs de messagerie).'
		},
		'verdict.mx.fallback':
			"Aucun enregistrement MX : les e-mails peuvent encore être livrés à l'adresse du domaine lui-même (repli A/AAAA), mais c'est inhabituel.",
		'verdict.mx.none':
			"Ni MX ni enregistrement d'adresse : ce domaine ne peut pas recevoir d'e-mails.",
		'verdict.spf.none':
			"Aucun enregistrement SPF : n'importe quel serveur peut envoyer des e-mails en se faisant passer pour ce domaine.",
		'verdict.spf.fail':
			'Strict (-all) : les e-mails des serveurs non listés devraient être rejetés.',
		'verdict.spf.softfail':
			'Souple (~all) : les e-mails des serveurs non listés sont marqués comme suspects mais généralement acceptés.',
		'verdict.spf.neutral': "Neutre (?all) : l'enregistrement n'indique rien d'utile.",
		'verdict.spf.pass':
			"Permissif (+all) : n'importe quel serveur est autorisé à envoyer pour ce domaine.",
		'verdict.spf.redirect':
			'Délégué par redirect vers {target} : la politique réelle y est définie.',
		'verdict.spf.noAll':
			'Aucune règle "all" : la politique pour les serveurs non listés est floue (traitée comme neutre).',
		'verdict.dmarc.none':
			'Aucun enregistrement DMARC : les destinataires ne reçoivent aucune consigne pour les e-mails usurpant ce domaine.',
		'verdict.dmarc.partial': ' (appliquée à {percent} % des e-mails)',
		'verdict.dmarc.reject': 'Reject : les e-mails usurpés devraient être refusés{partial}.',
		'verdict.dmarc.quarantine':
			'Quarantine : les e-mails usurpés devraient aller en spam{partial}.',
		'verdict.dmarc.monitor':
			'Surveillance uniquement (p=none) : les e-mails usurpés sont signalés mais quand même livrés.',
		'verdict.dmarc.invalid': "L'enregistrement DMARC n'a pas de politique valide (p=).",

		'gravatar.note':
			"Gravatar ne reçoit que le hash SHA-256 de l'adresse. Les profils sont publics et autodéclarés.",
		'gravatar.avatarAlt': 'Avatar Gravatar',
		'gravatar.noAvatar': 'Aucun avatar Gravatar pour cette adresse.',
		'gravatar.loadingAvatar': "Chargement de l'avatar…",
		'gravatar.name': 'Nom',
		'gravatar.profile': 'Profil',
		'gravatar.location': 'Localisation',
		'gravatar.jobTitle': 'Poste',
		'gravatar.company': 'Entreprise',
		'gravatar.pronouns': 'Pronoms',
		'gravatar.about': 'À propos',
		'gravatar.accounts': 'Comptes vérifiés',
		'gravatar.noProfile': 'Aucun profil Gravatar public pour cette adresse.',

		'links.title': 'Étapes suivantes',
		'links.leaks': '— voir quelles fuites de données connues incluent cette adresse.',
		'links.dorks': "— recherches Google prêtes à l'emploi pour cette adresse."
	}
};
