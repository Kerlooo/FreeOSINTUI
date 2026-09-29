import { resolveDns } from './doh.js';

const SPF_QUALIFIERS = { '+': 'pass', '-': 'fail', '~': 'softfail', '?': 'neutral' };

/**
 * Parses an SPF record ("v=spf1 ...") into its mechanisms and the policy of `all`.
 * @param {string} record
 */
export function parseSpf(record) {
	const terms = record.trim().split(/\s+/).slice(1);
	const mechanisms = terms.map((term) => {
		const qualifier = SPF_QUALIFIERS[term[0]] ? term[0] : '+';
		const body = SPF_QUALIFIERS[term[0]] ? term.slice(1) : term;
		const [name, ...rest] = body.split(/[:=]/);
		return {
			qualifier: SPF_QUALIFIERS[qualifier],
			name: name.toLowerCase(),
			value: rest.join(':') || null
		};
	});
	const all = mechanisms.find((m) => m.name === 'all');
	return {
		record,
		mechanisms,
		includes: mechanisms.filter((m) => m.name === 'include').map((m) => m.value),
		allPolicy: all ? all.qualifier : null
	};
}

/**
 * Parses a DMARC record ("v=DMARC1; p=...") into its tags.
 * @param {string} record
 */
export function parseDmarc(record) {
	const tags = Object.fromEntries(
		record
			.split(';')
			.map((part) => part.trim())
			.filter(Boolean)
			.map((part) => {
				const [key, ...value] = part.split('=');
				return [key.trim().toLowerCase(), value.join('=').trim()];
			})
	);
	return {
		record,
		tags,
		policy: tags.p ?? null,
		subdomainPolicy: tags.sp ?? null,
		percent: tags.pct ? Number(tags.pct) : 100,
		reports: tags.rua ? tags.rua.split(',').map((uri) => uri.trim()) : []
	};
}

/**
 * Looks up the SPF and DMARC records of a domain. Each is `null` when missing.
 * @param {string} domain
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function lookupEmailAuth(domain, options = {}) {
	const [txt, dmarcTxt] = await Promise.all([
		resolveDns(domain, 'TXT', options),
		resolveDns(`_dmarc.${domain}`, 'TXT', options)
	]);
	const spf = txt.find((r) => /^v=spf1(\s|$)/i.test(r.data));
	const dmarc = dmarcTxt.find((r) => /^v=DMARC1/i.test(r.data));
	return { spf: spf ? parseSpf(spf.data) : null, dmarc: dmarc ? parseDmarc(dmarc.data) : null };
}
