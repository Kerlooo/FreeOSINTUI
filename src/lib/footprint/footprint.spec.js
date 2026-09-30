import { describe, expect, it } from 'vitest';
import { cdxPattern, normalizeFootprintDomain } from './normalize.js';
import { ccIndexUrl, lookupCommonCrawl, parseCcNdjson, parseCollections } from './commoncrawl.js';
import { lookupWaybackUrls, parseWaybackAnswer } from './wayback.js';
import { archiveUrl, mergeRecords, parseArchivedUrl, timestampDay } from './merge.js';
import { classifyEntry, extensionOf, groupEntries } from './classify.js';
import { computeStats, extractParams, filterEntries, findSubdomains } from './stats.js';

/** @param {string} url */
const entryOf = (url) => {
	const parsed = parseArchivedUrl(url);
	if (!parsed) throw new Error(url);
	return parsed;
};

describe('normalizeFootprintDomain', () => {
	it('cleans URLs like the Domain Analyzer', () => {
		expect(normalizeFootprintDomain(' https://WWW.Example.com/path?x=1 ')).toEqual({
			value: 'example.com',
			subdomains: false
		});
	});

	it('turns a leading *. into the subdomains option', () => {
		expect(normalizeFootprintDomain('*.example.org')).toEqual({
			value: 'example.org',
			subdomains: true
		});
	});

	it('rejects invalid input', () => {
		expect(normalizeFootprintDomain('not a domain').error).toBeTruthy();
		expect(normalizeFootprintDomain('localhost').error).toBeTruthy();
	});

	it('builds the CDX pattern', () => {
		expect(cdxPattern('example.com', false)).toBe('example.com/*');
		expect(cdxPattern('example.com', true)).toBe('*.example.com');
	});
});

describe('Common Crawl', () => {
	it('parses collinfo.json keeping valid ids only', () => {
		expect(
			parseCollections([
				{ id: 'CC-MAIN-2026-39', name: 'September 2026 Index' },
				{ id: '../evil', name: 'x' },
				{ id: 'CC-MAIN-2026-34' }
			])
		).toEqual([
			{ id: 'CC-MAIN-2026-39', name: 'September 2026 Index' },
			{ id: 'CC-MAIN-2026-34', name: 'CC-MAIN-2026-34' }
		]);
		expect(parseCollections({})).toEqual([]);
	});

	it('parses NDJSON and skips bad lines', () => {
		const text = [
			'{"urlkey":"com,example)/","timestamp":"20260904131603","url":"https://example.com/","mime":"text/html","status":"200"}',
			'not json',
			'{"timestamp":"bad","url":"https://example.com/x"}',
			'',
			'{"timestamp":"20260905000000","url":"https://example.com/a.pdf"}'
		].join('\n');
		expect(parseCcNdjson(text)).toEqual([
			{
				timestamp: '20260904131603',
				url: 'https://example.com/',
				mime: 'text/html',
				status: '200'
			},
			{ timestamp: '20260905000000', url: 'https://example.com/a.pdf', mime: null, status: null }
		]);
	});

	it('builds the index URL', () => {
		const url = new URL(ccIndexUrl('CC-MAIN-2026-39', 'example.com', true, 100));
		expect(url.origin + url.pathname).toBe('https://index.commoncrawl.org/CC-MAIN-2026-39-index');
		expect(url.searchParams.get('url')).toBe('*.example.com');
		expect(url.searchParams.get('output')).toBe('json');
		expect(url.searchParams.get('limit')).toBe('100');
	});

	it('queries the latest crawls, tolerating a failing one and 404 "no captures"', async () => {
		/** @type {string[]} */
		const requested = [];
		/** @param {string} url */
		const fakeFetch = async (url) => {
			requested.push(url);
			if (url.endsWith('collinfo.json')) {
				return Response.json([
					{ id: 'CC-MAIN-2026-39', name: 'Sep' },
					{ id: 'CC-MAIN-2026-34', name: 'Aug' },
					{ id: 'CC-MAIN-2026-30', name: 'Jul' },
					{ id: 'CC-MAIN-2026-26', name: 'Jun' }
				]);
			}
			if (url.includes('2026-39')) {
				return new Response(
					'{"timestamp":"20260904131603","url":"https://example.com/","status":"200"}\n'
				);
			}
			if (url.includes('2026-34')) return new Response('', { status: 504 });
			return new Response('{"message":"No Captures found"}', { status: 404 });
		};
		const progress = [];
		const result = await lookupCommonCrawl('example.com', {
			fetch: /** @type {any} */ (fakeFetch),
			onProgress: (partial) => progress.push(partial.indexes.length)
		});
		expect(requested).toHaveLength(4);
		expect(result.done).toBe(true);
		expect(result.records).toHaveLength(1);
		expect(result.indexes.map((i) => [i.id, i.count, Boolean(i.error)])).toEqual([
			['CC-MAIN-2026-39', 1, false],
			['CC-MAIN-2026-34', 0, true],
			['CC-MAIN-2026-30', 0, false]
		]);
		expect(progress).toEqual([1, 2, 3]);
	});

	it('throws when every crawl fails', async () => {
		/** @param {string} url */
		const fakeFetch = async (url) =>
			url.endsWith('collinfo.json')
				? Response.json([{ id: 'CC-MAIN-2026-39', name: 'Sep' }])
				: new Response('', { status: 503 });
		await expect(
			lookupCommonCrawl('example.com', { fetch: /** @type {any} */ (fakeFetch) })
		).rejects.toThrow(/503/);
	});
});

