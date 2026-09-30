import { t } from '$lib/i18n/i18n.svelte.js';
import { isValidDomain } from './domain.js';
import { toAscii } from './punycode.js';

/** Neighbouring keys on a QWERTY keyboard (digits row included). */
export const QWERTY = {
	1: '2q',
	2: '3wq1',
	3: '4ew2',
	4: '5re3',
	5: '6tr4',
	6: '7yt5',
	7: '8uy6',
	8: '9iu7',
	9: '0oi8',
	0: 'po9',
	q: '12wa',
	w: '3esaq2',
	e: '4rdsw3',
	r: '5tfde4',
	t: '6ygfr5',
	y: '7uhgt6',
	u: '8ijhy7',
	i: '9okju8',
	o: '0plki9',
	p: 'lo0',
	a: 'qwsz',
	s: 'edxzaw',
	d: 'rfcxse',
	f: 'tgvcdr',
	g: 'yhbvft',
	h: 'ujnbgy',
	j: 'ikmnhu',
	k: 'olmji',
	l: 'kop',
	z: 'asx',
	x: 'zsdc',
	c: 'xdfv',
	v: 'cfgb',
	b: 'vghn',
	n: 'bhjm',
	m: 'njk'
};

/** ASCII sequences that look alike in most fonts, both directions listed. */
export const ASCII_HOMOGLYPHS = [
	['rn', 'm'],
	['m', 'rn'],
	['nn', 'm'],
	['vv', 'w'],
	['w', 'vv'],
	['cl', 'd'],
	['d', 'cl'],
	['l', '1'],
	['1', 'l'],
	['i', '1'],
	['l', 'i'],
	['i', 'l'],
	['o', '0'],
	['0', 'o'],
	['u', 'v'],
	['v', 'u'],
	['g', 'q'],
	['q', 'g']
];

/** Cyrillic and Greek letters that look like Latin ones (IDN homograph attacks). */
export const IDN_HOMOGLYPHS = {
	a: ['а'],
	c: ['с', 'ϲ'],
	d: ['ԁ'],
	e: ['е'],
	h: ['һ'],
	i: ['і'],
	j: ['ј'],
	k: ['κ'],
	l: ['ӏ'],
	o: ['о', 'ο'],
	p: ['р', 'ρ'],
	q: ['ԛ'],
	s: ['ѕ'],
	v: ['ν'],
	w: ['ԝ'],
	x: ['х'],
	y: ['у']
};

/** Top-level domains tried by the TLD swap. */
export const COMMON_TLDS = [
	'com',
	'net',
	'org',
	'info',
	'biz',
	'io',
	'co',
	'us',
	'uk',
	'co.uk',
	'de',
	'fr',
	'it',
	'es',
	'nl',
	'eu',
	'ru',
	'cn',
	'ch',
	'be',
	'xyz',
	'online',
	'site',
	'top',
	'app',
	'dev',
	'shop',
	'me'
];

/** Words phishers add to a brand name. */
export const ADDED_WORDS = [
	'login',
	'secure',
	'account',
	'support',
	'app',
	'verify',
	'online',
	'mail'
];

const VOWELS = 'aeiou';

/** @param {string} name @param {(chars: string[], i: number) => string[]} each */
function perPosition(name, each) {
	const chars = Array.from(name);
	return chars.flatMap((_, i) => each(chars, i));
}

/** @param {string[]} chars @param {number} i @param {string} value */
const replaceAt = (chars, i, value) =>
	[...chars.slice(0, i), value, ...chars.slice(i + 1)].join('');

/**
 * Permutation types in resolution priority order. `build(name, suffix)` returns candidate
 * domains in Unicode form; invalid ones are filtered out later.
 * @type {{ id: string, readonly label: string, readonly description: string, build: (name: string, suffix: string) => string[] }[]}
 */
