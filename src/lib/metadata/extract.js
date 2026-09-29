import { detectFormat, FORMAT_LABELS, IMAGE_FORMATS } from './detect.js';
import { formatBytes } from './format.js';
import { imageHighlights, imageTagGroups, readImageMetadata } from './image.js';
import { parseOffice } from './office.js';
import { parsePdf } from './pdf.js';

/**
 * @typedef {{ label: string, value: string, href?: string }} Row
 * @typedef {{ id: string, label: string, rows: Row[] }} Group
 * @typedef {object} MetadataResult
 * @property {string | null} format detected format id
 * @property {string} formatLabel
 * @property {boolean} isImage
 * @property {Row[]} file basic file information
 * @property {Row[]} highlights the most relevant fields
 * @property {Group[]} groups every field, grouped by source
 * @property {string[]} notes caveats to show to the user
 */

/**
 * @param {Record<string, string>} fields
 * @returns {Row[]}
 */
const toRows = (fields) => Object.entries(fields).map(([label, value]) => ({ label, value }));

/** Info dictionary keys shown as highlights, with their labels. */
const PDF_INFO_LABELS = {
	Title: 'Title',
	Author: 'Author',
	Subject: 'Subject',
	Keywords: 'Keywords',
	Creator: 'Creator (application)',
	Producer: 'Producer (PDF library)',
	CreationDate: 'Created',
	ModDate: 'Modified'
};

/**
 * Builds the result for a PDF.
 * @param {Uint8Array} bytes
 * @returns {Pick<MetadataResult, 'highlights' | 'groups' | 'notes'>}
 */
export function pdfResult(bytes) {
	const pdf = parsePdf(bytes);
	const notes = [];
	/** @type {Row[]} */
	const highlights = [
		{ label: 'PDF version', value: pdf.version },
		{ label: 'Pages (estimate)', value: pdf.pages ? String(pdf.pages) : '' },
		{ label: 'Encrypted', value: pdf.encrypted ? 'yes' : 'no' }
	];
	for (const [key, label] of Object.entries(PDF_INFO_LABELS)) {
		if (pdf.info[key]) highlights.push({ label, value: pdf.info[key] });
	}
	// Fill gaps from XMP when the Info dictionary lacks a field.
	const fromXmp = [
		['Author', 'Creator (author)'],
		['Title', 'Title'],
		['Creator (application)', 'Creator tool'],
		['Producer (PDF library)', 'Producer'],
		['Created', 'Created'],
		['Modified', 'Modified']
	];
	for (const [label, xmpLabel] of fromXmp) {
		if (!highlights.some((row) => row.label === label) && pdf.xmp[xmpLabel]) {
			highlights.push({ label, value: `${pdf.xmp[xmpLabel]} (XMP)` });
		}
	}

	if (pdf.infoStatus === 'unreadable')
		notes.push(
			'The document Info dictionary is stored in a compressed object stream that could not be decoded, so its metadata could not be read.'
		);
	if (pdf.infoStatus === 'encrypted')
		notes.push('The PDF is encrypted: the strings of its Info dictionary cannot be decoded.');
	if (pdf.infoStatus === 'missing' && !Object.keys(pdf.xmp).length)
		notes.push('No Info dictionary or XMP metadata found. The metadata may have been removed.');
	if (pdf.objectStreams)
		notes.push(
			'This PDF uses compressed object streams; values were read from the streams that could be inflated. The page count is an estimate.'
		);

	/** @type {Group[]} */
	const groups = [];
	if (Object.keys(pdf.info).length)
		groups.push({ id: 'info', label: 'Info dictionary', rows: toRows(pdf.info) });
	if (Object.keys(pdf.xmp).length)
		groups.push({ id: 'xmp', label: 'XMP metadata', rows: toRows(pdf.xmp) });
	return { highlights, groups, notes };
}

