/**
 * Remote lookups of the URL Analyzer. None of them opens the analyzed URL:
 * - Wayback Machine availability (browser, archive.org has CORS);
 * - urlscan.io existing scans, URLhaus and the unshortener (backend: no CORS / secret key).
 */

import { apiGet } from '$lib/api.js';
import { fetchJson } from '$lib/net.js';
import { parseWaybackAvailable } from '$lib/domain/archive.js';
import { MAX_EXPAND_HOPS, isShortenerUrl } from './shorteners.js';

/**
 * @typedef {{ signal?: AbortSignal, fetch?: typeof fetch }} Options
 */

/**
 * Closest Wayback Machine snapshot of this exact URL.
 * @param {string} url
 * @param {Options} [options]
 */
export async function lookupUrlWayback(url, options = {}) {
	const json = await fetchJson(
		`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
		{ ...options, timeoutMs: 20000 }
	);
	return {
		snapshot: parseWaybackAvailable(json),
		historyUrl: `https://web.archive.org/web/*/${url}`
	};
}

/**
 * Existing public urlscan.io scans of a host (no new scan is submitted).
 * @param {string} host ASCII hostname or IPv4 address
 * @param {Options} [options]
 */
export function lookupUrlscan(host, options = {}) {
	return apiGet('/api/url/urlscan', { params: { host }, ...options });
}

/**
 * URLhaus (abuse.ch) entry for the URL. `{ configured: false }` when the backend has no key.
 * @param {string} url
 * @param {Options} [options]
 */
export function lookupUrlhaus(url, options = {}) {
	return apiGet('/api/url/urlhaus', { params: { url }, ...options });
}

/**
 * Expands a short link hop by hop through the backend, only while each hop is an
 * allow-listed shortener, for at most MAX_EXPAND_HOPS requests.
 * @param {string} url
 * @param {Options} [options]
 * @returns {Promise<{ hops: { url: string, status: number, location: string | null }[], final: string | null, truncated: boolean }>}
 */
export async function expandShortUrl(url, options = {}) {
	/** @type {{ url: string, status: number, location: string | null }[]} */
	const hops = [];
	let current = url;
	while (hops.length < MAX_EXPAND_HOPS && isShortenerUrl(current)) {
		const data = await apiGet('/api/url/expand', { params: { url: current }, ...options });
		hops.push({ url: data.url, status: data.status, location: data.location ?? null });
		if (!data.location || hops.some((h) => h.url === data.location)) break;
		current = data.location;
	}
	const last = hops.at(-1);
	return {
		hops,
		final: last?.location ?? null,
		truncated: Boolean(
			last?.location && isShortenerUrl(last.location) && hops.length >= MAX_EXPAND_HOPS
		)
	};
}
