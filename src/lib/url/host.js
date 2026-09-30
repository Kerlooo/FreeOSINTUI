/**
 * Offline checks on a URL hostname: IP literals (including decimal/octal/hex IPv4 forms),
 * IDN / mixed-script / look-alike letters, registrable domain and brand names in subdomains.
 */

import { toUnicodeHost } from './punycode.js';

/**
 * Suffixes under which anyone can register a name (a small built-in subset of the Public
 * Suffix List). `hosting: true` marks free hosting / dynamic DNS services, where each
 * subdomain belongs to a different user.
 * @type {Record<string, { hosting?: boolean }>}
 */
const MULTI_PART_SUFFIXES = Object.fromEntries([
	...[
		'co.uk',
		'org.uk',
		'ac.uk',
		'gov.uk',
		'me.uk',
		'net.uk',
		'ltd.uk',
		'plc.uk',
		'com.au',
		'net.au',
		'org.au',
		'edu.au',
		'gov.au',
		'co.nz',
		'org.nz',
		'net.nz',
		'co.jp',
		'ne.jp',
		'or.jp',
		'ac.jp',
		'go.jp',
		'com.br',
		'net.br',
		'org.br',
		'gov.br',
		'com.cn',
		'net.cn',
		'org.cn',
		'gov.cn',
		'com.hk',
		'com.tw',
		'com.sg',
		'com.my',
		'co.id',
		'co.in',
		'net.in',
		'org.in',
		'co.il',
		'co.kr',
		'or.kr',
		'co.za',
		'org.za',
		'com.mx',
		'com.ar',
		'com.co',
		'com.pe',
		'com.tr',
		'com.ua',
		'com.pl',
		'com.ru',
		'com.eg',
		'com.sa',
		'com.ng',
		'com.pk',
		'com.ph',
		'com.vn',
		'co.th',
		'gov.it',
		'edu.it'
	].map((s) => [s, {}]),
	...[
		'github.io',
		'gitlab.io',
		'herokuapp.com',
		'blogspot.com',
		'netlify.app',
		'vercel.app',
		'pages.dev',
		'workers.dev',
		'web.app',
		'firebaseapp.com',
		'appspot.com',
		'azurewebsites.net',
		'cloudfront.net',
		'glitch.me',
		'ngrok.io',
		'ngrok-free.app',
		'ngrok.app',
		'repl.co',
		'replit.dev',
		'wixsite.com',
		'weebly.com',
		'000webhostapp.com',
		'duckdns.org',
		'no-ip.org',
		'ddns.net',
		'trycloudflare.com',
		'onrender.com',
		'fly.dev',
		'surge.sh',
		'myshopify.com',
		'wordpress.com',
		'sharepoint.com',
		's3.amazonaws.com'
	].map((s) => [s, { hosting: true }])
]);

/**
 * Brand names often borrowed by phishing hostnames. Matched as whole words (split on `.` and `-`).
 * Each brand lists the registrable domains that legitimately use it.
 * @type {Record<string, string[]>}
 */
const BRANDS = {
	paypal: ['paypal.com', 'paypal.me', 'paypalobjects.com'],
	apple: ['apple.com', 'apple.news'],
	icloud: ['icloud.com'],
	microsoft: ['microsoft.com', 'microsoftonline.com'],
	office365: ['office365.com', 'office.com'],
	outlook: ['outlook.com', 'live.com', 'office.com'],
	google: ['google.com', 'googleusercontent.com', 'googleapis.com'],
	gmail: ['gmail.com', 'google.com'],
	amazon: ['amazon.com', 'amazonaws.com'],
	facebook: ['facebook.com', 'fb.com'],
	instagram: ['instagram.com'],
	whatsapp: ['whatsapp.com', 'whatsapp.net'],
	netflix: ['netflix.com'],
	linkedin: ['linkedin.com'],
	dropbox: ['dropbox.com', 'dropboxusercontent.com'],
	docusign: ['docusign.com', 'docusign.net'],
	adobe: ['adobe.com'],
	chase: ['chase.com'],
	wellsfargo: ['wellsfargo.com'],
	bankofamerica: ['bankofamerica.com'],
	dhl: ['dhl.com', 'dhl.de'],
	fedex: ['fedex.com'],
	usps: ['usps.com'],
	binance: ['binance.com'],
	coinbase: ['coinbase.com'],
	metamask: ['metamask.io'],
	steam: ['steampowered.com', 'steamcommunity.com'],
	roblox: ['roblox.com'],
	ebay: ['ebay.com'],
	twitter: ['twitter.com', 'x.com'],
	telegram: ['telegram.org', 't.me'],
	yahoo: ['yahoo.com'],
	spotify: ['spotify.com'],
	poste: ['poste.it', 'posteitaliane.it'],
	intesasanpaolo: ['intesasanpaolo.com'],
	unicredit: ['unicredit.it', 'unicredit.eu']
};

