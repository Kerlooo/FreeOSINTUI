import { resolveDns } from '$lib/dns/doh.js';

/** Record types shown by the Domain Analyzer, in display order. */
export const DNS_RECORD_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CAA', 'SOA'];

/**
 * Labels a "null MX" (RFC 7505: priority 0, host "."), which resolveDns returns as "0".
 * @param {string} data
 */
export function describeMx(data) {
	return /^\d+\s*$/.test(data) ? `${data.trim()} . (null MX: the domain accepts no email)` : data;
}

/**
 * Resolves every record type in parallel. A failing type does not fail the others.
 * @param {string} domain
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 * @returns {Promise<{ type: string, records: { name: string, type: string, ttl: number, data: string }[], error: string | null }[]>}
 */
export async function lookupDnsRecords(domain, options = {}) {
	const results = await Promise.allSettled(
		DNS_RECORD_TYPES.map((type) => resolveDns(domain, type, options))
	);
	if (options.signal?.aborted) throw options.signal.reason;
	return DNS_RECORD_TYPES.map((type, index) => {
		const result = results[index];
		if (result.status === 'fulfilled') {
			const records = [...result.value]
				.map((record) => (type === 'MX' ? { ...record, data: describeMx(record.data) } : record))
				.sort((a, b) => a.data.localeCompare(b.data, undefined, { numeric: true }));
			return { type, records, error: null };
		}
		return { type, records: [], error: result.reason?.message ?? 'Lookup failed.' };
	});
}
