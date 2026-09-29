import { unzipSync } from 'fflate';
import { readAttributes, readElement, readElements } from './xml.js';

/**
 * Reads the document properties of Office Open XML files (docx, xlsx, pptx and their
 * macro/template variants): docProps/core.xml, docProps/app.xml, docProps/custom.xml,
 * plus the names of comment authors.
 */

/** Core properties (docProps/core.xml): [element, field id]. Labels: `metadata.office.<id>`. */
const CORE_FIELDS = [
	['dc:title', 'title'],
	['dc:subject', 'subject'],
	['dc:creator', 'creator'],
	['cp:lastModifiedBy', 'lastModifiedBy'],
	['dcterms:created', 'created'],
	['dcterms:modified', 'modified'],
	['cp:lastPrinted', 'lastPrinted'],
	['cp:revision', 'revision'],
	['cp:keywords', 'keywords'],
	['dc:description', 'description'],
	['cp:category', 'category'],
	['cp:contentStatus', 'contentStatus'],
	['dc:language', 'language']
];

/** Extended properties (docProps/app.xml): [element, field id]. */
const APP_FIELDS = [
	['Application', 'application'],
	['AppVersion', 'appVersion'],
	['Company', 'company'],
	['Manager', 'manager'],
	['Template', 'template'],
	['TotalTime', 'totalTime'],
	['Pages', 'pages'],
	['Words', 'words'],
	['Characters', 'characters'],
	['Lines', 'lines'],
	['Paragraphs', 'paragraphs'],
	['Slides', 'slides'],
	['Notes', 'notes'],
	['HiddenSlides', 'hiddenSlides'],
	['HyperlinkBase', 'hyperlinkBase']
];

/** Files read from the archive; everything else is skipped without inflating it. */
const WANTED = new Set([
	'docProps/core.xml',
	'docProps/app.xml',
	'docProps/custom.xml',
	'word/comments.xml',
	'ppt/commentAuthors.xml'
]);

/**
 * @param {string} iso
 */
function formatW3cDate(iso) {
	const match = iso.match(
		/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?$/
	);
	if (!match) return iso;
	const zone = match[3] === 'Z' ? ' UTC' : match[3] ? ` ${match[3]}` : '';
	return `${match[1]} ${match[2]}${zone}`;
}

/**
 * @param {string} minutes
 */
function formatMinutes(minutes) {
	const total = Number(minutes);
	if (!Number.isFinite(total) || total <= 0) return minutes;
	const hours = Math.floor(total / 60);
	return hours ? `${minutes} min (${hours} h ${total % 60} min)` : `${minutes} min`;
}

/**
 * Identifies the kind of Office document from the archive's file names.
 * Returns an id; its label is `metadata.office.kind.<id>`.
 * @param {string[]} names
 */
function documentKind(names) {
	if (names.some((name) => name.startsWith('word/'))) return 'word';
	if (names.some((name) => name.startsWith('xl/'))) return 'excel';
	if (names.some((name) => name.startsWith('ppt/'))) return 'powerpoint';
	if (names.some((name) => name.startsWith('visio/'))) return 'visio';
	return 'generic';
}

/**
 * @typedef {object} OfficeMetadata
 * @property {'word' | 'excel' | 'powerpoint' | 'visio' | 'generic'} kind
 * @property {Record<string, string>} core core properties keyed by field id (see CORE_FIELDS)
 * @property {Record<string, string>} app extended properties keyed by field id (see APP_FIELDS)
 * @property {Record<string, string>} custom custom properties keyed by name
 * @property {string[]} commentAuthors
 */

/**
 * Reads Office metadata from a zip archive. Returns null when the archive is not an
 * Office Open XML file (no [Content_Types].xml).
 * @param {Uint8Array} bytes
 * @returns {OfficeMetadata | null}
 */
export function parseOffice(bytes) {
	/** @type {string[]} */
	const names = [];
	const files = unzipSync(bytes, {
		filter: (file) => {
			names.push(file.name);
			return WANTED.has(file.name);
		}
	});
	if (!names.includes('[Content_Types].xml')) return null;

	const decoder = new TextDecoder('utf-8');
	/** @param {string} name */
	const read = (name) => (files[name] ? decoder.decode(files[name]) : '');

	/** @type {Record<string, string>} */
	const core = {};
	const coreXml = read('docProps/core.xml');
	for (const [element, id] of CORE_FIELDS) {
		const value = readElement(coreXml, element);
		if (value) core[id] = /^dcterms:|lastPrinted/.test(element) ? formatW3cDate(value) : value;
	}

	/** @type {Record<string, string>} */
	const app = {};
	const appXml = read('docProps/app.xml');
	for (const [element, id] of APP_FIELDS) {
		const value = readElement(appXml, element);
		if (value) app[id] = element === 'TotalTime' ? formatMinutes(value) : value;
	}

	/** @type {Record<string, string>} */
	const custom = {};
	const customXml = read('docProps/custom.xml');
	for (const match of customXml.matchAll(/<property\s[^>]*>[\s\S]*?<\/property>/g)) {
		const name = readAttributes(match[0], 'property', 'name')[0];
		const text = readElements(match[0], 'property')[0];
		if (name && text) custom[name] = text;
	}

	const commentAuthors = [
		...new Set([
			...readAttributes(read('word/comments.xml'), 'w:comment', 'w:author'),
			...readAttributes(read('ppt/commentAuthors.xml'), 'p:cmAuthor', 'name')
		])
	].filter(Boolean);

	return { kind: documentKind(names), core, app, custom, commentAuthors };
}
