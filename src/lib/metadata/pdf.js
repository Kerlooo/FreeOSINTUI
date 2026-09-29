import { unzlibSync, inflateSync } from 'fflate';
import { readXmpProperty } from './xml.js';

/**
 * Reads PDF metadata without pdf.js: the document Info dictionary, the XMP packet,
 * the PDF version and an estimate of the page count.
 *
 * The file is read as latin1 text (one char per byte). Objects stored in compressed
 * object streams (PDF 1.5+) are inflated with fflate when they are FlateDecode-encoded.
 */

/**
 * Converts bytes to a string with one char per byte (true latin1, unlike TextDecoder,
 * which maps 0x80–0x9F with windows-1252).
 * @param {Uint8Array} bytes
 */
export function bytesToLatin1(bytes) {
	let out = '';
	for (let i = 0; i < bytes.length; i += 0x8000) {
		out += String.fromCharCode.apply(null, /** @type {any} */ (bytes.subarray(i, i + 0x8000)));
	}
	return out;
}

/** @param {string} text */
function latin1ToBytes(text) {
	const bytes = new Uint8Array(text.length);
	for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
	return bytes;
}

/**
 * Decodes a PDF text string given as raw bytes (latin1 string): UTF-16BE/LE or UTF-8 when
 * a byte order mark is present, PDFDocEncoding (close to latin1) otherwise.
 * @param {string} raw
 */
export function decodePdfString(raw) {
	let text;
	if (raw.startsWith('\xfe\xff')) {
		text = new TextDecoder('utf-16be').decode(latin1ToBytes(raw.slice(2)));
	} else if (raw.startsWith('\xff\xfe')) {
		text = new TextDecoder('utf-16le').decode(latin1ToBytes(raw.slice(2)));
	} else if (raw.startsWith('\xef\xbb\xbf')) {
		text = new TextDecoder('utf-8').decode(latin1ToBytes(raw.slice(3)));
	} else {
		text = raw;
	}
	return text.replace(/\0+$/, '').trim();
}

/**
 * Formats a PDF date (`D:YYYYMMDDHHmmSSOHH'mm'`, every part after the year optional).
 * Returns the input unchanged when it does not follow the format.
 * @param {string} value
 */
export function formatPdfDate(value) {
	const match = value
		.trim()
		.match(
			/^(?:D:)?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?\s*(?:(Z)|([+-])(\d{2})'?(\d{2})?'?)?/
		);
	if (!match) return value;
	const [
		,
		year,
		month = '01',
		day = '01',
		hour,
		minute = '00',
		second = '00',
		zulu,
		sign,
		tzh,
		tzm
	] = match;
	let result = `${year}-${month}-${day}`;
	if (hour) result += ` ${hour}:${minute}:${second}`;
	if (zulu) result += ' UTC';
	else if (sign) result += ` ${sign}${tzh}:${tzm ?? '00'}`;
	return result;
}

// ---------------------------------------------------------------------------
// Minimal PDF object parser (enough for dictionaries of strings, names and refs).

/**
 * @typedef {{ type: 'string', raw: string } | { type: 'name', value: string }
 *   | { type: 'ref', num: number, gen: number } | { type: 'dict', value: Record<string, PdfValue> }
 *   | { type: 'array', value: PdfValue[] } | { type: 'number', value: number }
 *   | { type: 'other', value: string }} PdfValue
 */

const DELIMITERS = '()<>[]{}/%';
const WHITESPACE = '\0\t\n\f\r ';

/**
 * @param {string} src
 * @param {number} pos
 */
function skipWhitespace(src, pos) {
	while (pos < src.length) {
		const char = src[pos];
		if (WHITESPACE.includes(char)) pos++;
		else if (char === '%') {
			while (pos < src.length && src[pos] !== '\n' && src[pos] !== '\r') pos++;
		} else break;
	}
	return pos;
}

/**
 * @param {string} src
 * @param {number} pos
 */
function readToken(src, pos) {
	let end = pos;
	while (end < src.length && !WHITESPACE.includes(src[end]) && !DELIMITERS.includes(src[end]))
		end++;
	return { token: src.slice(pos, end), end };
}

/**
 * Parses a literal string starting at `(`.
 * @param {string} src
 * @param {number} pos
 */
