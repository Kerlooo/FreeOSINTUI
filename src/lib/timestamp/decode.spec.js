import { describe, expect, it } from 'vitest';
import { decodeInput, encodeDate, extractFromUrl, parseIsoDate } from './decode.js';
import { decodeKsuid, decodeObjectId, decodeUlid, decodeUuid, uuidHex } from './ids.js';
import {
	NUMERIC_FORMATS,
	gpsLeapSeconds,
	nsToNumeric,
	numericToNs,
	parseNumber
} from './numeric.js';
import { mediaIdToShortcode, shortcodeToMediaId } from './snowflake.js';
import { floorDiv, isoFromNs, relativeParts } from './time.js';

const NOW = Date.UTC(2026, 8, 30);

/** @param {string} input */
function decode(input) {
	const result = decodeInput(input, { now: NOW });
	if (result.kind !== 'ids') throw new Error(`expected ids, got ${result.kind}`);
	return result;
}

/** @param {string} input @param {string} id */
function reading(input, id) {
	const found = decode(input).results.find((r) => r.id === id);
	if (!found) throw new Error(`no ${id} reading`);
	return { ...found, iso: found.ns === null ? null : isoFromNs(found.ns) };
}

/** @param {{ id: string, value: string }[]} fields */
const fieldMap = (fields) => Object.fromEntries(fields.map((f) => [f.id, f.value]));

describe('time helpers', () => {
	it('floors BigInt division', () => {
		expect(floorDiv(7n, 2n)).toBe(3n);
		expect(floorDiv(-7n, 2n)).toBe(-4n);
		expect(floorDiv(-6n, 2n)).toBe(-3n);
	});

	it('keeps sub-millisecond digits in ISO strings', () => {
		expect(isoFromNs(1_700_000_000_123_456_700n)).toBe('2023-11-14T22:13:20.1234567Z');
		expect(isoFromNs(-1n)).toBe('1969-12-31T23:59:59.999999999Z');
	});

	it('picks a relative unit', () => {
		expect(relativeParts(NOW - 3 * 86_400_000, NOW)).toEqual({ value: -3, unit: 'day' });
		expect(relativeParts(NOW + 2 * 3_600_000, NOW)).toEqual({ value: 2, unit: 'hour' });
		expect(relativeParts(NOW, NOW)).toEqual({ value: 0, unit: 'second' });
	});
});

describe('snowflakes', () => {
	it('decodes a Discord ID', () => {
		const discord = reading('175928847299117063', 'discord');
		expect(discord.iso).toBe('2016-04-30T11:18:25.796Z');
		expect(discord.plausible).toBe(true);
		expect(fieldMap(discord.fields)).toEqual({ worker: '1', process: '0', increment: '7' });
	});

	it('decodes a Twitter ID', () => {
		const twitter = reading('1212092628029698048', 'twitter');
		// ((id >> 22) + 1288834974657) ms
		expect(twitter.iso).toBe('2019-12-31T19:26:16.771Z');
		expect(twitter.link?.href).toBe('https://x.com/i/status/1212092628029698048');
	});

	it('flags pre-snowflake tweets', () => {
		const twitter = reading('https://twitter.com/jack/status/20', 'twitter');
		expect(twitter.plausible).toBe(false);
		expect(twitter.note).toBe('twitterLegacy');
	});

	it('decodes Instagram media IDs and shortcodes', () => {
		const pair = decode('3198744451128440017_1234');
		expect(pair.results.map((r) => r.id)).toEqual(['instagram']);
		expect(fieldMap(pair.results[0].fields).ownerId).toBe('1234');
		expect(mediaIdToShortcode(3198744451128440017n)).toBe('CxkOSFwwzTR');
		expect(shortcodeToMediaId('CxkOSFwwzTR')).toBe(3198744451128440017n);

		const url = decode('https://www.instagram.com/p/CxkOSFwwzTR/?img_index=1');
		expect(url.hint).toBe('instagram');
		expect(url.results[0].id).toBe('instagram');
		expect(isoFromNs(/** @type {bigint} */ (url.results[0].ns)).slice(0, 10)).toBe('2023-09-24');
	});

	it('decodes TikTok and Mastodon IDs', () => {
		expect(reading('7300000000000000000', 'tiktok').iso).toBe('2023-11-11T00:48:18.000Z');
		const mastodon = reading('111000000000000000', 'mastodon');
		expect(mastodon.iso).toBe('2023-09-03T07:19:45.937Z');
		expect(mastodon.plausible).toBe(true);
	});

	it('ranks the platform named by the URL first', () => {
		const result = decode('https://discord.com/channels/1/2/175928847299117063');
		expect(result.hint).toBe('discord');
		expect(result.results[0].id).toBe('discord');
		expect(decode('urn:li:activity:7147375873228800000').results[0].id).toBe('linkedin');
	});
});

