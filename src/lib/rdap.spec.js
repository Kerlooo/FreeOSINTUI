import { describe, expect, it } from 'vitest';
import { lookupRdap, summarizeRdap } from './rdap.js';

describe('summarizeRdap', () => {
	it('summarizes a domain', () => {
		const summary = summarizeRdap({
			ldhName: 'EXAMPLE.COM',
			status: ['client delete prohibited'],
			events: [
				{ eventAction: 'registration', eventDate: '1995-08-14T04:00:00Z' },
				{ eventAction: 'expiration', eventDate: '2027-08-13T04:00:00Z' }
			],
			nameservers: [{ ldhName: 'A.IANA-SERVERS.NET' }],
			secureDNS: { delegationSigned: true },
			entities: [
				{
					roles: ['registrar'],
					vcardArray: ['vcard', [['fn', {}, 'text', 'Example Registrar']]],
					entities: [
						{
							roles: ['abuse'],
							vcardArray: ['vcard', [['email', {}, 'text', 'abuse@example.net']]]
						}
					]
				}
			]
		});
		expect(summary).toMatchObject({
			name: 'example.com',
			registered: '1995-08-14T04:00:00Z',
			expires: '2027-08-13T04:00:00Z',
			nameservers: ['a.iana-servers.net'],
			dnssec: true,
			registrar: 'Example Registrar'
		});
		expect(summary.contacts[1]).toMatchObject({ roles: ['abuse'], email: 'abuse@example.net' });
	});

	it('summarizes an IP network', () => {
		const summary = summarizeRdap({
			name: 'GOGL',
			startAddress: '8.8.8.0',
			endAddress: '8.8.8.255',
			cidr0_cidrs: [{ v4prefix: '8.8.8.0', length: 24 }]
		});
		expect(summary).toMatchObject({
			name: 'GOGL',
			range: '8.8.8.0 – 8.8.8.255',
			cidrs: ['8.8.8.0/24']
		});
	});
});

describe('lookupRdap', () => {
	it('keeps IPv6 colons unencoded and returns null on 404', async () => {
		let requested = '';
		const fetch = async (url) => {
			requested = url;
			return new Response('{}', { status: 404 });
		};
		expect(await lookupRdap('ip', '2001:db8::1', { fetch })).toBeNull();
		expect(requested).toBe('https://rdap.org/ip/2001:db8::1');
	});
});