function parseLiteralString(src, pos) {
	let depth = 1;
	let out = '';
	let i = pos + 1;
	const escapes = /** @type {Record<string, string>} */ ({
		n: '\n',
		r: '\r',
		t: '\t',
		b: '\b',
		f: '\f',
		'(': '(',
		')': ')',
		'\\': '\\'
	});
	while (i < src.length) {
		const char = src[i];
		if (char === '\\') {
			const next = src[i + 1];
			if (next in escapes) {
				out += escapes[next];
				i += 2;
			} else if (next >= '0' && next <= '7') {
				const octal = src.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] ?? '0';
				out += String.fromCharCode(parseInt(octal, 8) & 0xff);
				i += 1 + octal.length;
			} else if (next === '\r') {
				i += src[i + 2] === '\n' ? 3 : 2;
			} else if (next === '\n') {
				i += 2;
			} else {
				i += 1;
			}
			continue;
		}
		if (char === '(') depth++;
		if (char === ')') {
			depth--;
			if (depth === 0) return { value: out, end: i + 1 };
		}
		out += char;
		i++;
	}
	return { value: out, end: i };
}

/**
 * Parses one PDF value starting at `pos`.
 * @param {string} src
 * @param {number} pos
 * @returns {{ value: PdfValue, end: number }}
 */
export function parseValue(src, pos) {
	pos = skipWhitespace(src, pos);
	const char = src[pos];

	if (src.startsWith('<<', pos)) {
		/** @type {Record<string, PdfValue>} */
		const dict = {};
		let i = pos + 2;
		while (i < src.length) {
			i = skipWhitespace(src, i);
			if (src.startsWith('>>', i)) return { value: { type: 'dict', value: dict }, end: i + 2 };
			if (src[i] !== '/') {
				// Malformed dictionary: skip one char to avoid an endless loop.
				i++;
				continue;
			}
			const key = readToken(src, i + 1);
			const parsed = parseValue(src, key.end);
			dict[key.token] = parsed.value;
			i = parsed.end;
		}
		return { value: { type: 'dict', value: dict }, end: i };
	}
	if (char === '<') {
		const end = src.indexOf('>', pos);
		const hex = src.slice(pos + 1, end === -1 ? src.length : end).replace(/[^\da-f]/gi, '');
		const padded = hex.length % 2 ? `${hex}0` : hex;
		let raw = '';
		for (let i = 0; i < padded.length; i += 2)
			raw += String.fromCharCode(parseInt(padded.slice(i, i + 2), 16));
		return { value: { type: 'string', raw }, end: end === -1 ? src.length : end + 1 };
	}
	if (char === '(') {
		const { value, end } = parseLiteralString(src, pos);
		return { value: { type: 'string', raw: value }, end };
	}
	if (char === '[') {
		/** @type {PdfValue[]} */
		const items = [];
		let i = pos + 1;
		while (i < src.length) {
			i = skipWhitespace(src, i);
			if (src[i] === ']') return { value: { type: 'array', value: items }, end: i + 1 };
			const parsed = parseValue(src, i);
			if (parsed.end <= i) i++;
			else {
				items.push(parsed.value);
				i = parsed.end;
			}
		}
		return { value: { type: 'array', value: items }, end: i };
	}
	if (char === '/') {
		const { token, end } = readToken(src, pos + 1);
		const name = token.replace(/#([\da-f]{2})/gi, (_, hex) =>
			String.fromCharCode(parseInt(hex, 16))
		);
		return { value: { type: 'name', value: name }, end };
	}

	const { token, end } = readToken(src, pos);
	if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(token)) {
		// An integer followed by another integer and `R` is an indirect reference.
		const ref = /^\s+(\d+)\s+R(?![^\s\0/<>[\]()%])/.exec(src.slice(end, end + 32));
		if (/^\d+$/.test(token) && ref) {
			return {
				value: { type: 'ref', num: Number(token), gen: Number(ref[1]) },
				end: end + ref[0].length
			};
		}
		return { value: { type: 'number', value: Number(token) }, end };
	}
	return { value: { type: 'other', value: token }, end: Math.max(end, pos + 1) };
}

// ---------------------------------------------------------------------------
// Document-level reading.

/**
 * Index of the body of the last definition of object `num gen` (right after `obj`), or -1.
 * @param {string} src
 * @param {number} num
 * @param {number} gen
 */
function findObject(src, num, gen) {
	const pattern = new RegExp(`(?:^|[^\\d])${num}\\s+${gen}\\s+obj\\b`, 'g');
	let index = -1;
	for (const match of src.matchAll(pattern))
		index = /** @type {number} */ (match.index) + match[0].length;
	return index;
}

/**
 * Returns the decoded data of the stream whose dictionary ends at `dictEnd`, when it is
 * unfiltered or FlateDecode without predictors. Returns null otherwise.
 * @param {string} src
 * @param {Record<string, PdfValue>} dict
 * @param {number} dictEnd
 */
