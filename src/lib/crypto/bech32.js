// Bech32 (BIP-173) and Bech32m (BIP-350) decoding for SegWit addresses.
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3;

/** @param {number[]} values */
function polymod(values) {
	let checksum = 1;
	for (const value of values) {
		const top = checksum >>> 25;
		checksum = ((checksum & 0x1ffffff) << 5) ^ value;
		for (let i = 0; i < 5; i++) {
			if ((top >>> i) & 1) checksum ^= GENERATOR[i];
		}
	}
	return checksum >>> 0;
}

/** @param {string} hrp */
function expandHrp(hrp) {
	const codes = [...hrp].map((char) => char.charCodeAt(0));
	return [...codes.map((c) => c >> 5), 0, ...codes.map((c) => c & 31)];
}

/**
 * Decodes a Bech32/Bech32m string. Returns null on invalid characters, mixed case or
 * a checksum matching neither variant.
 * @param {string} text
 * @returns {{ hrp: string, data: number[], encoding: 'bech32' | 'bech32m' } | null}
 */
export function bech32Decode(text) {
	if (text.length > 90 || (text !== text.toLowerCase() && text !== text.toUpperCase())) return null;
	const lower = text.toLowerCase();
	const separator = lower.lastIndexOf('1');
	if (separator < 1 || separator + 7 > lower.length) return null;

	const hrp = lower.slice(0, separator);
	const data = [...lower.slice(separator + 1)].map((char) => CHARSET.indexOf(char));
	if (data.includes(-1)) return null;

	const constant = polymod([...expandHrp(hrp), ...data]);
	const encoding =
		constant === BECH32_CONST ? 'bech32' : constant === BECH32M_CONST ? 'bech32m' : null;
	if (!encoding) return null;
	return { hrp, data: data.slice(0, -6), encoding };
}

/**
 * Regroups 5-bit words into bytes (no padding allowed), or returns null if invalid.
 * @param {number[]} words
 */
function wordsToBytes(words) {
	let accumulator = 0;
	let bits = 0;
	const bytes = [];
	for (const word of words) {
		accumulator = (accumulator << 5) | word;
		bits += 5;
		while (bits >= 8) {
			bits -= 8;
			bytes.push((accumulator >> bits) & 0xff);
		}
	}
	if (bits >= 5 || (accumulator << (8 - bits)) & 0xff) return null;
	return bytes;
}

/**
 * Decodes a SegWit address for the expected human-readable part (e.g. 'bc', 'ltc'),
 * applying the BIP-173/350 rules on version, program length and checksum variant.
 * @param {string} text
 * @param {string} expectedHrp
 * @returns {{ version: number, program: number[] } | null}
 */
export function decodeSegwit(text, expectedHrp) {
	const decoded = bech32Decode(text);
	if (!decoded || decoded.hrp !== expectedHrp || decoded.data.length < 1) return null;
	const [version, ...words] = decoded.data;
	if (version > 16) return null;
	if ((version === 0) !== (decoded.encoding === 'bech32')) return null;
	const program = wordsToBytes(words);
	if (!program || program.length < 2 || program.length > 40) return null;
	if (version === 0 && program.length !== 20 && program.length !== 32) return null;
	return { version, program };
}