describe('Wayback', () => {
	it('keeps well-formed backend records', () => {
		expect(
			parseWaybackAnswer({
				truncated: true,
				records: [
					{
						timestamp: '20100101000000',
						url: 'http://example.com/',
						mime: 'text/html',
						status: '200'
					},
					{ timestamp: 'x', url: 'http://example.com/bad' },
					null
				]
			})
		).toEqual({
			truncated: true,
			records: [
				{
					timestamp: '20100101000000',
					url: 'http://example.com/',
					mime: 'text/html',
					status: '200'
				}
			]
		});
		expect(parseWaybackAnswer(null)).toEqual({ records: [], truncated: false });
	});

	it('calls the backend endpoint', async () => {
		/** @type {string} */
		let called = '';
		/** @param {string} url */
		const fakeFetch = async (url) => {
			called = url;
			return Response.json({ records: [], truncated: false });
		};
		await lookupWaybackUrls('example.com', {
			subdomains: true,
			fetch: /** @type {any} */ (fakeFetch)
		});
		expect(called).toBe('/api/footprint/wayback?domain=example.com&subdomains=true&limit=5000');
	});
});

describe('mergeRecords', () => {
	const merged = mergeRecords([
		{
			source: 'commoncrawl',
			records: [
				{
					timestamp: '20260904000000',
					url: 'https://example.com/a',
					mime: 'text/html',
					status: '200'
				},
				{
					timestamp: '20260801000000',
					url: 'https://example.com/a',
					mime: 'text/html',
					status: '301'
				}
			]
		},
		{
			source: 'wayback',
			records: [
				{ timestamp: '20150101000000', url: 'http://Example.com:80/a', mime: 'unk', status: '-' },
				{
					timestamp: '20160101000000',
					url: 'http://example.com/b?x=1',
					mime: 'warc/revisit',
					status: '-'
				},
				{ timestamp: '20160101000000', url: 'mailto:x@example.com', mime: null, status: null }
			]
		}
	]);

	it('dedupes across scheme, port and host case', () => {
		expect(merged.map((entry) => entry.key)).toEqual(['example.com/a', 'example.com/b?x=1']);
	});

	it('keeps first/last seen, sources and the latest status', () => {
		const [a, b] = merged;
		expect(a).toMatchObject({
			url: 'http://Example.com:80/a',
			first: '20150101000000',
			last: '20260904000000',
			waybackTimestamp: '20150101000000',
			sources: ['commoncrawl', 'wayback'],
			mime: 'text/html',
			status: '200',
			captures: 3
		});
		expect(b).toMatchObject({ mime: null, status: null, sources: ['wayback'] });
	});

	it('links to the archive, never the live site', () => {
		expect(archiveUrl(merged[0])).toBe(
			'https://web.archive.org/web/20150101000000/http://Example.com:80/a'
		);
		expect(timestampDay('20150102030405')).toBe('2015-01-02');
	});

	it('accepts scheme-less URLs', () => {
		expect(parseArchivedUrl('example.com/x')?.key).toBe('example.com/x');
		expect(parseArchivedUrl('ftp://example.com/x')).toBeNull();
	});
});

