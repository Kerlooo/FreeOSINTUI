import { t } from '$lib/i18n/i18n.svelte.js';
import { toAscii, toUnicode } from './punycode.js';

/**
 * Common multi-label public suffixes. Not the full Public Suffix List: enough to keep
 * `example.co.uk` from being treated as the domain `co` under `uk`.
 */
export const MULTI_PART_SUFFIXES = new Set([
	'co.uk',
	'org.uk',
	'me.uk',
	'ltd.uk',
	'plc.uk',
	'net.uk',
	'ac.uk',
	'gov.uk',
	'com.au',
	'net.au',
	'org.au',
	'edu.au',
	'gov.au',
	'co.nz',
	'org.nz',
	'net.nz',
	'com.br',
	'net.br',
	'org.br',
	'gov.br',
	'co.jp',
	'ne.jp',
	'or.jp',
	'ac.jp',
	'go.jp',
	'co.kr',
	'or.kr',
	'co.in',
	'net.in',
	'org.in',
	'gov.in',
	'co.za',
	'org.za',
	'co.il',
	'org.il',
	'co.id',
	'or.id',
	'co.th',
	'in.th',
	'com.cn',
	'net.cn',
	'org.cn',
	'gov.cn',
	'com.hk',
	'com.tw',
	'com.sg',
	'com.my',
	'com.mx',
	'com.ar',
	'com.co',
	'com.pe',
	'com.ve',
	'com.ec',
	'com.uy',
	'com.tr',
	'com.ua',
	'com.pl',
	'com.ru',
	'com.es',
	'com.pt',
	'com.gr',
	'com.cy',
	'com.eg',
	'com.sa',
	'com.pk',
	'com.ng',
	'com.ph',
	'com.vn',
	'com.bd'
]);

/**
 * Checks one ASCII label: 1 to 63 letters, digits or hyphens, no hyphen at either end,
 * and `--` in positions 3-4 only for `xn--` labels.
 * @param {string} label
 */
export function isValidLabel(label) {
	if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return false;
	return label.slice(2, 4) !== '--' || label.startsWith('xn--');
}

/**
 * Checks a whole ASCII domain name.
 * @param {string} domain
 */
export function isValidDomain(domain) {
	const labels = domain.split('.');
	return domain.length <= 253 && labels.length >= 2 && labels.every(isValidLabel);
}

/**
 * Splits an ASCII hostname into subdomain, registrable name and public suffix.
 * @param {string} hostname
 */
export function splitDomain(hostname) {
	const labels = hostname.split('.');
	const lastTwo = labels.slice(-2).join('.');
	const suffixLength = labels.length > 2 && MULTI_PART_SUFFIXES.has(lastTwo) ? 2 : 1;
	const suffix = labels.slice(-suffixLength).join('.');
	const name = labels[labels.length - suffixLength - 1];
	const subdomain = labels.slice(0, -suffixLength - 1).join('.');
	return { subdomain, name, suffix };
}

/**
 * Normalizes user input to a registrable domain: strips scheme, path, port, `www.` and any
 * other subdomain, lowercases and converts IDN to Punycode.
 * @param {string} input
 * @returns {{ error: string } | { error?: undefined, domain: string, unicode: string, name: string, suffix: string }}
 */
export function parseDomain(input) {
	let raw = input.trim().toLowerCase();
	if (!raw) return { error: t('lookalike.error.empty') };
	raw = raw
		.replace(/^[a-z][a-z\d+.-]*:\/\//, '')
		.replace(/[/?#].*$/, '')
		.replace(/\.$/, '');
	let hostname;
	try {
		hostname = new URL(`http://${raw}`).hostname;
	} catch {
		return { error: t('lookalike.error.invalid') };
	}
	hostname = toAscii(hostname.replace(/^www\./, ''));
	if (/^[\d.]+$/.test(hostname) || hostname.startsWith('['))
		return { error: t('lookalike.error.ip') };
	if (!isValidDomain(hostname)) return { error: t('lookalike.error.invalid') };
	const { name, suffix } = splitDomain(hostname);
	if (!name) return { error: t('lookalike.error.suffixOnly') };
	const domain = `${name}.${suffix}`;
	return { domain, unicode: toUnicode(domain), name: toUnicode(name), suffix };
}
