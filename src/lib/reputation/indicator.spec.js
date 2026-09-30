import { describe, expect, it } from 'vitest';
import { MAX_URL_LENGTH, parseIndicator } from './indicator.js';

describe('parseIndicator', () => {
	it('detects IPv4 and IPv6 addresses', () => {
		expect(parseIndicator(' 8.8.8.8 ')).toMatchObject({
			kind: 'ip',
			value: '8.8.8.8',
			special: null
		});
		expect(parseIndicator('2001:4860:4860:0:0:0:0:8888')).toMatchObject({
			kind: 'ip',
			value: '2001:4860:4860::8888'
		});
	});

	it('flags special-purpose addresses', () => {
		const result = parseIndicator('192.168.1.1');
		expect(result.kind).toBe('ip');
		expect(result.kind === 'ip' && result.special?.cidr).toBe('192.168.0.0/16');
	});

	it('detects domains', () => {
		expect(parseIndicator('Example.COM')).toEqual({ kind: 'domain', value: 'example.com' });
		expect(parseIndicator('sub.example.co.uk')).toEqual({
			kind: 'domain',
			value: 'sub.example.co.uk'
		});
	});

	it('detects URLs and keeps them as typed', () => {
		expect(parseIndicator('http://Evil.example/pay.exe')).toMatchObject({
			kind: 'url',
			value: 'http://Evil.example/pay.exe',
			host: 'evil.example',
			hostIp: null
		});
		const withIp = parseIndicator('https://[2001:db8::1]:8443/x');
		expect(withIp).toMatchObject({ kind: 'url', host: '2001:db8::1' });
		expect(parseIndicator('example.com/login')).toMatchObject({
			kind: 'url',
			value: 'http://example.com/login'
		});
	});

	it('rejects other schemes and overlong URLs', () => {
		expect(parseIndicator('ftp://example.com/file').kind).toBe('error');
		expect(parseIndicator(`https://example.com/${'a'.repeat(MAX_URL_LENGTH)}`).kind).toBe('error');
		expect(parseIndicator('http://localhost/').kind).toBe('error');
	});

	it('detects email addresses', () => {
		expect(parseIndicator('Name@Example.com')).toEqual({
			kind: 'email',
			value: 'name@example.com',
			domain: 'example.com'
		});
		expect(parseIndicator('bad@').kind).toBe('error');
	});

	it('rejects garbage and empty input', () => {
		expect(parseIndicator('').kind).toBe('error');
		expect(parseIndicator('not a thing').kind).toBe('error');
		expect(parseIndicator('999.1.1.1').kind).toBe('error');
	});
});
