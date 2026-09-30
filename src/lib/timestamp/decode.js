// Entry point of the ID and Timestamp Decoder: finds every plausible reading of an input.
import { NUMERIC_FORMATS, nsToNumeric, numericToNs, parseNumber } from './numeric.js';
import { SNOWFLAKES, isSnowflakeRange, shortcodeToMediaId } from './snowflake.js';
import {
	decodeKsuid,
	decodeObjectId,
	decodeUlid,
	decodeUuid,
	minStructuredIds,
	uuidHex
} from './ids.js';
import { NS_PER_MS, NS_PER_S, inDateRange, isPlausible, utcNs } from './time.js';

/**
 * @typedef {import('./ids.js').Field} Field
 * @typedef {object} Interpretation
 * @property {string} id format id, label key `timestamp.format.<id>`
 * @property {'structured' | 'snowflake' | 'number'} family
 * @property {bigint | null} ns decoded instant, null for IDs without a date (UUID v4...)
 * @property {Field[]} fields
 * @property {boolean} plausible
 * @property {boolean} [approximate]
 * @property {string} [note] key of `timestamp.note.<note>`
 * @property {{ id: string, href: string } | null} [link]
 */

/**
 * Platform IDs found in a pasted URL or URN, with the platform they belong to.
 * @param {string} text
 * @returns {{ value: string, hint: string } | null}
 */
