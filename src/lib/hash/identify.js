import { t } from '$lib/i18n/i18n.svelte.js';

/**
 * Candidate algorithms for plain hex digests, by digest length.
 * Names with words to translate are `{ key }` objects, resolved by identifyHash().
 */
const HEX_CANDIDATES = {
	8: ['CRC32', 'Adler-32'],
	16: ['MySQL 3.x', 'CRC64', 'Half MD5'],
	32: ['MD5', 'NTLM', 'MD4', 'LM'],
	40: ['SHA-1', 'RIPEMD-160', { key: 'hash.candidate.mysqlNoStar' }],
	56: ['SHA-224', 'SHA3-224'],
	64: ['SHA-256', 'SHA3-256', 'BLAKE3', 'BLAKE2s-256', 'Keccak-256'],
	96: ['SHA-384', 'SHA3-384'],
	128: ['SHA-512', 'SHA3-512', 'BLAKE2b-512', 'Whirlpool']
};

/** Formats recognized by their prefix or structure, checked in order. */
const PATTERNS = [
	{ regex: /^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/, names: ['bcrypt'] },
	{ regex: /^\$argon2(id|i|d)\$/, names: ['Argon2'] },
	{ regex: /^\$1\$[^$]{0,8}\$[./A-Za-z0-9]{22}$/, names: ['MD5-crypt (Unix)'] },
	{ regex: /^\$5\$(rounds=\d+\$)?[^$]{0,16}\$[./A-Za-z0-9]{43}$/, names: ['SHA-256-crypt (Unix)'] },
	{ regex: /^\$6\$(rounds=\d+\$)?[^$]{0,16}\$[./A-Za-z0-9]{86}$/, names: ['SHA-512-crypt (Unix)'] },
	{ regex: /^\$apr1\$[^$]{0,8}\$[./A-Za-z0-9]{22}$/, names: ['Apache APR1-MD5'] },
	{ regex: /^\$y\$/, names: ['yescrypt'] },
	{ regex: /^\*[0-9A-Fa-f]{40}$/, names: ['MySQL 4.1+'] }
];

/**
 * Normalizes a hex digest for comparison: trims, removes inner whitespace, lowercases.
 * @param {string} value
 */
export function normalizeHash(value) {
	return value.trim().replace(/\s+/g, '').toLowerCase();
}

/**
 * Returns the names of the algorithms that could have produced `value`.
 * @param {string} value
 * @returns {string[]}
 */
export function identifyHash(value) {
	const trimmed = value.trim();
	if (!trimmed) return [];

	const pattern = PATTERNS.find(({ regex }) => regex.test(trimmed));
	if (pattern) return pattern.names;

	const hex = normalizeHash(trimmed);
	if (/^[0-9a-f]+$/.test(hex)) {
		return (HEX_CANDIDATES[hex.length] ?? []).map((name) =>
			typeof name === 'string' ? name : t(name.key)
		);
	}

	return [];
}

/**
 * Returns the ids of the computed digests equal to `expected`.
 * @param {string} expected
 * @param {Record<string, string>} digests `{ [algorithmId]: hexDigest }`
 */
export function findMatches(expected, digests) {
	const target = normalizeHash(expected);
	if (!target) return [];
	return Object.keys(digests).filter((id) => digests[id] === target);
}
