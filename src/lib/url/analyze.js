/**
 * Offline URL analysis. Nothing here opens or fetches the analyzed URL.
 */

import { classifyIp, parseIp } from '$lib/ip/address.js';
import { t } from '$lib/i18n/i18n.svelte.js';
import { defang, refang } from './refang.js';
import { analyzeHost } from './host.js';
import {
	cleanTracking,
	extractEmbedded,
	knownRedirector,
	queryParams,
	redirectChain
} from './query.js';
import { isShortenerUrl } from './shorteners.js';
import { buildFindings } from './findings.js';

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;
/** Schemes recognized without `//`, so `example.com:8080` is not read as a scheme. */
const BARE_SCHEMES = ['javascript', 'data', 'vbscript', 'mailto', 'file', 'blob', 'about', 'tel'];

/**
 * Adds `https://` when the input has no scheme (`example.com/path`).
 * @param {string} text refanged input
 */
function withScheme(text) {
	const scheme = SCHEME_RE.exec(text)?.[1]?.toLowerCase();
	if (scheme && (text.slice(scheme.length + 1).startsWith('//') || BARE_SCHEMES.includes(scheme))) {
		return { text, added: false };
	}
	return { text: `https://${text.replace(/^\/+/, '')}`, added: true };
}

/**
 * The host exactly as typed, before URL normalization (needed to spot `http://3232235777`).
 * @param {string} text input with scheme
 */
export function rawHostOf(text) {
	const authority = /^[a-z][a-z0-9+.-]*:[/\\]*([^/?#\\]*)/i.exec(text)?.[1] ?? '';
	const host = authority.slice(authority.lastIndexOf('@') + 1);
	if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1);
	return host.replace(/:\d*$/, '');
}

/**
 * Parses and analyzes a URL.
 * @param {string} input as pasted by the user (may be defanged)
 * @returns {{ error: string } | { error: null } & ReturnType<typeof buildAnalysis>}
 */
export function analyzeUrl(input) {
	const refanged = refang(input);
	if (!refanged) return { error: t('url.error.empty') };
	const { text, added } = withScheme(refanged);

	let url;
	try {
		url = new URL(text);
	} catch {
		return { error: t('url.error.invalid') };
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return { error: t('url.error.scheme', { scheme: url.protocol.replace(':', '') }) };
	}
	if (!url.hostname) return { error: t('url.error.invalid') };
	return { error: null, ...buildAnalysis(url, { input, refanged, text, schemeAdded: added }) };
}

/**
 * @param {URL} url
 * @param {{ input: string, refanged: string, text: string, schemeAdded: boolean }} meta
 */
function buildAnalysis(url, { input, refanged, text, schemeAdded }) {
	const rawHost = rawHostOf(text);
	const host = analyzeHost(url.hostname, rawHost);
	const ip = host.kind === 'name' ? null : parseIp(host.ip);
	const special = ip ? classifyIp(ip.bytes) : null;

	const analysis = {
		href: url.href,
		url,
		refanged: refanged !== input.trim(),
		schemeAdded,
		defanged: defang(url.href),
		scheme: url.protocol.replace(':', ''),
		username: decodeSafe(url.username),
		hasPassword: Boolean(url.password),
		hostname: url.hostname,
		rawHost,
		host,
		special,
		port: url.port,
		path: decodeSafe(url.pathname),
		fragment: decodeSafe(url.hash.slice(1)),
		params: queryParams(url),
		cleaned: cleanTracking(url),
		embedded: extractEmbedded(url),
		chain: redirectChain(url),
		redirector: knownRedirector(url),
		shortener: isShortenerUrl(url)
	};
	return { ...analysis, findings: buildFindings(analysis) };
}

/** @param {string} value */
function decodeSafe(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
