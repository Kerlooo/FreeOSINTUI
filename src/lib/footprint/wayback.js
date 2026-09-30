import { apiGet } from '$lib/api.js';

/** Most captures the backend returns (it caps the limit at the same value). */
export const WAYBACK_LIMIT = 5000;

/**
 * Keeps the well-formed records of the backend answer, in the shared capture shape.
 * @param {any} json
 * @returns {{ records: import('./commoncrawl.js').CaptureRecord[], truncated: boolean }}
 */
export function parseWaybackAnswer(json) {
	const rows = Array.isArray(json?.records) ? json.records : [];
	const records = rows
		.filter((r) => typeof r?.url === 'string' && /^\d{14}$/.test(r.timestamp ?? ''))
		.map((r) => ({
			timestamp: r.timestamp,
			url: r.url,
			mime: typeof r.mime === 'string' ? r.mime : null,
			status: typeof r.status === 'string' ? r.status : null
		}));
	return { records, truncated: Boolean(json?.truncated) };
}

/**
 * Lists the URLs archived by the Wayback Machine through the backend (its CDX API has no CORS).
 * The backend queries web.archive.org only, one first capture per URL (collapse=urlkey).
 * @param {string} domain
 * @param {{ subdomains?: boolean, limit?: number, signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function lookupWaybackUrls(domain, options = {}) {
	const { subdomains = false, limit = WAYBACK_LIMIT, signal, fetch } = options;
	const json = await apiGet('/api/footprint/wayback', {
		params: { domain, subdomains: String(subdomains), limit: String(limit) },
		signal,
		fetch,
		timeoutMs: 45000
	});
	return parseWaybackAnswer(json);
}
