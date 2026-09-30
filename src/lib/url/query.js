/**
 * Query string analysis: tracking parameters, embedded redirect targets and known redirectors.
 */

/** Tracking parameters removed from the cleaned URL, whatever the site. */
const TRACKING_PARAMS = new Set([
	'fbclid',
	'gclid',
	'gclsrc',
	'dclid',
	'gbraid',
	'wbraid',
	'msclkid',
	'mc_eid',
	'mc_cid',
	'igshid',
	'igsh',
	'yclid',
	'twclid',
	'ttclid',
	'li_fat_id',
	'epik',
	'rb_clickid',
	'wickedid',
	'_hsenc',
	'_hsmi',
	'__hssc',
	'__hstc',
	'__hsfp',
	'hsctatracking',
	'mkt_tok',
	'oly_anon_id',
	'oly_enc_id',
	'vero_id',
	'vero_conv',
	'_openstat',
	'_ga',
	'_gl',
	's_cid',
	'ref_src',
	'ref_url',
	'srsltid',
	'trk',
	'trkcampaign',
	'sc_campaign',
	'sc_channel',
	'sc_content',
	'sc_medium',
	'sc_outcome',
	'sc_geo',
	'sc_country',
	'spm',
	'scm'
]);

/** Parameter prefixes that are always tracking (`utm_source`, `pk_campaign`…). */
const TRACKING_PREFIXES = ['utm_', 'pk_', 'mtm_', 'stm_', 'hmb_', 'ga_'];