function readStream(src, dict, dictEnd) {
	const match = /^\s*stream\r?\n/.exec(src.slice(dictEnd, dictEnd + 64));
	if (!match) return null;
	const start = dictEnd + match[0].length;
	const length = dict.Length?.type === 'number' ? dict.Length.value : -1;
	let end = length >= 0 ? start + length : src.indexOf('endstream', start);
	if (end < start || end > src.length) end = src.indexOf('endstream', start);
	if (end < 0) return null;
	const data = src.slice(start, end);

	const filter = dict.Filter;
	const filters =
		filter?.type === 'name'
			? [filter.value]
			: filter?.type === 'array'
				? filter.value.map((item) => (item.type === 'name' ? item.value : '?'))
				: [];
	if (filters.length === 0) return data;
	if (filters.length !== 1 || filters[0] !== 'FlateDecode' || dict.DecodeParms) return null;
	const bytes = latin1ToBytes(data);
	try {
		return bytesToLatin1(unzlibSync(bytes));
	} catch {
		try {
			return bytesToLatin1(inflateSync(bytes));
		} catch {
			return null;
		}
	}
}

/**
 * Inflates every object stream (`/Type /ObjStm`) and returns the objects they contain.
 * @param {string} src
 * @returns {{ objects: Map<number, string>, failed: number }}
 */
function readObjectStreams(src) {
	/** @type {Map<number, string>} */
	const objects = new Map();
	let failed = 0;
	for (const match of src.matchAll(/(?:^|[^\d])\d+\s+\d+\s+obj\s*(?=<<)/g)) {
		const start = /** @type {number} */ (match.index) + match[0].length;
		// Cheap check before parsing the whole dictionary.
		const head = src.slice(start, start + 512);
		if (!/\/Type\s*\/ObjStm/.test(head) && !/\/ObjStm/.test(head)) continue;
		const { value, end } = parseValue(src, start);
		if (
			value.type !== 'dict' ||
			value.value.Type?.type !== 'name' ||
			value.value.Type.value !== 'ObjStm'
		)
			continue;
		const dict = value.value;
		const data = readStream(src, dict, end);
		const first = dict.First?.type === 'number' ? dict.First.value : NaN;
		if (data === null || !Number.isFinite(first)) {
			failed++;
			continue;
		}
		const numbers = data.slice(0, first).trim().split(/\s+/).map(Number);
		for (let i = 0; i + 1 < numbers.length; i += 2) {
			const nextOffset = i + 3 < numbers.length ? numbers[i + 3] : data.length - first;
			objects.set(numbers[i], data.slice(first + numbers[i + 1], first + nextOffset));
		}
	}
	return { objects, failed };
}

/**
 * Finds the XMP packet in plain text, or '' when missing.
 * @param {string} text
 */
function findXmp(text) {
	const matches = [...text.matchAll(/<x:x[ma]pmeta[\s\S]*?<\/x:x[ma]pmeta>/g)];
	return matches.length ? matches[matches.length - 1][0] : '';
}

/** XMP properties shown for PDFs, in display order. */
export const PDF_XMP_FIELDS = [
	['dc:title', 'Title'],
	['dc:creator', 'Creator (author)'],
	['dc:description', 'Description'],
	['dc:subject', 'Subject / keywords'],
	['pdf:Keywords', 'Keywords'],
	['xmp:CreatorTool', 'Creator tool'],
	['pdf:Producer', 'Producer'],
	['xmp:CreateDate', 'Created'],
	['xmp:ModifyDate', 'Modified'],
	['xmp:MetadataDate', 'Metadata date'],
	['xmpMM:DocumentID', 'Document ID'],
	['xmpMM:InstanceID', 'Instance ID'],
	['pdf:PDFVersion', 'PDF version']
];

/**
 * Reads the XMP properties in PDF_XMP_FIELDS from an XMP packet.
 * @param {string} xmp
 * @returns {Record<string, string>}
 */
export function readPdfXmp(xmp) {
	/** @type {Record<string, string>} */
	const fields = {};
	for (const [name, label] of PDF_XMP_FIELDS) {
		const value = readXmpProperty(xmp, name);
		if (value) fields[label] = /Date$/.test(name) ? value.replace('T', ' ') : value;
	}
	return fields;
}

/**
 * @typedef {object} PdfMetadata
 * @property {string} version PDF header version, e.g. "1.7"
 * @property {number | null} pages estimated page count
 * @property {boolean} encrypted
 * @property {'ok' | 'missing' | 'unreadable' | 'encrypted'} infoStatus
 * @property {Record<string, string>} info decoded Info dictionary, keyed by PDF key
 * @property {Record<string, string>} xmp selected XMP properties, keyed by display label
 * @property {boolean} objectStreams whether the file uses compressed object streams
 */

