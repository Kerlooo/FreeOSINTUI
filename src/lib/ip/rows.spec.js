import { describe, expect, it } from 'vitest';
import { geoRows, rdapRows } from './rows.js';

describe('geoRows', () => {
	it('links coordinates and ASN, hides ISP when equal to the organization', () => {
		const rows = geoRows({
			ip: '8.8.8.8',
			continent: null,
			country: 'United States',
			countryCode: 'US',
			flag: null,
			region: 'California',
			city: 'San Jose',
			postal: null,
			latitude: 37.3393939,
			longitude: -121.8949553,
			mapUrl: 'https://www.openstreetmap.org/?mlat=37.3393939&mlon=-121.8949553',
			asn: 'AS15169',
			org: 'Google LLC',
			isp: 'Google LLC',
			domain: null,
			timezone: 'America/Los_Angeles',
			utcOffset: '-07:00'
		});
		const byLabel = Object.fromEntries(rows.map((row) => [row.label, row]));
		expect(byLabel.Country.value).toBe('United States (US)');
		expect(byLabel.Coordinates.value).toBe('37.3394, -121.8950 (map ↗)');
		expect(byLabel.Coordinates.href).toContain('openstreetmap.org');
		expect(byLabel.ASN.href).toBe('https://bgp.he.net/AS15169');
		expect(byLabel.ISP.value).toBeNull();
		expect(byLabel.Timezone.value).toBe('America/Los_Angeles UTC-07:00');
	});
});

describe('rdapRows', () => {
	it('puts the abuse contact first and keeps labels unique', () => {
		const rows = rdapRows({
			handle: 'NET-8-8-8-0-2',
			name: 'GOGL',
			status: [],
			registered: '2023-12-28T17:24:33-05:00',
			expires: null,
			updated: null,
			nameservers: [],
			dnssec: null,
			registrar: null,
			range: '8.8.8.0 – 8.8.8.255',
			cidrs: ['8.8.8.0/24'],
			country: null,
			type: 'DIRECT ALLOCATION',
			contacts: [
				{ roles: ['technical'], name: 'Tech A', email: null, handle: null },
				{ roles: ['technical'], name: 'Tech B', email: null, handle: null },
				{ roles: ['abuse'], name: 'Abuse', email: 'network-abuse@google.com', handle: null }
			]
		});
		const contacts = rows.filter((row) => row.label.startsWith('Contact'));
		expect(contacts.map((row) => row.label)).toEqual([
			'Contact: abuse',
			'Contact: technical',
			'Contact: technical #2'
		]);
		expect(contacts[0]).toMatchObject({
			value: 'Abuse <network-abuse@google.com>',
			href: 'mailto:network-abuse@google.com'
		});
		expect(rows.find((row) => row.label === 'Registered')?.value).toBe('2023-12-28');
	});
});
