// Plain numeric timestamps: a count of units since an epoch.
import { NS_PER_DAY, NS_PER_MS, NS_PER_S, NS_PER_US, floorDiv, utcNs } from './time.js';

/**
 * UTC dates from which GPS time is one more second ahead of UTC (GPS started equal to UTC
 * on 1980-01-06; 18 leap seconds since 2017-01-01).
 */
const LEAP_SECONDS = [
	[1981, 7],
	[1982, 7],
	[1983, 7],
	[1985, 7],
	[1988, 1],
	[1990, 1],
	[1991, 1],
	[1992, 7],
	[1993, 7],
	[1994, 7],
	[1996, 1],
	[1997, 7],
	[1999, 1],
	[2006, 1],
	[2009, 1],
	[2012, 7],
	[2015, 7],
	[2017, 1]
].map(([year, month]) => utcNs(year, month, 1));

/**
 * GPS − UTC offset in seconds at a UTC instant.
 * @param {bigint} ns
 */
export function gpsLeapSeconds(ns) {
	return LEAP_SECONDS.filter((leap) => ns >= leap).length;
}

/**
 * @typedef {object} NumericFormat
 * @property {string} id key of `timestamp.format.<id>`
 * @property {bigint} epochNs the format's zero, in ns since the Unix epoch
 * @property {bigint} unitNs one unit, in ns
 * @property {number} decimals digits kept when converting a date into this format
 * @property {boolean} [gps] GPS time: no leap seconds
 * @property {string} [note] key of `timestamp.note.<note>`
 */

const EPOCH_1601 = utcNs(1601, 1, 1);

/** @type {NumericFormat[]} Ordered by how common they are. */
export const NUMERIC_FORMATS = [
	{ id: 'unixSeconds', epochNs: 0n, unitNs: NS_PER_S, decimals: 0 },
	{ id: 'unixMilliseconds', epochNs: 0n, unitNs: NS_PER_MS, decimals: 0 },
	{ id: 'unixMicroseconds', epochNs: 0n, unitNs: NS_PER_US, decimals: 0 },
	{ id: 'unixNanoseconds', epochNs: 0n, unitNs: 1n, decimals: 0 },
	{ id: 'filetime', epochNs: EPOCH_1601, unitNs: 100n, decimals: 0, note: 'filetime' },
	{ id: 'webkit', epochNs: EPOCH_1601, unitNs: NS_PER_US, decimals: 0, note: 'webkit' },
	{ id: 'dotnetTicks', epochNs: utcNs(1, 1, 1), unitNs: 100n, decimals: 0, note: 'dotnet' },
	{ id: 'cocoa', epochNs: utcNs(2001, 1, 1), unitNs: NS_PER_S, decimals: 6, note: 'cocoa' },
	{ id: 'cocoaNanoseconds', epochNs: utcNs(2001, 1, 1), unitNs: 1n, decimals: 0, note: 'cocoa' },
	{ id: 'excel', epochNs: utcNs(1899, 12, 30), unitNs: NS_PER_DAY, decimals: 8, note: 'excel' },
	{ id: 'gps', epochNs: utcNs(1980, 1, 6), unitNs: NS_PER_S, decimals: 0, gps: true, note: 'gps' },
	{ id: 'hfs', epochNs: utcNs(1904, 1, 1), unitNs: NS_PER_S, decimals: 0, note: 'hfs' }
];

/**
 * A decimal (optionally signed, optionally with a fraction) or `0x` hexadecimal number,
 * kept exact as `value / scale`.
 * @param {string} text
 * @returns {{ value: bigint, scale: bigint, integer: boolean } | null}
 */
export function parseNumber(text) {
	const hex = /^0x([0-9a-f]{1,32})$/i.exec(text);
	if (hex) return { value: BigInt(`0x${hex[1]}`), scale: 1n, integer: true };
	const decimal = /^([+-]?)(\d{1,40})(?:\.(\d{1,18}))?$/.exec(text);
	if (!decimal) return null;
	const [, sign, whole, fraction = ''] = decimal;
	const value = BigInt(whole + fraction) * (sign === '-' ? -1n : 1n);
	return { value, scale: 10n ** BigInt(fraction.length), integer: fraction.length === 0 };
}

/**
 * Instant for a number read in the given format.
 * @param {NumericFormat} format
 * @param {{ value: bigint, scale: bigint }} number
 */
export function numericToNs(format, number) {
	const naive = format.epochNs + floorDiv(number.value * format.unitNs, number.scale);
	if (!format.gps) return naive;
	// GPS = UTC + leap seconds: find the offset that holds at the resulting UTC instant.
	const first = naive - BigInt(gpsLeapSeconds(naive)) * NS_PER_S;
	return naive - BigInt(gpsLeapSeconds(first)) * NS_PER_S;
}

/**
 * The value of an instant in the given format, as a string (trailing zero decimals trimmed).
 * @param {NumericFormat} format
 * @param {bigint} ns
 */
export function nsToNumeric(format, ns) {
	const utc = format.gps ? ns + BigInt(gpsLeapSeconds(ns)) * NS_PER_S : ns;
	const factor = 10n ** BigInt(format.decimals);
	const scaled = floorDiv((utc - format.epochNs) * factor, format.unitNs);
	if (format.decimals === 0) return scaled.toString();
	const negative = scaled < 0n;
	const digits = (negative ? -scaled : scaled).toString().padStart(format.decimals + 1, '0');
	const whole = digits.slice(0, -format.decimals);
	const fraction = digits.slice(-format.decimals).replace(/0+$/, '');
	return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}
