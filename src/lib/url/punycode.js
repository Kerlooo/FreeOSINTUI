/**
 * Punycode (RFC 3492) label decoding, used to show IDN hostnames in Unicode.
 * Encoding is done by the WHATWG URL parser, which returns ASCII hostnames.
 */

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

/**
 * @param {number} delta
 * @param {number} points
 * @param {boolean} first
 */
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

/** @param {number} code */
function digitValue(code) {
	if (code >= 48 && code <= 57) return code - 22; // 0-9 → 26-35
	if (code >= 65 && code <= 90) return code - 65; // A-Z
	if (code >= 97 && code <= 122) return code - 97; // a-z
	return BASE;
}

/**
 * Decodes the part of a label after `xn--`. Returns null when it is not valid Punycode.
 * @param {string} input
 */
export function decodePunycode(input) {
	/** @type {number[]} */
	const output = [];
	const basicEnd = input.lastIndexOf('-');
	for (let j = 0; j < Math.max(basicEnd, 0); j++) {
		const code = input.charCodeAt(j);
		if (code >= 0x80) return null;
		output.push(code);
	}

	let n = INITIAL_N;
	let bias = INITIAL_BIAS;
	let i = 0;
	for (let index = basicEnd > 0 ? basicEnd + 1 : 0; index < input.length;) {
		const oldI = i;
		for (let w = 1, k = BASE; ; k += BASE) {
			if (index >= input.length) return null;
			const digit = digitValue(input.charCodeAt(index++));
			if (digit >= BASE) return null;
			i += digit * w;
			if (i > 0x7fffffff) return null;
			const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
			if (digit < t) break;
			w *= BASE - t;
		}
		const length = output.length + 1;
		bias = adapt(i - oldI, length, oldI === 0);
		n += Math.floor(i / length);
		if (n > 0x10ffff) return null;
		i %= length;
		output.splice(i++, 0, n);
	}
	return String.fromCodePoint(...output);
}

/**
 * Converts an ASCII hostname to Unicode, label by label (`xn--80ak6aa92e.com` → `аррӏе.com`).
 * Invalid Punycode labels are kept as they are.
 * @param {string} hostname
 */
export function toUnicodeHost(hostname) {
	return hostname
		.split('.')
		.map((label) => {
			if (!/^xn--/i.test(label)) return label;
			return decodePunycode(label.slice(4).toLowerCase()) ?? label;
		})
		.join('.');
}
