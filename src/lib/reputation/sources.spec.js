import { describe, expect, it } from 'vitest';
import { md5 } from 'hash-wasm';
import { parseIndicator } from './indicator.js';
import {
	SOURCES,
	countResults,
	fromBackend,
	otxTarget,
	parseOtx,
	parseSourceDate,
	parseStopForumSpam,
	sourcesFor,
	urlhausQuery
} from './sources.js';
import { detailRows, displayDate } from './rows.js';

/** @param {string} text */
const ind = (text) => /** @type {import('./indicator.js').Indicator} */ (parseIndicator(text));

/** @param {string} id */
const source = (id) =>
	/** @type {import('./sources.js').Source} */ (SOURCES.find((s) => s.id === id));

/**
 * Fake fetch that records the requested URLs and answers with JSON.
 * @param {(url: string) => { status?: number, body: any, type?: string }} answer
 */
function fakeFetch(answer) {
	/** @type {string[]} */
	const urls = [];
	const fetch = /** @type {typeof globalThis.fetch} */ (
		async (input) => {
			const url = String(input);
			urls.push(url);
			const { status = 200, body, type = 'application/json' } = answer(url);
			return new Response(JSON.stringify(body), { status, headers: { 'content-type': type } });
		}
	);
	return { fetch, urls };
}

describe('sourcesFor', () => {
	const ids = (/** @type {string} */ text) => sourcesFor(ind(text)).map((s) => s.id);

	it('picks the sources that apply to each kind', () => {
		expect(ids('1.2.3.4')).toEqual(['otx', 'sfs', 'tor', 'drop', 'urlhaus', 'threatfox']);
		expect(ids('2001:4860::1')).toEqual(['otx', 'sfs', 'tor', 'drop', 'threatfox']);
		expect(ids('example.com')).toEqual(['otx', 'urlhaus', 'threatfox']);
		expect(ids('https://example.com/a')).toEqual(['otx', 'urlhaus', 'threatfox']);
		expect(ids('a@example.com')).toEqual(['otx', 'sfs']);
	});

	it('builds the URLhaus and OTX lookup targets', () => {
		expect(urlhausQuery(ind('1.2.3.4'))).toEqual({ host: '1.2.3.4' });
		expect(urlhausQuery(ind('http://x.example/a'))).toEqual({ url: 'http://x.example/a' });
		expect(otxTarget(ind('example.com'))).toEqual({
			api: 'domain',
			page: 'domain',
			value: 'example.com'
		});
		expect(otxTarget(ind('www.example.com'))?.api).toBe('hostname');
		expect(otxTarget(ind('a@mail.example.com'))?.value).toBe('mail.example.com');
		expect(otxTarget(ind('::2'))?.api).toBe('IPv6');
	});
});

describe('AlienVault OTX', () => {
	const answer = {
		pulse_info: {
			count: 3,
			pulses: [
				{ id: 'a', name: 'Old', created: '2025-01-01T00:00:00', tags: ['x'], malware_families: [] },
				{
					id: 'b',
					name: 'New',
					modified: '2026-09-21T07:29:06.900000',
					tags: ['a', 'b', 'c', 'd', 'e', 'f'],
					malware_families: [{ display_name: 'Emotet' }, 'Qakbot']
				}
			]
		},
		validation: [{ source: 'majestic', name: 'Whitelisted domain' }]
	};

	it('sorts pulses by date and keeps whitelist notes', () => {
		const parsed = parseOtx(answer);
		expect(parsed.count).toBe(3);
		expect(parsed.pulses.map((p) => p.name)).toEqual(['New', 'Old']);
		expect(parsed.pulses[0].tags).toHaveLength(5);
		expect(parsed.pulses[0].malware).toEqual(['Emotet', 'Qakbot']);
		expect(parsed.latest).toBe('2026-09-21T07:29:06.900000');
		expect(parsed.whitelisted).toEqual(['Whitelisted domain']);
	});

	it('reports a listing with the encoded indicator and page link', async () => {
		const { fetch, urls } = fakeFetch(() => ({ body: answer }));
		const result = await source('otx').lookup(ind('2001:db8::1'.replace('db8', '4860')), { fetch });
		expect(urls[0]).toBe(
			'https://otx.alienvault.com/api/v1/indicators/IPv6/2001%3A4860%3A%3A1/general'
		);
		expect(result).toMatchObject({
			status: 'listed',
			link: 'https://otx.alienvault.com/indicator/ip/2001%3A4860%3A%3A1'
		});
	});

	it('treats 404 and zero pulses as not listed', async () => {
		const missing = fakeFetch(() => ({ status: 404, body: {} }));
		expect((await source('otx').lookup(ind('example.com'), { fetch: missing.fetch })).status).toBe(
			'not_listed'
		);
		const empty = fakeFetch(() => ({ body: { pulse_info: { count: 0, pulses: [] } } }));
		expect((await source('otx').lookup(ind('example.com'), { fetch: empty.fetch })).status).toBe(
			'not_listed'
		);
	});
});

