// Structured IDs recognised by their shape: UUID, ULID, MongoDB ObjectId, KSUID.
import { NS_PER_MS, NS_PER_S, utcNs } from './time.js';

/** Start of the Gregorian calendar, the zero of UUID v1/v2/v6 timestamps. */
const GREGORIAN_NS = utcNs(1582, 10, 15);
const KSUID_EPOCH_S = 1_400_000_000n;

/**
 * @typedef {{ id: string, value: string, valueKey?: string, pivot?: 'mac' }} Field
 * `valueKey` is translated as `timestamp.value.<valueKey>` (value is then only a fallback).
 * @typedef {{ id: string, ns: bigint | null, fields: Field[], note?: string, approximate?: boolean }} Decoded
 */

/** @param {string} hex */
const big = (hex) => BigInt(`0x${hex}`);

const UUID_KIND = {
	1: 'timeBased',
	2: 'dceSecurity',
	3: 'md5',
	4: 'random',
	5: 'sha1',
	6: 'reorderedTime',
	7: 'unixTime',
	8: 'custom'
};

/**
 * Normalizes `{...}`, `urn:uuid:` and hyphen-less UUIDs to 32 lowercase hex digits.
 * @param {string} text
 */
export function uuidHex(text) {
	const match =
		/^(?:urn:uuid:)?\{?([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})\}?$/i.exec(
			text
		);
	return match ? match.slice(1).join('').toLowerCase() : null;
}

/** @param {string} hex 32 hex digits */
function formatUuid(hex) {
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * @param {string} hex 32 lowercase hex digits
 * @returns {Decoded}
 */
export function decodeUuid(hex) {
	const canonical = { id: 'canonical', value: formatUuid(hex) };
	if (/^0{32}$/.test(hex)) {
		return { id: 'uuid', ns: null, fields: [canonical], note: 'uuidNil' };
	}
	if (/^f{32}$/.test(hex)) {
		return { id: 'uuid', ns: null, fields: [canonical], note: 'uuidMax' };
	}

	const variantNibble = parseInt(hex[16], 16);
	const variant =
		variantNibble < 8
			? 'ncs'
			: variantNibble < 12
				? 'rfc'
				: variantNibble < 14
					? 'microsoft'
					: 'reserved';
	const version = parseInt(hex[12], 16);
	/** @type {Field[]} */
	const fields = [canonical, { id: 'variant', value: variant, valueKey: `variant.${variant}` }];

	if (variant !== 'rfc' || !(version in UUID_KIND)) {
		return { id: 'uuid', ns: null, fields, note: 'uuidUnknown' };
	}
	const kind = UUID_KIND[/** @type {keyof typeof UUID_KIND} */ (version)];
	fields.push({ id: 'version', value: String(version), valueKey: `uuid.${kind}` });

	if (version === 1 || version === 2 || version === 6) {
		const ticks =
			version === 6
				? (big(hex.slice(0, 12)) << 12n) | big(hex.slice(13, 16))
				: (big(hex.slice(13, 16)) << 48n) |
					(big(hex.slice(8, 12)) << 32n) |
					(version === 2 ? 0n : big(hex.slice(0, 8)));
		const clockSeq =
			version === 2 ? big(hex.slice(16, 18)) & 0x3fn : big(hex.slice(16, 20)) & 0x3fffn;
		const node = hex.slice(20).match(/../g)?.join(':') ?? '';
		const randomNode = (parseInt(hex.slice(20, 22), 16) & 1) === 1;
		fields.push({ id: 'clockSequence', value: clockSeq.toString() });
		if (version === 2) {
			fields.push({ id: 'localDomain', value: big(hex.slice(18, 20)).toString() });
			fields.push({ id: 'localId', value: big(hex.slice(0, 8)).toString() });
		}
		fields.push(
			randomNode
				? { id: 'node', value: node, valueKey: 'randomNode' }
				: { id: 'node', value: node, pivot: 'mac' }
		);
		return {
			id: 'uuid',
			ns: GREGORIAN_NS + ticks * 100n,
			fields,
			note: version === 2 ? 'uuidV2' : randomNode ? 'uuidRandomNode' : 'uuidMac',
			approximate: version === 2
		};
	}
	if (version === 7) {
		return { id: 'uuid', ns: big(hex.slice(0, 12)) * NS_PER_MS, fields };
	}
	return { id: 'uuid', ns: null, fields, note: `uuidNoTime` };
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * @param {string} text
 * @returns {Decoded | null}
 */
export function decodeUlid(text) {
	const upper = text.toUpperCase();
	if (!/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(upper)) return null;
	let ms = 0n;
	for (const char of upper.slice(0, 10)) ms = ms * 32n + BigInt(CROCKFORD.indexOf(char));
	return {
		id: 'ulid',
		ns: ms * NS_PER_MS,
		fields: [{ id: 'randomness', value: upper.slice(10) }]
	};
}

/**
 * @param {string} text
 * @returns {Decoded | null}
 */
export function decodeObjectId(text) {
	if (!/^[0-9a-f]{24}$/i.test(text)) return null;
	const hex = text.toLowerCase();
	return {
		id: 'objectId',
		ns: big(hex.slice(0, 8)) * NS_PER_S,
		fields: [
			{ id: 'processRandom', value: hex.slice(8, 18) },
			{ id: 'counter', value: big(hex.slice(18)).toString() }
		],
		note: 'objectId'
	};
}

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * @param {string} text
 * @returns {Decoded | null}
 */
export function decodeKsuid(text) {
	if (!/^[0-9A-Za-z]{27}$/.test(text)) return null;
	let value = 0n;
	for (const char of text) value = value * 62n + BigInt(BASE62.indexOf(char));
	if (value >= 1n << 160n) return null;
	const seconds = value >> 128n;
	const payload = (value & ((1n << 128n) - 1n)).toString(16).padStart(32, '0');
	return {
		id: 'ksuid',
		ns: (seconds + KSUID_EPOCH_S) * NS_PER_S,
		fields: [{ id: 'payload', value: payload }]
	};
}

/**
 * Smallest ID of each kind created at an instant (useful as a search lower bound).
 * @param {bigint} ns
 */
export function minStructuredIds(ns) {
	const ms = ns / NS_PER_MS;
	const seconds = ns / NS_PER_S;
	/** @type {{ id: string, value: string }[]} */
	const ids = [];
	if (ms >= 0n && ms < 1n << 48n) {
		let rest = ms;
		let ulid = '';
		for (let i = 0; i < 10; i++) {
			ulid = CROCKFORD[Number(rest % 32n)] + ulid;
			rest /= 32n;
		}
		ids.push({ id: 'ulid', value: `${ulid}${'0'.repeat(16)}` });
		const time = ms.toString(16).padStart(12, '0');
		ids.push({ id: 'uuid7', value: formatUuid(`${time}7000${'8'.padEnd(16, '0')}`) });
	}
	if (ns >= 0n && seconds < 1n << 32n) {
		ids.push({
			id: 'objectId',
			value: `${seconds.toString(16).padStart(8, '0')}${'0'.repeat(16)}`
		});
	}
	return ids;
}
