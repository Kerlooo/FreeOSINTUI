import { describe, expect, it } from 'vitest';
import { findMatches, identifyHash, normalizeHash } from './identify.js';

describe('identifyHash', () => {
	it('identifies hex digests by length', () => {
		expect(identifyHash('900150983cd24fb0d6963f7d28e17f72')).toContain('MD5');
		expect(identifyHash('A9993E364706816ABA3E25717850C26C9CD0D89D')).toContain('SHA-1');
		expect(
			identifyHash('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
		).toContain('SHA-256');
	});

	it('identifies crypt formats', () => {
		expect(identifyHash('$2b$12$KIXQJ1qQ2e0e7e6j8Zb9UeWz1QmZ8e1vY6x3x9wZkq7o8b1c2d3eG')).toEqual([
			'bcrypt'
		]);
		expect(identifyHash('$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA')).toEqual(['Argon2']);
	});

	it('returns nothing for unknown input', () => {
		expect(identifyHash('')).toEqual([]);
		expect(identifyHash('not a hash')).toEqual([]);
		expect(identifyHash('abc')).toEqual([]);
	});
});

describe('normalizeHash', () => {
	it('trims, removes whitespace and lowercases', () => {
		expect(normalizeHash('  AB CD\nEF ')).toBe('abcdef');
	});
});

describe('findMatches', () => {
	const digests = { md5: 'aaa', sha1: 'bbb', crc32: 'aaa' };

	it('returns every algorithm with an equal digest', () => {
		expect(findMatches(' AAA ', digests)).toEqual(['md5', 'crc32']);
	});

	it('returns nothing when empty or different', () => {
		expect(findMatches('', digests)).toEqual([]);
		expect(findMatches('ccc', digests)).toEqual([]);
	});
});
