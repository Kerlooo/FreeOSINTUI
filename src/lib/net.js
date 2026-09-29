import { t } from '$lib/i18n/i18n.svelte.js';

/** Error thrown by fetchJson, with a message that can be shown in the UI. */
export class FetchError extends Error {
	/**
	 * @param {string} message
	 * @param {number | null} [status]
	 */
	constructor(message, status = null) {
		super(message);
		this.name = 'FetchError';
		this.status = status;
	}
}

/**
 * Shared request logic: timeout, abort, rate-limit and HTTP error messages.
 * `parse` reads the body of a successful response.
 * @template T
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeoutMs?: number, headers?: Record<string, string>, allowNotFound?: boolean, fetch?: typeof fetch }} options
 * @param {string} accept
 * @param {(response: Response) => Promise<T>} parse
 * @returns {Promise<T | null>}
 */
async function request(url, options, accept, parse) {
	const {
		signal,
		timeoutMs = 15000,
		headers,
		allowNotFound = false,
		fetch: fetchFn = fetch
	} = options;
	const timeout = AbortSignal.timeout(timeoutMs);
	const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
	const host = new URL(url).host;

	let response;
	try {
		response = await fetchFn(url, { signal: combined, headers: { accept, ...headers } });
	} catch (error) {
		if (signal?.aborted) throw error;
		if (timeout.aborted) throw new FetchError(t('common.timeout', { host }));
		throw new FetchError(t('common.networkError', { host }));
	}

	if (response.status === 404 && allowNotFound) return null;
	if (response.status === 429) {
		throw new FetchError(t('common.rateLimited', { host }), 429);
	}
	if (!response.ok) {
		throw new FetchError(t('common.httpError', { host, status: response.status }), response.status);
	}

	try {
		return await parse(response);
	} catch {
		throw new FetchError(t('common.invalidResponse', { host }), response.status);
	}
}

/**
 * Fetches a JSON document from a third-party API.
 * Returns `null` on 404 when `allowNotFound` is set, since many lookups use 404 for "no result".
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeoutMs?: number, headers?: Record<string, string>, allowNotFound?: boolean, fetch?: typeof fetch }} [options]
 */
export function fetchJson(url, options = {}) {
	return request(url, options, 'application/json', (response) => response.json());
}

/**
 * Fetches a plain-text document, with the same options and errors as `fetchJson`.
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeoutMs?: number, headers?: Record<string, string>, allowNotFound?: boolean, fetch?: typeof fetch }} [options]
 * @returns {Promise<string | null>}
 */
export function fetchText(url, options = {}) {
	return request(url, options, 'text/plain', (response) => response.text());
}
