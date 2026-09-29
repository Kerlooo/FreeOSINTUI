import { ALGORITHMS } from './algorithms.js';

const CHUNK_SIZE = 4 * 1024 * 1024;

/**
 * Feeds data to every algorithm and returns `{ [algorithmId]: hexDigest }`.
 * @param {(update: (chunk: Uint8Array) => void) => Promise<void>} feed
 */
async function computeAll(feed) {
	const hashers = await Promise.all(ALGORITHMS.map((algorithm) => algorithm.create()));
	hashers.forEach((hasher) => hasher.init());

	await feed((chunk) => hashers.forEach((hasher) => hasher.update(chunk)));

	return Object.fromEntries(ALGORITHMS.map((algorithm, i) => [algorithm.id, hashers[i].digest()]));
}

/**
 * Hashes a string, encoded as UTF-8.
 * @param {string} text
 */
export function hashText(text) {
	const bytes = new TextEncoder().encode(text);
	return computeAll(async (update) => update(bytes));
}

/**
 * Hashes a File or Blob chunk by chunk, so large files are never fully loaded in memory.
 * @param {Blob} file
 * @param {{ onProgress?: (fraction: number) => void, signal?: AbortSignal }} [options]
 */
export function hashFile(file, { onProgress, signal } = {}) {
	return computeAll(async (update) => {
		for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
			signal?.throwIfAborted();
			const buffer = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
			update(new Uint8Array(buffer));
			onProgress?.(Math.min(1, (offset + CHUNK_SIZE) / file.size));
		}
		signal?.throwIfAborted();
		onProgress?.(1);
	});
}
