import { TARGET_TYPES } from '$lib/dorks/targets.js';

const domainTarget = TARGET_TYPES.find((type) => type.id === 'domain');

/**
 * Cleans a pasted domain or URL (scheme, path, "www." and case) and validates it.
 * @param {string} raw
 * @returns {{ value: string, error?: undefined } | { error: string, value?: undefined }}
 */
export function normalizeDomain(raw) {
	const result = domainTarget.normalize(raw.replace(/\.$/, ''));
	return result.error ? { error: result.error } : { value: result.value };
}

/**
 * Formats an ISO date as YYYY-MM-DD, or returns null.
 * @param {string | null | undefined} iso
 */
export function formatDate(iso) {
	if (!iso) return null;
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? iso : date.toISOString().slice(0, 10);
}
