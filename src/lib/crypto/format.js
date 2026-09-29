/**
 * Formats an integer amount in base units (satoshi, wei) as a decimal string,
 * with thousands separators and at most `maxFraction` decimals (truncated).
 * @param {bigint | string | number} value
 * @param {number} decimals
 * @param {number} [maxFraction]
 */
export function formatUnits(value, decimals, maxFraction = decimals) {
	const amount = BigInt(value);
	const negative = amount < 0n;
	const abs = negative ? -amount : amount;
	const base = 10n ** BigInt(decimals);
	const whole = (abs / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	const fraction = (abs % base)
		.toString()
		.padStart(decimals, '0')
		.slice(0, maxFraction)
		.replace(/0+$/, '');
	if (abs > 0n && whole === '0' && !fraction) {
		return `${negative ? '>-' : '<'}0.${'0'.repeat(maxFraction - 1)}1`;
	}
	return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

/**
 * Formats a base-unit amount with the chain's symbol, e.g. "0.5 BTC".
 * @param {bigint | string | number} value
 * @param {{ decimals: number, displayDecimals: number, symbol: string }} chain
 */
export function formatAmount(value, chain) {
	return `${formatUnits(value, chain.decimals, chain.displayDecimals)} ${chain.symbol}`;
}

/**
 * Shortens a long hash or address for display, e.g. "4a5e1e4b…2127b7afdeda33b".
 * @param {string} value
 */
export function shortenHash(value, head = 8, tail = 8) {
	return value.length > head + tail + 1 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
}
