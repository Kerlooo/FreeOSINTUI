import { describe, expect, it } from 'vitest';
import { murmur3 } from './mmh3.js';
import { base64Lines, faviconHashes, searchLinks, shodanFaviconHash } from './hash.js';

const text = (/** @type {string} */ value) => new TextEncoder().encode(value);
const allBytes = Uint8Array.from({ length: 256 }, (_, i) => i);

describe('murmur3', () => {
	// Reference values from Python's mmh3.hash().
	it.each([
		['', 0],
		['a', 1009084850],
		['ab', -1681926305],
		['abc', -1277324294],
		['abcd', 1139631978],
		['abcde', -392455434],
		['hello', 613153351],
		['The quick brown fox jumps over the lazy dog', 776992547]
	])('hashes %j', (input, expected) => {
		expect(murmur3(text(input))).toBe(expected);
	});
});

describe('base64Lines', () => {
	it('wraps at 76 characters with a trailing newline like base64.encodebytes', () => {
		const encoded = base64Lines(allBytes);
		const lines = encoded.split('\n');
		expect(encoded.endsWith('\n')).toBe(true);
		expect(lines.slice(0, -2).every((line) => line.length === 76)).toBe(true);
		expect(lines[0]).toBe(
			'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4'
		);
		expect(encoded.length).toBe(349);
	});

	it('returns an empty string for empty input', () => {
		expect(base64Lines(new Uint8Array())).toBe('');
	});

	it('adds a single trailing newline to short input', () => {
		expect(base64Lines(text('hi'))).toBe('aGk=\n');
	});
});

describe('shodanFaviconHash', () => {
	// Cross-checked with Python: mmh3.hash(base64.encodebytes(data)).
	it('matches Python for bytes 0..255', () => {
		expect(shodanFaviconHash(allBytes)).toBe(-757223386);
	});

	it('matches Python for a repeated ICO-like header', () => {
		const data = new Uint8Array(160);
		const pattern = [0, 0, 1, 0, 1, 0, 16, 16];
		data.forEach((_, i) => (data[i] = pattern[i % 8]));
		expect(shodanFaviconHash(data)).toBe(220231437);
	});
});

describe('faviconHashes', () => {
	it('computes mmh3, MD5 and SHA-256', async () => {
		expect(await faviconHashes(allBytes)).toEqual({
			mmh3: -757223386,
			md5: 'e2c865db4162bed963bfaa9ef6ac18f0',
			sha256: '40aff2e9d2d8922e47afd4648e6967497158785fbd1da870e7110266bf944880'
		});
	});
});

describe('searchLinks', () => {
	const links = searchLinks({ mmh3: -757223386, md5: 'abc123', sha256: 'def456' });
	const byId = Object.fromEntries(links.map((link) => [link.id, link]));

	it('builds the Shodan query', () => {
		expect(byId.shodan.query).toBe('http.favicon.hash:-757223386');
		expect(byId.shodan.url).toBe(
			'https://www.shodan.io/search?query=http.favicon.hash%3A-757223386'
		);
	});

	it('base64-encodes the FOFA query', () => {
		expect(byId.fofa.url).toBe(
			'https://en.fofa.info/result?qbase64=aWNvbl9oYXNoPSItNzU3MjIzMzg2Ig%3D%3D'
		);
	});

	it('uses the MD5 for ZoomEye and Censys and SHA-256 for urlscan.io', () => {
		expect(byId.zoomeye.query).toBe('iconhash="abc123"');
		expect(atob(decodeURIComponent(byId.zoomeye.url.split('q=')[1]))).toBe('iconhash="abc123"');
		expect(byId.censys.query).toContain('host.services.endpoints.http.favicons.hash_md5="abc123"');
		expect(byId.urlscan.url).toBe('https://urlscan.io/search/#hash%3Adef456');
	});
});