/** Parameters that only track on some sites (elsewhere they may be meaningful). */
const SITE_TRACKING = [
	{ hosts: ['youtube.com', 'youtu.be', 'spotify.com'], params: ['si', 'feature', 'pp'] },
	{ hosts: ['twitter.com', 'x.com'], params: ['s', 't', 'ref_src'] },
	{ hosts: ['instagram.com'], params: ['igsh', 'img_index'] },
	{
		hosts: ['amazon.com', 'amazon.it', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es'],
		params: ['ref', 'ref_', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg', 'pf_rd_p', 'pf_rd_r', 'psc', 'th']
	},
	{ hosts: ['linkedin.com'], params: ['trackingid', 'refid', 'lipi', 'midtoken', 'midsig', 'trk'] },
	{
		hosts: ['tiktok.com'],
		params: ['is_from_webapp', 'sender_device', 'sender_web_id', '_r', '_t']
	}
];

/** Parameter names commonly used to carry a redirect target. */
export const REDIRECT_PARAMS = new Set([
	'url',
	'u',
	'q',
	'redirect',
	'redirect_url',
	'redirect_uri',
	'redirecturl',
	'redirecturi',
	'redir',
	'next',
	'dest',
	'destination',
	'continue',
	'target',
	'returnurl',
	'return_url',
	'return',
	'returnto',
	'return_to',
	'goto',
	'go',
	'link',
	'out',
	'to',
	'r',
	'forward',
	'callback',
	'service',
	'successurl',
	'backurl',
	'ref'
]);

/** Known link wrappers and redirectors, with the parameters holding the target. */
const REDIRECTORS = [
	{
		id: 'google',
		test: (/** @type {URL} */ u) =>
			/(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname === '/url',
		params: ['q', 'url']
	},
	{
		id: 'facebook',
		test: (/** @type {URL} */ u) =>
			/(^|\.)(l|lm)\.facebook\.com$/.test(u.hostname) && u.pathname === '/l.php',
		params: ['u']
	},
	{
		id: 'instagram',
		test: (/** @type {URL} */ u) => u.hostname === 'l.instagram.com',
		params: ['u']
	},
	{
		id: 'safelinks',
		test: (/** @type {URL} */ u) => u.hostname.endsWith('.safelinks.protection.outlook.com'),
		params: ['url']
	},
	{
		id: 'urldefense',
		test: (/** @type {URL} */ u) => /(^|\.)urldefense\.(com|proofpoint\.com)$/.test(u.hostname),
		params: []
	},
	{
		id: 'youtube',
		test: (/** @type {URL} */ u) =>
			/(^|\.)youtube\.com$/.test(u.hostname) && u.pathname === '/redirect',
		params: ['q']
	},
	{
		id: 'vk',
		test: (/** @type {URL} */ u) => u.hostname === 'vk.com' && u.pathname === '/away.php',
		params: ['to']
	},
	{
		id: 'linkedin',
		test: (/** @type {URL} */ u) =>
			/(^|\.)linkedin\.com$/.test(u.hostname) && u.pathname.startsWith('/redir/'),
		params: ['url']
	},
	{
		id: 'slack',
		test: (/** @type {URL} */ u) => u.hostname === 'slack-redir.net',
		params: ['url']
	},
	{
		id: 'steam',
		test: (/** @type {URL} */ u) =>
			u.hostname === 'steamcommunity.com' && u.pathname === '/linkfilter/',
		params: ['url', 'u']
	}
];

/**
 * @param {string} hostname
 * @param {string[]} hosts
 */
const hostIn = (hostname, hosts) => hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));

/**
 * Whether a query parameter is a known tracking parameter on this host.
 * @param {string} name
 * @param {string} hostname
 */
export function isTrackingParam(name, hostname) {
	const key = name.toLowerCase();
	if (TRACKING_PARAMS.has(key)) return true;
	if (TRACKING_PREFIXES.some((prefix) => key.startsWith(prefix))) return true;
	return SITE_TRACKING.some((rule) => hostIn(hostname, rule.hosts) && rule.params.includes(key));
}

/**
 * The URL without its tracking parameters (fragment kept).
 * @param {URL} url
 * @returns {{ url: string, removed: string[] }}
 */
export function cleanTracking(url) {
	const clean = new URL(url.href);
	const removed = [];
	for (const name of [...new Set(url.searchParams.keys())]) {
		if (isTrackingParam(name, url.hostname)) {
			clean.searchParams.delete(name);
			removed.push(name);
		}
	}
	return { url: removed.length ? clean.href : url.href, removed };
}

const URL_START = /^https?:\/\//i;

/**
 * Tries to read an http(s) URL out of a parameter value:
 * plain, URL-encoded once or more, protocol-relative or base64/base64url.
 * @param {string} value already decoded once by URLSearchParams
 * @returns {{ url: string, encoding: 'plain' | 'percent' | 'base64' } | null}
 */
export function decodeEmbeddedUrl(value) {
	let text = value.trim();
	let encoding = /** @type {'plain' | 'percent' | 'base64'} */ ('plain');
	for (let i = 0; i < 4 && /^https?%(25)*3a/i.test(text); i++) {
		try {
			text = decodeURIComponent(text);
			encoding = 'percent';
		} catch {
			break;
		}
	}
	if (URL_START.test(text)) return validHttpUrl(text) ? { url: text, encoding } : null;
	if (text.startsWith('//') && /^\/\/[a-z0-9-]+\.[a-z0-9.-]+/i.test(text)) {
		const url = `https:${text}`;
		return validHttpUrl(url) ? { url, encoding } : null;
	}
	if (/^[A-Za-z0-9+/_-]{12,}={0,2}$/.test(text)) {
		const decoded = decodeBase64(text);
		if (decoded && URL_START.test(decoded) && validHttpUrl(decoded)) {
			return { url: decoded, encoding: 'base64' };
		}
	}
	return null;
}

/** @param {string} text */
function validHttpUrl(text) {
	try {
		const url = new URL(text);
		return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
	} catch {
		return false;
	}
}

/**
 * Decodes base64 or base64url into a UTF-8 string, or null.
 * @param {string} text
 */
export function decodeBase64(text) {
	try {
		const normal = text.replace(/-/g, '+').replace(/_/g, '/');
		const padded = normal + '='.repeat((4 - (normal.length % 4)) % 4);
		const binary = atob(padded);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		return null;
	}
}

/** Maps `**X` run-length markers of Proofpoint v3 URLs to their length. */
const V3_RUN_LENGTHS = Object.fromEntries(
	[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'].map((c, i) => [c, i + 2])
);

/**
 * Decodes Proofpoint URL Defense links (v2 and v3). Returns null when the URL is not one.
 * @param {URL} url
 */
export function decodeUrlDefense(url) {
	if (!/(^|\.)urldefense\.(com|proofpoint\.com)$/.test(url.hostname)) return null;

	if (url.pathname.startsWith('/v2/')) {
		const u = url.searchParams.get('u');
		if (!u) return null;
		try {
			return decodeURIComponent(u.replace(/-/g, '%').replace(/_/g, '/'));
		} catch {
			return null;
		}
	}

	if (url.pathname.startsWith('/v1/')) {
		return url.searchParams.get('u');
	}

	const match = /\/v3\/__(.+?)__(?:;([^!]*))?!/.exec(url.href);
	if (!match) return null;
	let encoded;
	try {
		encoded = decodeURIComponent(match[1]);
	} catch {
		encoded = match[1];
	}
	const bytes = match[2] ? (decodeBase64(match[2]) ?? '') : '';
	const chars = [...bytes];
	let marker = 0;
	const decoded = encoded.replace(/\*(\*.)?/g, (token) => {
		if (token === '*') return chars[marker++] ?? '';
		const run = V3_RUN_LENGTHS[token[2]] ?? 0;
		const out = chars.slice(marker, marker + run).join('');
		marker += run;
		return out;
	});
	return decoded.replace(/^([a-z0-9+.-]+:\/)([^/].+)/i, '$1/$2');
}

/**
 * Known redirector or link wrapper matching the URL, if any.
 * @param {URL} url
 */
export function knownRedirector(url) {
	return REDIRECTORS.find((r) => r.test(url))?.id ?? null;
}

/**
 * URLs embedded in the query string (and in the fragment when it looks like a query),
 * plus the target of known wrappers. Each entry says where it was found.
 * @param {URL} url
 * @returns {{ param: string | null, source: 'query' | 'fragment' | 'wrapper', url: string, encoding: string, redirectParam: boolean }[]}
 */
export function extractEmbedded(url) {
	/** @type {ReturnType<typeof extractEmbedded>} */
	const found = [];
	const seen = new Set();
	/** @param {ReturnType<typeof extractEmbedded>[number]} entry */
	const add = (entry) => {
		if (seen.has(entry.url) || entry.url === url.href) return;
		seen.add(entry.url);
		found.push(entry);
	};

	const wrapped = decodeUrlDefense(url);
	if (wrapped && validHttpUrl(wrapped)) {
		add({
			param: null,
			source: 'wrapper',
			url: wrapped,
			encoding: 'urldefense',
			redirectParam: true
		});
	}

	/** @type {[URLSearchParams, 'query' | 'fragment'][]} */
	const sources = [[url.searchParams, 'query']];
	if (/^#[^#]*=/.test(url.hash)) sources.push([new URLSearchParams(url.hash.slice(1)), 'fragment']);

	for (const [params, source] of sources) {
		for (const [name, value] of params) {
			const embedded = decodeEmbeddedUrl(value);
			if (!embedded) continue;
			add({
				param: name,
				source,
				url: embedded.url,
				encoding: embedded.encoding,
				redirectParam: REDIRECT_PARAMS.has(name.toLowerCase())
			});
		}
	}
	return found;
}

/**
 * Follows embedded redirect targets offline, e.g. a Google redirect wrapping a Facebook one.
 * Returns the chain of URLs after the first (at most `maxDepth`).
 * @param {URL} url
 * @param {number} [maxDepth]
 */
export function redirectChain(url, maxDepth = 5) {
	/** @type {string[]} */
	const chain = [];
	let current = url;
	for (let i = 0; i < maxDepth; i++) {
		const next = extractEmbedded(current).find((e) => e.redirectParam || e.source === 'wrapper');
		if (!next || chain.includes(next.url)) break;
		chain.push(next.url);
		current = new URL(next.url);
	}
	return chain;
}

/**
 * Query parameters as a list, with tracking and embedded-URL flags.
 * @param {URL} url
 */
export function queryParams(url) {
	return [...url.searchParams].map(([name, value]) => ({
		name,
		value,
		tracking: isTrackingParam(name, url.hostname),
		embedded: decodeEmbeddedUrl(value)?.url ?? null
	}));
}
