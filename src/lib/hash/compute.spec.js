import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { hashFile, hashText } from './compute.js';

/** Node's own implementation, used as reference. */
const NODE_NAMES = {
	md5: 'md5',
	sha1: 'sha1',
	sha224: 'sha224',
	sha256: 'sha256',
	sha384: 'sha384',
	sha512: 'sha512',
	'sha3-256': 'sha3-256',
	'sha3-512': 'sha3-512',
	'blake2b-512': 'blake2b512',
	ripemd160: 'ripemd160'
};

function referenceDigests(bytes) {
	const digests = Object.fromEntries(
		Object.entries(NODE_NAMES).map(([id, name]) => [
			id,
			createHash(name).update(bytes).digest('hex')
		])
	);
	digests.crc32 = crc32(bytes).toString(16).padStart(8, '0');
	return digests;
}

describe('hashText', () => {
	it('matches the reference implementations', async () => {
		const text = 'The quick brown fox jumps over the lazy dog — àèìòù';
		const digests = await hashText(text);
		expect(digests).toMatchObject(referenceDigests(Buffer.from(text, 'utf8')));
	});

	it('computes BLAKE3 of the empty string', async () => {
		const digests = await hashText('');
		expect(digests.blake3).toBe('af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262');
	});
});

describe('hashFile', () => {
	it('gives the same result as hashing the whole content at once', async () => {
		// Larger than one chunk, so the chunked path is exercised.
		const bytes = new Uint8Array(9 * 1024 * 1024 + 123).map((_, i) => i % 251);
		const progress = [];
		const digests = await hashFile(new Blob([bytes]), { onProgress: (p) => progress.push(p) });

		expect(digests).toMatchObject(referenceDigests(bytes));
		expect(progress.at(-1)).toBe(1);
	});

	it('hashes an empty file', async () => {
		const digests = await hashFile(new Blob([]));
		expect(digests.md5).toBe('d41d8cd98f00b204e9800998ecf8427e');
	});

	it('stops when aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(hashFile(new Blob(['abc']), { signal: controller.signal })).rejects.toThrow();
	});
});
