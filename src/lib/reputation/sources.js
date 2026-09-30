/**
 * Reputation sources. Each lookup resolves to one normalized result:
 * `{ status: 'listed' | 'not_listed' | 'unavailable', checked, date, link, details, reason? }`.
 *
 * Browser-side (CORS allowed): AlienVault OTX, StopForumSpam.
 * Backend (no CORS, or a secret key): Tor exit list, Spamhaus DROP, URLhaus, ThreatFox.
 *
 * DNSBLs are deliberately not queried through Google DNS-over-HTTPS: Spamhaus answers
 * 127.255.255.254 ("query via public resolver refused") to public resolvers, which would
 * look like a listing for every address and give false positives.
 */

import { md5 } from 'hash-wasm';
import { fetchJson } from '$lib/net.js';
import { apiGet } from '$lib/api.js';

/**
 * @typedef {import('./indicator.js').Indicator} Indicator
 * @typedef {{ signal?: AbortSignal, fetch?: typeof fetch }} LookupOptions
 * @typedef {{
 *   status: 'listed' | 'not_listed' | 'unavailable',
 *   checked: string,
 *   date: string | null,
 *   link: string | null,
 *   details: any,
 *   reason?: 'notConfigured'
 * }} SourceResult
 * @typedef {{
 *   id: string,
 *   name: string,
 *   backend: boolean,
 *   term: (indicator: Indicator) => string | null,
 *   lookup: (indicator: Indicator, options?: LookupOptions) => Promise<SourceResult>
 * }} Source
 */

/** OTX answers slowly, especially for popular indicators. */
const OTX_TIMEOUT_MS = 40000;

/**
 * OTX indicator type for the API and for the web page.
 * Domains with more than two labels are looked up as hostnames (OTX keeps them apart).
 * @param {Indicator} indicator
 * @returns {{ api: string, page: string, value: string } | null}
 */
export function otxTarget(indicator) {
	if (indicator.kind === 'ip') {
		const api = indicator.ip.version === 4 ? 'IPv4' : 'IPv6';
		return { api, page: 'ip', value: indicator.value };
	}
	if (indicator.kind === 'url') return { api: 'url', page: 'url', value: indicator.value };
	const host = indicator.kind === 'email' ? indicator.domain : indicator.value;
	const type = host.split('.').length > 2 ? 'hostname' : 'domain';
	return { api: type, page: type, value: host };
}

/**
 * Keeps pulse count, the most recent pulses and whitelist notes of an OTX "general" answer.
 * @param {any} json
 */
export function parseOtx(json) {
	const info = json?.pulse_info ?? {};
	/** @type {any[]} */
	const pulses = Array.isArray(info.pulses) ? info.pulses : [];
	const count = Number(info.count) || pulses.length;
	const recent = pulses
		.map((pulse) => ({
			id: String(pulse.id ?? ''),
			name: String(pulse.name ?? ''),
			date: pulse.modified || pulse.created || null,
			tags: (Array.isArray(pulse.tags) ? pulse.tags : []).filter(Boolean).slice(0, 5),
			malware: (Array.isArray(pulse.malware_families) ? pulse.malware_families : [])
				.map((/** @type {any} */ m) => (typeof m === 'string' ? m : m?.display_name || m?.id))
				.filter(Boolean)
		}))
		.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
	/** @type {any[]} */
	const validation = Array.isArray(json?.validation) ? json.validation : [];
	return {
		count,
		pulses: recent.slice(0, 5),
		latest: recent[0]?.date ?? null,
		whitelisted: validation.map((v) => v?.name || v?.source).filter(Boolean)
	};
}

