import { describe, expect, it } from 'vitest';
import { analyzeUrl, rawHostOf } from './analyze.js';

/** @param {string} input */
const ids = (input) => {
	const result = analyzeUrl(input);
	if (result.error) throw new Error(result.error);
	return result.findings.map((f) => f.id);
};

describe('rawHostOf', () => {
	it('reads the host as typed', () => {
		expect(rawHostOf('http://3232235777/x')).toBe('3232235777');
		expect(rawHostOf('https://user:pw@0x7f.1:8080/')).toBe('0x7f.1');
		expect(rawHostOf('http://[::1]:80/')).toBe('[::1]');
	});
});

describe('analyzeUrl', () => {
	it('parses the parts of a URL', () => {
		const result = analyzeUrl(
			'hxxps://user@login.example[.]co.uk:8443/a%20b?id=1&utm_source=x#frag'
		);
		if (result.error) throw new Error(result.error);
		expect(result).toMatchObject({
			href: 'https://user@login.example.co.uk:8443/a%20b?id=1&utm_source=x#frag',
			scheme: 'https',
			username: 'user',
			hasPassword: false,
			hostname: 'login.example.co.uk',
			port: '8443',
			path: '/a b',
			fragment: 'frag',
			refanged: true,
			schemeAdded: false,
			defanged: 'hxxps[://]user[@]login[.]example[.]co[.]uk:8443/a%20b?id=1&utm_source=x#frag',
			cleaned: {
				url: 'https://user@login.example.co.uk:8443/a%20b?id=1#frag',
				removed: ['utm_source']
			}
		});
		expect(result.host).toMatchObject({ registrable: 'example.co.uk', subdomain: 'login' });
	});

	it('adds a scheme when missing', () => {
		const result = analyzeUrl('example.com:8080/path');
		expect(result).toMatchObject({
			error: null,
			href: 'https://example.com:8080/path',
			schemeAdded: true
		});
	});

	it('rejects non-http schemes and invalid input', () => {
		expect(analyzeUrl('javascript:alert(1)').error).toMatch(/javascript/);
		expect(analyzeUrl('data:text/html,hi').error).toMatch(/data/);
		expect(analyzeUrl('').error).toBeTruthy();
		expect(analyzeUrl('https://').error).toBeTruthy();
	});

	it('reports user info tricks first', () => {
		const findings = ids('https://paypal.com@evil.example/login');
		expect(findings[0]).toBe('userinfo');
	});

	it('reports obfuscated and private IPs', () => {
		expect(ids('http://3232235777/')).toEqual(
			expect.arrayContaining(['ipObfuscated', 'ipLiteral', 'ipSpecial', 'http'])
		);
		expect(ids('http://8.8.8.8/')).not.toContain('ipObfuscated');
	});

	it('reports look-alike domains', () => {
		expect(ids('https://аpple.com/')).toEqual(
			expect.arrayContaining(['lookalike', 'mixedScript', 'idn'])
		);
		expect(ids('https://xn--80ak6aa92e.com/')).toEqual(
			expect.arrayContaining(['lookalike', 'idn'])
		);
	});

	it('reports brands, deep subdomains and free hosting', () => {
		expect(ids('https://paypal.com.account.verify.secure.evil.net/')).toEqual(
			expect.arrayContaining(['brand', 'deepSubdomain'])
		);
		expect(ids('https://paypal-login.github.io/')).toEqual(
			expect.arrayContaining(['brand', 'hosting'])
		);
		expect(ids('https://www.paypal.com/')).toEqual([]);
	});

	it('reports redirects, shorteners and tracking', () => {
		expect(ids('https://www.google.com/url?q=https://evil.com')).toEqual(
			expect.arrayContaining(['embedded', 'redirector'])
		);
		expect(ids('https://bit.ly/abc')).toContain('shortener');
		expect(ids('https://example.com/?utm_source=x')).toContain('tracking');
		const nested =
			'https://www.google.com/url?q=' +
			encodeURIComponent('https://l.facebook.com/l.php?u=https%3A%2F%2Fevil.com');
		expect(ids(nested)).toContain('nested');
	});

	it('sorts findings by severity', () => {
		const result = analyzeUrl('http://user@3232235777/?utm_source=x');
		if (result.error) throw new Error(result.error);
		const order = ['warning', 'notice', 'info'];
		const severities = result.findings.map((f) => order.indexOf(f.severity));
		expect(severities).toEqual([...severities].sort((a, b) => a - b));
		expect(result.findings.every((f) => f.message && !f.message.startsWith('url.'))).toBe(true);
	});
});
