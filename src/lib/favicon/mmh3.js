/**
 * MurmurHash3 x86 32-bit, returned as a signed 32-bit integer like Python's `mmh3.hash()`.
 * @param {Uint8Array} bytes
 * @param {number} [seed]
 */
export function murmur3(bytes, seed = 0) {
	const c1 = 0xcc9e2d51;
	const c2 = 0x1b873593;
	const length = bytes.length;
	const blocks = length & ~3;
	let h = seed >>> 0;

	for (let i = 0; i < blocks; i += 4) {
		let k = bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
		k = Math.imul(k, c1);
		k = (k << 15) | (k >>> 17);
		k = Math.imul(k, c2);
		h ^= k;
		h = (h << 13) | (h >>> 19);
		h = (Math.imul(h, 5) + 0xe6546b64) | 0;
	}

	let k = 0;
	switch (length & 3) {
		case 3:
			k ^= bytes[blocks + 2] << 16;
		// falls through
		case 2:
			k ^= bytes[blocks + 1] << 8;
		// falls through
		case 1:
			k ^= bytes[blocks];
			k = Math.imul(k, c1);
			k = (k << 15) | (k >>> 17);
			k = Math.imul(k, c2);
			h ^= k;
	}

	h ^= length;
	h ^= h >>> 16;
	h = Math.imul(h, 0x85ebca6b);
	h ^= h >>> 13;
	h = Math.imul(h, 0xc2b2ae35);
	h ^= h >>> 16;
	return h | 0;
}
