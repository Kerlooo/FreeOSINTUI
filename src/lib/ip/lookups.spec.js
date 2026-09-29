import { describe, expect, it } from 'vitest';
import {
	lookupInternetDb,
	lookupIpRdap,
	lookupPtr,
	parseInternetDb,
	parseIpWhois,
	resolveHostname
} from './lookups.js';

/** Fake fetch returning a JSON body per URL substring. */
function fakeFetch(/** @type {Record<string, { status?: number, body: any }>} */ routes) {
	return /** @type {typeof fetch} */ (
		async (input) => {
			const url = String(input);
			const key = Object.keys(routes).find((k) => url.includes(k));
			if (!key) throw new Error(`unexpected ${url}`);
			const { status = 200, body } = routes[key];
			return new Response(JSON.stringify(body), { status });
		}
	);
}

describe('parseIpWhois', () => {
	it('extracts location and network fields', () => {
		const geo = parseIpWhois({
			ip: '8.8.8.8',
			success: true,
			country: 'United States',
			country_code: 'US',
			region: 'California',
			city: 'San Jose',
			latitude: 37.34,
			longitude: -121.89,
			flag: { emoji: '🇺🇸' },
			connection: { asn: 15169, org: 'Google LLC', isp: 'Google LLC', domain: 'google.com' },
			timezone: { id: 'America/Los_Angeles', utc: '-07:00' }
		});
		expect(geo).toMatchObject({
			country: 'United States',
			city: 'San Jose',
			asn: 'AS15169',
			isp: 'Google LLC',
			timezone: 'America/Los_Angeles',
			utcOffset: '-07:00'
		});
		expect(geo.mapUrl).toContain('mlat=37.34&mlon=-121.89');
	});

	it('throws the API message on failure', () => {
		expect(() => parseIpWhois({ success: false, message: 'Reserved range' })).toThrow(
			'ipwho.is: Reserved range.'
		);
	});
});

describe('parseInternetDb', () => {
	it('sorts ports and CVEs and names services', () => {
		const result = parseInternetDb({
			ports: [443, 22, 8080, 31337],
			hostnames: ['a.example'],
			cpes: ['cpe:/a:openbsd:openssh'],
			tags: ['cloud'],
			vulns: ['CVE-2019-1', 'CVE-2023-38408', 'CVE-2023-100']
		});
		expect(result?.ports).toEqual([
			{ port: 22, service: 'SSH' },
			{ port: 443, service: 'HTTPS' },
			{ port: 8080, service: 'HTTP (alt)' },
			{ port: 31337, service: null }
		]);
		expect(result?.vulns).toEqual(['CVE-2023-38408', 'CVE-2023-100', 'CVE-2019-1']);
	});

	it('returns null when there is no data', () => {
		expect(parseInternetDb(null)).toBeNull();
		expect(parseInternetDb({ detail: 'No information available' })).toBeNull();
	});
});

describe('lookupInternetDb', () => {
	it('treats 404 as no data', async () => {
		const fetch = fakeFetch({
			'internetdb.shodan.io': { status: 404, body: { detail: 'No information available' } }
		});
		expect(await lookupInternetDb('1.2.3.4', { fetch })).toBeNull();
	});
});

describe('DNS helpers', () => {
	it('resolves A and AAAA records, IPv4 first, without duplicates', async () => {
		const fetch = fakeFetch({
			'type=AAAA': {
				body: { Status: 0, Answer: [{ name: 'x.', type: 28, TTL: 60, data: '2001:DB8:0::1' }] }
			},
			'type=A': {
				body: {
					Status: 0,
					Answer: [
						{ name: 'x.', type: 5, TTL: 60, data: 'y.' },
						{ name: 'y.', type: 1, TTL: 60, data: '1.2.3.4' },
						{ name: 'y.', type: 1, TTL: 60, data: '1.2.3.4' }
					]
				}
			}
		});
		expect(await resolveHostname('x.example', { fetch })).toEqual([
			{ address: '1.2.3.4', version: 4 },
			{ address: '2001:db8::1', version: 6 }
		]);
	});

	it('looks up PTR names', async () => {
		const fetch = fakeFetch({
			'8.8.8.8.in-addr.arpa': {
				body: { Status: 0, Answer: [{ name: 'x.', type: 12, TTL: 60, data: 'dns.google.' }] }
			}
		});
		expect(await lookupPtr('8.8.8.8', { fetch })).toEqual(['dns.google']);
	});
});

describe('lookupIpRdap', () => {
	it('sends IPv6 addresses with unencoded colons', async () => {
		/** @type {string[]} */
		const urls = [];
		const fetch = /** @type {typeof globalThis.fetch} */ (
			async (input) => {
				urls.push(String(input));
				return new Response(
					JSON.stringify({ handle: 'NET6', startAddress: '2a00::', endAddress: '2a00::ff' })
				);
			}
		);
		const summary = await lookupIpRdap('2a00:1450::66', { fetch });
		expect(urls).toEqual(['https://rdap.org/ip/2a00:1450::66']);
		expect(summary?.handle).toBe('NET6');
	});

	it('rejects anything that is not an address', async () => {
		await expect(lookupIpRdap('../domain/x')).rejects.toThrow('Invalid IP address.');
	});
});