/** @type {Source} */
const otx = {
	id: 'otx',
	name: 'AlienVault OTX',
	backend: false,
	term: (indicator) => otxTarget(indicator)?.value ?? null,
	async lookup(indicator, { signal, fetch } = {}) {
		const target = /** @type {NonNullable<ReturnType<typeof otxTarget>>} */ (otxTarget(indicator));
		const encoded = encodeURIComponent(target.value);
		const json = await fetchJson(
			`https://otx.alienvault.com/api/v1/indicators/${target.api}/${encoded}/general`,
			{ signal, fetch, allowNotFound: true, timeoutMs: OTX_TIMEOUT_MS }
		);
		const details = parseOtx(json);
		return {
			status: details.count > 0 ? 'listed' : 'not_listed',
			checked: target.value,
			date: details.latest,
			link: `https://otx.alienvault.com/indicator/${target.page}/${encoded}`,
			details
		};
	}
};

/**
 * Reads one StopForumSpam field (`ip` or `emailhash`) of a JSON answer.
 * @param {any} json
 * @param {'ip' | 'emailhash'} field
 */
export function parseStopForumSpam(json, field) {
	if (json?.success !== 1) throw new Error(`StopForumSpam: ${json?.error ?? 'request failed'}`);
	const entry = json[field] ?? {};
	const appears = Number(entry.appears) > 0;
	return {
		appears,
		frequency: Number(entry.frequency) || 0,
		lastseen: entry.lastseen || null,
		confidence: entry.confidence ?? null,
		torexit: entry.torexit === 1
	};
}

/** @type {Source} */
const stopForumSpam = {
	id: 'sfs',
	name: 'StopForumSpam',
	backend: false,
	term: (indicator) =>
		indicator.kind === 'ip' || indicator.kind === 'email' ? indicator.value : null,
	async lookup(indicator, { signal, fetch } = {}) {
		const isEmail = indicator.kind === 'email';
		// Email addresses are never sent in clear: StopForumSpam accepts their MD5 (`emailhash`).
		const field = isEmail ? 'emailhash' : 'ip';
		const param = isEmail ? await md5(indicator.value) : indicator.value;
		const json = await fetchJson(
			`https://api.stopforumspam.org/api?${field}=${encodeURIComponent(param)}&json`,
			{ signal, fetch }
		);
		const details = parseStopForumSpam(json, field);
		return {
			status: details.appears ? 'listed' : 'not_listed',
			checked: indicator.value,
			date: details.lastseen,
			// The search page would need the plain address in the URL, so emails link to the site only.
			link: isEmail
				? 'https://www.stopforumspam.com/'
				: `https://www.stopforumspam.com/ipcheck/${encodeURIComponent(indicator.value)}`,
			details
		};
	}
};

/**
 * Turns a backend answer into a SourceResult; `not_configured` becomes "unavailable".
 * @param {any} data
 * @param {string | null} link
 * @returns {SourceResult}
 */
export function fromBackend(data, link) {
	const base = {
		checked: String(data.checked ?? ''),
		date: data.date ?? null,
		link: data.reference || link,
		details: data.details ?? {}
	};
	if (data.status === 'not_configured')
		return { ...base, status: 'unavailable', reason: 'notConfigured' };
	return { ...base, status: data.status === 'listed' ? 'listed' : 'not_listed' };
}

/** @param {Indicator} indicator */
const ipOnly = (indicator) => (indicator.kind === 'ip' ? indicator.value : null);

/** @type {Source} */
const tor = {
	id: 'tor',
	name: 'Tor Project',
	backend: true,
	term: ipOnly,
	async lookup(indicator, { signal, fetch } = {}) {
		const data = await apiGet('/api/reputation/tor', {
			params: { ip: indicator.value },
			signal,
			fetch
		});
		return fromBackend(
			data,
			`https://metrics.torproject.org/rs.html#search/${encodeURIComponent(indicator.value)}`
		);
	}
};

/** @type {Source} */
const drop = {
	id: 'drop',
	name: 'Spamhaus DROP',
	backend: true,
	term: ipOnly,
	async lookup(indicator, { signal, fetch } = {}) {
		const data = await apiGet('/api/reputation/drop', {
			params: { ip: indicator.value },
			signal,
			fetch
		});
		return fromBackend(
			data,
			`https://check.spamhaus.org/results/?query=${encodeURIComponent(indicator.value)}`
		);
	}
};

