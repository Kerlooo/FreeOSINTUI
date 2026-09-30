import { describe, expect, it } from 'vitest';
import { decodeLabel, encodeLabel, toAscii, toUnicode } from './punycode.js';
import { isValidDomain, isValidLabel, parseDomain, splitDomain } from './domain.js';
import { GENERATORS, countByType, generateLookalikes, pickForResolution } from './generators.js';
import { mailHosts, resolveAll, resolveLookalike } from './resolve.js';

/** @param {string} id @param {string} name @param {string} [suffix] */
const build = (id, name, suffix = 'com') =>
	/** @type {NonNullable<ReturnType<typeof GENERATORS.find>>} */ (
		GENERATORS.find((generator) => generator.id === id)
	).build(name, suffix);

describe('punycode', () => {
	// Reference values from Python's str.encode('punycode').
	it.each([
		['bücher', 'bcher-kva'],
		['аpple', 'pple-43d'],
		['аррӏе', '80ak6aa92e'],
		['gооgle', 'ggle-55da'],
		['παράδειγμα', 'hxajbheg2az3al'],
		['münchen-ost', 'mnchen-ost-9db'],
		['日本語', 'wgv71a119e']
	])('encodes and decodes %s', (unicode, puny) => {
		expect(encodeLabel(unicode)).toBe(puny);
		expect(decodeLabel(puny)).toBe(unicode);
	});

	it('converts whole domains label by label', () => {
		expect(toAscii('аррӏе.com')).toBe('xn--80ak6aa92e.com');
		expect(toUnicode('xn--80ak6aa92e.com')).toBe('аррӏе.com');
		expect(toUnicode('xn--!!.com')).toBe('xn--!!.com');
	});
});

describe('domain validity', () => {
	it('checks labels', () => {
		expect(isValidLabel('example')).toBe(true);
		expect(isValidLabel('ex-ample')).toBe(true);
		expect(isValidLabel('-example')).toBe(false);
		expect(isValidLabel('example-')).toBe(false);
		expect(isValidLabel('')).toBe(false);
		expect(isValidLabel('a'.repeat(63))).toBe(true);
		expect(isValidLabel('a'.repeat(64))).toBe(false);
		expect(isValidLabel('ab--cd')).toBe(false);
		expect(isValidLabel('xn--bcher-kva')).toBe(true);
		expect(isValidLabel('ex_ample')).toBe(false);
	});

	it('checks domains', () => {
		expect(isValidDomain('example.com')).toBe(true);
		expect(isValidDomain('com')).toBe(false);
		expect(isValidDomain('ex..com')).toBe(false);
	});
});

describe('parseDomain', () => {
	it('strips scheme, path, port, www and subdomains', () => {
		expect(parseDomain(' HTTPS://www.Example.com:8443/login?x=1 ')).toMatchObject({
			domain: 'example.com',
			name: 'example',
			suffix: 'com'
		});
		expect(parseDomain('mail.google.com')).toMatchObject({ domain: 'google.com' });
	});

	it('handles multi-part public suffixes', () => {
		expect(splitDomain('shop.bbc.co.uk')).toEqual({
			subdomain: 'shop',
			name: 'bbc',
			suffix: 'co.uk'
		});
		expect(parseDomain('www.bbc.co.uk')).toMatchObject({ domain: 'bbc.co.uk', suffix: 'co.uk' });
		expect(parseDomain('example.com.br')).toMatchObject({ name: 'example', suffix: 'com.br' });
		expect(parseDomain('co.uk')).toMatchObject({ domain: 'co.uk', name: 'co', suffix: 'uk' });
	});

	it('converts IDN input to punycode and keeps the Unicode form', () => {
		expect(parseDomain('Bücher.de')).toMatchObject({
			domain: 'xn--bcher-kva.de',
			unicode: 'bücher.de',
			name: 'bücher'
		});
	});

	it('rejects invalid input and IP addresses', () => {
		expect(parseDomain('').error).toBeTruthy();
		expect(parseDomain('localhost').error).toBeTruthy();
		expect(parseDomain('exa mple.com').error).toBeTruthy();
		expect(parseDomain('1.2.3.4').error).toBeTruthy();
	});
});

describe('generators', () => {
	it('omission', () => {
		expect(build('omission', 'abc')).toEqual(['bc.com', 'ac.com', 'ab.com']);
	});

	it('repetition', () => {
		expect(build('repetition', 'ab')).toEqual(['aab.com', 'abb.com']);
	});

	it('transposition skips identical neighbours', () => {
		expect(build('transposition', 'abb')).toEqual(['bab.com']);
	});

	it('replacement uses QWERTY neighbours', () => {
		expect(build('replacement', 'p')).toEqual(['l.com', 'o.com', '0.com']);
	});

	it('insertion adds neighbours before and after', () => {
		expect(build('insertion', 'p')).toEqual([
			'lp.com',
			'pl.com',
			'op.com',
			'po.com',
			'0p.com',
			'p0.com'
		]);
	});

	it('bitsquatting flips one bit and keeps valid characters', () => {
		// 'a' is 0x61: the flips giving '`', 'A', '!' and 0xE1 are dropped.
		expect(build('bitsquatting', 'a')).toEqual(['c.com', 'e.com', 'i.com', 'q.com']);
	});

	it('ASCII homoglyphs', () => {
		const out = build('homoglyph', 'modern');
		expect(out).toContain('rnodern.com');
		expect(out).toContain('modem.com');
		expect(out).toContain('m0dern.com');
	});

	it('IDN homoglyphs, single letters and whole name', () => {
		const out = build('idn', 'apple');
		expect(out[0]).toBe('аррӏе.com');
		expect(out).toContain('аpple.com');
	});

	it('hyphenation and subdomain insertion', () => {
		expect(build('hyphenation', 'abc')).toEqual(['a-bc.com', 'ab-c.com']);
		expect(build('subdomain', 'abc')).toEqual(['a.bc.com', 'ab.c.com']);
	});

	it('vowel swap', () => {
		expect(build('vowel', 'ba')).toEqual(['be.com', 'bi.com', 'bo.com', 'bu.com']);
	});

	it('addition of words', () => {
		const out = build('addition', 'acme');
		expect(out).toContain('acme-login.com');
		expect(out).toContain('secureacme.com');
		expect(out).toContain('wwwacme.com');
	});

	it('TLD swap skips the current suffix', () => {
		const out = build('tld', 'acme', 'com');
		expect(out).toContain('acme.net');
		expect(out).toContain('acme.co.uk');
		expect(out).not.toContain('acme.com');
	});
});

