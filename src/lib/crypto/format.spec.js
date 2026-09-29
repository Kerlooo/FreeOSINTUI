import { describe, expect, it } from 'vitest';
import { CHAINS } from './chains.js';
import { formatAmount, formatUnits, shortenHash } from './format.js';

describe('formatUnits', () => {
	it('formats satoshi and wei', () => {
		expect(formatUnits(5747633581n, 8)).toBe('57.47633581');
		expect(formatUnits(100000000, 8)).toBe('1');
		expect(formatUnits('0', 8)).toBe('0');
		expect(formatUnits('5774491790776062094343', 18, 6)).toBe('5,774.49179');
		expect(formatUnits(-150000000n, 8)).toBe('-1.5');
	});

	it('shows dust that truncates to zero', () => {
		expect(formatUnits(1n, 18, 6)).toBe('<0.000001');
	});
});

describe('formatAmount', () => {
	it('adds the chain symbol', () => {
		expect(formatAmount(12345n, CHAINS.btc)).toBe('0.00012345 BTC');
		expect(formatAmount(10n ** 18n, CHAINS.eth)).toBe('1 ETH');
	});
});

describe('shortenHash', () => {
	it('keeps both ends', () => {
		expect(shortenHash('0123456789abcdef0123')).toBe('01234567…cdef0123');
		expect(shortenHash('short')).toBe('short');
	});
});
