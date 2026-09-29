import { fetchText } from '$lib/net.js';

export const DISPOSABLE_LIST_URL =
	'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf';

export const DISPOSABLE_LIST_SOURCE =
	'https://github.com/disposable-email-domains/disposable-email-domains';

/**
 * Parses the blocklist (one domain per line, `#` comments) into a Set.
 * @param {string} text
 */
export function parseBlocklist(text) {
	return new Set(
		text
			.split(/\r?\n/)
			.map((line) => line.trim().toLowerCase())
			.filter((line) => line && !line.startsWith('#'))
	);
}

/**
 * Returns the blocklisted entry matching the domain or one of its parent domains, or `null`.
 * @param {string} domain
 * @param {Set<string>} blocklist
 */
export function findDisposableMatch(domain, blocklist) {
	const labels = domain.toLowerCase().split('.');
	for (let i = 0; i < labels.length - 1; i++) {
		const candidate = labels.slice(i).join('.');
		if (blocklist.has(candidate)) return candidate;
	}
	return null;
}

/** @type {Promise<Set<string>> | null} */
let cached = null;

/**
 * Downloads the blocklist once per session. A failed download is not cached.
 * @param {{ fetch?: typeof fetch }} [options]
 */
export function loadDisposableList(options = {}) {
	if (!cached) {
		cached = fetchText(DISPOSABLE_LIST_URL, { ...options, timeoutMs: 20000 })
			.then(parseBlocklist)
			.catch((error) => {
				cached = null;
				throw error;
			});
	}
	return cached;
}

/**
 * Checks whether a domain belongs to a disposable email service.
 * @param {string} domain
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function checkDisposable(domain, options = {}) {
	const { signal, ...rest } = options;
	const list = await loadDisposableList(rest);
	signal?.throwIfAborted();
	const match = findDisposableMatch(domain, list);
	return { disposable: match !== null, match, listSize: list.size };
}

/** Clears the in-memory cache (for tests). */
export function resetDisposableCache() {
	cached = null;
}