describe('StopForumSpam', () => {
	it('parses an IP answer', () => {
		expect(
			parseStopForumSpam(
				{
					success: 1,
					ip: { appears: 1, frequency: 3, lastseen: '2026-06-30 01:49:12', confidence: 0.27 }
				},
				'ip'
			)
		).toEqual({
			appears: true,
			frequency: 3,
			lastseen: '2026-06-30 01:49:12',
			confidence: 0.27,
			torexit: false
		});
		expect(() => parseStopForumSpam({ success: 0, error: 'bad' }, 'ip')).toThrow('bad');
	});

	it('sends only the MD5 of an email address', async () => {
		const { fetch, urls } = fakeFetch(() => ({
			body: { success: 1, emailhash: { appears: 0, frequency: 0 } }
		}));
		const result = await source('sfs').lookup(ind('Someone@Example.com'), { fetch });
		const hash = await md5('someone@example.com');
		expect(urls).toEqual([`https://api.stopforumspam.org/api?emailhash=${hash}&json`]);
		expect(urls[0]).not.toContain('someone');
		expect(result.status).toBe('not_listed');
		expect(result.link).not.toContain('someone');
	});

	it('links IPs to the ipcheck page', async () => {
		const { fetch } = fakeFetch(() => ({
			body: { success: 1, ip: { appears: 1, frequency: 2, lastseen: '2026-01-01 00:00:00' } }
		}));
		const result = await source('sfs').lookup(ind('1.2.3.4'), { fetch });
		expect(result).toMatchObject({
			status: 'listed',
			date: '2026-01-01 00:00:00',
			link: 'https://www.stopforumspam.com/ipcheck/1.2.3.4'
		});
	});
});

describe('backend sources', () => {
	it('calls the fixed endpoints with the indicator', async () => {
		const { fetch, urls } = fakeFetch(() => ({
			body: { source: 'x', status: 'not_listed', checked: 'c', date: null, details: {} }
		}));
		const ip = ind('1.2.3.4');
		for (const id of ['tor', 'drop', 'urlhaus', 'threatfox'])
			await source(id).lookup(ip, { fetch });
		await source('urlhaus').lookup(ind('http://a.example/x?y=1'), { fetch });
		expect(urls).toEqual([
			'/api/reputation/tor?ip=1.2.3.4',
			'/api/reputation/drop?ip=1.2.3.4',
			'/api/reputation/urlhaus?host=1.2.3.4',
			'/api/reputation/threatfox?term=1.2.3.4',
			'/api/reputation/urlhaus?url=http%3A%2F%2Fa.example%2Fx%3Fy%3D1'
		]);
	});

	it('maps statuses, not-configured and the reference link', () => {
		expect(
			fromBackend({ status: 'listed', checked: 'a', reference: 'https://r' }, 'https://l')
		).toMatchObject({ status: 'listed', link: 'https://r' });
		expect(fromBackend({ status: 'not_configured', checked: 'a' }, 'https://l')).toMatchObject({
			status: 'unavailable',
			reason: 'notConfigured',
			link: 'https://l'
		});
	});

	it('reports a non-JSON answer as backend unreachable', async () => {
		const { fetch } = fakeFetch(() => ({ status: 502, body: 'Bad gateway', type: 'text/plain' }));
		await expect(source('tor').lookup(ind('1.2.3.4'), { fetch })).rejects.toMatchObject({
			unreachable: true
		});
	});
});

describe('countResults', () => {
	it('counts listed, not listed, unavailable and pending sections', () => {
		const done = (/** @type {any} */ status, reason) => ({
			status: /** @type {const} */ ('done'),
			data: { status, reason, checked: '', date: null, link: null, details: {} }
		});
		expect(
			countResults([
				done('listed'),
				done('listed'),
				done('not_listed'),
				done('unavailable', 'notConfigured'),
				{ status: 'error' },
				{ status: 'loading' }
			])
		).toEqual({ listed: 2, notListed: 1, unavailable: 2, pending: 1 });
	});
});

describe('dates and rows', () => {
	it('parses the source date formats as UTC', () => {
		expect(parseSourceDate('2026-06-30 01:49:12')?.toISOString()).toBe('2026-06-30T01:49:12.000Z');
		expect(parseSourceDate('2026-09-01 10:00:00 UTC')?.toISOString()).toBe(
			'2026-09-01T10:00:00.000Z'
		);
		expect(parseSourceDate('2026-09-21T07:29:06.900000')?.toISOString()).toBe(
			'2026-09-21T07:29:06.900Z'
		);
		expect(parseSourceDate('2026-09-30T09:05:15+00:00')?.toISOString()).toBe(
			'2026-09-30T09:05:15.000Z'
		);
		expect(parseSourceDate('2026-09-30T11:05:15+0200')?.toISOString()).toBe(
			'2026-09-30T09:05:15.000Z'
		);
		expect(parseSourceDate('yesterday')).toBeNull();
		expect(displayDate('yesterday')).toBe('yesterday');
		expect(displayDate('2026-06-30 01:49:12')).toContain('2026');
	});

	it('builds detail rows for DROP and URLhaus', () => {
		const drop = detailRows('drop', {
			status: 'listed',
			checked: '1.10.16.1',
			date: null,
			link: null,
			details: { cidr: '1.10.16.0/20', sblid: 'SBL1', rir: 'apnic' }
		});
		expect(drop.map((row) => row.value)).toEqual(['1.10.16.0/20', 'SBL1', 'APNIC']);
		const host = detailRows('urlhaus', {
			status: 'listed',
			checked: 'x',
			date: null,
			link: null,
			details: {
				url_count: 2,
				online: 1,
				threats: ['malware_download'],
				blacklists: { surbl: 'listed' },
				tags: []
			}
		});
		expect(host.find((row) => row.label === 'Other blocklists')?.value).toBe('surbl: listed');
	});
});
