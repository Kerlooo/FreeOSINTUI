/**
 * Authentication headers: Authentication-Results (RFC 8601), Received-SPF (RFC 7208),
 * DKIM-Signature (RFC 6376) and ARC (RFC 8617).
 */

import { splitTopLevel, stripComments } from './parse.js';

/**
 * @typedef {{ method: string, result: string, props: Record<string, string>, comment: string }} AuthResult
 * @typedef {{ authservId: string, instance: number | null, results: AuthResult[] }} AuthResults
 */

/**
 * Parses an Authentication-Results (or ARC-Authentication-Results) value:
 * `mx.example.com; spf=pass smtp.mailfrom=example.net; dkim=pass header.d=example.net`.
 * @param {string} value
 * @returns {AuthResults}
 */
export function parseAuthenticationResults(value) {
	const parts = splitTopLevel(value, ';').map((part) => part.trim());
	/** @type {number | null} */
	let instance = null;
	// ARC-Authentication-Results start with `i=N;`.
	if (/^i\s*=\s*\d+$/i.test(parts[0] ?? '')) {
		instance = Number(parts.shift()?.split('=')[1]);
	}
	// Some servers (Outlook) omit the authserv-id and start with a result.
	const first = stripComments(parts[0] ?? '').text;
	const authservId = /^[A-Za-z0-9_.-]+\s*=/.test(first)
		? ''
		: (parts.shift(), first.split(/\s/)[0]);

	/** @type {AuthResult[]} */
	const results = [];
	for (const part of parts) {
		const { text, comments } = stripComments(part);
		const match = /^([A-Za-z0-9_.-]+)\s*=\s*([A-Za-z0-9_-]+)(.*)$/.exec(text);
		if (!match) continue;
		/** @type {Record<string, string>} */
		const props = {};
		for (const prop of match[3].matchAll(
			/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|reason)\s*=\s*("[^"]*"|\S+)/g
		)) {
			props[prop[1].toLowerCase()] = prop[2].replace(/^"|"$/g, '');
		}
		results.push({
			method: match[1].toLowerCase(),
			result: match[2].toLowerCase(),
			props,
			comment: comments.join(' ')
		});
	}
	return { authservId, instance, results };
}

/**
 * Parses a Received-SPF value:
 * `pass (comment) client-ip=192.0.2.1; envelope-from=a@example.net; helo=mail.example.net`.
 * @param {string} value
 * @returns {{ result: string, comment: string, props: Record<string, string> }}
 */
export function parseReceivedSpf(value) {
	const { text, comments } = stripComments(value);
	const result = (/^([A-Za-z]+)/.exec(text)?.[1] ?? '').toLowerCase();
	/** @type {Record<string, string>} */
	const props = {};
	for (const match of text.matchAll(/([A-Za-z-]+)\s*=\s*("[^"]*"|[^;\s]+)/g)) {
		props[match[1].toLowerCase()] = match[2].replace(/^"|"$/g, '');
	}
	return { result, comment: comments.join(' '), props };
}

/**
 * Parses a DKIM-style tag list (`v=1; a=rsa-sha256; d=example.net; ...`).
 * Whitespace inside values is removed (it is folding, RFC 6376 §3.2).
 * @param {string} value
 * @returns {Record<string, string>}
 */
export function parseTagList(value) {
	/** @type {Record<string, string>} */
	const tags = {};
	for (const part of value.split(';')) {
		const eq = part.indexOf('=');
		if (eq < 0) continue;
		const name = part.slice(0, eq).trim().toLowerCase();
		if (!name) continue;
		tags[name] = part.slice(eq + 1).replace(/\s+/g, '');
	}
	return tags;
}

/**
 * @param {string} value
 * @returns {{ domain: string, selector: string, algorithm: string, canonicalization: string, headers: string[], identity: string, timestamp: number | null, expiration: number | null }}
 */
export function parseDkimSignature(value) {
	const tags = parseTagList(value);
	/** @param {string | undefined} text */
	const seconds = (text) => (text && /^\d+$/.test(text) ? Number(text) * 1000 : null);
	return {
		domain: (tags.d ?? '').toLowerCase(),
		selector: tags.s ?? '',
		algorithm: tags.a ?? '',
		canonicalization: tags.c ?? '',
		headers: (tags.h ?? '')
			.split(':')
			.map((name) => name.trim())
			.filter(Boolean),
		identity: tags.i ?? '',
		timestamp: seconds(tags.t),
		expiration: seconds(tags.x)
	};
}

/**
 * ARC-Seal and ARC-Message-Signature share the tag syntax.
 * @param {string} value
 * @returns {{ instance: number | null, domain: string, selector: string, algorithm: string, chainValidation: string }}
 */
export function parseArcTags(value) {
	const tags = parseTagList(value);
	return {
		instance: tags.i && /^\d+$/.test(tags.i) ? Number(tags.i) : null,
		domain: (tags.d ?? '').toLowerCase(),
		selector: tags.s ?? '',
		algorithm: tags.a ?? '',
		chainValidation: (tags.cv ?? '').toLowerCase()
	};
}

/**
 * Domain carried by an Authentication-Results entry (`header.d`, `header.i`,
 * `smtp.mailfrom`, `header.from`...).
 * @param {AuthResult} result
 */
export function resultDomain(result) {
	const value =
		result.props['header.d'] ??
		result.props['header.i'] ??
		result.props['header.from'] ??
		result.props['smtp.mailfrom'] ??
		result.props['smtp.helo'] ??
		'';
	const at = value.lastIndexOf('@');
	return (at >= 0 ? value.slice(at + 1) : value).toLowerCase();
}
