/** Source ids, also used as i18n keys (footprint.source.<id>). */
export const SOURCES = ['commoncrawl', 'wayback'];

/**
 * @typedef {{
 *   key: string,
 *   url: string,
 *   host: string,
 *   path: string,
 *   search: string,
 *   first: string,
 *   last: string,
 *   waybackTimestamp: string | null,
 *   sources: string[],
 *   mime: string | null,
 *   status: string | null,
 *   captures: number
 * }} FootprintEntry
 */

/**
 * Splits an archived URL. http/https, default ports and host case are not significant,
 * so the dedupe key is host + path + query. Returns null for URLs that cannot be parsed.
 * @param {string} raw
 */
export function parseArchivedUrl(raw) {
	const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
	// "mailto:", "javascript:"... (but not "host:8080/")
	if (!hasScheme && /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(raw)) return null;
	let url;
	try {
		url = new URL(hasScheme ? raw : `http://${raw}`);
	} catch {
		return null;
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
	const host = url.hostname.toLowerCase().replace(/\.$/, '');
	const path = url.pathname || '/';
	return { host, path, search: url.search, key: `${host}${path}${url.search}` };
}

/** Normalizes a CDX status: "-" or empty means unknown. */
const cleanStatus = (/** @type {string | null} */ status) =>
	status && /^\d{3}$/.test(status) ? status : null;

/** Normalizes a CDX MIME type: lowercase, no parameters; "unk" and revisit markers are unknown. */
function cleanMime(/** @type {string | null} */ mime) {
	const value = (mime ?? '').split(';')[0].trim().toLowerCase();
	return !value || value === 'unk' || value === 'warc/revisit' || value === '-' ? null : value;
}

/**
 * Merges the captures of every source into one entry per URL, keeping the first and last
 * capture time, the sources that have it and the MIME type and status of the latest capture.
 * @param {{ source: string, records: import('./commoncrawl.js').CaptureRecord[] }[]} lists
 * @returns {FootprintEntry[]} sorted by URL key
 */
export function mergeRecords(lists) {
	/** @type {Map<string, FootprintEntry>} */
	const entries = new Map();
	for (const { source, records } of lists) {
		for (const record of records) {
			const parsed = parseArchivedUrl(record.url);
			if (!parsed) continue;
			const mime = cleanMime(record.mime);
			const status = cleanStatus(record.status);
			let entry = entries.get(parsed.key);
			if (!entry) {
				entry = {
					...parsed,
					url: record.url,
					first: record.timestamp,
					last: record.timestamp,
					waybackTimestamp: null,
					sources: [],
					mime,
					status,
					captures: 0
				};
				entries.set(parsed.key, entry);
			}
			entry.captures += 1;
			if (!entry.sources.includes(source)) entry.sources.push(source);
			if (
				source === 'wayback' &&
				(!entry.waybackTimestamp || record.timestamp < entry.waybackTimestamp)
			) {
				entry.waybackTimestamp = record.timestamp;
			}
			if (record.timestamp < entry.first) {
				entry.first = record.timestamp;
				entry.url = record.url;
			}
			if (record.timestamp >= entry.last) {
				entry.last = record.timestamp;
				entry.mime = mime ?? entry.mime;
				entry.status = status ?? entry.status;
			} else {
				entry.mime ??= mime;
				entry.status ??= status;
			}
		}
	}
	for (const entry of entries.values()) entry.sources.sort();
	return [...entries.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/**
 * Link to the archived copy in the Wayback Machine, never to the live site. A Wayback
 * capture time is used when known; otherwise Wayback redirects to the closest capture.
 * @param {FootprintEntry} entry
 */
export function archiveUrl(entry) {
	return `https://web.archive.org/web/${entry.waybackTimestamp ?? entry.last}/${entry.url}`;
}

/**
 * YYYYMMDDhhmmss -> YYYY-MM-DD.
 * @param {string} timestamp
 */
export function timestampDay(timestamp) {
	return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
}
