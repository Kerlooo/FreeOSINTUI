import { describe, expect, it } from 'vitest';
import { googleSearchUrl } from '$lib/search.js';
import { generateDorks } from './generate.js';
import { TARGET_TYPES } from './targets.js';

const queries = (result) => result.groups.flatMap((group) => group.dorks.map((dork) => dork.query));
const group = (result, id) => result.groups.find((g) => g.id === id);

describe('generateDorks', () => {
	it('returns nothing for empty input', () => {
		expect(generateDorks('username', '   ')).toEqual({ error: null, target: null, groups: [] });
	});

	it('rejects an unknown type', () => {
		expect(() => generateDorks('nope', 'x')).toThrow();
	});

	it.each(TARGET_TYPES.map((t) => [t.id, t.placeholder]))(
		'builds a Social group with YouTube and Reddit for %s',
		(type, sample) => {
			const social = group(generateDorks(type, sample), 'social');
			const ids = social.dorks.map((dork) => dork.id);
			expect(ids).toContain('youtube');
			expect(ids).toContain('reddit');
		}
	);

	it('gives every dork a Google search link for its query', () => {
		const result = generateDorks('email', 'John.Doe@Example.com');
		for (const dork of result.groups.flatMap((g) => g.dorks)) {
			expect(dork.url).toBe(googleSearchUrl(dork.query));
		}
		expect(queries(result)).toContain('site:youtube.com "john.doe@example.com"');
		expect(queries(result)).toContain('"john.doe" -"john.doe@example.com"');
	});

	it('only builds site exposure dorks for domains', () => {
		expect(group(generateDorks('username', 'johndoe'), 'exposure')).toBeUndefined();
		const result = generateDorks('domain', 'https://www.Example.com/path?x=1');
		expect(result.target.value).toBe('example.com');
		expect(group(result, 'exposure').dorks.map((d) => d.query)).toContain(
			'site:*.example.com -site:www.example.com'
		);
		expect(group(result, 'documents').dorks[0].query).toBe('site:example.com filetype:pdf');
	});
});

describe('target normalization', () => {
	it('strips a leading @ from usernames and removes quotes', () => {
		const result = generateDorks('username', ' @jo"hn ');
		expect(result.target.value).toBe('john');
		expect(queries(result)).toContain('inurl:john');
	});

	it('searches a two-word name in both orders', () => {
		expect(queries(generateDorks('name', 'Mario   Rossi'))).toEqual(
			expect.arrayContaining(['"Mario Rossi"', '"Rossi Mario"'])
		);
	});

	it('searches a phone number as typed and as digits', () => {
		expect(generateDorks('phone', '+39 333 123 4567').target.exact).toBe(
			'("+39 333 123 4567" OR "393331234567" OR "+393331234567")'
		);
		expect(generateDorks('phone', '3331234567').target.exact).toBe('"3331234567"');
	});

	it('reports invalid input', () => {
		expect(generateDorks('email', 'not-an-email').error).toMatch(/email/i);
		expect(generateDorks('phone', 'abc123').error).toMatch(/phone/i);
		expect(generateDorks('domain', 'not a domain').error).toMatch(/domain/i);
	});
});

describe('googleSearchUrl', () => {
	it('encodes the query', () => {
		expect(googleSearchUrl('site:x.com "a b"')).toBe(
			'https://www.google.com/search?q=site%3Ax.com%20%22a%20b%22'
		);
	});
});
