import { FetchError, fetchJson } from '$lib/net.js';
import { resolveDns, reverseName } from '$lib/dns/doh.js';
import { lookupRdap } from '$lib/rdap.js';
import { t } from '$lib/i18n/i18n.svelte.js';
import { parseIp } from './address.js';
import { serviceName } from './ports.js';

/**
 * @typedef {{ signal?: AbortSignal, fetch?: typeof fetch }} LookupOptions
 */

/**
 * Resolves the A and AAAA records of a hostname.
 * @param {string} hostname
 * @param {LookupOptions} [options]
 * @returns {Promise<{ address: string, version: 4 | 6 }[]>} IPv4 addresses first
 */
export async function resolveHostname(hostname, options = {}) {
	const [a, aaaa] = await Promise.all([
		resolveDns(hostname, 'A', options),
		resolveDns(hostname, 'AAAA', options)
	]);
	const seen = new Set();
	/** @type {{ address: string, version: 4 | 6 }[]} */
	const addresses = [];
	for (const record of [...a, ...aaaa]) {
		const ip = parseIp(record.data);
		if (!ip || seen.has(ip.address)) continue;
		seen.add(ip.address);
		addresses.push({ address: ip.address, version: ip.version });
	}
	return addresses;
}

/**
 * Reverse DNS (PTR) names of an address.
 * @param {string} ip
 * @param {LookupOptions} [options]
 */
export async function lookupPtr(ip, options = {}) {
	const records = await resolveDns(reverseName(ip), 'PTR', options);
	return [...new Set(records.map((record) => record.data))];
}

/**
 * Turns an ipwho.is response into the fields shown in the UI.
 * @param {any} data
 */
export function parseIpWhois(data) {
	if (!data?.success) {
		throw new FetchError(
			`ipwho.is: ${data?.message ?? t('ip.error.ipwhois')}${t('common.period')}`
		);
	}
	const hasCoordinates = typeof data.latitude === 'number' && typeof data.longitude === 'number';
	const connection = data.connection ?? {};
	return {
		ip: data.ip ?? null,
		continent: data.continent ?? null,
		country: data.country ?? null,
		countryCode: data.country_code ?? null,
		flag: data.flag?.emoji ?? null,
		region: data.region ?? null,
		city: data.city ?? null,
		postal: data.postal ?? null,
		latitude: hasCoordinates ? data.latitude : null,
		longitude: hasCoordinates ? data.longitude : null,
		mapUrl: hasCoordinates
			? `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=11/${data.latitude}/${data.longitude}`
			: null,
		asn: connection.asn ? `AS${connection.asn}` : null,
		org: connection.org || null,
		isp: connection.isp || null,
		domain: connection.domain || null,
		timezone: data.timezone?.id ?? null,
		utcOffset: data.timezone?.utc ?? null
	};
}

/**
 * Approximate geolocation and network (ASN, ISP) of a public address, from ipwho.is.
 * @param {string} ip
 * @param {LookupOptions} [options]
 */
export async function lookupGeo(ip, options = {}) {
	const data = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`, options);
	return parseIpWhois(data);
}

/** CVE ids sorted newest first (by year, then number). */
function sortCves(/** @type {string[]} */ cves) {
	/** @param {string} id */
	const key = (id) => {
		const match = /^CVE-(\d{4})-(\d+)$/i.exec(id);
		return match ? [Number(match[1]), Number(match[2])] : [0, 0];
	};
	return [...cves].sort((a, b) => {
		const [ya, na] = key(a);
		const [yb, nb] = key(b);
		return yb - ya || nb - na || a.localeCompare(b);
	});
}

/**
 * Turns a Shodan InternetDB response into the fields shown in the UI.
 * Returns null when Shodan has no data for the address.
 * @param {any} data
 */
export function parseInternetDb(data) {
	if (!data || data.detail) return null;
	return {
		ports: [...(data.ports ?? [])]
			.sort((a, b) => a - b)
			.map((port) => ({ port, service: serviceName(port) })),
		hostnames: data.hostnames ?? [],
		cpes: data.cpes ?? [],
		tags: data.tags ?? [],
		vulns: sortCves(data.vulns ?? [])
	};
}

/**
 * Open ports, hostnames, CPEs, tags and CVEs seen by Shodan's scans (passive: the
 * target is not contacted). Returns null when there is no data.
 * @param {string} ip
 * @param {LookupOptions} [options]
 */
export async function lookupInternetDb(ip, options = {}) {
	const data = await fetchJson(`https://internetdb.shodan.io/${encodeURIComponent(ip)}`, {
		...options,
		allowNotFound: true
	});
	return parseInternetDb(data);
}

/**
 * RDAP record of the network an address belongs to, via rdap.org.
 * Returns null when the registry has no record.
 * @param {string} ip canonical address from parseIp
 * @param {LookupOptions} [options]
 */
export async function lookupIpRdap(ip, options = {}) {
	if (!parseIp(ip)) throw new Error(t('ip.error.invalidIp'));
	return lookupRdap('ip', ip, options);
}
