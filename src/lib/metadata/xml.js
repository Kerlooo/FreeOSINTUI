/**
 * Tiny regex-based XML readers for metadata documents (Office docProps, XMP packets).
 * DOMParser is not available in Node, and these documents are small and flat enough
 * that a full parser is not needed.
 */

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/**
 * Decodes the five XML named entities and numeric character references.
 * @param {string} text
 */
export function decodeXmlEntities(text) {
	return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
		if (entity[0] === '#') {
			const code =
				entity[1] === 'x' || entity[1] === 'X'
					? parseInt(entity.slice(2), 16)
					: parseInt(entity.slice(1), 10);
			return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : match;
		}
		return NAMED_ENTITIES[/** @type {keyof typeof NAMED_ENTITIES} */ (entity)] ?? match;
	});
}

/** @param {string} value */
function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strips tags and collapses whitespace, keeping only the text content.
 * @param {string} xml
 */
function textContent(xml) {
	return decodeXmlEntities(xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ''))
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Returns the text content of every element with the given qualified name (e.g. `dc:creator`).
 * @param {string} xml
 * @param {string} name
 */
export function readElements(xml, name) {
	const pattern = new RegExp(
		`<${escapeRegex(name)}(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</${escapeRegex(name)}\\s*>)`,
		'g'
	);
	return [...xml.matchAll(pattern)].map((match) => textContent(match[1] ?? ''));
}

/**
 * Text content of the first element with the given qualified name, or '' if missing.
 * @param {string} xml
 * @param {string} name
 */
export function readElement(xml, name) {
	return readElements(xml, name)[0] ?? '';
}

/**
 * Values of an attribute on every element with the given qualified name.
 * @param {string} xml
 * @param {string} element
 * @param {string} attribute
 */
export function readAttributes(xml, element, attribute) {
	const pattern = new RegExp(`<${escapeRegex(element)}\\s[^>]*>`, 'g');
	const attr = new RegExp(`\\s${escapeRegex(attribute)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`);
	return [...xml.matchAll(pattern)]
		.map((match) => match[0].match(attr))
		.filter((match) => match !== null)
		.map((match) => decodeXmlEntities(match[1] ?? match[2]));
}

/**
 * Reads an XMP property, which can be written as an attribute (`pdf:Producer="…"`)
 * or as an element, possibly holding an rdf:Seq / rdf:Bag / rdf:Alt list.
 * List items are joined with ", ". Returns '' when missing.
 * @param {string} xml
 * @param {string} name
 */
export function readXmpProperty(xml, name) {
	const attr = xml.match(new RegExp(`\\s${escapeRegex(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
	if (attr) return decodeXmlEntities(attr[1] ?? attr[2]).trim();

	const element = xml.match(
		new RegExp(`<${escapeRegex(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapeRegex(name)}\\s*>`)
	);
	if (!element) return '';
	const items = readElements(element[1], 'rdf:li').filter(Boolean);
	return items.length ? [...new Set(items)].join(', ') : textContent(element[1]);
}
