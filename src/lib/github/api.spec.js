import { describe, expect, it } from 'vitest';
import { githubFetch, normalizeUsername, parseRateLimit, RateLimitError } from './api.js';
import { fetchCommitEmails } from './lookup.js';

const RATE_HEADERS = {
	'x-ratelimit-limit': '60',
	'x-ratelimit-remaining': '42',
	'x-ratelimit-reset': '1790676613'
};

/**
 * @param {number} status
 * @param {unknown} body
 * @param {Record<string, string>} [headers]
 */
const respond = (status, body, headers = RATE_HEADERS) =>
	new Response(body === undefined ? null : JSON.stringify(body), { status, headers });

describe('parseRateLimit', () => {
	it('reads the rate limit headers', () => {
		expect(parseRateLimit(new Headers(RATE_HEADERS))).toEqual({
			limit: 60,
			remaining: 42,
			reset: new Date(1790676613 * 1000)
		});
		expect(parseRateLimit(new Headers())).toBeNull();
	});
});

describe('githubFetch', () => {
	it('returns data and rate limit', async () => {
		const result = await githubFetch('/users/alice', {
			fetch: async (url) => {
				expect(url).toBe('https://api.github.com/users/alice');
				return respond(200, { login: 'alice' });
			}
		});
		expect(result.data).toEqual({ login: 'alice' });
		expect(result.rate?.remaining).toBe(42);
	});

	it('returns null for 404 when allowed and for listed empty statuses', async () => {
		const notFound = await githubFetch('/users/nobody', {
			allowNotFound: true,
			fetch: async () => respond(404, { message: 'Not Found' })
		});
		expect(notFound.data).toBeNull();
		const empty = await githubFetch('/repos/a/b/commits', {
			emptyStatuses: [409],
			fetch: async () => respond(409, { message: 'Git Repository is empty.' })
		});
		expect(empty.data).toBeNull();
	});

	it('throws a RateLimitError with the reset time when the quota is used up', async () => {
		const promise = githubFetch('/users/alice', {
			fetch: async () =>
				respond(
					403,
					{ message: 'API rate limit exceeded for 1.2.3.4.' },
					{ ...RATE_HEADERS, 'x-ratelimit-remaining': '0' }
				)
		});
		await expect(promise).rejects.toBeInstanceOf(RateLimitError);
		await expect(promise).rejects.toThrow(/rate limit reached .* resets at/);
	});

	it('reports other errors', async () => {
		await expect(
			githubFetch('/users/alice', { fetch: async () => respond(403, { message: 'Forbidden' }) })
		).rejects.toThrow('GitHub refused the request (HTTP 403).');
		await expect(
			githubFetch('/users/alice', { fetch: async () => respond(500, {}) })
		).rejects.toThrow('HTTP 500');
		await expect(
			githubFetch('/users/alice', {
				fetch: async () => {
					throw new TypeError('Failed to fetch');
				}
			})
		).rejects.toThrow(/Could not reach api.github.com/);
	});
});

describe('fetchCommitEmails', () => {
	it('scans up to three repositories and skips empty ones', async () => {
		const repos = ['a', 'b', 'c', 'd'].map((name, i) => ({
			full_name: `alice/${name}`,
			fork: false,
			size: 1,
			pushed_at: `2024-0${i + 1}-01T00:00:00Z`
		}));
		/** @type {string[]} */
		const calls = [];
		let lastRate = null;
		const result = await fetchCommitEmails('alice', repos, {
			onRate: (rate) => (lastRate = rate),
			fetch: async (url) => {
				calls.push(String(url));
				if (String(url).includes('/alice/d/'))
					return respond(409, { message: 'Git Repository is empty.' });
				return respond(200, [
					{
						html_url: 'x',
						commit: {
							author: { name: 'Alice', email: 'alice@example.com', date: '2024' },
							committer: {}
						},
						author: { login: 'alice' },
						committer: null
					}
				]);
			}
		});
		expect(calls).toHaveLength(3);
		expect(result.scanned).toEqual(['alice/d', 'alice/c', 'alice/b']);
		expect(result.emails).toHaveLength(1);
		expect(result.emails[0]).toMatchObject({
			email: 'alice@example.com',
			commits: 2,
			linked: true
		});
		expect(lastRate?.remaining).toBe(42);
	});
});

describe('normalizeUsername', () => {
	it('accepts usernames, @handles and profile URLs', () => {
		expect(normalizeUsername(' octocat ')).toEqual({ value: 'octocat', error: null });
		expect(normalizeUsername('@octo-cat')).toEqual({ value: 'octo-cat', error: null });
		expect(normalizeUsername('https://github.com/torvalds?tab=repositories').value).toBe(
			'torvalds'
		);
	});

	it('rejects invalid usernames', () => {
		for (const bad of ['-bad', 'bad-', 'a--b', 'with space', 'a'.repeat(40), '']) {
			expect(normalizeUsername(bad).error).toBeTruthy();
		}
	});
});
