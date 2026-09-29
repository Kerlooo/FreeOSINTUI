/**
 * Runs `worker` over `items` with at most `concurrency` calls in flight.
 * Stops starting new work once `signal` is aborted; results of started calls still arrive.
 * @template T, R
 * @param {T[]} items
 * @param {(item: T, signal?: AbortSignal) => Promise<R>} worker
 * @param {{ concurrency?: number, signal?: AbortSignal, onResult?: (result: R, item: T) => void, onError?: (error: unknown, item: T) => void }} [options]
 * @returns {Promise<void>}
 */
export async function runPool(items, worker, options = {}) {
	const { concurrency = 8, signal, onResult, onError } = options;
	let next = 0;

	async function lane() {
		while (next < items.length && !signal?.aborted) {
			const item = items[next++];
			try {
				const result = await worker(item, signal);
				if (!signal?.aborted) onResult?.(result, item);
			} catch (error) {
				if (!signal?.aborted) onError?.(error, item);
			}
		}
	}

	const lanes = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, lane);
	await Promise.all(lanes);
}
