import { classifyIp, parseInput, parseIp } from '$lib/ip/address.js';
import { parseEmail } from '$lib/email/address.js';
import { t } from '$lib/i18n/i18n.svelte.js';

/** Longest URL accepted, the same limit the backend enforces. */
export const MAX_URL_LENGTH = 2048;

/**
 * @typedef {NonNullable<ReturnType<typeof parseIp>>} ParsedIp
 * @typedef {{ kind: 'ip', value: string, ip: ParsedIp, special: ReturnType<typeof classifyIp> }
 *   | { kind: 'domain', value: string }
 *   | { kind: 'url', value: string, host: string, hostIp: ParsedIp | null }
 *   | { kind: 'email', value: string, domain: string }} Indicator
 */

/**
 * Detects what the user pasted: an email address, an http(s) URL, an IP address or a domain.
 * @param {string} text
 * @returns {Indicator | { kind: 'error', error: string }}
 */
export function parseIndicator(text) {
	const value = text.trim();
	if (!value) return { kind: 'error', error: t('reputation.error.empty') };

	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return parseUrl(value);

	if (value.includes('@') && !value.includes('/')) {
		const email = parseEmail(value);
		if (email.error !== undefined) return { kind: 'error', error: email.error };
		return { kind: 'email', value: email.email, domain: email.domain };
	}

	const ip = parseIp(value);
	if (ip) return { kind: 'ip', value: ip.address, ip, special: classifyIp(ip.bytes) };

	// A bare host with a path (example.com/login) is a URL without scheme.
	if (/^[^/?#\s]+[/?#]/.test(value)) return parseUrl(`http://${value}`);

	const parsed = parseInput(value);
	if (parsed.kind === 'hostname') return { kind: 'domain', value: parsed.hostname };
	return { kind: 'error', error: t('reputation.error.invalid') };
}

/** @param {string} value */
function parseUrl(value) {
	if (value.length > MAX_URL_LENGTH)
		return /** @type {const} */ ({
			kind: 'error',
			error: t('reputation.error.urlTooLong', { max: MAX_URL_LENGTH })
		});
	/** @type {URL} */
	let url;
	try {
		url = new URL(value);
	} catch {
		return /** @type {const} */ ({ kind: 'error', error: t('reputation.error.url') });
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:')
		return /** @type {const} */ ({ kind: 'error', error: t('reputation.error.scheme') });

	const hostIp = parseIp(url.hostname);
	const host = parseInput(url.hostname);
	if (!hostIp && host.kind !== 'hostname')
		return /** @type {const} */ ({ kind: 'error', error: t('reputation.error.url') });
	return /** @type {const} */ ({
		kind: 'url',
		// Kept as typed: blocklists store URLs as submitted, a normalized form may not match.
		value,
		host: hostIp ? hostIp.address : url.hostname,
		hostIp
	});
}
