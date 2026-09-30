import { describe, expect, it } from 'vitest';
import { expandShortUrl, lookupUrlWayback } from './remote.js';
import { isShortenerUrl } from './shorteners.js';

/** @param {Record<string, any>} answers keyed by the `url` query parameter */
function fakeBackend(answers) {
	/** @type {string[]} */
	const calls = [];
	/** @type {typeof fetch} */
	const fetchFn = async (input) => {
		const url = new URL(String(input), 'http://localhost');
		const target = url.searchParams.get('url') ?? '';
		calls.push(target);
		return new Response(JSON.stringify(answers[target]), {
			headers: { 'content-type': 'application/json' }
		});
	};
	return { fetchFn, calls };
}

describe('isShortenerUrl', () => {
	it('accepts only allow-listed hosts without tricks', () => {
		expect(isShortenerUrl('https://bit.ly/abc')).toBe(true);
		expect(isShortenerUrl('https://bit.ly.evil.com/abc')).toBe(false);
		expect(isShortenerUrl('https://bit.ly@evil.com/')).toBe(false);
		expect(isShortenerUrl('https://evil.com/#bit.ly')).toBe(false);
		expect(isShortenerUrl('https://bit.ly:8080/')).toBe(false);
		expect(isShortenerUrl('ftp://bit.ly/')).toBe(false);
		expect(isShortenerUrl('nope')).toBe(false);
	});
});

describe('expandShortUrl', () => {
	it('follows shortener hops and stops at the first normal URL', async () => {
		const { fetchFn, calls } = fakeBackend({
			'https://t.co/a': { url: 'https://t.co/a', status: 301, location: 'https://bit.ly/b' },
			'https://bit.ly/b': { url: 'https://bit.ly/b', status: 301, location: 'https://evil.com/x' }
		});
		const result = await expandShortUrl('https://t.co/a', { fetch: fetchFn });
		expect(calls).toEqual(['https://t.co/a', 'https://bit.ly/b']);
		expect(result).toMatchObject({ final: 'https://evil.com/x', truncated: false });
		expect(result.hops).toHaveLength(2);
	});

	it('stops when there is no Location', async () => {
		const { fetchFn } = fakeBackend({
			'https://bit.ly/x': { url: 'https://bit.ly/x', status: 404, location: null }
		});
		expect(await expandShortUrl('https://bit.ly/x', { fetch: fetchFn })).toMatchObject({
			final: null,
			hops: [{ status: 404 }]
		});
	});

	it('stops after five hops and on loops', async () => {
		/** @type {Record<string, any>} */
		const answers = {};
		for (let i = 0; i < 10; i++) {
			answers[`https://bit.ly/${i}`] = {
				url: `https://bit.ly/${i}`,
				status: 301,
				location: `https://bit.ly/${i + 1}`
			};
		}
		const { fetchFn, calls } = fakeBackend(answers);
		const result = await expandShortUrl('https://bit.ly/0', { fetch: fetchFn });
		expect(calls).toHaveLength(5);
		expect(result.truncated).toBe(true);

		const loop = fakeBackend({
			'https://bit.ly/a': { url: 'https://bit.ly/a', status: 301, location: 'https://bit.ly/a' }
		});
		await expandShortUrl('https://bit.ly/a', { fetch: loop.fetchFn });
		expect(loop.calls).toHaveLength(1);
	});

	it('never calls the backend for other hosts', async () => {
		const { fetchFn, calls } = fakeBackend({});
		expect(await expandShortUrl('https://evil.com/', { fetch: fetchFn })).toEqual({
			hops: [],
			final: null,
			truncated: false
		});
		expect(calls).toEqual([]);
	});
});

describe('lookupUrlWayback', () => {
	it('queries archive.org for the exact URL', async () => {
		/** @type {string[]} */
		const urls = [];
		/** @type {typeof fetch} */
		const fetchFn = async (input) => {
			urls.push(String(input));
			return new Response(JSON.stringify({ archived_snapshots: {} }), {
				headers: { 'content-type': 'application/json' }
			});
		};
		const result = await lookupUrlWayback('https://example.com/a?b=1', { fetch: fetchFn });
		expect(urls[0]).toBe(
			'https://archive.org/wayback/available?url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1'
		);
		expect(result.snapshot).toBeNull();
	});
});
