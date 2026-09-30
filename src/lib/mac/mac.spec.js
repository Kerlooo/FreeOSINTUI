import { describe, expect, it } from 'vitest';
import { eui64InterfaceId, macHex, parseMac, parseMacList } from './parse.js';
import { loadOuiData, lookupVendor } from './vendor.js';

/** @param {string} text */
const formats = (text) =>
	Object.fromEntries((parseMac(text)?.formats ?? []).map((f) => [f.id, f.value]));

describe('macHex', () => {
	it('accepts every common notation', () => {
		for (const text of [
			'00:1a:2b:3c:4d:5e',
			'00-1A-2B-3C-4D-5E',
			'001a.2b3c.4d5e',
			'001A2B3C4D5E',
			'0:1a:2b:3c:4d:5e',
			' 00 1a 2b 3c 4d 5e '
		]) {
			expect(macHex(text), text).toBe('001A2B3C4D5E');
		}
		expect(macHex('00:1a:2b')).toBe('001A2B');
		expect(macHex('001a2b')).toBe('001A2B');
	});

	it('rejects malformed input', () => {
		for (const text of [
			'00:1a:2b:3c:4d',
			'00:1a-2b:3c:4d:5e',
			'zz:1a:2b:3c:4d:5e',
			'001a2b3c4d',
			''
		]) {
			expect(macHex(text), text).toBeNull();
		}
	});
});

describe('parseMac', () => {
	it('gives the normalized forms and the EUI-64 interface ID', () => {
		expect(formats('00-1A-2B-3C-4D-5E')).toEqual({
			colon: '00:1A:2B:3C:4D:5E',
			colonLower: '00:1a:2b:3c:4d:5e',
			hyphen: '00-1A-2B-3C-4D-5E',
			cisco: '001a.2b3c.4d5e',
			bare: '001A2B3C4D5E',
			eui64: '21a:2bff:fe3c:4d5e',
			linkLocal: 'fe80::21a:2bff:fe3c:4d5e'
		});
		expect(eui64InterfaceId('0200000000FF')).toBe('0:ff:fe00:ff');
	});

	it('reads the I/G and U/L bits', () => {
		expect(parseMac('00:1a:2b:3c:4d:5e')).toMatchObject({
			multicast: false,
			local: false,
			broadcast: false,
			prefixOnly: false
		});
		// Randomized Wi-Fi MAC: second hex digit 2, 6, A or E.
		expect(parseMac('da:a1:19:00:00:01')).toMatchObject({ multicast: false, local: true });
		expect(parseMac('01:00:5e:00:00:fb')).toMatchObject({ multicast: true, local: false });
		expect(parseMac('ff:ff:ff:ff:ff:ff')).toMatchObject({
			multicast: true,
			local: true,
			broadcast: true
		});
	});

	it('handles an OUI prefix alone', () => {
		const oui = parseMac('F0-18-98');
		expect(oui).toMatchObject({ hex: 'F01898', prefixOnly: true });
		expect(oui?.formats.map((f) => f.id)).toEqual(['colon', 'hyphen', 'bare']);
	});

	it('splits lists', () => {
		const list = parseMacList('00:1a:2b:3c:4d:5e\n\n  bad  \n001a.2b3c.4d5e, f01898');
		expect(list.map((row) => row.mac?.hex ?? null)).toEqual([
			'001A2B3C4D5E',
			null,
			'001A2B3C4D5E',
			'F01898'
		]);
	});
});

const DATA = {
	l: {
		F01898: ['Apple, Inc.', 'US'],
		'001A2B': 'Ayecom Technology Co., Ltd.',
		'70B3D5': 'IEEE Registration Authority',
		'00005E': 'ICANN, IANA Department'
	},
	m: { '70B3D51': ['Small Vendor', 'IT'] },
	s: { '70B3D5123': 'Tiny Vendor' }
};

describe('lookupVendor', () => {
	it('returns the longest matching assignment', () => {
		expect(lookupVendor('70B3D5123456', DATA)).toEqual({
			registry: 'MA-S',
			prefix: '70B3D5123',
			bits: 36,
			organization: 'Tiny Vendor',
			country: null
		});
		expect(lookupVendor('70B3D51FFFFF', DATA)).toMatchObject({
			registry: 'MA-M',
			organization: 'Small Vendor',
			country: 'IT'
		});
		expect(lookupVendor('70B3D5FFFFFF', DATA)).toMatchObject({ registry: 'MA-L' });
		expect(lookupVendor('F01898', DATA)).toMatchObject({
			organization: 'Apple, Inc.',
			country: 'US'
		});
		expect(lookupVendor('123456789ABC', DATA)).toBeNull();
		// Multicast: the OUI is read with the I/G bit cleared.
		expect(lookupVendor('01005E0000FB', DATA)).toMatchObject({ prefix: '00005E' });
	});

	it('downloads the table once and retries after a failure', async () => {
		let calls = 0;
		const failing = /** @type {typeof fetch} */ (
			async () => {
				calls++;
				return new Response('nope', { status: 500 });
			}
		);
		await expect(
			loadOuiData('https://example.test/data/oui.json', { fetch: failing })
		).rejects.toThrow();
		const working = /** @type {typeof fetch} */ (
			async () => {
				calls++;
				return new Response(JSON.stringify(DATA), { status: 200 });
			}
		);
		const url = 'https://example.test/data/oui.json';
		expect(await loadOuiData(url, { fetch: working })).toEqual(DATA);
		expect(await loadOuiData(url, { fetch: working })).toEqual(DATA);
		expect(calls).toBe(2);
	});
});
