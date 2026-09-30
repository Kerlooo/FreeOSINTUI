import { describe, expect, it } from 'vitest';
import { analyzeUrl } from './analyze.js';
import { overviewRows, urlhausRows } from './rows.js';

describe('overviewRows', () => {
	it('shows host details and hides empty rows', () => {
		const a = analyzeUrl('https://www.xn--mnchen-3ya.de/a');
		if (a.error) throw new Error(a.error);
		const rows = Object.fromEntries(overviewRows(a).map((r) => [r.label, r.value]));
		expect(rows).toMatchObject({
			Scheme: 'https',
			Host: 'www.münchen.de',
			'Host (Punycode)': 'www.xn--mnchen-3ya.de',
			'Registered domain': 'münchen.de (xn--mnchen-3ya.de)',
			Subdomain: 'www',
			Path: '/a'
		});
	});

	it('shows the host as written for numeric IPs', () => {
		const a = analyzeUrl('http://3232235777/');
		if (a.error) throw new Error(a.error);
		const rows = Object.fromEntries(overviewRows(a).map((r) => [r.label, r.value]));
		expect(rows).toMatchObject({ Host: '192.168.1.1', 'Host as written': '3232235777' });
	});
});

describe('urlhausRows', () => {
	it('links only to urlhaus.abuse.ch', () => {
		const rows = urlhausRows({ reference: 'https://urlhaus.abuse.ch/url/1/', tags: ['a', 'b'] });
		expect(rows.find((r) => r.href)?.href).toBe('https://urlhaus.abuse.ch/url/1/');
		expect(urlhausRows({ reference: 'https://evil.com/' }).some((r) => r.href)).toBe(false);
	});
});