describe('generateLookalikes', () => {
	const parsed = /** @type {any} */ (parseDomain('example.com'));
	const all = generateLookalikes(parsed);

	it('dedupes, drops invalid names and excludes the original', () => {
		const domains = all.map((candidate) => candidate.domain);
		expect(new Set(domains).size).toBe(domains.length);
		expect(domains).not.toContain('example.com');
		expect(domains.every(isValidDomain)).toBe(true);
		expect(domains).not.toContain('-example.com');
	});

	it('shows IDN candidates in Unicode with a punycode domain', () => {
		const idn = all.find((candidate) => candidate.unicode === 'exаmple.com');
		expect(idn).toMatchObject({ domain: 'xn--exmple-4nf.com', type: 'idn' });
	});

	it('keeps the highest priority type for duplicates', () => {
		// "g0ogle" is both an ASCII homoglyph (o → 0) and a QWERTY replacement; homoglyph comes first.
		const google = generateLookalikes(/** @type {any} */ (parseDomain('google.com')));
		expect(google.find((candidate) => candidate.domain === 'g0ogle.com')?.type).toBe('homoglyph');
	});

	it('counts per type', () => {
		const counts = countByType(all);
		expect(counts.tld).toBe(27);
		expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(all.length);
	});

	it('picks a capped, round-robin selection of the chosen types', () => {
		const picked = pickForResolution(all, ['tld', 'omission'], 10);
		expect(picked).toHaveLength(10);
		expect(picked.slice(0, 4).map((candidate) => candidate.type)).toEqual([
			'tld',
			'omission',
			'tld',
			'omission'
		]);
		expect(pickForResolution(all, ['tld'], 300)).toHaveLength(27);
	});
});

/** Fake DoH server: `zones` maps "name/TYPE" to answers data. */
function fakeDoh(
	/** @type {Record<string, string[]>} */ zones,
	calls = /** @type {string[]} */ ([])
) {
	const codes = { A: 1, NS: 2, MX: 15, AAAA: 28 };
	return /** @type {typeof fetch} */ (
		async (input) => {
			const url = new URL(String(input));
			const name = /** @type {string} */ (url.searchParams.get('name'));
			const type = /** @type {keyof typeof codes} */ (url.searchParams.get('type'));
			calls.push(`${name}/${type}`);
			const data = zones[`${name}/${type}`];
			const body = data
				? {
						Status: 0,
						Answer: data.map((value) => ({
							name: `${name}.`,
							type: codes[type],
							TTL: 60,
							data: value
						}))
					}
				: { Status: 3 };
			return new Response(JSON.stringify(body), { status: 200 });
		}
	);
}

describe('resolution', () => {
	it('parses MX answers and drops null MX', () => {
		expect(mailHosts([{ data: '10 mx.example.com.' }, { data: '0 .' }])).toEqual([
			'mx.example.com'
		]);
	});

	it('resolves A, AAAA, MX and NS for a registered name', async () => {
		const fetch = fakeDoh({
			'examp1e.com/A': ['192.0.2.1'],
			'examp1e.com/NS': ['ns1.host.net.'],
			'examp1e.com/MX': ['10 mail.examp1e.com.'],
			'examp1e.com/AAAA': ['2001:db8::1']
		});
		expect(await resolveLookalike('examp1e.com', { fetch })).toEqual({
			a: ['192.0.2.1'],
			aaaa: ['2001:db8::1'],
			mx: ['mail.examp1e.com'],
			ns: ['ns1.host.net'],
			registered: true
		});
	});

	it('skips MX and AAAA when there is neither A nor NS', async () => {
		/** @type {string[]} */
		const calls = [];
		const result = await resolveLookalike('nothing.com', { fetch: fakeDoh({}, calls) });
		expect(result.registered).toBe(false);
		expect(calls.sort()).toEqual(['nothing.com/A', 'nothing.com/NS']);
	});

	it('resolves a list with a pool and reports errors per domain', async () => {
		const base = fakeDoh({ 'a.com/NS': ['ns.a.com.'] });
		const fetch = /** @type {typeof globalThis.fetch} */ (
			async (input, init) => {
				if (String(input).includes('broken.com')) return new Response('oops', { status: 500 });
				return base(input, init);
			}
		);
		/** @type {Record<string, boolean>} */
		const results = {};
		/** @type {string[]} */
		const errors = [];
		await resolveAll(['a.com', 'b.com', 'broken.com'], {
			fetch,
			concurrency: 2,
			onResult: (domain, records) => (results[domain] = records.registered),
			onError: (domain) => errors.push(domain)
		});
		expect(results).toEqual({ 'a.com': true, 'b.com': false });
		expect(errors).toEqual(['broken.com']);
	});
});
