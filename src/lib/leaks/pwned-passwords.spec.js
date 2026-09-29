import { describe, expect, it, vi } from 'vitest';
import { checkPwnedPassword, countInRange, sha1Hex, splitHash } from './pwned-passwords.js';

const RANGE =
	'003D68EB55068C33ACE09247EE4C639306B:29\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:52372427\r\nFFFFF0000000000000000000000000000AA:0';

describe('sha1Hex / splitHash', () => {
	it('computes an uppercase SHA-1 and splits it 5 + 35', async () => {
		const hash = await sha1Hex('password');
		expect(hash).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
		expect(splitHash(hash)).toEqual({
			prefix: '5BAA6',
			suffix: '1E4C9B93F3F0682250B6CF8331B7EE68FD8'
		});
	});
});

describe('countInRange', () => {
	it('finds the suffix count, case-insensitively', () => {
		expect(countInRange(RANGE, '1e4c9b93f3f0682250b6cf8331b7ee68fd8')).toBe(52372427);
	});

	it('returns 0 when missing or only in padding', () => {
		expect(countInRange(RANGE, 'ABCDEF')).toBe(0);
		expect(countInRange(RANGE, 'FFFFF0000000000000000000000000000AA')).toBe(0);
	});
});

describe('checkPwnedPassword', () => {
	it('sends only the 5-character prefix with padding', async () => {
		const fetch = vi.fn(async () => new Response(RANGE));
		expect(await checkPwnedPassword('password', { fetch })).toEqual({
			prefix: '5BAA6',
			count: 52372427
		});
		const [url, init] = /** @type {any[]} */ (fetch.mock.calls[0]);
		expect(url).toBe('https://api.pwnedpasswords.com/range/5BAA6');
		expect(init.headers['Add-Padding']).toBe('true');
	});
});
