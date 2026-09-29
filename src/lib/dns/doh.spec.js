import { describe, expect, it } from 'vitest';
import { resolveDns, reverseName } from './doh.js';

const fakeFetch = (body) => async () => new Response(JSON.stringify(body), { status: 200 });

describe('resolveDns', () => {
	it('keeps answers of the requested type and cleans the data', async () => {
		const answers = await resolveDns('example.com', 'TXT', {
			fetch: fakeFetch({
				Status: 0,
				Answer: [
					{ name: 'example.com.', type: 5, TTL: 60, data: 'alias.example.net.' },
					{ name: 'example.com.', type: 16, TTL: 300, data: '"v=spf1 -all"' },
					{ name: 'example.com.', type: 16, TTL: 300, data: '"part one" "part two"' }
				]
			})
		});
		expect(answers).toEqual([
			{ name: 'example.com', type: 'TXT', ttl: 300, data: 'v=spf1 -all' },
			{ name: 'example.com', type: 'TXT', ttl: 300, data: 'part onepart two' }
		]);
	});

	it('returns no answers for a missing name', async () => {
		expect(await resolveDns('nope.invalid', 'A', { fetch: fakeFetch({ Status: 3 }) })).toEqual([]);
	});
});

describe('reverseName', () => {
	it('builds IPv4 and IPv6 reverse names', () => {
		expect(reverseName('8.8.4.4')).toBe('4.4.8.8.in-addr.arpa');
		expect(reverseName('2001:db8::1')).toBe(
			'1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa'
		);
	});
});
