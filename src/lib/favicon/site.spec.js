import { describe, expect, it } from 'vitest';
import { faviconUrl } from './site.js';

describe('faviconUrl', () => {
	it('builds the favicon URL from a domain or a URL', () => {
		expect(faviconUrl('example.com')).toBe('https://example.com/favicon.ico');
		expect(faviconUrl(' https://Www.Example.com/login?x=1 ')).toBe(
			'https://www.example.com/favicon.ico'
		);
		expect(faviconUrl('http://example.com:8080/')).toBe('http://example.com:8080/favicon.ico');
	});

	it('converts IDN hosts to punycode', () => {
		expect(faviconUrl('bücher.de')).toBe('https://xn--bcher-kva.de/favicon.ico');
	});

	it('rejects invalid input', () => {
		expect(faviconUrl('')).toBeNull();
		expect(faviconUrl('not a domain')).toBeNull();
		expect(faviconUrl('ftp://example.com')).toBeNull();
		expect(faviconUrl('intranet')).toBeNull();
	});
});
