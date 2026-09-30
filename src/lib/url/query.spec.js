import { describe, expect, it } from 'vitest';
import {
	cleanTracking,
	decodeBase64,
	decodeEmbeddedUrl,
	decodeUrlDefense,
	extractEmbedded,
	isTrackingParam,
	knownRedirector,
	queryParams,
	redirectChain
} from './query.js';

describe('tracking parameters', () => {
	it('recognizes generic and site-specific trackers', () => {
		expect(isTrackingParam('utm_source', 'example.com')).toBe(true);
		expect(isTrackingParam('fbclid', 'example.com')).toBe(true);
		expect(isTrackingParam('GCLID', 'example.com')).toBe(true);
		expect(isTrackingParam('si', 'youtu.be')).toBe(true);
		expect(isTrackingParam('si', 'example.com')).toBe(false);
		expect(isTrackingParam('id', 'example.com')).toBe(false);
	});

	it('removes them and keeps the rest', () => {
		const url = new URL('https://example.com/a?id=5&utm_source=x&utm_medium=y&fbclid=abc#top');
		expect(cleanTracking(url)).toEqual({
			url: 'https://example.com/a?id=5#top',
			removed: ['utm_source', 'utm_medium', 'fbclid']
		});
	});

	it('drops the question mark when nothing is left', () => {
		const url = new URL('https://youtu.be/dQw4w9WgXcQ?si=abcdef');
		expect(cleanTracking(url).url).toBe('https://youtu.be/dQw4w9WgXcQ');
	});

	it('returns the URL unchanged without trackers', () => {
		const url = new URL('https://example.com/?a=1+2');
		expect(cleanTracking(url)).toEqual({ url: url.href, removed: [] });
	});
});

describe('decodeEmbeddedUrl', () => {
	it('reads plain, percent-encoded and base64 URLs', () => {
		expect(decodeEmbeddedUrl('https://evil.com/x')).toEqual({
			url: 'https://evil.com/x',
			encoding: 'plain'
		});
		expect(decodeEmbeddedUrl('https%3A%2F%2Fevil.com%2Fx')).toEqual({
			url: 'https://evil.com/x',
			encoding: 'percent'
		});
		expect(decodeEmbeddedUrl('https%253A%252F%252Fevil.com')?.url).toBe('https://evil.com');
		expect(decodeEmbeddedUrl(btoa('https://evil.com/login'))).toEqual({
			url: 'https://evil.com/login',
			encoding: 'base64'
		});
		expect(decodeEmbeddedUrl('aHR0cHM6Ly9ldmlsLmNvbS8_YT0x')?.url).toBe('https://evil.com/?a=1');
		expect(decodeEmbeddedUrl('//evil.com/path')?.url).toBe('https://evil.com/path');
	});

	it('ignores other values', () => {
		expect(decodeEmbeddedUrl('hello')).toBeNull();
		expect(decodeEmbeddedUrl('/relative/path')).toBeNull();
		expect(decodeEmbeddedUrl('dGhpcyBpcyBub3QgYSB1cmw=')).toBeNull();
		expect(decodeEmbeddedUrl('javascript:alert(1)')).toBeNull();
	});

	it('decodes base64url', () => {
		expect(decodeBase64('aGk_')).toBe('hi?');
		expect(decodeBase64('!!!')).toBeNull();
	});
});

describe('URL Defense', () => {
	it('decodes v2 links', () => {
		const url = new URL(
			'https://urldefense.proofpoint.com/v2/url?u=http-3A__www.example.com_path-3Fa-3D1&d=DwMF&c=x'
		);
		expect(decodeUrlDefense(url)).toBe('http://www.example.com/path?a=1');
	});

	it('decodes v3 links', () => {
		const url = new URL(
			'https://urldefense.com/v3/__https://google.com:443/search?q=a*test&gs=ps__;Kw!-612Flbf0JvQ3kNJkRi5Jg!Ue6tQudNKaShHg93trcdjqDP8se2ySE65jyCIe2K1D_uNjZ1Lnf6YLQERujngZv9UWf66ujQIQ$'
		);
		expect(decodeUrlDefense(url)).toBe('https://google.com:443/search?q=a+test&gs=ps');
	});

	it('ignores other hosts', () => {
		expect(decodeUrlDefense(new URL('https://example.com/v3/__x__;!'))).toBeNull();
	});
});

describe('embedded redirects', () => {
	it('finds known redirector targets', () => {
		const google = new URL('https://www.google.com/url?sa=t&q=https://evil.com/&usg=x');
		expect(knownRedirector(google)).toBe('google');
		expect(extractEmbedded(google)).toEqual([
			{
				param: 'q',
				source: 'query',
				url: 'https://evil.com/',
				encoding: 'plain',
				redirectParam: true
			}
		]);

		const fb = new URL('https://l.facebook.com/l.php?u=https%3A%2F%2Fevil.com%2Fx&h=AT0');
		expect(knownRedirector(fb)).toBe('facebook');
		expect(extractEmbedded(fb)[0].url).toBe('https://evil.com/x');

		const safe = new URL(
			'https://eur01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fevil.com%2F&data=05%7C01'
		);
		expect(knownRedirector(safe)).toBe('safelinks');
		expect(extractEmbedded(safe)[0].url).toBe('https://evil.com/');
	});

	it('finds URL Defense wrapper targets', () => {
		const url = new URL('https://urldefense.proofpoint.com/v2/url?u=https-3A__evil.com_&d=x');
		expect(extractEmbedded(url)[0]).toMatchObject({ source: 'wrapper', url: 'https://evil.com/' });
	});

	it('finds redirect parameters in the fragment and flags non-redirect names', () => {
		const url = new URL(
			'https://example.com/login?img=https://cdn.example.com/a.png#next=https://evil.com'
		);
		const found = extractEmbedded(url);
		expect(found.map((e) => [e.source, e.param, e.redirectParam])).toEqual([
			['query', 'img', false],
			['fragment', 'next', true]
		]);
	});

	it('follows nested and encoded redirects offline', () => {
		const inner = 'https://l.facebook.com/l.php?u=' + encodeURIComponent('https://evil.com/final');
		const url = new URL('https://www.google.com/url?q=' + encodeURIComponent(inner));
		expect(redirectChain(url)).toEqual([inner, 'https://evil.com/final']);
	});

	it('follows base64 redirect parameters', () => {
		const url = new URL(`https://example.com/r?redirect=${btoa('https://evil.com/x')}`);
		expect(redirectChain(url)).toEqual(['https://evil.com/x']);
	});

	it('lists query parameters with flags', () => {
		const url = new URL('https://example.com/?utm_source=a&next=https%3A%2F%2Fevil.com&x=1');
		expect(queryParams(url)).toEqual([
			{ name: 'utm_source', value: 'a', tracking: true, embedded: null },
			{ name: 'next', value: 'https://evil.com', tracking: false, embedded: 'https://evil.com' },
			{ name: 'x', value: '1', tracking: false, embedded: null }
		]);
	});
});
