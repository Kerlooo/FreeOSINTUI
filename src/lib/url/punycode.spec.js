import { describe, expect, it } from 'vitest';
import { decodePunycode, toUnicodeHost } from './punycode.js';

describe('punycode', () => {
	it('decodes labels', () => {
		expect(decodePunycode('80ak6aa92e')).toBe('аррӏе');
		expect(decodePunycode('mnchen-3ya')).toBe('münchen');
		expect(decodePunycode('pple-43d')).toBe('аpple');
	});

	it('converts whole hostnames and keeps invalid labels', () => {
		expect(toUnicodeHost('www.xn--mnchen-3ya.de')).toBe('www.münchen.de');
		expect(toUnicodeHost('xn--!!.com')).toBe('xn--!!.com');
		expect(toUnicodeHost('example.com')).toBe('example.com');
	});

	it('round-trips with the URL parser', () => {
		for (const host of ['bücher.example', 'пример.рф', '例え.jp']) {
			expect(toUnicodeHost(new URL(`https://${host}/`).hostname)).toBe(host);
		}
	});
});
