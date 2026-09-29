import { getLocale } from '$lib/i18n/i18n.svelte.js';

/**
 * Group and decimal separators of the current language (e.g. "," and "." in English).
 * Only the separators come from Intl: the digits are built from the BigInt, so no precision is lost.
 * @returns {{ group: string, decimal: string }}
 */
function localeSeparators() {
	const parts = new Intl.NumberFormat(getLocale()).formatToParts(1000.5);
	return {
		group: parts.find((part) => part.type === 'group')?.value ?? ',',
		decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.'
	};
}

/**
 * Formats an integer amount in base units (satoshi, wei) as a decimal string,
 * with thousands separators and at most `maxFraction` decimals (truncated).
 * Separators follow the current language unless given.
 * @param {bigint | string | number} value
 * @param {number} decimals
 * @param {number} [maxFraction]
 * @param {{ group: string, decimal: string }} [separators]
 */
export function formatUnits(
	value,
	decimals,
	maxFraction = decimals,
	separators = localeSeparators()
) {
	const { group, decimal } = separators;
	const amount = BigInt(value);
	const negative = amount < 0n;
	const abs = negative ? -amount : amount;
	const base = 10n ** BigInt(decimals);
	const whole = (abs / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, group);
	const fraction = (abs % base)
		.toString()
		.padStart(decimals, '0')
		.slice(0, maxFraction)
		.replace(/0+$/, '');
	if (abs > 0n && whole === '0' && !fraction) {
		return `${negative ? '>-' : '<'}0${decimal}${'0'.repeat(maxFraction - 1)}1`;
	}
	return `${negative ? '-' : ''}${whole}${fraction ? `${decimal}${fraction}` : ''}`;
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
