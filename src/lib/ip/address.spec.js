import { describe, expect, it } from 'vitest';
import { classifyIp, formatIPv6, parseIPv4, parseIPv6, parseInput, parseIp } from './address.js';

describe('parseIPv4', () => {
	it('parses valid addresses', () => {
		expect(parseIPv4('8.8.8.8')).toEqual([8, 8, 8, 8]);
		expect(parseIPv4('0.0.0.0')).toEqual([0, 0, 0, 0]);
		expect(parseIPv4('255.255.255.255')).toEqual([255, 255, 255, 255]);
	});

	it('rejects invalid addresses', () => {
		for (const bad of [
			'256.1.1.1',
			'1.2.3',
			'1.2.3.4.5',
			'01.2.3.4',
			'1..2.3',
			'a.b.c.d',
			' 1.2.3.4',
			''
		]) {
			expect(parseIPv4(bad), bad).toBeNull();
		}
	});
});

describe('parseIPv6', () => {
	it('parses full and compressed forms', () => {
		const full = parseIPv6('2001:0db8:0000:0000:0000:0000:0000:0001');
		expect(parseIPv6('2001:db8::1')).toEqual(full);
		expect(parseIPv6('2001:DB8:0:0:0:0:0:1')).toEqual(full);
		expect(parseIPv6('::')).toEqual(Array(16).fill(0));
		expect(parseIPv6('::1')).toEqual([...Array(15).fill(0), 1]);
		expect(parseIPv6('fe80::')).toEqual([0xfe, 0x80, ...Array(14).fill(0)]);
	});

	it('parses an embedded IPv4', () => {
		expect(parseIPv6('::ffff:192.0.2.1')?.slice(10)).toEqual([0xff, 0xff, 192, 0, 2, 1]);
		expect(parseIPv6('64:ff9b::1.2.3.4')?.slice(12)).toEqual([1, 2, 3, 4]);
	});

	it('rejects invalid forms', () => {
		for (const bad of [
			'1::2::3',
			':::',
			'1:2:3:4:5:6:7',
			'1:2:3:4:5:6:7:8:9',
			'1:2:3:4:5:6:7::8',
			'12345::',
			'g::1',
			':1:2:3:4:5:6:7',
			'::1.2.3',
			'1.2.3.4::',
			'fe80::1%eth0'
		]) {
			expect(parseIPv6(bad), bad).toBeNull();
		}
	});
});

describe('formatIPv6', () => {
	it('uses the canonical RFC 5952 form', () => {
		/** @param {string} text */
		const roundTrip = (text) => formatIPv6(/** @type {number[]} */ (parseIPv6(text)));
		expect(roundTrip('2001:0DB8:0000:0000:0000:0000:0000:0001')).toBe('2001:db8::1');
		expect(roundTrip('2001:db8:0:1:0:0:0:1')).toBe('2001:db8:0:1::1');
		expect(roundTrip('2001:db8:0:0:1:0:0:1')).toBe('2001:db8::1:0:0:1');
		expect(roundTrip('2001:db8:0:1:1:1:1:1')).toBe('2001:db8:0:1:1:1:1:1');
		expect(roundTrip('0:0:0:0:0:0:0:0')).toBe('::');
		expect(roundTrip('0:0:0:0:0:0:0:1')).toBe('::1');
		expect(roundTrip('fe80:0:0:0:0:0:0:0')).toBe('fe80::');
	});
});

describe('parseIp', () => {
	it('returns the version and canonical address', () => {
		expect(parseIp(' 8.8.8.8 ')).toMatchObject({ version: 4, address: '8.8.8.8' });
		expect(parseIp('[2001:4860:4860:0:0:0:0:8888]')).toMatchObject({
			version: 6,
			address: '2001:4860:4860::8888'
		});
	});

	it('unwraps IPv4-mapped addresses', () => {
		expect(parseIp('::ffff:1.2.3.4')).toMatchObject({
			version: 4,
			address: '1.2.3.4',
			mapped: true
		});
	});

	it('returns null for non-addresses', () => {
		expect(parseIp('example.com')).toBeNull();
	});
});

describe('parseInput', () => {
	it('recognizes addresses', () => {
		expect(parseInput('1.1.1.1')).toMatchObject({ kind: 'ip', ip: { address: '1.1.1.1' } });
	});

	it('recognizes hostnames and URLs', () => {
		expect(parseInput('Example.COM.')).toEqual({ kind: 'hostname', hostname: 'example.com' });
		expect(parseInput('https://www.example.com:8443/path?q=1')).toEqual({
			kind: 'hostname',
			hostname: 'www.example.com'
		});
		expect(parseInput('example.com/page')).toEqual({ kind: 'hostname', hostname: 'example.com' });
		expect(parseInput('http://[2001:db8::1]/')).toMatchObject({
			kind: 'ip',
			ip: { address: '2001:db8::1' }
		});
	});

	it('reports invalid input', () => {
		expect(parseInput('')).toMatchObject({ kind: 'error' });
		expect(parseInput('999.1.1.1').kind).toBe('error');
		expect(parseInput('1:2:3').kind).toBe('error');
		expect(parseInput('localhost').kind).toBe('error');
		expect(parseInput('not a host').kind).toBe('error');
	});
});

describe('classifyIp', () => {
	/** @param {string} text */
	const classify = (text) => classifyIp(/** @type {any} */ (parseIp(text)).bytes)?.label ?? null;

	it('flags private and special IPv4 ranges', () => {
		expect(classify('10.1.2.3')).toBe('Private');
		expect(classify('172.16.0.1')).toBe('Private');
		expect(classify('172.31.255.255')).toBe('Private');
		expect(classify('192.168.1.1')).toBe('Private');
		expect(classify('127.0.0.1')).toBe('Loopback');
		expect(classify('169.254.10.20')).toBe('Link-local');
		expect(classify('100.64.0.1')).toBe('CGNAT');
		expect(classify('100.127.255.255')).toBe('CGNAT');
		expect(classify('0.0.0.0')).toBe('This network');
		expect(classify('192.0.2.5')).toBe('Documentation');
		expect(classify('198.19.0.1')).toBe('Benchmarking');
		expect(classify('224.0.0.251')).toBe('Multicast');
		expect(classify('255.255.255.255')).toBe('Broadcast');
		expect(classify('250.1.1.1')).toBe('Reserved');
	});

	it('treats public IPv4 addresses as public', () => {
		for (const ip of [
			'8.8.8.8',
			'1.1.1.1',
			'172.32.0.1',
			'172.15.255.255',
			'100.128.0.1',
			'192.169.0.1'
		]) {
			expect(classify(ip), ip).toBeNull();
		}
	});

	it('flags special IPv6 ranges', () => {
		expect(classify('::1')).toBe('Loopback');
		expect(classify('::')).toBe('Unspecified');
		expect(classify('fe80::1')).toBe('Link-local');
		expect(classify('febf::1')).toBe('Link-local');
		expect(classify('fd12:3456::1')).toBe('Private');
		expect(classify('fc00::1')).toBe('Private');
		expect(classify('2001:db8::1')).toBe('Documentation');
		expect(classify('ff02::1')).toBe('Multicast');
		expect(classify('::ffff:192.168.0.1')).toBe('Private');
		expect(classify('4000::1')).toBe('Reserved');
	});

	it('treats global unicast IPv6 as public', () => {
		expect(classify('2001:4860:4860::8888')).toBeNull();
		expect(classify('2a00:1450:4001::1')).toBeNull();
	});
});
