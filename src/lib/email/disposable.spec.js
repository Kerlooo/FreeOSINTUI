import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	checkDisposable,
	findDisposableMatch,
	parseBlocklist,
	resetDisposableCache
} from './disposable.js';

const LIST = '# comment\nmailinator.com\n\n10minutemail.com\r\nYOPMAIL.com\n';

describe('parseBlocklist', () => {
	it('skips comments and blank lines and lowercases', () => {
		expect([...parseBlocklist(LIST)]).toEqual([
			'mailinator.com',
			'10minutemail.com',
			'yopmail.com'
		]);
	});
});

describe('findDisposableMatch', () => {
	const list = parseBlocklist(LIST);

	it('matches the domain and its parent domains', () => {
		expect(findDisposableMatch('mailinator.com', list)).toBe('mailinator.com');
		expect(findDisposableMatch('eu.mx.mailinator.com', list)).toBe('mailinator.com');
	});

	it('does not match unrelated domains or bare TLDs', () => {
		expect(findDisposableMatch('gmail.com', list)).toBeNull();
		expect(findDisposableMatch('notmailinator.com', list)).toBeNull();
		expect(findDisposableMatch('com', new Set(['com']))).toBeNull();
	});
});

describe('checkDisposable', () => {
	beforeEach(resetDisposableCache);

	it('downloads the list once and caches it', async () => {
		const fetch = vi.fn(async () => new Response(LIST));
		expect(await checkDisposable('yopmail.com', { fetch })).toMatchObject({
			disposable: true,
			match: 'yopmail.com',
			listSize: 3
		});
		expect((await checkDisposable('gmail.com', { fetch })).disposable).toBe(false);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('does not cache a failed download', async () => {
		const failing = vi.fn(async () => new Response('', { status: 500 }));
		await expect(checkDisposable('a.com', { fetch: failing })).rejects.toThrow('HTTP 500');
		const fetch = vi.fn(async () => new Response(LIST));
		expect((await checkDisposable('mailinator.com', { fetch })).disposable).toBe(true);
	});
});
