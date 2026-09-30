import { normalizeDomain } from '$lib/domain/normalize.js';

/**
 * Cleans the target like the Domain Analyzer does (scheme, path, "www.", case).
 * A leading "*." (e.g. "*.example.com") is accepted and turns on subdomains.
 * @param {string} raw
 * @returns {{ value: string, subdomains: boolean, error?: undefined } | { error: string, value?: undefined, subdomains?: undefined }}
 */
export function normalizeFootprintDomain(raw) {
	const trimmed = raw.trim();
	const wildcard = trimmed.startsWith('*.');
	const result = normalizeDomain(wildcard ? trimmed.slice(2) : trimmed);
	if (result.error) return { error: result.error };
	return { value: result.value, subdomains: wildcard };
}

/**
 * CDX url pattern shared by Common Crawl and the Wayback Machine:
 * "example.com/*" (the domain only, www included) or "*.example.com" (every subdomain too).
 * @param {string} domain
 * @param {boolean} subdomains
 */
export function cdxPattern(domain, subdomains) {
	return subdomains ? `*.${domain}` : `${domain}/*`;
}
