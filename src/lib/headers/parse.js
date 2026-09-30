/**
 * Low-level email header parsing: header block extraction, RFC 5322 unfolding,
 * RFC 2047 encoded-word decoding and RFC 5322 date parsing. Pure functions, no DOM.
 */

/** @typedef {{ name: string, key: string, value: string }} Header */

/** Header field name: printable ASCII except the colon (RFC 5322 §2.2). */
const FIELD_RE = /^([!-9;-~]+):[ \t]*(.*)$/;

/**
 * Cuts the header section out of a pasted text or a whole .eml: leading blank lines
 * and an mbox `From ` separator are skipped, the headers end at the first empty line.
 * @param {string} text
 */
export function extractHeaderBlock(text) {
	const lines = text.replace(/\r\n?/g, '\n').split('\n');
	let start = 0;
	while (start < lines.length && lines[start].trim() === '') start++;
	if (lines[start]?.startsWith('From ')) start++;
	let end = start;
	while (end < lines.length && lines[end].trim() !== '') end++;
	return lines.slice(start, end).join('\n');
}

/**
 * Splits a header block into fields, unfolding continuation lines (a line starting
 * with a space or a tab belongs to the previous field; the line break is removed and
 * the whitespace kept, RFC 5322 §2.2.3). Lines that are neither a field nor a
 * continuation are counted as ignored.
 * @param {string} text headers, or a whole message
 * @returns {{ headers: Header[], ignored: number }}
 */
export function parseHeaders(text) {
	/** @type {Header[]} */
	const headers = [];
	let ignored = 0;
	for (const line of extractHeaderBlock(text).split('\n')) {
		if (/^[ \t]/.test(line)) {
			const last = headers[headers.length - 1];
			if (last) last.value = `${last.value} ${line.trim()}`.trim();
			else ignored++;
			continue;
		}
		const match = FIELD_RE.exec(line);
		if (match) {
			headers.push({ name: match[1], key: match[1].toLowerCase(), value: match[2].trim() });
		} else if (line.trim()) {
			ignored++;
		}
	}
	return { headers, ignored };
}

/**
 * Values of every field with a given name, in message order (top first).
 * @param {Header[]} headers
 * @param {string} name case-insensitive
 */
export function getAll(headers, name) {
	const key = name.toLowerCase();
	return headers.filter((header) => header.key === key).map((header) => header.value);
}

/**
 * First value of a field, or null.
 * @param {Header[]} headers
 * @param {string} name
 */
export function getFirst(headers, name) {
	return getAll(headers, name)[0] ?? null;
}

/**
 * @param {string} charset
 * @param {Uint8Array} bytes
 */
function decodeBytes(charset, bytes) {
	// RFC 2231 allows a language suffix: `utf-8*en`.
	const label = charset.split('*')[0].toLowerCase();
	try {
		return new TextDecoder(label).decode(bytes);
	} catch {
		return new TextDecoder('utf-8').decode(bytes);
	}
}

/** @param {string} text */
function base64Bytes(text) {
	const clean = text.replace(/[^A-Za-z0-9+/]/g, '');
	const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
	const binary = atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** @param {string} text */
function quotedPrintableBytes(text) {
	/** @type {number[]} */
	const bytes = [];
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === '_') bytes.push(0x20);
		else if (char === '=' && /^[0-9A-Fa-f]{2}$/.test(text.slice(i + 1, i + 3))) {
			bytes.push(parseInt(text.slice(i + 1, i + 3), 16));
			i += 2;
		} else {
			// Encoded words are ASCII; anything else is kept as UTF-8.
			bytes.push(...new TextEncoder().encode(char));
		}
	}
	return Uint8Array.from(bytes);
}

const ENCODED_WORD_RE = /=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g;

/**
 * Decodes RFC 2047 encoded words (`=?utf-8?B?...?=`, `=?iso-8859-1?Q?...?=`).
 * Whitespace between two adjacent encoded words is dropped, as the RFC requires.
 * Malformed words are left untouched.
 * @param {string} text
 */
