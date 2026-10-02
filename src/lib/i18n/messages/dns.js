// Shared DNS strings: DNS-over-HTTPS errors and SPF/DMARC findings and labels
// (used by the Domain Analyzer and the Email Analyzer).
export default {
	en: {
		lookupFailed: 'DNS lookup failed (status {status}).',
		'finding.good': 'OK',
		'finding.warn': 'WEAK',
		'finding.bad': 'RISK',
		'finding.info': 'NOTE',
		'spf.missing':
			'No SPF record: receivers cannot tell which servers may send mail for this domain.',
		'spf.fail': 'SPF rejects mail from unlisted servers (-all).',
		'spf.softfail':
			'SPF only soft-fails unlisted servers (~all): their mail is marked suspicious, not rejected.',
		'spf.open': 'SPF ends with {all}: any server is accepted, so SPF gives no protection.',
		'spf.redirect': 'SPF delegates its policy to another domain (redirect=).',
		'spf.noAll': 'SPF has no "all" mechanism: mail from unlisted servers gets a neutral result.',
		'dmarc.missing':
			'No DMARC: the domain can be spoofed more easily, and receivers get no policy for failing mail.',
		'dmarc.reject': 'DMARC rejects mail that fails authentication (p=reject).',
		'dmarc.quarantine': 'DMARC sends mail that fails authentication to spam (p=quarantine).',
		'dmarc.none': 'DMARC is in monitoring mode only (p=none): spoofed mail is not blocked.',
		'dmarc.invalid': 'DMARC record has no valid policy (p=).',
		'dmarc.partial': 'The DMARC policy applies to only {percent}% of failing mail (pct={percent}).',
		'dmarc.noReports': 'No aggregate report address (rua=): the owner gets no DMARC reports.',
		'label.record': 'Record',
		'label.allPolicy': '"all" policy',
		'label.includes': 'Includes',
		'label.policy': 'Policy (p)',
		'label.subdomainPolicy': 'Subdomain policy (sp)',
		'label.percent': 'Percent (pct)',
		'label.reports': 'Reports (rua)',
		'value.none': 'none',
		'value.missing': 'missing',
		'spf.noRecord': 'No SPF record (TXT "v=spf1").',
		'dmarc.noRecord': 'No DMARC record (TXT at _dmarc).'
	},
	it: {
		lookupFailed: 'Query DNS non riuscita (stato {status}).',
		'finding.good': 'OK',
		'finding.warn': 'DEBOLE',
		'finding.bad': 'RISCHIO',
		'finding.info': 'NOTA',
		'spf.missing':
			'Nessun record SPF: i destinatari non possono sapere quali server possono inviare posta per questo dominio.',
		'spf.fail': 'SPF rifiuta la posta dai server non elencati (-all).',
		'spf.softfail':
			'SPF applica solo un soft fail ai server non elencati (~all): la loro posta viene segnata come sospetta, non rifiutata.',
		'spf.open': 'SPF termina con {all}: qualsiasi server è accettato, quindi SPF non protegge.',
		'spf.redirect': 'SPF delega la sua policy a un altro dominio (redirect=).',
		'spf.noAll':
			'SPF non ha un meccanismo "all": la posta dai server non elencati riceve un risultato neutro.',
		'dmarc.missing':
			'Nessun DMARC: il dominio è più facile da falsificare e i destinatari non hanno una policy per la posta che fallisce i controlli.',
		'dmarc.reject': "DMARC rifiuta la posta che fallisce l'autenticazione (p=reject).",
		'dmarc.quarantine':
			"DMARC manda nello spam la posta che fallisce l'autenticazione (p=quarantine).",
		'dmarc.none':
			'DMARC è solo in modalità monitoraggio (p=none): la posta falsificata non viene bloccata.',
		'dmarc.invalid': 'Il record DMARC non ha una policy valida (p=).',
		'dmarc.partial':
			'La policy DMARC si applica solo al {percent}% della posta che fallisce i controlli (pct={percent}).',
		'dmarc.noReports':
			'Nessun indirizzo per i report aggregati (rua=): il proprietario non riceve report DMARC.',
		'label.record': 'Record',
		'label.allPolicy': 'Policy "all"',
		'label.includes': 'Include',
		'label.policy': 'Policy (p)',
		'label.subdomainPolicy': 'Policy sottodomini (sp)',
		'label.percent': 'Percentuale (pct)',
		'label.reports': 'Report (rua)',
		'value.none': 'nessuna',
		'value.missing': 'assente',
		'spf.noRecord': 'Nessun record SPF (TXT "v=spf1").',
		'dmarc.noRecord': 'Nessun record DMARC (TXT su _dmarc).'
	},
	fr: {
		lookupFailed: 'Échec de la requête DNS (statut {status}).',
		'finding.good': 'OK',
		'finding.warn': 'FAIBLE',
		'finding.bad': 'RISQUE',
		'finding.info': 'NOTE',
		'spf.missing':
			'Aucun enregistrement SPF : les destinataires ne peuvent pas savoir quels serveurs peuvent envoyer des e-mails pour ce domaine.',
		'spf.fail': 'SPF rejette les e-mails des serveurs non listés (-all).',
		'spf.softfail':
			'SPF applique seulement un soft fail aux serveurs non listés (~all) : leurs e-mails sont marqués comme suspects, pas rejetés.',
		'spf.open':
			"SPF se termine par {all} : n'importe quel serveur est accepté, SPF n'offre donc aucune protection.",
		'spf.redirect': 'SPF délègue sa politique à un autre domaine (redirect=).',
		'spf.noAll':
			'SPF n\'a pas de mécanisme "all" : les e-mails des serveurs non listés obtiennent un résultat neutre.',
		'dmarc.missing':
			"Pas de DMARC : le domaine est plus facile à usurper et les destinataires n'ont aucune politique pour les e-mails en échec.",
		'dmarc.reject': "DMARC rejette les e-mails qui échouent à l'authentification (p=reject).",
		'dmarc.quarantine':
			"DMARC envoie en spam les e-mails qui échouent à l'authentification (p=quarantine).",
		'dmarc.none':
			'DMARC est en mode surveillance uniquement (p=none) : les e-mails usurpés ne sont pas bloqués.',
		'dmarc.invalid': "L'enregistrement DMARC n'a pas de politique valide (p=).",
		'dmarc.partial':
			"La politique DMARC ne s'applique qu'à {percent} % des e-mails en échec (pct={percent}).",
		'dmarc.noReports':
			'Aucune adresse de rapports agrégés (rua=) : le propriétaire ne reçoit aucun rapport DMARC.',
		'label.record': 'Enregistrement',
		'label.allPolicy': 'Politique "all"',
		'label.includes': 'Inclusions',
		'label.policy': 'Politique (p)',
		'label.subdomainPolicy': 'Politique des sous-domaines (sp)',
		'label.percent': 'Pourcentage (pct)',
		'label.reports': 'Rapports (rua)',
		'value.none': 'aucune',
		'value.missing': 'absente',
		'spf.noRecord': 'Aucun enregistrement SPF (TXT "v=spf1").',
		'dmarc.noRecord': 'Aucun enregistrement DMARC (TXT sur _dmarc).'
	},
	ja: {
		lookupFailed: 'DNS 検索に失敗しました (ステータス {status})。',
		'finding.good': 'OK',
		'finding.warn': '弱い',
		'finding.bad': 'リスク',
		'finding.info': '注記',
		'spf.missing':
			'SPF レコードがありません: 受信側は、このドメインのメールを送信できるサーバーを判別できません。',
		'spf.fail': 'SPF は、リストにないサーバーからのメールを拒否します (-all)。',
		'spf.softfail':
			'SPF は、リストにないサーバーをソフトフェイルにするだけです (~all): そのメールは拒否されず、疑わしいものとしてマークされます。',
		'spf.open':
			'SPF が {all} で終わっています: どのサーバーも許可されるため、SPF による保護はありません。',
		'spf.redirect': 'SPF はポリシーを別のドメインに委任しています (redirect=)。',
		'spf.noAll':
			'SPF に "all" メカニズムがありません: リストにないサーバーからのメールは neutral 判定になります。',
		'dmarc.missing':
			'DMARC がありません: ドメインがなりすましに使われやすく、受信側は認証に失敗したメールへのポリシーを得られません。',
		'dmarc.reject': 'DMARC は、認証に失敗したメールを拒否します (p=reject)。',
		'dmarc.quarantine': 'DMARC は、認証に失敗したメールを迷惑メールに振り分けます (p=quarantine)。',
		'dmarc.none': 'DMARC は監視モードのみです (p=none): なりすましメールはブロックされません。',
		'dmarc.invalid': 'DMARC レコードに有効なポリシー (p=) がありません。',
		'dmarc.partial':
			'DMARC ポリシーは、認証に失敗したメールの {percent}% にのみ適用されます (pct={percent})。',
		'dmarc.noReports':
			'集約レポートの送信先 (rua=) がありません: 所有者は DMARC レポートを受け取れません。',
		'label.record': 'レコード',
		'label.allPolicy': '"all" ポリシー',
		'label.includes': 'Include',
		'label.policy': 'ポリシー (p)',
		'label.subdomainPolicy': 'サブドメインのポリシー (sp)',
		'label.percent': '適用率 (pct)',
		'label.reports': 'レポート (rua)',
		'value.none': 'なし',
		'value.missing': '未設定',
		'spf.noRecord': 'SPF レコードがありません (TXT "v=spf1")。',
		'dmarc.noRecord': 'DMARC レコードがありません (_dmarc の TXT)。'
	}
};