describe('classification', () => {
	it('reads extensions', () => {
		expect(extensionOf('/files/report.pdf')).toBe('pdf');
		expect(extensionOf('/.env')).toBe('env');
		expect(extensionOf('/dir.v2/readme')).toBe('');
	});

	it.each([
		['https://example.com/files/Report%202019.PDF', ['documents']],
		['https://example.com/backup/site.tar.gz', ['archives']],
		['https://example.com/db.sql', ['archives']],
		['https://example.com/.env', ['config']],
		['https://example.com/.git/config', ['config']],
		['https://example.com/wp-config.php.bak', ['archives', 'config']],
		['https://example.com/app.js', ['scripts']],
		['https://example.com/wp-login.php', ['scripts', 'admin']],
		['https://example.com/api/v1/users', ['admin']],
		['https://example.com/graphql', ['admin']],
		['https://example.com/search?q=x', ['params']],
		['https://example.com/about', []]
	])('%s', (url, groups) => {
		expect(classifyEntry(entryOf(url))).toEqual(groups);
	});

	it('groups entries', () => {
		const groups = groupEntries([
			entryOf('https://example.com/a.pdf'),
			entryOf('https://example.com/x?a=1')
		]);
		expect(groups.documents).toHaveLength(1);
		expect(groups.params).toHaveLength(1);
		expect(groups.scripts).toHaveLength(0);
	});
});

describe('stats', () => {
	const entries = mergeRecords([
		{
			source: 'commoncrawl',
			records: [
				{
					timestamp: '20260101000000',
					url: 'https://example.com/',
					mime: 'text/html',
					status: '200'
				},
				{
					timestamp: '20260101000000',
					url: 'https://blog.example.com/p?id=1&ref=x',
					mime: 'text/html',
					status: '404'
				}
			]
		},
		{
			source: 'wayback',
			records: [
				{
					timestamp: '20100101000000',
					url: 'http://example.com/',
					mime: 'text/html',
					status: '200'
				},
				{
					timestamp: '20110101000000',
					url: 'http://dev.example.com/a.pdf',
					mime: 'application/pdf',
					status: '-'
				},
				{
					timestamp: '20110101000000',
					url: 'http://blog.example.com/q?id=2',
					mime: 'text/html',
					status: '200'
				},
				{
					timestamp: '20110101000000',
					url: 'http://notexample.com/',
					mime: 'text/html',
					status: '200'
				}
			]
		}
	]);

	it('computes totals and distributions', () => {
		const stats = computeStats(entries, { topMime: 1 });
		expect(stats.total).toBe(5);
		expect(stats.bySource).toEqual({ commoncrawl: 1, wayback: 3, both: 1 });
		expect(stats.byYear).toEqual([
			{ year: '2010', count: 1 },
			{ year: '2011', count: 3 },
			{ year: '2026', count: 1 }
		]);
		expect(stats.byMime).toEqual([{ value: 'text/html', count: 4 }]);
		expect(stats.otherMime).toBe(1);
		expect(stats.byStatus).toEqual([
			{ value: '200', count: 3 },
			{ value: '404', count: 1 },
			{ value: null, count: 1 }
		]);
	});

	it('finds subdomains of the target only', () => {
		expect(findSubdomains(entries, 'example.com')).toEqual([
			{ host: 'blog.example.com', count: 2 },
			{ host: 'dev.example.com', count: 1 }
		]);
	});

	it('extracts unique parameter names', () => {
		expect(
			extractParams([...entries, { search: '?id=3&id=4&a%5B%5D=1&=x' }, { search: '?%E0%A4%A=1' }])
		).toEqual([
			{ name: 'id', count: 3 },
			{ name: '%E0%A4%A', count: 1 },
			{ name: 'a[]', count: 1 },
			{ name: 'ref', count: 1 }
		]);
	});

	it('filters by substring', () => {
		expect(filterEntries(entries, ' PDF ')).toHaveLength(1);
		expect(filterEntries(entries, '')).toHaveLength(5);
	});
});