export function extractFromUrl(text) {
	const urn = /^urn:li:(?:activity|share|ugcPost):(\d+)$/i.exec(text);
	if (urn) return { value: urn[1], hint: 'linkedin' };

	let url;
	try {
		url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
	} catch {
		return null;
	}
	if (!/^https?:\/\//i.test(text) && !/^[\w-]+(\.[\w-]+)+\//.test(text)) return null;

	const host = url.hostname.toLowerCase().replace(/^(www|m|mobile|vm)\./, '');
	const path = decodeURIComponent(url.pathname);
	/** @type {[RegExp, RegExp, string][]} host pattern, path pattern, platform */
	const rules = [
		[/^(x|twitter|fxtwitter|vxtwitter|fixupx)\.com$/, /\/status(?:es)?\/(\d+)/, 'twitter'],
		[/(^|\.)discord(app)?\.com$/, /\/channels\/(?:\d+|@me)\/\d+\/(\d+)|\/(\d+)\/?$/, 'discord'],
		[/^instagram\.com$/, /\/(?:p|reels?|tv)\/([A-Za-z0-9_-]+)/, 'instagram'],
		[/(^|\.)tiktok\.com$/, /\/(?:video|photo|v)\/(\d+)/, 'tiktok'],
		[/(^|\.)linkedin\.com$/, /(?:activity[:-]|ugcPost[:-]|share[:-])(\d{15,})/, 'linkedin']
	];
	for (const [hostPattern, pathPattern, hint] of rules) {
		if (!hostPattern.test(host)) continue;
		const match = pathPattern.exec(path);
		const value = match?.slice(1).find(Boolean);
		if (value) return { value, hint };
	}
	const mastodon = /^\/@[\w.]+(?:@[\w.-]+)?\/(\d{15,})\/?$/.exec(path);
	if (mastodon) return { value: mastodon[1], hint: 'mastodon' };
	const anyId = /(\d{15,20})(?!.*\d{15,20})/.exec(path);
	return anyId ? { value: anyId[1], hint: '' } : null;
}

const DATE_PATTERN =
	/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

/**
 * An ISO 8601 date or date-time. Without a time zone it is read as UTC.
 * @param {string} text
 * @returns {bigint | null}
 */
export function parseIsoDate(text) {
	const match = DATE_PATTERN.exec(text);
	if (!match) return null;
	const [, y, mo, d, h = '0', mi = '0', s = '0', fraction = '', zone = 'Z'] = match;
	const [year, month, day, hour, minute, second] = [y, mo, d, h, mi, s].map(Number);
	if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null;
	const midnight = utcNs(year, month, day);
	if (new Date(Number(midnight / NS_PER_MS)).getUTCDate() !== day) return null;

	let offsetMinutes = 0;
	if (zone.toUpperCase() !== 'Z') {
		const [, sign, oh, om = '0'] = /^([+-])(\d{2}):?(\d{2})?$/.exec(zone) ?? [];
		if (!sign || Number(oh) > 23 || Number(om) > 59) return null;
		offsetMinutes = (sign === '-' ? -1 : 1) * (Number(oh) * 60 + Number(om));
	}
	const seconds = hour * 3600 + minute * 60 + second - offsetMinutes * 60;
	return midnight + BigInt(seconds) * NS_PER_S + BigInt(fraction.padEnd(9, '0') || '0');
}

/**
 * @param {import('./ids.js').Decoded} decoded
 * @returns {Interpretation[]}
 */
function structured(decoded) {
	if (decoded.ns !== null && !inDateRange(decoded.ns)) return [];
	return [{ ...decoded, family: 'structured', plausible: true }];
}

/**
 * @param {bigint} id
 * @param {number} now
 * @param {Field[]} [extra]
 * @returns {Interpretation[]}
 */
function snowflakes(id, now, extra = []) {
	if (!isSnowflakeRange(id)) return [];
	return SNOWFLAKES.flatMap((snowflake) => {
		const { ns, fields, note } = snowflake.decode(id);
		if (!inDateRange(ns)) return [];
		return [
			{
				id: snowflake.id,
				family: /** @type {const} */ ('snowflake'),
				ns,
				fields: [...fields, ...(snowflake.id === 'instagram' ? extra : [])],
				plausible: isPlausible(ns, 'social', now, snowflake.epochNs),
				note: note ?? snowflake.note,
				link: snowflake.link?.(id) ?? null
			}
		];
	});
}

/**
 * @param {{ value: bigint, scale: bigint }} number
 * @param {number} now
 * @returns {Interpretation[]}
 */
function numbers(number, now) {
	return NUMERIC_FORMATS.flatMap((format) => {
		const ns = numericToNs(format, number);
		if (!inDateRange(ns)) return [];
		return [
			{
				id: format.id,
				family: /** @type {const} */ ('number'),
				ns,
				fields: [],
				plausible: isPlausible(ns, 'generic', now, format.epochNs),
				note: format.note
			}
		];
	});
}

/**
 * Most plausible first: the platform named by a URL, then plausible readings, then the
 * rest; ties keep the order of the format lists (most common formats first).
 * @param {Interpretation[]} results
 * @param {string} hint
 */
function rank(results, hint) {
	const score = (/** @type {Interpretation} */ r) =>
		(hint && r.id === hint ? 0 : 2) + (r.plausible ? 0 : 1);
	return results
		.map((result, index) => ({ result, index }))
		.sort((a, b) => score(a.result) - score(b.result) || a.index - b.index)
		.map(({ result }) => result);
}

/**
 * @typedef {{ kind: 'empty' }
 *   | { kind: 'error', error: string }
 *   | { kind: 'ids', value: string, hint: string, results: Interpretation[] }
 *   | { kind: 'date', ns: bigint, numeric: { id: string, value: string }[], ids: { id: string, value: string }[] }} Decoding
 * `error` is a key of `timestamp.error.<error>`.
 */

/**
 * Decodes any pasted ID, number, URL or ISO date.
 * @param {string} raw
 * @param {{ now?: number }} [options]
 * @returns {Decoding}
 */
export function decodeInput(raw, { now = Date.now() } = {}) {
	const text = raw.trim();
	if (!text) return { kind: 'empty' };

	const date = parseIsoDate(text);
	if (date !== null) {
		if (!inDateRange(date)) return { kind: 'error', error: 'outOfRange' };
		return { kind: 'date', ns: date, ...encodeDate(date) };
	}

	const extracted = extractFromUrl(text);
	if (!extracted && /[/:]/.test(text) && !uuidHex(text)) {
		return { kind: 'error', error: /^https?:\/\//i.test(text) ? 'noIdInUrl' : 'unrecognized' };
	}
	const value = extracted?.value ?? text.replace(/\s+/g, '');
	const hint = extracted?.hint ?? '';

	/** @type {Interpretation[]} */
	const results = [];

	const uuid = uuidHex(value);
	if (uuid) results.push(...structured(decodeUuid(uuid)));
	for (const decoder of [decodeUlid, decodeObjectId, decodeKsuid]) {
		const decoded = decoder(value);
		if (decoded) results.push(...structured(decoded));
	}

	const instagramPair = /^(\d+)_(\d+)$/.exec(value);
	if (instagramPair) {
		const owner = [{ id: 'ownerId', value: instagramPair[2] }];
		const id = BigInt(instagramPair[1]);
		const instagram = snowflakes(id, now, owner).filter((r) => r.id === 'instagram');
		if (!instagram.length) return { kind: 'error', error: 'unrecognized' };
		return { kind: 'ids', value, hint: 'instagram', results: instagram };
	}

	const number = parseNumber(value);
	if (number) {
		if (number.integer) results.push(...snowflakes(number.value, now));
		results.push(...numbers(number, now));
	} else if (/^[A-Za-z0-9_-]{9,}$/.test(value) && /[^0-9]/.test(value) && !results.length) {
		const mediaId = shortcodeToMediaId(value.slice(0, 11));
		if (mediaId !== null) {
			const shortcode = [{ id: 'mediaId', value: mediaId.toString() }];
			const instagram = snowflakes(mediaId, now, shortcode).filter((r) => r.id === 'instagram');
			// A random word also decodes: only keep it when the date makes sense.
			if (hint === 'instagram' || instagram.some((r) => r.plausible)) {
				results.push(...instagram);
			}
		}
	}

	if (!results.length) return { kind: 'error', error: 'unrecognized' };
	return { kind: 'ids', value, hint, results: rank(results, hint) };
}

/**
 * An instant written in every numeric format, plus the smallest ID of each kind at that time.
 * @param {bigint} ns
 */
export function encodeDate(ns) {
	const numeric = NUMERIC_FORMATS.map((format) => ({
		id: format.id,
		value: nsToNumeric(format, ns)
	}));
	const ids = [
		...SNOWFLAKES.flatMap((snowflake) => {
			const id = snowflake.minId(ns);
			return id === null ? [] : [{ id: snowflake.id, value: id.toString() }];
		}),
		...minStructuredIds(ns)
	];
	return { numeric, ids };
}
