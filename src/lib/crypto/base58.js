const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decodes a Base58 string into bytes, or returns null if it has invalid characters.
 * @param {string} text
 */
export function base58Decode(text) {
	let number = 0n;
	for (const char of text) {
		const digit = ALPHABET.indexOf(char);
		if (digit < 0) return null;
		number = number * 58n + BigInt(digit);
	}
	const bytes = [];
	while (number > 0n) {
		bytes.unshift(Number(number & 0xffn));
		number >>= 8n;
	}
	const leadingZeros = text.length - text.replace(/^1+/, '').length;
	return Uint8Array.from([...new Array(leadingZeros).fill(0), ...bytes]);
}

/** @param {Uint8Array} bytes */
async function sha256(bytes) {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

/**
 * Decodes a Base58Check string and verifies its 4-byte double SHA-256 checksum.
 * Returns the version byte and payload, or null when decoding or the checksum fails.
 * @param {string} text
 */
export async function base58CheckDecode(text) {
	const bytes = base58Decode(text);
	if (!bytes || bytes.length < 5) return null;
	const body = bytes.slice(0, -4);
	const checksum = bytes.slice(-4);
	const hash = await sha256(await sha256(body));
	if (!checksum.every((byte, i) => byte === hash[i])) return null;
	return { version: body[0], payload: body.slice(1) };
}
