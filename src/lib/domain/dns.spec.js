import { describe, expect, it } from 'vitest';
import { DNS_RECORD_TYPES, describeMx, lookupDnsRecords } from './dns.js';

const CODES = { A: 1, AAAA: 28, MX: 15, NS: 2, TXT: 16, CAA: 257, SOA: 6 };

/** Fake DoH answering MX with two records, failing AAAA and returning nothing otherwise. */
async function fakeFetch(url) {
	const type = new URL(url).searchParams.get('type');
	if (type === 'AAAA') return new Response('', { status: 500 });
	const Answer =
		type === 'MX'
			? [
					{ name: 'example.com.', type: CODES.MX, TTL: 300, data: '20 mx2.example.com.' },
					{ name: 'example.com.', type: CODES.MX, TTL: 300, data: '10 mx1.example.com.' }
				]
			: undefined;
	return new Response(JSON.stringify({ Status: 0, Answer }), { status: 200 });
}

describe('lookupDnsRecords', () => {
	it('groups records by type, sorted, with per-type errors', async () => {
		const groups = await lookupDnsRecords('example.com', { fetch: fakeFetch });
		expect(groups.map((g) => g.type)).toEqual(DNS_RECORD_TYPES);
		const mx = groups.find((g) => g.type === 'MX');
		expect(mx.records.map((r) => r.data)).toEqual(['10 mx1.example.com', '20 mx2.example.com']);
		expect(mx.records[0].ttl).toBe(300);
		expect(groups.find((g) => g.type === 'AAAA').error).toMatch(/HTTP 500/);
		expect(groups.find((g) => g.type === 'A')).toEqual({ type: 'A', records: [], error: null });
	});
});

describe('describeMx', () => {
	it('labels a null MX and leaves normal records alone', () => {
		expect(describeMx('0')).toBe('0 . (null MX: the domain accepts no email)');
		expect(describeMx('10 mx.example.com')).toBe('10 mx.example.com');
	});
});
