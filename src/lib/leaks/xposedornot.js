import { FetchError, fetchJson } from '$lib/net.js';
import { t } from '$lib/i18n/i18n.svelte.js';

const API = 'https://api.xposedornot.com/v1';

/**
 * Reads the breach names from a check-email response.
 * Found: `{ "breaches": [["A", "B"]] }`; not found: `{ "Error": "Not found" }` (HTTP 200 or 404).
 * @param {any} json
 * @returns {string[]}
 */
export function parseCheckEmail(json) {
	if (!json || !Array.isArray(json.breaches)) return [];
	return [...new Set(json.breaches.flat().filter((name) => typeof name === 'string' && name))];
}

/**
 * @typedef {{ id: string, date: string | null, domain: string | null, industry: string | null,
 *   records: number | null, exposedData: string[], description: string | null, verified: boolean | null }} Breach
 */

/**
 * Indexes the breach catalog by lowercase breach ID.
 * @param {any} json
 * @returns {Map<string, Breach>}
 */
export function parseBreachCatalog(json) {
	const list = Array.isArray(json?.exposedBreaches) ? json.exposedBreaches : [];
	return new Map(
		list
			.filter((/** @type {any} */ item) => item?.breachID)
			.map((/** @type {any} */ item) => [
				String(item.breachID).toLowerCase(),
				{
					id: String(item.breachID),
					date: item.breachedDate || null,
					domain: item.domain || null,
					industry: item.industry || null,
					records: typeof item.exposedRecords === 'number' ? item.exposedRecords : null,
					exposedData: Array.isArray(item.exposedData) ? item.exposedData : [],
					description: item.exposureDescription || null,
					verified: typeof item.verified === 'boolean' ? item.verified : null
				}
			])
	);
}

/**
 * Joins breach names with the catalog and sorts by breach date, newest first
 * (breaches missing from the catalog go last).
 * @param {string[]} names
 * @param {Map<string, Breach>} catalog
 * @returns {Breach[]}
 */
export function enrichBreaches(names, catalog) {
	return names
		.map(
			(name) =>
				catalog.get(name.toLowerCase()) ?? {
					id: name,
					date: null,
					domain: null,
					industry: null,
					records: null,
					exposedData: [],
					description: null,
					verified: null
				}
		)
		.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id));
}

/**
 * XposedOrNot sits behind Cloudflare: when it rate limits, the 429 page has no CORS headers,
 * so the browser only sees a network error. Explain that instead of a generic message.
 * @param {unknown} error
 */
function explainError(error) {
	const timeoutMessage = t('common.timeout', { host: new URL(API).host });
	if (error instanceof FetchError && error.status === null && error.message !== timeoutMessage)
		return new FetchError(t('leaks.email.rateLimited'));
	return error;
}

/** @type {Promise<Map<string, Breach>> | null} */
let catalogCache = null;

/**
 * Downloads the breach catalog once per session. A failed download is not cached.
 * @param {{ fetch?: typeof fetch }} [options]
 */
export function loadBreachCatalog(options = {}) {
	if (!catalogCache) {
		catalogCache = fetchJson(`${API}/breaches`, { ...options, timeoutMs: 30000 })
			.then(parseBreachCatalog)
			.catch((error) => {
				catalogCache = null;
				throw explainError(error);
			});
	}
	return catalogCache;
}

/**
 * Lists the known breaches that include an email address, with breach metadata only.
 * @param {string} email a validated, normalized address
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function checkEmailBreaches(email, options = {}) {
	const { signal, ...rest } = options;
	let json;
	try {
		json = await fetchJson(`${API}/check-email/${encodeURIComponent(email)}`, {
			...options,
			allowNotFound: true
		});
	} catch (error) {
		throw explainError(error);
	}
	const names = parseCheckEmail(json);
	if (!names.length) return [];
	const catalog = await loadBreachCatalog(rest);
	signal?.throwIfAborted();
	return enrichBreaches(names, catalog);
}

/** Clears the in-memory catalog cache (for tests). */
export function resetBreachCatalogCache() {
	catalogCache = null;
}
