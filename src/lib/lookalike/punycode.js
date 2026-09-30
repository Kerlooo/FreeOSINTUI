// Punycode (RFC 3492) for single labels, plus IDNA-style helpers for whole domain names.
// Implemented here because the browser has no toUnicode() and new URL() is too lenient for labels.

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

/** @param {number} delta @param {number} points @param {boolean} first */
function adapt(delta, points, first) {
	delta = first ? Math.floor(delta / DAMP) : delta >> 1;
	delta += Math.floor(delta / points);
	let k = 0;
	while (delta > ((BASE - T_MIN) * T_MAX) >> 1) {
		delta = Math.floor(delta / (BASE - T_MIN));
		k += BASE;
	}
	return k + Math.floor(((BASE - T_MIN + 1) * delta) / (delta + SKEW));
}

/** @param {number} digit */
const encodeDigit = (digit) => String.fromCharCode(digit < 26 ? digit + 97 : digit + 22);

/** @param {number} code */
function decodeDigit(code) {
	if (code >= 48 && code <= 57) return code - 22;
	if (code >= 65 && code <= 90) return code - 65;
	if (code >= 97 && code <= 122) return code - 97;
	return BASE;
}

/**
 * Encodes a Unicode label to raw Punycode (without the `xn--` prefix).
 * @param {string} input
 */
export function encodeLabel(input) {
	const codes = Array.from(input, (char) => /** @type {number} */ (char.codePointAt(0)));
	let output = codes
		.filter((code) => code < 0x80)
		.map((code) => String.fromCharCode(code))
		.join('');
	const basic = output.length;
	let handled = basic;
	if (basic) output += '-';

	let n = INITIAL_N;
	let delta = 0;
	let bias = INITIAL_BIAS;
	while (handled < codes.length) {
		const m = Math.min(...codes.filter((code) => code >= n));
		delta += (m - n) * (handled + 1);
		n = m;
		for (const code of codes) {
			if (code < n) delta++;
			if (code === n) {
				let q = delta;
				for (let k = BASE; ; k += BASE) {
					const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
					if (q < t) break;
					output += encodeDigit(t + ((q - t) % (BASE - t)));
					q = Math.floor((q - t) / (BASE - t));
				}
				output += encodeDigit(q);
				bias = adapt(delta, handled + 1, handled === basic);
				delta = 0;
				handled++;
			}
		}
		delta++;
		n++;
	}
	return output;
}

/**
 * Decodes raw Punycode (without the `xn--` prefix) to Unicode. Throws on invalid input.
 * @param {string} input
 */
export function decodeLabel(input) {
	const end = input.lastIndexOf('-');
	/** @type {number[]} */
	const output = [];
	for (let i = 0; i < Math.max(0, end); i++) {
		const code = input.charCodeAt(i);
		if (code >= 0x80) throw new Error('invalid punycode');
		output.push(code);
	}

	let n = INITIAL_N;
	let bias = INITIAL_BIAS;
	let i = 0;
	for (let index = end > 0 ? end + 1 : 0; index < input.length;) {
		const oldI = i;
		for (let w = 1, k = BASE; ; k += BASE) {
			if (index >= input.length) throw new Error('invalid punycode');
			const digit = decodeDigit(input.charCodeAt(index++));
			if (digit >= BASE) throw new Error('invalid punycode');
			i += digit * w;
			const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
			if (digit < t) break;
			w *= BASE - t;
		}
		const length = output.length + 1;
		bias = adapt(i - oldI, length, oldI === 0);
		n += Math.floor(i / length);
		i %= length;
		if (n > 0x10ffff) throw new Error('invalid punycode');
		output.splice(i++, 0, n);
	}
	return String.fromCodePoint(...output);
}

/**
 * Converts a domain name to its ASCII form, label by label (`xn--` for non-ASCII labels).
 * @param {string} domain
 */
export function toAscii(domain) {
	return domain
		.split('.')
		.map((label) => (/^\p{ASCII}*$/u.test(label) ? label : `xn--${encodeLabel(label)}`))
		.join('.');
}

/**
 * Converts a domain name to Unicode, leaving labels that are not valid Punycode untouched.
 * @param {string} domain
 */
export function toUnicode(domain) {
	return domain
		.split('.')
		.map((label) => {
			if (!label.startsWith('xn--')) return label;
			try {
				return decodeLabel(label.slice(4));
			} catch {
				return label;
			}
		})
		.join('.');
}