/**
 * Builds the result for an Office Open XML file, or null if the zip is not one.
 * @param {Uint8Array} bytes
 * @returns {(Pick<MetadataResult, 'highlights' | 'groups' | 'notes'> & { kind: string }) | null}
 */
export function officeResult(bytes) {
	const office = parseOffice(bytes);
	if (!office) return null;
	const pickCore = [
		'Author (creator)',
		'Last modified by',
		'Created',
		'Modified',
		'Last printed',
		'Title',
		'Revision'
	];
	const pickApp = [
		'Application',
		'Company',
		'Manager',
		'Template',
		'Total editing time',
		'Pages',
		'Words',
		'Slides'
	];
	/** @type {Row[]} */
	const highlights = [
		{ label: 'Type', value: office.kind },
		...pickCore.map((label) => ({ label, value: office.core[label] ?? '' })),
		...pickApp.map((label) => ({ label, value: office.app[label] ?? '' }))
	];
	if (office.commentAuthors.length)
		highlights.push({ label: 'Comment authors', value: office.commentAuthors.join(', ') });

	/** @type {Group[]} */
	const groups = [];
	if (Object.keys(office.core).length)
		groups.push({
			id: 'core',
			label: 'Core properties (docProps/core.xml)',
			rows: toRows(office.core)
		});
	if (Object.keys(office.app).length)
		groups.push({
			id: 'app',
			label: 'Extended properties (docProps/app.xml)',
			rows: toRows(office.app)
		});
	if (Object.keys(office.custom).length)
		groups.push({
			id: 'custom',
			label: 'Custom properties (docProps/custom.xml)',
			rows: toRows(office.custom)
		});

	const notes = [];
	if (!groups.length) notes.push('No document properties found. They may have been removed.');
	notes.push(
		'Total editing time and revision are counters kept by the editing application and can be reset.'
	);
	return { kind: office.kind, highlights: highlights.filter((row) => row.value), groups, notes };
}

/**
 * Extracts the metadata of a file, entirely in the browser.
 * @param {File} file
 * @returns {Promise<MetadataResult>}
 */
export async function extractMetadata(file) {
	const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
	const format = detectFormat(head);
	/** @type {MetadataResult} */
	const result = {
		format,
		formatLabel: format ? FORMAT_LABELS[format] : 'Unknown format',
		isImage: format !== null && IMAGE_FORMATS.has(format),
		file: [
			{ label: 'Name', value: file.name },
			{ label: 'Size', value: `${formatBytes(file.size)} (${file.size} bytes)` },
			{ label: 'MIME type (from browser)', value: file.type },
			{
				label: 'Last modified (local copy)',
				value: file.lastModified ? new Date(file.lastModified).toLocaleString() : ''
			}
		],
		highlights: [],
		groups: [],
		notes: []
	};

	if (result.isImage && format) {
		const segments = await readImageMetadata(file, format);
		result.highlights = imageHighlights(segments);
		result.groups = imageTagGroups(segments);
		if (!result.groups.length) result.notes.push('No embedded metadata found in this image.');
		else if (!result.highlights.some((row) => row.label === 'GPS coordinates'))
			result.notes.push('No GPS location in this image.');
		return result;
	}

	if (format === 'pdf') {
		Object.assign(result, pdfResult(new Uint8Array(await file.arrayBuffer())));
		return result;
	}

	if (format === 'zip') {
		const office = officeResult(new Uint8Array(await file.arrayBuffer()));
		if (office) {
			result.formatLabel = office.kind;
			Object.assign(result, {
				highlights: office.highlights,
				groups: office.groups,
				notes: office.notes
			});
		} else {
			result.notes.push('This ZIP archive is not an Office Open XML document (docx, xlsx, pptx).');
		}
		return result;
	}

	result.notes.push(
		'Unsupported format. Supported: JPEG, PNG, TIFF, WebP, HEIC/AVIF images, PDF and Office documents (docx, xlsx, pptx).'
	);
	return result;
}