/**
 * URLhaus looks up a host (domain or IPv4) or an exact URL.
 * @param {Indicator} indicator
 * @returns {{ host: string } | { url: string } | null}
 */
export function urlhausQuery(indicator) {
	if (indicator.kind === 'url') return { url: indicator.value };
	if (indicator.kind === 'domain') return { host: indicator.value };
	if (indicator.kind === 'ip' && indicator.ip.version === 4) return { host: indicator.value };
	return null;
}

/** @type {Source} */
const urlhaus = {
	id: 'urlhaus',
	name: 'abuse.ch URLhaus',
	backend: true,
	term: (indicator) => {
		const query = urlhausQuery(indicator);
		return query ? Object.values(query)[0] : null;
	},
	async lookup(indicator, { signal, fetch } = {}) {
		const query = /** @type {Record<string, string>} */ (urlhausQuery(indicator));
		const data = await apiGet('/api/reputation/urlhaus', { params: query, signal, fetch });
		const link =
			'host' in query
				? `https://urlhaus.abuse.ch/host/${encodeURIComponent(query.host)}/`
				: `https://urlhaus.abuse.ch/browse.php?search=${encodeURIComponent(query.url)}`;
		return fromBackend(data, link);
	}
};

/** @type {Source} */
const threatfox = {
	id: 'threatfox',
	name: 'abuse.ch ThreatFox',
	backend: true,
	term: (indicator) => (indicator.kind === 'email' ? null : indicator.value),
	async lookup(indicator, { signal, fetch } = {}) {
		const data = await apiGet('/api/reputation/threatfox', {
			params: { term: indicator.value },
			signal,
			fetch
		});
		return fromBackend(
			data,
			`https://threatfox.abuse.ch/browse.php?search=ioc%3A${encodeURIComponent(indicator.value)}`
		);
	}
};

/** All sources, in display order. */
export const SOURCES = [otx, stopForumSpam, tor, drop, urlhaus, threatfox];

/**
 * Sources that apply to an indicator (e.g. Tor and DROP only for IP addresses).
 * @param {Indicator} indicator
 */
export function sourcesFor(indicator) {
	return SOURCES.filter((source) => source.term(indicator) !== null);
}

/**
 * Counts results for the summary. `pending` sections are still loading.
 * @param {({ status: 'loading' | 'done' | 'error', data?: SourceResult })[]} sections
 */
export function countResults(sections) {
	const counts = { listed: 0, notListed: 0, unavailable: 0, pending: 0 };
	for (const section of sections) {
		if (section.status === 'loading') counts.pending++;
		else if (section.status === 'error') counts.unavailable++;
		else if (section.data?.status === 'listed') counts.listed++;
		else if (section.data?.status === 'not_listed') counts.notListed++;
		else counts.unavailable++;
	}
	return counts;
}

/**
 * Parses the date formats used by the sources ("2026-06-30 01:49:12", "... UTC",
 * ISO with or without zone, microseconds). Dates without a zone are UTC.
 * @param {string | null | undefined} value
 * @returns {Date | null}
 */
export function parseSourceDate(value) {
	if (!value) return null;
	const match =
		/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?)(\.\d+)?)?\s*(UTC|Z|[+-]\d{2}:?\d{2})?$/i.exec(
			String(value).trim()
		);
	if (!match) return null;
	const [, day, time = '00:00:00', fraction = '', zone = 'Z'] = match;
	const ms = fraction ? fraction.slice(0, 4).padEnd(4, '0') : '';
	const offset = /^utc$/i.test(zone)
		? 'Z'
		: zone.toUpperCase().replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
	const date = new Date(`${day}T${time.length === 5 ? `${time}:00` : time}${ms}${offset}`);
	return Number.isNaN(date.getTime()) ? null : date;
}
