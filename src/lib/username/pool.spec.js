import { describe, expect, it } from 'vitest';
import { runPool } from './pool.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('runPool', () => {
	it('processes every item and never exceeds the concurrency', async () => {
		let active = 0;
		let peak = 0;
		const seen = [];
		await runPool(
			[1, 2, 3, 4, 5, 6, 7],
			async (n) => {
				active++;
				peak = Math.max(peak, active);
				await wait(5);
				active--;
				return n * 2;
			},
			{ concurrency: 3, onResult: (result) => seen.push(result) }
		);
		expect(peak).toBe(3);
		expect(seen.toSorted((a, b) => a - b)).toEqual([2, 4, 6, 8, 10, 12, 14]);
	});

	it('reports errors per item and keeps going', async () => {
		const errors = [];
		const results = [];
		await runPool(
			['a', 'b', 'c'],
			async (item) => {
				if (item === 'b') throw new Error('boom');
				return item;
			},
			{ onResult: (r) => results.push(r), onError: (_e, item) => errors.push(item) }
		);
		expect(results).toEqual(['a', 'c']);
		expect(errors).toEqual(['b']);
	});

	it('stops starting new work after abort', async () => {
		const controller = new AbortController();
		const started = [];
		await runPool(
			[1, 2, 3, 4, 5, 6],
			async (n) => {
				started.push(n);
				if (n === 2) controller.abort();
				await wait(1);
				return n;
			},
			{ concurrency: 2, signal: controller.signal }
		);
		expect(started.length).toBeLessThan(6);
	});

	it('handles an empty list', async () => {
		let calls = 0;
		await runPool([], async () => calls++);
		expect(calls).toBe(0);
	});
});
