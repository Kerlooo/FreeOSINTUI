import { describe, expect, it } from 'vitest';
import {
	analyzeHost,
	brandsInHost,
	labelScripts,
	latinSkeleton,
	obfuscatedIpv4,
	splitHost
} from './host.js';

describe('obfuscatedIpv4', () => {
	it('detects decimal, hex, octal and short forms', () => {
		expect(obfuscatedIpv4('3232235777')).toEqual({
			address: '192.168.1.1',
			forms: ['decimal', 'short']
		});
		expect(obfuscatedIpv4('0xc0a80101')).toEqual({
			address: '192.168.1.1',
			forms: ['hex', 'short']
		});
		expect(obfuscatedIpv4('0300.0250.1.1')).toEqual({
			address: '192.168.1.1',
			forms: ['octal', 'decimal']
		});
		expect(obfuscatedIpv4('0xc0.168.0x1.1')?.address).toBe('192.168.1.1');
		expect(obfuscatedIpv4('192.168.257')?.address).toBe('192.168.1.1');
		expect(obfuscatedIpv4('127.1')?.address).toBe('127.0.0.1');
	});

	it('matches the WHATWG URL parser', () => {
		for (const raw of ['3232235777', '0xc0a80101', '0300.0250.1.1', '192.168.257', '0x7f.1']) {
			expect(obfuscatedIpv4(raw)?.address).toBe(new URL(`http://${raw}/`).hostname);
		}
	});

	it('ignores normal dotted quads and names', () => {
		expect(obfuscatedIpv4('192.168.1.1')).toBeNull();
		expect(obfuscatedIpv4('example.com')).toBeNull();
		expect(obfuscatedIpv4('1.2.3.4.5')).toBeNull();
		expect(obfuscatedIpv4('09.1.1.1')).toBeNull();
	});
});

describe('scripts and look-alikes', () => {
	it('lists scripts of a label', () => {
		expect(labelScripts('apple')).toEqual(['Latin']);
		expect(labelScripts('аpple')).toEqual(['Cyrillic', 'Latin']);
		expect(labelScripts('例え')).toEqual(['Han', 'Hiragana']);
		expect(labelScripts('a-1')).toEqual(['Latin']);
	});

	it('maps look-alike letters to Latin', () => {
		expect(latinSkeleton('аррӏе')).toBe('apple');
		expect(latinSkeleton('pаypаl')).toBe('paypal');
	});
});

describe('splitHost', () => {
	it('finds registrable domain and subdomain', () => {
		expect(splitHost('a.b.example.com')).toEqual({
			suffix: 'com',
			registrable: 'example.com',
			subdomain: 'a.b',
			hosting: false
		});
		expect(splitHost('www.bbc.co.uk').registrable).toBe('bbc.co.uk');
		expect(splitHost('evil.github.io')).toMatchObject({
			registrable: 'evil.github.io',
			hosting: true
		});
		expect(splitHost('co.uk').registrable).toBe('co.uk');
	});
});

describe('brandsInHost', () => {
	it('flags brand names outside the brand domain', () => {
		expect(brandsInHost('paypal.com.secure-login.net', 'secure-login.net')).toEqual(['paypal']);
		expect(brandsInHost('paypal-account.com', 'paypal-account.com')).toEqual(['paypal']);
		expect(brandsInHost('www.paypal.com', 'paypal.com')).toEqual([]);
		expect(brandsInHost('pineapple.com', 'pineapple.com')).toEqual([]);
		expect(brandsInHost('аpple-id.example', 'xn--pple-id-xyz.example')).toEqual(['apple']);
	});
});

describe('analyzeHost', () => {
	it('flags a Cyrillic look-alike domain', () => {
		const host = new URL('https://аpple.com').hostname;
		const result = analyzeHost(host, 'аpple.com');
		expect(result).toMatchObject({
			kind: 'name',
			idn: true,
			unicode: 'аpple.com',
			lookalike: 'apple.com',
			riskyMix: true,
			mixedLabels: ['аpple']
		});
	});

	it('flags whole-script confusables', () => {
		const result = analyzeHost('xn--80ak6aa92e.com', 'аррӏе.com');
		expect(result).toMatchObject({
			lookalike: 'apple.com',
			riskyMix: false,
			nonLatin: ['Cyrillic']
		});
	});

	it('does not flag a genuine non-Latin domain as look-alike', () => {
		const result = analyzeHost(new URL('https://пример.рф').hostname, 'пример.рф');
		expect(result).toMatchObject({ idn: true, lookalike: null, riskyMix: false });
	});

	it('reports IP hosts and obfuscation', () => {
		expect(analyzeHost('192.168.1.1', '3232235777')).toMatchObject({
			kind: 'ipv4',
			ip: '192.168.1.1',
			obfuscated: { address: '192.168.1.1' }
		});
		expect(analyzeHost('[::1]', '[::1]')).toMatchObject({ kind: 'ipv6', ip: '::1' });
	});

	it('counts subdomain depth', () => {
		expect(analyzeHost('a.b.c.d.example.com', 'a.b.c.d.example.com')).toMatchObject({
			subdomain: 'a.b.c.d',
			subdomainDepth: 4
		});
	});
});
