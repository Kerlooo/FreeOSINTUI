import { resolveDns } from '$lib/dns/doh.js';
import { lookupEmailAuth } from '$lib/dns/email-auth.js';

/**
 * Parses MX answers ("10 mx.example.com") and sorts them by priority.
 * A "null MX" (RFC 7505: priority 0 and host ".") has an empty host.
 * @param {{ data: string, ttl: number }[]} answers
 */
export function parseMx(answers) {
	return answers
		.map((answer) => {
			const [priority, host = ''] = answer.data.trim().split(/\s+/);
			return {
				priority: Number(priority),
				host: host.replace(/\.$/, '').toLowerCase(),
				ttl: answer.ttl
			};
		})
		.sort((a, b) => a.priority - b.priority || a.host.localeCompare(b.host));
}

/**
 * @typedef {{ level: 'good' | 'warn' | 'bad', text: string }} Verdict
 */

/**
 * Plain-English verdict on whether the domain can receive mail.
 * @param {{ host: string }[]} mx
 * @param {boolean} hasAddress whether the domain has an A/AAAA record (implicit MX fallback)
 * @returns {Verdict}
 */
export function mxVerdict(mx, hasAddress) {
	if (mx.length === 1 && mx[0].host === '')
		return {
			level: 'bad',
			text: 'Null MX: the domain explicitly declares it does not accept mail.'
		};
	if (mx.length)
		return {
			level: 'good',
			text: `The domain can receive mail (${mx.length} mail server${mx.length > 1 ? 's' : ''}).`
		};
	if (hasAddress)
		return {
			level: 'warn',
			text: 'No MX record: mail may still be delivered to the domain’s own address (A/AAAA fallback), but this is unusual.'
		};
	return { level: 'bad', text: 'No MX and no address record: this domain cannot receive mail.' };
}

/**
 * @param {{ allPolicy: string | null, mechanisms?: { name: string, value: string | null }[] } | null} spf
 * @returns {Verdict}
 */
export function spfVerdict(spf) {
	if (!spf)
		return {
			level: 'bad',
			text: 'No SPF record: any server can send mail claiming to be from this domain.'
		};
	switch (spf.allPolicy) {
		case 'fail':
			return {
				level: 'good',
				text: 'Strict (-all): mail from unlisted servers should be rejected.'
			};
		case 'softfail':
			return {
				level: 'warn',
				text: 'Soft (~all): mail from unlisted servers is marked suspicious but usually accepted.'
			};
		case 'neutral':
			return { level: 'bad', text: 'Neutral (?all): the record does not say anything useful.' };
		case 'pass':
			return {
				level: 'bad',
				text: 'Permissive (+all): any server is allowed to send for this domain.'
			};
		default: {
			const redirect = spf.mechanisms?.find((m) => m.name === 'redirect')?.value;
			if (redirect)
				return {
					level: 'warn',
					text: `Delegated with redirect to ${redirect}: the actual policy is defined there.`
				};
			return {
				level: 'warn',
				text: 'No "all" rule: the policy for unlisted servers is unclear (treated as neutral).'
			};
		}
	}
}

/**
 * @param {{ policy: string | null, percent: number } | null} dmarc
 * @returns {Verdict}
 */
export function dmarcVerdict(dmarc) {
	if (!dmarc)
		return {
			level: 'bad',
			text: 'No DMARC record: receivers get no instructions for spoofed mail from this domain.'
		};
	const partial = dmarc.percent < 100 ? ` (applied to ${dmarc.percent}% of mail)` : '';
	switch (dmarc.policy) {
		case 'reject':
			return { level: 'good', text: `Reject: spoofed mail should be refused${partial}.` };
		case 'quarantine':
			return { level: 'warn', text: `Quarantine: spoofed mail should go to spam${partial}.` };
		case 'none':
			return {
				level: 'warn',
				text: 'Monitoring only (p=none): spoofed mail is reported but still delivered.'
			};
		default:
			return { level: 'bad', text: 'The DMARC record has no valid policy (p=).' };
	}
}

/**
 * Looks up MX, address fallback, SPF and DMARC for a mail domain.
 * @param {string} domain
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function lookupMailServer(domain, options = {}) {
	const [mxAnswers, auth] = await Promise.all([
		resolveDns(domain, 'MX', options),
		lookupEmailAuth(domain, options)
	]);
	const mx = parseMx(mxAnswers);
	let hasAddress = false;
	if (!mx.length) {
		const [a, aaaa] = await Promise.all([
			resolveDns(domain, 'A', options),
			resolveDns(domain, 'AAAA', options)
		]);
		hasAddress = a.length > 0 || aaaa.length > 0;
	}
	return {
		mx,
		hasAddress,
		spf: auth.spf,
		dmarc: auth.dmarc,
		verdicts: {
			mx: mxVerdict(mx, hasAddress),
			spf: spfVerdict(auth.spf),
			dmarc: dmarcVerdict(auth.dmarc)
		}
	};
}
