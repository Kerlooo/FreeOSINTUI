import { describe, expect, it } from 'vitest';
import { cleanNames, findSubdomains, parseCertSpotter, parseCrtSh } from './subdomains.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

describe('cleanNames', () => {
	it('lowercases, drops wildcards, apex, foreign and invalid names, dedupes and sorts', () => {
		expect(
			cleanNames(
				[
					'*.Example.com',
					'b.example.com',
					'A.example.com',
					'a.example.com',
					'x.a.example.com',
					'example.com',
					'evil-example.com',
					'user@mail.example.com',
					'notexample.com'
				],
				'example.com'
			)
		).toEqual(['a.example.com', 'x.a.example.com', 'b.example.com']);
	});
});

describe('parsers', () => {
	it('splits crt.sh name_value on newlines', () => {
		expect(
			parseCrtSh(
				[{ common_name: 'www.example.com', name_value: 'www.example.com\n*.api.example.com' }],
				'example.com'
			)
		).toEqual(['api.example.com', 'www.example.com']);
	});

	it('reads Cert Spotter dns_names', () => {
		expect(
			parseCertSpotter(
				[{ dns_names: ['example.com', 'mail.example.com', 'example.org'] }],
				'example.com'
			)
		).toEqual(['mail.example.com']);
	});

	it('rejects non-array answers', () => {
		expect(() => parseCrtSh({ code: 'x' }, 'example.com')).toThrow();
	});
});

describe('findSubdomains', () => {
	it('uses crt.sh when it answers', async () => {
		const result = await findSubdomains('example.com', {
			fetch: async () => json([{ name_value: 'www.example.com' }])
		});
		expect(result).toEqual({
			names: ['www.example.com'],
			source: 'crt.sh',
			partial: false,
			fallbackReason: null
		});
	});

	it('falls back to Cert Spotter when crt.sh fails', async () => {
		const urls = [];
		const result = await findSubdomains('example.com', {
			fetch: async (url) => {
				urls.push(url);
				return url.startsWith('https://crt.sh')
					? new Response('Bad Gateway', { status: 502 })
					: json([{ dns_names: ['dev.example.com'] }]);
			}
		});
		expect(urls[0]).toBe('https://crt.sh/?q=%25.example.com&output=json');
		expect(result.source).toBe('Cert Spotter');
		expect(result.partial).toBe(true);
		expect(result.names).toEqual(['dev.example.com']);
		expect(result.fallbackReason).toMatch(/HTTP 502/);
	});

	it('throws when both sources fail', async () => {
		await expect(
			findSubdomains('example.com', { fetch: async () => new Response('', { status: 503 }) })
		).rejects.toThrow(/api.certspotter.com/);
	});
});
