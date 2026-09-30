// Instants are BigInt nanoseconds since the Unix epoch, so formats finer than a
// millisecond (µs, ns, 100-ns ticks) keep their full precision.

export const NS_PER_US = 1000n;
export const NS_PER_MS = 1_000_000n;
export const NS_PER_S = 1_000_000_000n;
export const NS_PER_DAY = 86_400n * NS_PER_S;

/** Largest distance from the Unix epoch a JS Date can hold (±100 000 000 days). */
const MAX_DATE_MS = 8_640_000_000_000_000n;

/** Plausible window for social network IDs: 2000-01-01 to one year from now. */
const SOCIAL_MIN_MS = Date.UTC(2000, 0, 1);
/** Plausible window for generic timestamps: 1980-01-01 to twenty years from now. */
const GENERIC_MIN_MS = Date.UTC(1980, 0, 1);
const YEAR_MS = 365.25 * 86_400_000;

/**
 * Floor division for BigInt (the `/` operator truncates towards zero).
 * @param {bigint} a
 * @param {bigint} b
 */
export function floorDiv(a, b) {
	const q = a / b;
	return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q;
}

/**
 * A UTC calendar date (any year, also before 1970) as BigInt nanoseconds since the Unix epoch.
 * @param {number} year @param {number} month 1-12 @param {number} day
 */
export function utcNs(year, month, day) {
	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	return BigInt(date.getTime()) * NS_PER_MS;
}

/** @param {bigint} ns */
export function inDateRange(ns) {
	const ms = floorDiv(ns, NS_PER_MS);
	return ms >= -MAX_DATE_MS && ms <= MAX_DATE_MS;
}

/** @param {bigint} ns */
export function nsToMs(ns) {
	return Number(floorDiv(ns, NS_PER_MS));
}

/**
 * ISO 8601 in UTC, with sub-millisecond digits when the instant has them.
 * @param {bigint} ns
 */
export function isoFromNs(ns) {
	const ms = floorDiv(ns, NS_PER_MS);
	const rest = ns - ms * NS_PER_MS;
	const iso = new Date(Number(ms)).toISOString();
	if (rest === 0n) return iso;
	const digits = rest.toString().padStart(6, '0').replace(/0+$/, '');
	return `${iso.slice(0, -1)}${digits}Z`;
}

/** Readings closer than this to their format's epoch are almost always a wrong guess. */
const MIN_AFTER_EPOCH_NS = 30n * NS_PER_DAY;

/**
 * Whether a decoded date is believable for the given kind of source.
 * @param {bigint} ns
 * @param {'social' | 'generic' | 'any'} window
 * @param {number} nowMs
 * @param {bigint} [epochNs] zero of the format: a date in its first 30 days is not plausible
 */
export function isPlausible(ns, window, nowMs, epochNs = 0n) {
	if (window === 'any') return true;
	if (ns - epochNs < MIN_AFTER_EPOCH_NS) return false;
	const ms = nsToMs(ns);
	if (window === 'social') return ms >= SOCIAL_MIN_MS && ms <= nowMs + YEAR_MS;
	return ms >= GENERIC_MIN_MS && ms <= nowMs + 20 * YEAR_MS;
}

const RELATIVE_UNITS = /** @type {const} */ ([
	['year', 365.25 * 86_400_000],
	['month', 30.44 * 86_400_000],
	['week', 7 * 86_400_000],
	['day', 86_400_000],
	['hour', 3_600_000],
	['minute', 60_000],
	['second', 1000]
]);

/**
 * Value and unit for Intl.RelativeTimeFormat (negative = in the past).
 * @param {number} ms instant
 * @param {number} nowMs
 * @returns {{ value: number, unit: Intl.RelativeTimeFormatUnit }}
 */
export function relativeParts(ms, nowMs) {
	const diff = ms - nowMs;
	for (const [unit, size] of RELATIVE_UNITS) {
		if (Math.abs(diff) >= size) return { value: Math.trunc(diff / size), unit };
	}
	return { value: 0, unit: 'second' };
}