describe('structured IDs', () => {
	it('decodes UUID v7, v1 and v6 (RFC 9562 examples)', () => {
		const v7 = decodeUuid(/** @type {string} */ (uuidHex('017F22E2-79B0-7CC3-98C4-DC0C0C07398F')));
		expect(isoFromNs(/** @type {bigint} */ (v7.ns))).toBe('2022-02-22T19:22:22.000Z');

		const v1 = reading('C232AB00-9414-11EC-B3C8-9F6BDECED846', 'uuid');
		expect(v1.iso).toBe('2022-02-22T19:22:22.000Z');
		expect(fieldMap(v1.fields)).toMatchObject({
			version: '1',
			clockSequence: String(0x33c8),
			node: '9f:6b:de:ce:d8:46'
		});
		// Multicast bit set: the node is random, not a MAC address.
		expect(v1.fields.find((f) => f.id === 'node')?.valueKey).toBe('randomNode');

		expect(reading('{1EC9414C-232A-6B00-B3C8-9F6BDECED846}', 'uuid').iso).toBe(
			'2022-02-22T19:22:22.000Z'
		);
	});

	it('offers a MAC pivot for v1 UUIDs with a real node', () => {
		const v1 = decodeUuid(/** @type {string} */ (uuidHex('c232ab00941411ecb3c8001a2b3c4d5e')));
		expect(v1.fields.find((f) => f.id === 'node')).toEqual({
			id: 'node',
			value: '00:1a:2b:3c:4d:5e',
			pivot: 'mac'
		});
	});

	it('has no date for random UUIDs', () => {
		const v4 = reading('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'uuid');
		expect(v4.ns).toBeNull();
		expect(fieldMap(v4.fields).version).toBe('4');
		expect(decodeUuid('0'.repeat(32)).note).toBe('uuidNil');
	});

	it('decodes ULID, ObjectId and KSUID', () => {
		expect(isoFromNs(/** @type {bigint} */ (decodeUlid('01ARZ3NDEKTSV4RRFFQ69G5FAV')?.ns))).toBe(
			'2016-07-30T23:54:10.259Z'
		);
		expect(decodeUlid('81ARZ3NDEKTSV4RRFFQ69G5FAV')).toBeNull();
		const objectId = decodeObjectId('507f1f77bcf86cd799439011');
		expect(isoFromNs(/** @type {bigint} */ (objectId?.ns))).toBe('2012-10-17T21:13:27.000Z');
		const ksuid = decodeKsuid('0ujtsYcgvSTl8PAuAdqWYSMnLOv');
		expect(isoFromNs(/** @type {bigint} */ (ksuid?.ns))).toBe('2017-10-10T04:00:47.000Z');
		expect(ksuid?.fields[0].value).toBe('b5a1cd34b5f99d1154fb6853345c9735');
	});
});

describe('numeric timestamps', () => {
	it('parses decimal and hexadecimal numbers', () => {
		expect(parseNumber('-12.50')).toEqual({ value: -1250n, scale: 100n, integer: false });
		expect(parseNumber('0x10')).toEqual({ value: 16n, scale: 1n, integer: true });
		expect(parseNumber('1,5')).toBeNull();
	});

	it('reads the common epochs', () => {
		expect(reading('1700000000', 'unixSeconds').iso).toBe('2023-11-14T22:13:20.000Z');
		expect(reading('1700000000123', 'unixMilliseconds').iso).toBe('2023-11-14T22:13:20.123Z');
		expect(reading('133444736000000000', 'filetime').iso).toBe('2023-11-14T22:13:20.000Z');
		expect(reading('13344473600000000', 'webkit').iso).toBe('2023-11-14T22:13:20.000Z');
		expect(reading('638355968000000000', 'dotnetTicks').iso).toBe('2023-11-14T22:13:20.000Z');
		expect(reading('721692800', 'cocoa').iso).toBe('2023-11-14T22:13:20.000Z');
		expect(reading('45000.5', 'excel').iso).toBe('2023-03-15T12:00:00.000Z');
		expect(reading('3782844800', 'hfs').iso).toBe('2023-11-14T22:13:20.000Z');
	});

	it('applies GPS leap seconds', () => {
		expect(gpsLeapSeconds(BigInt(Date.UTC(2020, 0, 1)) * 1_000_000n)).toBe(18);
		// 1700000000 - 315964800 + 18
		expect(reading('1384035218', 'gps').iso).toBe('2023-11-14T22:13:20.000Z');
	});

	it('hides implausible readings behind plausible ones', () => {
		const results = decode('1700000000').results;
		expect(results[0].id).toBe('unixSeconds');
		expect(results.find((r) => r.id === 'unixMilliseconds')?.plausible).toBe(false);
		// Only 405 ms after the Discord epoch: not a real snowflake.
		expect(results.find((r) => r.id === 'discord')?.plausible).toBe(false);
		const firstUnlikely = results.findIndex((r) => !r.plausible);
		expect(results.slice(firstUnlikely).every((r) => !r.plausible)).toBe(true);
	});

	it('round-trips every format', () => {
		const ns = 1_700_000_000_123_000_000n;
		for (const format of NUMERIC_FORMATS) {
			const back = numericToNs(format, /** @type {any} */ (parseNumber(nsToNumeric(format, ns))));
			// Precision is one unit divided by the decimals kept.
			const tolerance = format.unitNs / 10n ** BigInt(format.decimals) || 1n;
			expect(back <= ns && ns - back < tolerance, format.id).toBe(true);
		}
	});
});

describe('dates', () => {
	it('parses ISO 8601 dates, UTC when no zone is given', () => {
		expect(parseIsoDate('2024-01-01')).toBe(1_704_067_200_000_000_000n);
		expect(parseIsoDate('2024-01-01T01:00:00+01:00')).toBe(1_704_067_200_000_000_000n);
		expect(parseIsoDate('2024-01-01 00:00:00.5z')).toBe(1_704_067_200_500_000_000n);
		expect(parseIsoDate('2024-02-30')).toBeNull();
		expect(parseIsoDate('2024-01-01T24:00')).toBeNull();
	});

	it('converts a date into every format and minimum IDs', () => {
		const result = decodeInput('2024-01-01T00:00:00Z', { now: NOW });
		expect(result.kind).toBe('date');
		const { numeric, ids } = encodeDate(1_704_067_200_000_000_000n);
		expect(fieldMap(numeric)).toMatchObject({
			unixSeconds: '1704067200',
			unixMilliseconds: '1704067200000',
			filetime: '133485408000000000',
			webkit: '13348540800000000',
			dotnetTicks: '638396640000000000',
			cocoa: '725760000',
			excel: '45292',
			gps: '1388102418',
			hfs: '3786912000'
		});
		const minIds = fieldMap(ids);
		expect(minIds.objectId).toBe('659200800000000000000000');
		expect(minIds.uuid7).toBe('018cc251-f400-7000-8000-000000000000');
		expect(minIds.ulid).toBe('01HK153X000000000000000000');
		expect(reading(minIds.discord, 'discord').iso).toBe('2024-01-01T00:00:00.000Z');
		expect(reading(minIds.twitter, 'twitter').iso).toBe('2024-01-01T00:00:00.000Z');
	});
});

describe('input handling', () => {
	it('extracts IDs from URLs', () => {
		expect(extractFromUrl('https://x.com/user/status/1212092628029698048?s=20')).toEqual({
			value: '1212092628029698048',
			hint: 'twitter'
		});
		expect(extractFromUrl('https://www.tiktok.com/@user/video/7300000000000000000')).toEqual({
			value: '7300000000000000000',
			hint: 'tiktok'
		});
		expect(extractFromUrl('https://mastodon.social/@user/111000000000000000')).toEqual({
			value: '111000000000000000',
			hint: 'mastodon'
		});
		expect(extractFromUrl('1700000000')).toBeNull();
	});

	it('reports unusable input', () => {
		expect(decodeInput('   ')).toEqual({ kind: 'empty' });
		expect(decodeInput('hello')).toEqual({ kind: 'error', error: 'unrecognized' });
		expect(decodeInput('https://example.com/about')).toEqual({ kind: 'error', error: 'noIdInUrl' });
	});
});