export function decodeEncodedWords(text) {
	if (!text.includes('=?')) return text;
	// Join adjacent encoded words first.
	const joined = text.replace(/(\?=)\s+(?==\?[^?\s]+\?[BbQq]\?)/g, '$1');
	return joined.replace(ENCODED_WORD_RE, (word, charset, encoding, payload) => {
		try {
			const bytes =
				encoding.toUpperCase() === 'B' ? base64Bytes(payload) : quotedPrintableBytes(payload);
			return decodeBytes(charset, bytes);
		} catch {
			return word;
		}
	});
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Obsolete zone names (RFC 5322 §4.3), in minutes east of UTC. */
const ZONES = {
	ut: 0,
	utc: 0,
	gmt: 0,
	z: 0,
	est: -300,
	edt: -240,
	cst: -360,
	cdt: -300,
	mst: -420,
	mdt: -360,
	pst: -480,
	pdt: -420
};

const DATE_RE =
	/(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*([+-]\d{4}|[A-Za-z]{1,5}\b)?/;

/**
 * Parses an RFC 5322 date (`Tue, 29 Sep 2026 10:15:30 +0200 (CEST)`), also the
 * obsolete forms (two-digit years, named zones). Unknown zones count as UTC.
 * @param {string | null | undefined} text
 * @returns {number | null} milliseconds since the epoch
 */
export function parseMailDate(text) {
	if (!text) return null;
	const match = DATE_RE.exec(text);
	if (!match) {
		const fallback = Date.parse(text);
		return Number.isNaN(fallback) ? null : fallback;
	}
	const [, day, monthName, yearText, hour, minute, second, zone] = match;
	const month = MONTHS.indexOf(monthName.toLowerCase());
	if (month < 0) return null;
	let year = Number(yearText);
	if (yearText.length === 2) year += year < 50 ? 2000 : 1900;
	else if (yearText.length === 3) year += 1900;

	let offset = 0;
	if (zone && /^[+-]\d{4}$/.test(zone)) {
		const sign = zone[0] === '-' ? -1 : 1;
		offset = sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(3, 5)));
	} else if (zone) {
		offset = ZONES[/** @type {keyof typeof ZONES} */ (zone.toLowerCase())] ?? 0;
	}
	const utc = Date.UTC(year, month, Number(day), Number(hour), Number(minute), Number(second ?? 0));
	const value = utc - offset * 60_000;
	return Number.isNaN(value) ? null : value;
}

/**
 * Splits a string on a separator character, ignoring separators inside
 * parentheses (comments, which may nest), double quotes and angle brackets.
 * @param {string} text
 * @param {string} separator one character
 */
export function splitTopLevel(text, separator) {
	/** @type {string[]} */
	const parts = [];
	let depth = 0;
	let quoted = false;
	let angle = false;
	let current = '';
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === '\\' && (quoted || depth > 0)) {
			current += char + (text[i + 1] ?? '');
			i++;
			continue;
		}
		if (quoted) {
			if (char === '"') quoted = false;
		} else if (depth > 0) {
			if (char === '(') depth++;
			else if (char === ')') depth--;
		} else if (char === '"') quoted = true;
		else if (char === '(') depth++;
		else if (char === '<') angle = true;
		else if (char === '>') angle = false;
		else if (char === separator && !angle) {
			parts.push(current);
			current = '';
			continue;
		}
		current += char;
	}
	parts.push(current);
	return parts;
}

/**
 * Removes RFC 5322 comments (parenthesized, possibly nested) from a value.
 * @param {string} text
 * @returns {{ text: string, comments: string[] }}
 */
export function stripComments(text) {
	/** @type {string[]} */
	const comments = [];
	let depth = 0;
	let quoted = false;
	let out = '';
	let comment = '';
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (depth === 0) {
			if (char === '"') quoted = !quoted;
			if (char === '(' && !quoted) {
				depth = 1;
				comment = '';
				continue;
			}
			out += char;
			continue;
		}
		if (char === '\\') {
			comment += text[i + 1] ?? '';
			i++;
		} else if (char === '(') {
			depth++;
			comment += char;
		} else if (char === ')') {
			depth--;
			if (depth === 0) comments.push(comment.trim());
			else comment += char;
		} else {
			comment += char;
		}
	}
	if (depth > 0 && comment.trim()) comments.push(comment.trim());
	return { text: out.replace(/\s+/g, ' ').trim(), comments };
}
