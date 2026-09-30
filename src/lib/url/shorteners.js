/**
 * URL shortener hosts. Must match SHORTENER_HOSTS in backend/app/url.py: the backend expands
 * only these (exact host match), and the page only asks it to.
 */
export const SHORTENER_HOSTS = [
	'bit.ly',
	'bitly.com',
	't.co',
	'tinyurl.com',
	'goo.gl',
	'ow.ly',
	'is.gd',
	'buff.ly',
	'rebrand.ly',
	'cutt.ly',
	'shorturl.at',
	'www.shorturl.at',
	'rb.gy',
	't.ly',
	'tiny.cc',
	'lnkd.in',
	's.id'
];

/** Maximum number of shortener hops followed (each one a backend request). */
export const MAX_EXPAND_HOPS = 5;

/**
 * Whether the URL can be sent to the backend unshortener: http(s), allow-listed host,
 * no user info and no explicit port (same rules as the backend).
 * @param {string | URL} value
 */
export function isShortenerUrl(value) {
	let url;
	try {
		url = value instanceof URL ? value : new URL(value);
	} catch {
		return false;
	}
	return (
		(url.protocol === 'http:' || url.protocol === 'https:') &&
		!url.username &&
		!url.password &&
		!url.port &&
		SHORTENER_HOSTS.includes(url.hostname)
	);
}
