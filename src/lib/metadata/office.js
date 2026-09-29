import { unzipSync } from 'fflate';
import { readAttributes, readElement, readElements } from './xml.js';

/**
 * Reads the document properties of Office Open XML files (docx, xlsx, pptx and their
 * macro/template variants): docProps/core.xml, docProps/app.xml, docProps/custom.xml,
 * plus the names of comment authors.
 */

/** Core properties (docProps/core.xml): [element, label]. */
const CORE_FIELDS = [
	['dc:title', 'Title'],
	['dc:subject', 'Subject'],
	['dc:creator', 'Author (creator)'],
	['cp:lastModifiedBy', 'Last modified by'],
	['dcterms:created', 'Created'],
	['dcterms:modified', 'Modified'],
	['cp:lastPrinted', 'Last printed'],
	['cp:revision', 'Revision'],
	['cp:keywords', 'Keywords'],
	['dc:description', 'Description'],
	['cp:category', 'Category'],
	['cp:contentStatus', 'Status'],
	['dc:language', 'Language']
];

/** Extended properties (docProps/app.xml): [element, label]. */
const APP_FIELDS = [
	['Application', 'Application'],
	['AppVersion', 'Application version'],
	['Company', 'Company'],
	['Manager', 'Manager'],
	['Template', 'Template'],
	['TotalTime', 'Total editing time'],
	['Pages', 'Pages'],
	['Words', 'Words'],
	['Characters', 'Characters'],
	['Lines', 'Lines'],
	['Paragraphs', 'Paragraphs'],
	['Slides', 'Slides'],
	['Notes', 'Notes'],
	['HiddenSlides', 'Hidden slides'],
	['HyperlinkBase', 'Hyperlink base']
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
 * @param {string[]} names
 */
function documentKind(names) {
	if (names.some((name) => name.startsWith('word/'))) return 'Word document';
	if (names.some((name) => name.startsWith('xl/'))) return 'Excel workbook';
	if (names.some((name) => name.startsWith('ppt/'))) return 'PowerPoint presentation';
	if (names.some((name) => name.startsWith('visio/'))) return 'Visio drawing';
	return 'Office Open XML document';
}

/**
 * @typedef {object} OfficeMetadata
 * @property {string} kind
 * @property {Record<string, string>} core core properties keyed by display label
 * @property {Record<string, string>} app extended properties keyed by display label
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
	for (const [element, label] of CORE_FIELDS) {
		const value = readElement(coreXml, element);
		if (value) core[label] = /^dcterms:|lastPrinted/.test(element) ? formatW3cDate(value) : value;
	}

	/** @type {Record<string, string>} */
	const app = {};
	const appXml = read('docProps/app.xml');
	for (const [element, label] of APP_FIELDS) {
		const value = readElement(appXml, element);
		if (value) app[label] = element === 'TotalTime' ? formatMinutes(value) : value;
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
