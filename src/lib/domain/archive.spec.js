import { describe, expect, it } from 'vitest';
import { lookupWayback, parseWaybackAvailable, waybackDate } from './archive.js';

describe('waybackDate', () => {
	it('parses Wayback timestamps', () => {
		expect(waybackDate('20260929055621')).toBe('2026-09-29 05:56:21 UTC');
		expect(waybackDate('')).toBeNull();
	});
});

describe('parseWaybackAvailable', () => {
	it('returns the closest snapshot over https', () => {
		expect(
			parseWaybackAvailable({
				archived_snapshots: {
					closest: {
						status: '200',
						available: true,
						url: 'http://web.archive.org/web/20260929055621/https://example.com/',
						timestamp: '20260929055621'
					}
				}
			})
		).toEqual({
			url: 'https://web.archive.org/web/20260929055621/https://example.com/',
			date: '2026-09-29 05:56:21 UTC',
			status: '200'
		});
	});

	it('returns null when nothing is archived', () => {
		expect(parseWaybackAvailable({ url: 'x.com', archived_snapshots: {} })).toBeNull();
	});
});

describe('lookupWayback', () => {
	it('adds the history link', async () => {
		const result = await lookupWayback('example.com', {
			fetch: async () => new Response(JSON.stringify({ archived_snapshots: {} }), { status: 200 })
		});
		expect(result).toEqual({
			snapshot: null,
			historyUrl: 'https://web.archive.org/web/*/example.com/*'
		});
	});
});