/** Cyrillic and Greek letters that look like Latin ones. */
const CONFUSABLES = {
	а: 'a',
	с: 'c',
	ԁ: 'd',
	е: 'e',
	һ: 'h',
	і: 'i',
	ј: 'j',
	к: 'k',
	ӏ: 'l',
	о: 'o',
	р: 'p',
	ԛ: 'q',
	ѕ: 's',
	υ: 'u',
	ѵ: 'v',
	ԝ: 'w',
	х: 'x',
	у: 'y',
	α: 'a',
	ε: 'e',
	ι: 'i',
	κ: 'k',
	ν: 'v',
	ο: 'o',
	ρ: 'p',
	χ: 'x',
	ɡ: 'g',
	ɑ: 'a'
};

const LOOKALIKE_SCRIPTS = ['Cyrillic', 'Greek', 'Armenian'];

const SCRIPTS = /** @type {const} */ ([
	['Latin', /\p{Script=Latin}/u],
	['Cyrillic', /\p{Script=Cyrillic}/u],
	['Greek', /\p{Script=Greek}/u],
	['Armenian', /\p{Script=Armenian}/u],
	['Han', /\p{Script=Han}/u],
	['Hiragana', /\p{Script=Hiragana}/u],
	['Katakana', /\p{Script=Katakana}/u],
	['Hangul', /\p{Script=Hangul}/u],
	['Arabic', /\p{Script=Arabic}/u],
	['Hebrew', /\p{Script=Hebrew}/u],
	['Thai', /\p{Script=Thai}/u],
	['Devanagari', /\p{Script=Devanagari}/u]
]);

/**
 * Scripts used by the letters of a label (digits and hyphens are ignored).
 * @param {string} label
 */
export function labelScripts(label) {
	const found = new Set();
	for (const char of label) {
		if (!/\p{L}/u.test(char)) continue;
		const script = SCRIPTS.find(([, pattern]) => pattern.test(char));
		found.add(script ? script[0] : 'Other');
	}
	return [...found];
}

/**
 * Replaces look-alike Cyrillic/Greek letters with the Latin letter they imitate.
 * @param {string} text
 */
export function latinSkeleton(text) {
	return [...text.toLowerCase()]
		.map((c) => CONFUSABLES[/** @type {keyof typeof CONFUSABLES} */ (c)] ?? c)
		.join('');
}

/**
 * Parses one IPv4 part the way the WHATWG URL parser does (0x = hex, leading 0 = octal).
 * @param {string} part
 * @returns {{ value: number, form: 'decimal' | 'octal' | 'hex' } | null}
 */
function parseIpv4Part(part) {
	if (/^0x[0-9a-f]*$/i.test(part))
		return { value: parseInt(part.slice(2) || '0', 16), form: 'hex' };
	if (/^0[0-7]+$/.test(part)) return { value: parseInt(part, 8), form: 'octal' };
	if (/^(0|[1-9]\d*)$/.test(part)) return { value: Number(part), form: 'decimal' };
	return null;
}

/**
 * Detects an IPv4 address written in a non-standard form, as browsers accept it:
 * `3232235777`, `0xc0a80101`, `0300.0250.1.1`, `192.168.257`.
 * @param {string} rawHost the host exactly as typed
 * @returns {{ address: string, forms: string[] } | null} null for normal dotted quads and non-IPs
 */
