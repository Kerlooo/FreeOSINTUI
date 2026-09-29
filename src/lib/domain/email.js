/**
 * @typedef {{ level: 'good' | 'warn' | 'bad' | 'info', text: string }} Finding
 */

/**
 * Turns the SPF/DMARC records of a domain into plain-English findings.
 * @param {{ spf: ReturnType<typeof import('$lib/dns/email-auth.js').parseSpf> | null, dmarc: ReturnType<typeof import('$lib/dns/email-auth.js').parseDmarc> | null }} auth
 * @returns {Finding[]}
 */
export function emailSecurityFindings({ spf, dmarc }) {
	/** @type {Finding[]} */
	const findings = [];

	if (!spf) {
		findings.push({
			level: 'bad',
			text: 'No SPF record: receivers cannot tell which servers may send mail for this domain.'
		});
	} else if (spf.allPolicy === 'fail') {
		findings.push({ level: 'good', text: 'SPF rejects mail from unlisted servers (-all).' });
	} else if (spf.allPolicy === 'softfail') {
		findings.push({
			level: 'warn',
			text: 'SPF only soft-fails unlisted servers (~all): their mail is marked suspicious, not rejected.'
		});
	} else if (spf.allPolicy === 'neutral' || spf.allPolicy === 'pass') {
		findings.push({
			level: 'bad',
			text: `SPF ends with ${spf.allPolicy === 'pass' ? '+all' : '?all'}: any server is accepted, so SPF gives no protection.`
		});
	} else if (spf.mechanisms.some((m) => m.name === 'redirect')) {
		findings.push({
			level: 'info',
			text: 'SPF delegates its policy to another domain (redirect=).'
		});
	} else {
		findings.push({
			level: 'warn',
			text: 'SPF has no "all" mechanism: mail from unlisted servers gets a neutral result.'
		});
	}

	if (!dmarc) {
		findings.push({
			level: 'bad',
			text: 'No DMARC: the domain can be spoofed more easily, and receivers get no policy for failing mail.'
		});
	} else {
		const policy = dmarc.policy?.toLowerCase();
		if (policy === 'reject') {
			findings.push({
				level: 'good',
				text: 'DMARC rejects mail that fails authentication (p=reject).'
			});
		} else if (policy === 'quarantine') {
			findings.push({
				level: 'good',
				text: 'DMARC sends mail that fails authentication to spam (p=quarantine).'
			});
		} else if (policy === 'none') {
			findings.push({
				level: 'warn',
				text: 'DMARC is in monitoring mode only (p=none): spoofed mail is not blocked.'
			});
		} else {
			findings.push({ level: 'bad', text: 'DMARC record has no valid policy (p=).' });
		}
		if ((policy === 'reject' || policy === 'quarantine') && dmarc.percent < 100) {
			findings.push({
				level: 'warn',
				text: `The DMARC policy applies to only ${dmarc.percent}% of failing mail (pct=${dmarc.percent}).`
			});
		}
		if (!dmarc.reports.length) {
			findings.push({
				level: 'info',
				text: 'No aggregate report address (rua=): the owner gets no DMARC reports.'
			});
		}
	}

	return findings;
}
