import { describe, expect, it } from 'vitest';
import { dmarcVerdict, lookupMailServer, mxVerdict, parseMx, spfVerdict } from './mail-server.js';

describe('parseMx', () => {
	it('sorts by priority and strips the trailing dot', () => {
		expect(
			parseMx([
				{ data: '20 alt.example.com.', ttl: 60 },
				{ data: '10 MX.example.com', ttl: 60 }
			]).map((mx) => [mx.priority, mx.host])
		).toEqual([
			[10, 'mx.example.com'],
			[20, 'alt.example.com']
		]);
	});

	it('recognizes a null MX', () => {
		const mx = parseMx([{ data: '0 ', ttl: 60 }]);
		expect(mx[0].host).toBe('');
		expect(mxVerdict(mx, true).level).toBe('bad');
	});
});

describe('verdicts', () => {
	it('explains MX presence and fallback', () => {
		expect(mxVerdict([{ host: 'mx.example.com' }], false).level).toBe('good');
		expect(mxVerdict([], true).level).toBe('warn');
		expect(mxVerdict([], false).text).toMatch(/cannot receive mail/);
	});

	it('grades SPF by its all policy', () => {
		expect(spfVerdict(null).level).toBe('bad');
		expect(spfVerdict({ allPolicy: 'fail', includes: [] }).level).toBe('good');
		expect(spfVerdict({ allPolicy: 'softfail', includes: [] }).level).toBe('warn');
		expect(spfVerdict({ allPolicy: 'pass', includes: [] }).level).toBe('bad');
		expect(
			spfVerdict({ allPolicy: null, mechanisms: [{ name: 'redirect', value: '_spf.google.com' }] })
				.text
		).toMatch(/_spf\.google\.com/);
	});

	it('grades DMARC by its policy', () => {
		expect(dmarcVerdict(null).level).toBe('bad');
		expect(dmarcVerdict({ policy: 'reject', percent: 100 }).level).toBe('good');
		expect(dmarcVerdict({ policy: 'quarantine', percent: 50 }).text).toMatch(/50%/);
		expect(dmarcVerdict({ policy: 'none', percent: 100 }).level).toBe('warn');
	});
});

describe('lookupMailServer', () => {
	it('falls back to A records when there is no MX', async () => {
		/** @param {string | URL | Request} url */
		const fetch = async (url) => {
			const type = new URL(String(url)).searchParams.get('type');
			const answer = type === 'A' ? [{ name: 'x.com.', type: 1, TTL: 60, data: '192.0.2.1' }] : [];
			return Response.json({ Status: 0, Answer: answer });
		};
		const result = await lookupMailServer('x.com', { fetch });
		expect(result).toMatchObject({ mx: [], hasAddress: true, spf: null, dmarc: null });
		expect(result.verdicts.mx.level).toBe('warn');
	});
});