/**
 * Extracts metadata from a PDF file.
 * @param {Uint8Array} bytes
 * @returns {PdfMetadata}
 */
export function parsePdf(bytes) {
	const src = bytesToLatin1(bytes);
	const version = src.match(/%PDF-(\d\.\d)/)?.[1] ?? '';
	const encrypted = /\/Encrypt\s*(?:\d+\s+\d+\s+R|<<)/.test(src);
	const hasObjectStreams = /\/Type\s*\/ObjStm/.test(src);

	/** @type {ReturnType<typeof readObjectStreams> | null} */
	let streams = null;
	const getStreams = () => (streams ??= readObjectStreams(src));

	/**
	 * Resolves an indirect reference to its value, looking in object streams if needed.
	 * @param {PdfValue | undefined} value
	 * @returns {PdfValue | undefined}
	 */
	const resolve = (value, depth = 0) => {
		if (!value || value.type !== 'ref' || depth > 4) return value;
		const index = findObject(src, value.num, value.gen);
		if (index >= 0) return resolve(parseValue(src, index).value, depth + 1);
		const body = hasObjectStreams ? getStreams().objects.get(value.num) : undefined;
		return body === undefined ? undefined : resolve(parseValue(body, 0).value, depth + 1);
	};

	// Info dictionary: the last /Info reference wins (incremental updates append new trailers).
	/** @type {PdfMetadata['infoStatus']} */
	let infoStatus = 'missing';
	/** @type {Record<string, string>} */
	const info = {};
	const infoRefs = [...src.matchAll(/\/Info\s+(\d+)\s+(\d+)\s+R/g)];
	const lastRef = infoRefs[infoRefs.length - 1];
	if (lastRef) {
		const dict = resolve({ type: 'ref', num: Number(lastRef[1]), gen: Number(lastRef[2]) });
		if (dict?.type === 'dict') {
			if (encrypted) {
				infoStatus = 'encrypted';
			} else {
				infoStatus = 'ok';
				for (const [key, raw] of Object.entries(dict.value)) {
					const value = resolve(raw);
					let text = '';
					if (value?.type === 'string') text = decodePdfString(value.raw);
					else if (value?.type === 'name') text = value.value;
					else if (value?.type === 'number') text = String(value.value);
					if (/Date$/.test(key) && text) text = formatPdfDate(text);
					if (text) info[key] = text;
				}
			}
		} else {
			infoStatus = 'unreadable';
		}
	}

	// XMP packet: usually stored uncompressed, but look in FlateDecode metadata streams too.
	let xmpPacket = findXmp(src);
	if (!xmpPacket) {
		for (const match of src.matchAll(/(?:^|[^\d])\d+\s+\d+\s+obj\s*(?=<<)/g)) {
			const start = /** @type {number} */ (match.index) + match[0].length;
			if (!/\/Metadata/.test(src.slice(start, start + 512))) continue;
			const { value, end } = parseValue(src, start);
			if (
				value.type !== 'dict' ||
				value.value.Type?.type !== 'name' ||
				value.value.Type.value !== 'Metadata'
			)
				continue;
			const data = readStream(src, value.value, end);
			const found = data ? findXmp(data) : '';
			if (found) xmpPacket = found;
		}
	}
	const xmp = xmpPacket ? readPdfXmp(decodeUtf8(xmpPacket)) : {};

	// Page count: the largest /Count of a /Pages node, or the number of /Page objects.
	let text = src;
	if (hasObjectStreams) text += [...getStreams().objects.values()].join('\n');
	let maxCount = 0;
	for (const match of text.matchAll(/\/Type\s*\/Pages\b[^]{0,512}?>>/g)) {
		const count = match[0].match(/\/Count\s+(\d+)/);
		if (count) maxCount = Math.max(maxCount, Number(count[1]));
	}
	for (const match of text.matchAll(/\/Count\s+(\d+)[^>]{0,512}?\/Type\s*\/Pages\b/g)) {
		maxCount = Math.max(maxCount, Number(match[1]));
	}
	const pageObjects = [...text.matchAll(/\/Type\s*\/Page(?![a-zA-Z])/g)].length;
	const pages = maxCount || pageObjects || null;

	return { version, pages, encrypted, infoStatus, info, xmp, objectStreams: hasObjectStreams };
}

/**
 * XMP packets are UTF-8; the file was read as latin1, so re-decode them.
 * @param {string} latin1
 */
function decodeUtf8(latin1) {
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(latin1ToBytes(latin1));
	} catch {
		return latin1;
	}
}