export const GENERATORS = [
	{
		id: 'tld',
		build: (name, suffix) =>
			COMMON_TLDS.filter((tld) => tld !== suffix).map((tld) => `${name}.${tld}`)
	},
	{
		id: 'homoglyph',
		build: (name, suffix) =>
			ASCII_HOMOGLYPHS.flatMap(([from, to]) => {
				const out = [];
				for (let i = name.indexOf(from); i !== -1; i = name.indexOf(from, i + 1))
					out.push(`${name.slice(0, i)}${to}${name.slice(i + from.length)}.${suffix}`);
				return out;
			})
	},
	{
		id: 'omission',
		build: (name, suffix) =>
			perPosition(name, (chars, i) => [`${replaceAt(chars, i, '')}.${suffix}`])
	},
	{
		id: 'repetition',
		build: (name, suffix) =>
			perPosition(name, (chars, i) => [`${replaceAt(chars, i, chars[i] + chars[i])}.${suffix}`])
	},
	{
		id: 'transposition',
		build: (name, suffix) =>
			perPosition(name, (chars, i) => {
				if (i === chars.length - 1 || chars[i] === chars[i + 1]) return [];
				const swapped = [...chars];
				[swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
				return [`${swapped.join('')}.${suffix}`];
			})
	},
	{
		id: 'replacement',
		build: (name, suffix) =>
			perPosition(name, (chars, i) =>
				Array.from(QWERTY[chars[i]] ?? '', (key) => `${replaceAt(chars, i, key)}.${suffix}`)
			)
	},
	{
		id: 'hyphenation',
		build: (name, suffix) =>
			perPosition(name, (chars, i) =>
				i === 0 ? [] : [`${chars.slice(0, i).join('')}-${chars.slice(i).join('')}.${suffix}`]
			)
	},
	{
		id: 'addition',
		build: (name, suffix) =>
			[
				...ADDED_WORDS.flatMap((word) => [
					`${name}-${word}`,
					`${name}${word}`,
					`${word}-${name}`,
					`${word}${name}`
				]),
				`www${name}`,
				`www-${name}`
			].map((label) => `${label}.${suffix}`)
	},
	{
		id: 'vowel',
		build: (name, suffix) =>
			perPosition(name, (chars, i) =>
				VOWELS.includes(chars[i])
					? Array.from(
							VOWELS.replace(chars[i], ''),
							(vowel) => `${replaceAt(chars, i, vowel)}.${suffix}`
						)
					: []
			)
	},
	{
		id: 'idn',
		build: (name, suffix) => {
			const chars = Array.from(name);
			const single = perPosition(name, (_, i) =>
				(IDN_HOMOGLYPHS[chars[i]] ?? []).map((glyph) => `${replaceAt(chars, i, glyph)}.${suffix}`)
			);
			// Whole-name swap (e.g. apple → аррӏе): the classic single-script homograph.
			const whole = chars.every((char) => IDN_HOMOGLYPHS[char] || !/[a-z]/.test(char))
				? [`${chars.map((char) => IDN_HOMOGLYPHS[char]?.[0] ?? char).join('')}.${suffix}`]
				: [];
			return [...whole, ...single];
		}
	},
	{
		id: 'subdomain',
		build: (name, suffix) =>
			perPosition(name, (chars, i) =>
				i === 0 ? [] : [`${chars.slice(0, i).join('')}.${chars.slice(i).join('')}.${suffix}`]
			)
	},
	{
		id: 'insertion',
		build: (name, suffix) =>
			perPosition(name, (chars, i) =>
				Array.from(QWERTY[chars[i]] ?? '', (key) => [
					`${replaceAt(chars, i, key + chars[i])}.${suffix}`,
					`${replaceAt(chars, i, chars[i] + key)}.${suffix}`
				]).flat()
			)
	},
	{
		id: 'bitsquatting',
		build: (name, suffix) =>
			perPosition(name, (chars, i) => {
				const code = chars[i].charCodeAt(0);
				if (code > 0x7f) return [];
				const out = [];
				for (let bit = 0; bit < 8; bit++) {
					const flipped = String.fromCharCode(code ^ (1 << bit));
					if (/[a-z0-9-]/.test(flipped)) out.push(`${replaceAt(chars, i, flipped)}.${suffix}`);
				}
				return out;
			})
	}
].map((generator) => ({
	...generator,
	get label() {
		return t(`lookalike.type.${generator.id}.label`);
	},
	get description() {
		return t(`lookalike.type.${generator.id}.description`);
	}
}));

/**
 * @typedef {{ domain: string, unicode: string, type: string }} Candidate
 * `domain` is the ASCII (Punycode) name, `unicode` how it is displayed.
 */

/**
 * Generates every lookalike of a parsed domain: deduplicated, valid, original excluded.
 * A candidate produced by several generators keeps the first (highest priority) type.
 * @param {{ domain: string, name: string, suffix: string }} parsed
 * @returns {Candidate[]}
 */
export function generateLookalikes({ domain, name, suffix }) {
	const seen = new Set([domain]);
	/** @type {Candidate[]} */
	const out = [];
	for (const generator of GENERATORS) {
		for (const unicode of generator.build(name, suffix)) {
			const ascii = toAscii(unicode);
			if (seen.has(ascii) || !isValidDomain(ascii)) continue;
			seen.add(ascii);
			out.push({ domain: ascii, unicode, type: generator.id });
		}
	}
	return out;
}

/**
 * Number of candidates per type id.
 * @param {Candidate[]} candidates
 */
export function countByType(candidates) {
	/** @type {Record<string, number>} */
	const counts = Object.fromEntries(GENERATORS.map((generator) => [generator.id, 0]));
	for (const candidate of candidates) counts[candidate.type]++;
	return counts;
}

/**
 * Picks at most `limit` candidates of the selected types, taking them in turn from each
 * type (in priority order) so every type is represented when the cap is reached.
 * @param {Candidate[]} candidates
 * @param {string[]} types
 * @param {number} limit
 */
export function pickForResolution(candidates, types, limit) {
	const queues = GENERATORS.filter((generator) => types.includes(generator.id)).map((generator) =>
		candidates.filter((candidate) => candidate.type === generator.id)
	);
	/** @type {Candidate[]} */
	const picked = [];
	for (
		let round = 0;
		picked.length < limit && queues.some((queue) => round < queue.length);
		round++
	) {
		for (const queue of queues) {
			if (round < queue.length && picked.length < limit) picked.push(queue[round]);
		}
	}
	return picked;
}
