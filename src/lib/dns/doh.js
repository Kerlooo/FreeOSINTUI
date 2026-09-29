import { fetchJson } from '$lib/net.js';

/** DNS record types by numeric code, as returned by DNS-over-HTTPS JSON APIs. */
export const RECORD_TYPES = {
	1: 'A',
	2: 'NS',
	5: 'CNAME',
	6: 'SOA',
	12: 'PTR',
	15: 'MX',
	16: 'TXT',
	28: 'AAAA',
	257: 'CAA'
};

/**
 * Resolves a DNS record with Google's DNS-over-HTTPS JSON API (CORS-enabled).
 * Returns the answers of the requested type, `[]` when there are none.
 * @param {string} name
 * @param {string} type e.g. 'A', 'MX', 'TXT', 'PTR'
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 * @returns {Promise<{ name: string, type: string, ttl: number, data: string }[]>}
 */
export async function resolveDns(name, type, options = {}) {
	const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
	const json = await fetchJson(url, options);
	// Status 3 is NXDOMAIN: the name does not exist, which is a valid empty result.
	if (json.Status !== 0 && json.Status !== 3)
		throw new Error(`DNS lookup failed (status ${json.Status}).`);
	return (json.Answer ?? [])
		.map((answer) => ({
			name: answer.name.replace(/\.$/, ''),
			type: RECORD_TYPES[answer.type] ?? String(answer.type),
			ttl: answer.TTL,
			// TXT records come quoted and may be split into several strings.
			data:
				answer.type === 16
					? answer.data.replace(/^"|"$/g, '').replace(/"\s*"/g, '')
					: answer.data.replace(/\.$/, '')
		}))
		.filter((answer) => answer.type === type);
}

/**
 * Builds the reverse-DNS name for an IPv4 or IPv6 address.
 * @param {string} ip
 */
export function reverseName(ip) {
	if (ip.includes(':')) {
		const [head, tail = ''] = ip.split('::');
		const headParts = head ? head.split(':') : [];
		const tailParts = tail ? tail.split(':') : [];
		const missing = 8 - headParts.length - tailParts.length;
		const groups = [
			...headParts,
			...Array(ip.includes('::') ? missing : 0).fill('0'),
			...tailParts
		];
		const nibbles = groups.map((group) => group.padStart(4, '0')).join('');
		return `${[...nibbles].reverse().join('.')}.ip6.arpa`;
	}
	return `${ip.split('.').reverse().join('.')}.in-addr.arpa`;
}
