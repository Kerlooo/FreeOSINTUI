/**
 * Received header parsing (RFC 5321 §4.4 trace fields) and the delivery chain.
 */

import { parseIp } from '$lib/ip/address.js';
import { parseMailDate, stripComments } from './parse.js';

/**
 * @typedef {{
 *   raw: string,
 *   from: string | null,
 *   fromHelo: string | null,
 *   fromRdns: string | null,
 *   fromIps: string[],
 *   by: string | null,
 *   byIps: string[],
 *   via: string | null,
 *   with: string | null,
 *   id: string | null,
 *   for: string | null,
 *   dateText: string | null,
 *   date: number | null
 * }} Hop
 */

const CLAUSE_KEYWORDS = new Set(['from', 'by', 'via', 'with', 'id', 'for']);

/**
 * Splits the part before `;` into clauses (`from x (...)`, `by y`, `with z`...).
 * Keywords inside comments are ignored.
 * @param {string} text
 * @returns {{ keyword: string, text: string }[]}
 */
function splitClauses(text) {
	/** @type {{ keyword: string, text: string }[]} */
	const clauses = [];
	/** @type {{ keyword: string, text: string } | null} */
	let current = null;
	let depth = 0;
	let i = 0;
	while (i < text.length) {
		const char = text[i];
		if (char === '(') depth++;
		else if (char === ')') depth = Math.max(0, depth - 1);
		if (depth === 0 && /\s/.test(text[i - 1] ?? ' ')) {
			const word = /^([A-Za-z]+)(?=\s)/.exec(text.slice(i));
			if (word && CLAUSE_KEYWORDS.has(word[1].toLowerCase())) {
				current = { keyword: word[1].toLowerCase(), text: '' };
				clauses.push(current);
				i += word[1].length;
				continue;
			}
		}
		if (current) current.text += char;
		i++;
	}
	return clauses;
}

/**
 * IP addresses written in a clause: `[192.0.2.1]`, `[IPv6:2001:db8::1]`, `(2001:db8::1)`
 * or a bare address in a comment.
 * @param {string} text
 */
export function extractIps(text) {
	/** @type {string[]} */
	const found = [];
	const candidates = text.match(/(?:IPv6:)?[0-9A-Fa-f:.]*[0-9A-Fa-f][0-9A-Fa-f:.]*/g) ?? [];
	for (const candidate of candidates) {
		const value = candidate.replace(/^IPv6:/i, '').replace(/\.+$/, '');
		if (!/[.:]/.test(value)) continue;
		const ip = parseIp(value);
		if (ip && !found.includes(ip.address)) found.push(ip.address);
	}
	return found;
}

/** @param {string} text */
function firstWord(text) {
	return text.trim().split(/[\s(]/)[0] || null;
}

/** @param {string | null} host */
function cleanHost(host) {
	if (!host) return null;
	const value = host.replace(/^\[|\]$/g, '').replace(/\.$/, '');
	return value || null;
}

/**
 * Parses one Received header value.
 * @param {string} value unfolded value
 * @returns {Hop}
 */
export function parseReceived(value) {
	const semicolon = value.lastIndexOf(';');
	const dateText = semicolon >= 0 ? value.slice(semicolon + 1).trim() || null : null;
	const body = semicolon >= 0 ? value.slice(0, semicolon) : value;
	const clauses = splitClauses(` ${body}`);

	/** @param {string} keyword */
	const clause = (keyword) => clauses.find((c) => c.keyword === keyword) ?? null;

	const fromClause = clause('from');
	const byClause = clause('by');

	let from = null;
	let fromHelo = null;
	let fromRdns = null;
	/** @type {string[]} */
	let fromIps = [];
	if (fromClause) {
		const { text, comments } = stripComments(fromClause.text);
		const word = firstWord(text);
		from = cleanHost(word);
		fromIps = extractIps(fromClause.text);
		for (const comment of comments) {
			const helo = /\b(?:helo|ehlo)\s*[=:]?\s*\[?([^\s\])]+)/i.exec(comment);
			if (helo) {
				fromHelo = cleanHost(helo[1]);
				continue;
			}
			// `(rdns.example.net [192.0.2.1])` or `(rdns.example.net. [192.0.2.1])`.
			const host =
				/^([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9-]+)+)\.?(?:\s|$)/.exec(comment);
			if (host && !parseIp(host[1]) && !fromRdns) fromRdns = host[1].toLowerCase();
		}
	}

	const withText = clause('with') ? stripComments(clause('with')?.text ?? '').text : '';
	const forText = clause('for') ? stripComments(clause('for')?.text ?? '').text : '';

	return {
		raw: value,
		from,
		fromHelo,
		fromRdns,
		fromIps,
		by: byClause ? cleanHost(firstWord(stripComments(byClause.text).text)) : null,
		byIps: byClause ? extractIps(byClause.text) : [],
		via: clause('via') ? firstWord(stripComments(clause('via')?.text ?? '').text) : null,
		with: firstWord(withText),
		id: clause('id') ? firstWord(stripComments(clause('id')?.text ?? '').text) : null,
		for: forText ? forText.split(/\s/)[0].replace(/^<|>$/g, '') || null : null,
		dateText,
		date: parseMailDate(dateText)
	};
}

/** Delay above which a hop is flagged as slow. */
export const SLOW_HOP_MS = 10 * 60_000;

/**
 * @typedef {Hop & { index: number, delay: number | null, slow: boolean, negative: boolean }} ChainHop
 */

/**
 * Builds the delivery chain from the Received values in message order (newest on
 * top). The result goes from the origin to the recipient, each hop with the delay
 * from the previous timestamped hop.
 * @param {string[]} values
 * @returns {{ hops: ChainHop[], total: number | null, start: number | null, end: number | null }}
 */
export function buildChain(values) {
	const hops = values.map(parseReceived).reverse();
	/** @type {number | null} */
	let previous = null;
	/** @type {number | null} */
	let start = null;
	/** @type {number | null} */
	let end = null;
	const chain = hops.map((hop, index) => {
		/** @type {number | null} */
		let delay = null;
		if (hop.date !== null) {
			if (previous !== null) delay = hop.date - previous;
			previous = hop.date;
			start ??= hop.date;
			end = hop.date;
		}
		return {
			...hop,
			index,
			delay,
			slow: delay !== null && delay > SLOW_HOP_MS,
			negative: delay !== null && delay < 0
		};
	});
	const total =
		start !== null && end !== null && chain.filter((h) => h.date !== null).length > 1
			? end - start
			: null;
	return { hops: chain, total, start, end };
}

/**
 * Splits a duration into the largest sensible unit for display.
 * @param {number} ms may be negative
 * @returns {{ value: number, unit: 'second' | 'minute' | 'hour' | 'day' }}
 */
export function durationParts(ms) {
	const abs = Math.abs(ms);
	const sign = ms < 0 ? -1 : 1;
	if (abs < 60_000) return { value: sign * Math.round(abs / 1000), unit: 'second' };
	if (abs < 3_600_000) return { value: (sign * Math.round(abs / 6_000)) / 10, unit: 'minute' };
	if (abs < 86_400_000) return { value: (sign * Math.round(abs / 360_000)) / 10, unit: 'hour' };
	return { value: (sign * Math.round(abs / 8_640_000)) / 10, unit: 'day' };
}
