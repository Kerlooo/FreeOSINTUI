import { FetchError } from '$lib/net.js';

/**
 * Minimal client for the unauthenticated GitHub REST API (CORS enabled, 60 requests per
 * hour per IP). Every response carries the rate-limit headers, which are returned so the
 * page can show how many requests are left.
 */

export const GITHUB_API = 'https://api.github.com';

/**
 * @typedef {{ limit: number, remaining: number, reset: Date | null }} RateLimit
 */

/**
 * Reads the X-RateLimit-* headers, or null when they are missing.
 * @param {Headers} headers
 * @returns {RateLimit | null}
 */
export function parseRateLimit(headers) {
	const limit = headers.get('x-ratelimit-limit');
	const remaining = headers.get('x-ratelimit-remaining');
	if (limit === null || remaining === null) return null;
	const reset = Number(headers.get('x-ratelimit-reset'));
	return {
		limit: Number(limit),
		remaining: Number(remaining),
		reset: Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : null
	};
}

/**
 * @param {Date | null} date
 */
export function formatResetTime(date) {
	if (!date) return 'within an hour';
	const minutes = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 60000));
	const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	return `at ${time} (in ${minutes} min)`;
}

/** Error thrown when the hourly quota is used up. */
export class RateLimitError extends FetchError {
	/**
	 * @param {RateLimit | null} rate
	 * @param {number} status
	 */
	constructor(rate, status) {
		super(
			`GitHub API rate limit reached (${rate?.limit ?? 60} requests per hour per IP without login). It resets ${formatResetTime(rate?.reset ?? null)}.`,
			status
		);
		this.name = 'RateLimitError';
		this.rate = rate;
	}
}

/**
 * Calls a GitHub API path and returns the parsed JSON with the rate-limit state.
 * `data` is null when the status is 404 and `allowNotFound` is set, or when the status
 * is listed in `emptyStatuses` (e.g. 409 for an empty repository).
 * @param {string} path path starting with "/", e.g. "/users/octocat"
 * @param {{ signal?: AbortSignal, timeoutMs?: number, allowNotFound?: boolean, emptyStatuses?: number[], fetch?: typeof fetch }} [options]
 * @returns {Promise<{ data: any, rate: RateLimit | null, status: number }>}
 */
export async function githubFetch(path, options = {}) {
	const {
		signal,
		timeoutMs = 15000,
		allowNotFound = false,
		emptyStatuses = [],
		fetch: fetchFn = fetch
	} = options;
	const timeout = AbortSignal.timeout(timeoutMs);
	const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

	let response;
	try {
		response = await fetchFn(`${GITHUB_API}${path}`, {
			signal: combined,
			headers: { accept: 'application/vnd.github+json' }
		});
	} catch (error) {
		if (signal?.aborted) throw error;
		if (timeout.aborted) throw new FetchError('api.github.com did not answer in time.');
		throw new FetchError(
			'Could not reach api.github.com (network error or blocked by the browser).'
		);
	}

	const rate = parseRateLimit(response.headers);
	const { status } = response;

	if (status === 403 || status === 429) {
		let message = '';
		try {
			message = (await response.json())?.message ?? '';
		} catch {
			// Body is not JSON; the headers are enough.
		}
		if (rate?.remaining === 0 || /rate limit/i.test(message))
			throw new RateLimitError(rate, status);
		throw new FetchError(`GitHub refused the request (HTTP ${status}).`, status);
	}
	if (status === 404 && allowNotFound) return { data: null, rate, status };
	if (emptyStatuses.includes(status)) return { data: null, rate, status };
	if (!response.ok) throw new FetchError(`api.github.com answered with HTTP ${status}.`, status);

	try {
		return { data: await response.json(), rate, status };
	} catch {
		throw new FetchError('api.github.com returned an invalid response.', status);
	}
}

/**
 * Cleans a GitHub username typed by the user: accepts "@user" and profile URLs.
 * @param {string} input
 * @returns {{ value: string, error: null } | { value: null, error: string }}
 */
export function normalizeUsername(input) {
	let value = input.trim().replace(/^@/, '');
	const url = value.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]+)/i);
	if (url) value = url[1];
	if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)) {
		return {
			value: null,
			error:
				'Invalid GitHub username: up to 39 letters, digits or single hyphens, not starting or ending with a hyphen.'
		};
	}
	return { value, error: null };
}
