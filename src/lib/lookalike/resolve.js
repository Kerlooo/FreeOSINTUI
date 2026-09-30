import { resolveDns } from '$lib/dns/doh.js';
import { runPool } from '$lib/username/pool.js';

/** Maximum number of lookalikes resolved in one run (each costs 2 to 4 DNS queries). */
export const RESOLVE_LIMIT = 300;

/** @typedef {{ a: string[], aaaa: string[], mx: string[], ns: string[], registered: boolean }} DnsRecords */

/**
 * Extracts the mail hosts of MX answers, dropping the "null MX" (`0 .`) that says a domain
 * accepts no mail.
 * @param {{ data: string }[]} answers
 */
export function mailHosts(answers) {
	return answers
		.map((answer) => answer.data.trim().split(/\s+/)[1]?.replace(/\.$/, '') ?? '')
		.filter(Boolean);
}

/**
 * Resolves one lookalike. A and NS come first; a name with neither is reported as not
 * registered without spending queries on MX and AAAA.
 * @param {string} domain ASCII (Punycode) name
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 * @returns {Promise<DnsRecords>}
 */
export async function resolveLookalike(domain, options = {}) {
	const values = (/** @type {{ data: string }[]} */ answers) =>
		answers.map((answer) => answer.data);
	const [a, ns] = await Promise.all([
		resolveDns(domain, 'A', options).then(values),
		resolveDns(domain, 'NS', options).then(values)
	]);
	if (!a.length && !ns.length) return { a, aaaa: [], mx: [], ns, registered: false };
	const [aaaa, mx] = await Promise.all([
		resolveDns(domain, 'AAAA', options).then(values),
		resolveDns(domain, 'MX', options).then(mailHosts)
	]);
	return { a, aaaa, mx, ns, registered: true };
}

/**
 * Resolves many lookalikes with a bounded pool, reporting each result as it arrives.
 * @param {string[]} domains
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch, concurrency?: number, onResult: (domain: string, records: DnsRecords) => void, onError: (domain: string, error: unknown) => void }} options
 */
export function resolveAll(domains, { signal, fetch, concurrency = 8, onResult, onError }) {
	return runPool(domains, (domain) => resolveLookalike(domain, { signal, fetch }), {
		concurrency,
		signal,
		onResult: (records, domain) => onResult(domain, records),
		onError: (error, domain) => onError(domain, error)
	});
}
