import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	checkEmailBreaches,
	enrichBreaches,
	parseBreachCatalog,
	parseCheckEmail,
	resetBreachCatalogCache
} from './xposedornot.js';

const CATALOG = {
	status: 'success',
	exposedBreaches: [
		{
			breachID: 'Adobe',
			breachedDate: '2013-10-04T00:00:00+00:00',
			domain: 'adobe.com',
			industry: 'Information Technology',
			exposedData: ['Email addresses', 'Passwords'],
			exposedRecords: 152445165,
			verified: true
		},
		{
			breachID: 'Chess-2026',
			breachedDate: '2026-08-01T00:00:00+00:00',
			domain: 'chess.com',
			exposedData: ['Email addresses', 'Usernames'],
			exposedRecords: 4656591
		}
	]
};

describe('parseCheckEmail', () => {
	it('flattens and dedupes breach names', () => {
		expect(parseCheckEmail({ breaches: [['Adobe', 'Chess-2026', 'Adobe']] })).toEqual([
			'Adobe',
			'Chess-2026'
		]);
	});

	it('returns an empty list when not found', () => {
		expect(parseCheckEmail({ Error: 'Not found', email: null })).toEqual([]);
		expect(parseCheckEmail(null)).toEqual([]);
	});
});

describe('enrichBreaches', () => {
	it('joins the catalog case-insensitively and sorts newest first, unknown last', () => {
		const breaches = enrichBreaches(
			['adobe', 'Mystery', 'Chess-2026'],
			parseBreachCatalog(CATALOG)
		);
		expect(breaches.map((b) => b.id)).toEqual(['Chess-2026', 'Adobe', 'Mystery']);
		expect(breaches[1]).toMatchObject({ domain: 'adobe.com', records: 152445165, verified: true });
		expect(breaches[2]).toMatchObject({ date: null, exposedData: [] });
	});
});

describe('checkEmailBreaches', () => {
	beforeEach(resetBreachCatalogCache);

	it('fetches the catalog once and only when there are breaches', async () => {
		const fetch = vi.fn(async (/** @type {string} */ url) =>
			String(url).endsWith('/breaches')
				? Response.json(CATALOG)
				: String(url).includes('nobody')
					? Response.json({ Error: 'Not found' }, { status: 404 })
					: Response.json({ breaches: [['Adobe']] })
		);
		expect(await checkEmailBreaches('nobody@example.com', { fetch })).toEqual([]);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect((await checkEmailBreaches('a@example.com', { fetch }))[0].id).toBe('Adobe');
		await checkEmailBreaches('b@example.com', { fetch });
		expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/breaches'))).toHaveLength(1);
	});

	it('explains network errors as possible rate limiting', async () => {
		const fetch = async () => {
			throw new TypeError('Failed to fetch');
		};
		await expect(checkEmailBreaches('a@example.com', { fetch })).rejects.toThrow(/rate limiting/);
	});

	it('reports HTTP 429', async () => {
		const fetch = async () => new Response('', { status: 429 });
		await expect(checkEmailBreaches('a@example.com', { fetch })).rejects.toThrow(/rate limiting/);
	});
});
