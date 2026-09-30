// Snowflake-style social network IDs: a timestamp in the high bits of a 64-bit integer.
import { NS_PER_MS, NS_PER_S, floorDiv } from './time.js';

const MAX_U64 = (1n << 64n) - 1n;

/**
 * @typedef {object} Snowflake
 * @property {string} id key of `timestamp.format.<id>`
 * @property {bigint} epochNs zero of the timestamp, in ns since the Unix epoch
 * @property {(id: bigint) => { ns: bigint, fields: { id: string, value: string }[], note?: string }} decode
 * @property {(ns: bigint) => bigint | null} minId smallest ID created at that instant
 * @property {(id: bigint) => { id: string, href: string } | null} [link]
 * @property {string} [note] key of `timestamp.note.<note>`
 */

/**
 * Classic layout: `(ms since epoch) << shift | low bits`.
 * @param {bigint} epochMs @param {bigint} shift @param {bigint} id
 */
function msShift(epochMs, shift, id) {
	return ((id >> shift) + epochMs) * NS_PER_MS;
}

/** @param {bigint} epochMs @param {bigint} shift @param {bigint} ns */
function minShift(epochMs, shift, ns) {
	const ms = floorDiv(ns, NS_PER_MS) - epochMs;
	if (ms < 0n) return null;
	const id = ms << shift;
	return id <= MAX_U64 ? id : null;
}

/** @param {bigint} value */
const str = (value) => value.toString();

const TWITTER_EPOCH = 1288834974657n;
const DISCORD_EPOCH = 1420070400000n;
const INSTAGRAM_EPOCH = 1314220021721n;
const TWITTER_LEGACY_MS = 30n * 86_400_000n;

const SHORTCODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Instagram post shortcode (`instagram.com/p/<shortcode>`) to media ID.
 * Shortcodes of private posts are longer: the media ID is in the first 11 characters.
 * @param {string} code
 */
export function shortcodeToMediaId(code) {
	if (!/^[A-Za-z0-9_-]{1,11}$/.test(code)) return null;
	let id = 0n;
	for (const char of code) id = id * 64n + BigInt(SHORTCODE_ALPHABET.indexOf(char));
	return id <= MAX_U64 ? id : null;
}

/** @param {bigint} id */
export function mediaIdToShortcode(id) {
	let code = '';
	let rest = id;
	do {
		code = SHORTCODE_ALPHABET[Number(rest % 64n)] + code;
		rest /= 64n;
	} while (rest > 0n);
	return code;
}

/** @type {Snowflake[]} Ordered by how often they are met in investigations. */
export const SNOWFLAKES = [
	{
		id: 'twitter',
		epochNs: TWITTER_EPOCH * NS_PER_MS,
		decode: (id) => ({
			ns: msShift(TWITTER_EPOCH, 22n, id),
			fields: [
				{ id: 'datacenter', value: str((id >> 17n) & 31n) },
				{ id: 'worker', value: str((id >> 12n) & 31n) },
				{ id: 'sequence', value: str(id & 4095n) }
			],
			// Tweets before November 2010 have small sequential IDs, not snowflakes.
			note: id >> 22n < TWITTER_LEGACY_MS ? 'twitterLegacy' : undefined
		}),
		minId: (ns) => minShift(TWITTER_EPOCH, 22n, ns),
		link: (id) => ({ id: 'tweet', href: `https://x.com/i/status/${id}` })
	},
	{
		id: 'discord',
		epochNs: DISCORD_EPOCH * NS_PER_MS,
		decode: (id) => ({
			ns: msShift(DISCORD_EPOCH, 22n, id),
			fields: [
				{ id: 'worker', value: str((id >> 17n) & 31n) },
				{ id: 'process', value: str((id >> 12n) & 31n) },
				{ id: 'increment', value: str(id & 4095n) }
			]
		}),
		minId: (ns) => minShift(DISCORD_EPOCH, 22n, ns)
	},
	{
		id: 'instagram',
		epochNs: INSTAGRAM_EPOCH * NS_PER_MS,
		decode: (id) => ({
			ns: msShift(INSTAGRAM_EPOCH, 23n, id),
			fields: [
				{ id: 'shard', value: str((id >> 10n) & 0x1fffn) },
				{ id: 'sequence', value: str(id & 0x3ffn) },
				{ id: 'shortcode', value: mediaIdToShortcode(id) }
			]
		}),
		minId: (ns) => minShift(INSTAGRAM_EPOCH, 23n, ns),
		link: (id) => ({
			id: 'instagramPost',
			href: `https://www.instagram.com/p/${mediaIdToShortcode(id)}/`
		}),
		note: 'instagram'
	},
	{
		id: 'tiktok',
		epochNs: 0n,
		decode: (id) => ({
			ns: (id >> 32n) * NS_PER_S,
			fields: []
		}),
		minId: (ns) => {
			const seconds = floorDiv(ns, NS_PER_S);
			return seconds >= 0n && seconds < 1n << 32n ? seconds << 32n : null;
		}
	},
	{
		id: 'mastodon',
		epochNs: 0n,
		decode: (id) => ({
			ns: (id >> 16n) * NS_PER_MS,
			fields: [{ id: 'sequence', value: str(id & 0xffffn) }]
		}),
		minId: (ns) => minShift(0n, 16n, ns)
	},
	{
		id: 'linkedin',
		epochNs: 0n,
		decode: (id) => ({
			ns: (id >> 22n) * NS_PER_MS,
			fields: []
		}),
		minId: (ns) => minShift(0n, 22n, ns),
		note: 'linkedin'
	}
];

/** @param {bigint} id */
export function isSnowflakeRange(id) {
	return id > 0n && id <= MAX_U64;
}