export function obfuscatedIpv4(rawHost) {
	const host = rawHost.replace(/\.$/, '');
	const parts = host.split('.');
	if (parts.length > 4 || parts.some((p) => p === '')) return null;
	const parsed = parts.map(parseIpv4Part);
	if (parsed.some((p) => p === null)) return null;
	const values = /** @type {{ value: number, form: string }[]} */ (parsed);
	const last = values[values.length - 1].value;
	if (values.slice(0, -1).some((p) => p.value > 255)) return null;
	if (last >= 256 ** (5 - values.length)) return null;
	let number = last;
	values.slice(0, -1).forEach((p, i) => {
		number += p.value * 256 ** (3 - i);
	});
	const address = [24, 16, 8, 0].map((shift) => Math.floor(number / 2 ** shift) % 256).join('.');
	if (address === host) return null;
	const forms = new Set(values.map((p) => p.form));
	if (parts.length < 4) forms.add('short');
	return { address, forms: [...forms] };
}

/**
 * Splits an ASCII hostname into subdomain, registrable domain and public suffix.
 * @param {string} hostname lower-case, no trailing dot
 */
export function splitHost(hostname) {
	const labels = hostname.split('.');
	let suffixLength = 1;
	/** @type {{ hosting?: boolean }} */
	let info = {};
	for (let n = Math.min(3, labels.length - 1); n >= 2; n--) {
		const candidate = labels.slice(-n).join('.');
		if (MULTI_PART_SUFFIXES[candidate]) {
			suffixLength = n;
			info = MULTI_PART_SUFFIXES[candidate];
			break;
		}
	}
	if (labels.length <= suffixLength) {
		return { suffix: hostname, registrable: hostname, subdomain: '', hosting: false };
	}
	const registrableLabels = labels.slice(-(suffixLength + 1));
	return {
		suffix: labels.slice(-suffixLength).join('.'),
		registrable: registrableLabels.join('.'),
		subdomain: labels.slice(0, labels.length - suffixLength - 1).join('.'),
		hosting: Boolean(info.hosting)
	};
}

/**
 * Brand names found in the hostname outside a domain that the brand really uses.
 * @param {string} unicodeHost
 * @param {string} registrable
 */
export function brandsInHost(unicodeHost, registrable) {
	const words = new Set(
		latinSkeleton(unicodeHost)
			.split(/[.\-_\d]+/)
			.filter(Boolean)
	);
	return Object.entries(BRANDS)
		.filter(([brand, domains]) => words.has(brand) && !domains.includes(registrable))
		.map(([brand]) => brand);
}

/**
 * All host checks for a parsed URL.
 * @param {string} hostname `URL.hostname` (ASCII, lower-case; IPv6 in brackets)
 * @param {string} rawHost the host part as typed, before URL normalization
 */
export function analyzeHost(hostname, rawHost) {
	const clean = hostname.replace(/\.$/, '');
	if (clean.startsWith('[')) {
		return { kind: /** @type {const} */ ('ipv6'), ip: clean.slice(1, -1), ascii: clean };
	}
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) {
		const unicodeRaw = rawHost.toLowerCase();
		return {
			kind: /** @type {const} */ ('ipv4'),
			ip: clean,
			ascii: clean,
			obfuscated: obfuscatedIpv4(unicodeRaw)
		};
	}

	const unicode = toUnicodeHost(clean);
	const { registrable, subdomain, suffix, hosting } = splitHost(clean);
	const labels = unicode.split('.');
	const mixedLabels = labels.filter((label) => labelScripts(label).length > 1);
	// Latin mixed with scripts that have Latin look-alikes is the classic homograph trick.
	const riskyMix = mixedLabels.some((label) => {
		const scripts = labelScripts(label);
		return scripts.includes('Latin') && scripts.some((s) => LOOKALIKE_SCRIPTS.includes(s));
	});
	const nonLatin = labels.flatMap(labelScripts).filter((s) => s !== 'Latin');
	const skeleton = latinSkeleton(unicode);
	const lookalike = skeleton !== unicode.toLowerCase() && /^[\x20-\x7e]+$/.test(skeleton);
	const subdomainLabels = subdomain ? subdomain.split('.') : [];

	return {
		kind: /** @type {const} */ ('name'),
		ascii: clean,
		unicode,
		idn: clean.split('.').some((label) => label.startsWith('xn--')),
		scripts: [...new Set(labels.flatMap(labelScripts))],
		nonLatin: [...new Set(nonLatin)],
		mixedLabels,
		riskyMix,
		lookalike: lookalike ? skeleton : null,
		registrable,
		registrableUnicode: toUnicodeHost(registrable),
		subdomain,
		suffix,
		hosting,
		subdomainDepth: subdomainLabels.length,
		brands: brandsInHost(unicode, registrable),
		dotless: !clean.includes('.')
	};
}
