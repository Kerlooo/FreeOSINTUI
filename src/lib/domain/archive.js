import { fetchJson } from '$lib/net.js';

/**
 * Converts a Wayback timestamp (YYYYMMDDhhmmss) into an ISO date-time string.
 * @param {string} timestamp
 */
export function waybackDate(timestamp) {
	const m = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/.exec(timestamp ?? '');
	if (!m) return null;
	const [, y, mo, d, h = '00', mi = '00', s = '00'] = m;
	return `${y}-${mo}-${d} ${h}:${mi}:${s} UTC`;
}

/**
 * Link to every capture of the domain in the Wayback Machine.
 * @param {string} domain
 */
export function waybackHistoryUrl(domain) {
	return `https://web.archive.org/web/*/${domain}/*`;
}

/**
 * Reads the closest snapshot from a Wayback "available" API answer.
 * @param {any} json
 * @returns {{ url: string, date: string | null, status: string | null } | null}
 */
export function parseWaybackAvailable(json) {
	const closest = json?.archived_snapshots?.closest;
	if (!closest?.available || !closest.url) return null;
	return {
		url: closest.url.replace(/^http:\/\//, 'https://'),
		date: waybackDate(closest.timestamp),
		status: closest.status ?? null
	};
}

/**
 * Looks up the closest Wayback Machine snapshot of a domain.
 * @param {string} domain
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function lookupWayback(domain, options = {}) {
	const json = await fetchJson(
		`https://archive.org/wayback/available?url=${encodeURIComponent(domain)}`,
		{ ...options, timeoutMs: 20000 }
	);
	return { snapshot: parseWaybackAvailable(json), historyUrl: waybackHistoryUrl(domain) };
}
