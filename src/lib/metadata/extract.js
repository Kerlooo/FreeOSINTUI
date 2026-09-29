import { formatDate, formatNumber, t } from '$lib/i18n/i18n.svelte.js';
import { detectFormat, formatLabel, IMAGE_FORMATS } from './detect.js';
import { formatBytes } from './format.js';
import { imageHighlights, imageTagGroups, readImageMetadata } from './image.js';
import { parseOffice } from './office.js';
import { parsePdf } from './pdf.js';

/**
 * Extraction is split in two steps: `readMetadata()` parses the file once and returns
 * language-independent data, `buildResult()` turns it into labelled rows in the current
 * language. The page calls `buildResult()` in a `$derived`, so switching language does not
 * re-read the file.
 *
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
 *
 * @typedef {object} RawMetadata
 * @property {ReturnType<typeof detectFormat>} format
 * @property {{ name: string, size: number, type: string, lastModified: number }} file
 * @property {Record<string, Record<string, unknown>> | null} image exifr segments
 * @property {import('./pdf.js').PdfMetadata | null} pdf
 * @property {import('./office.js').OfficeMetadata | null} office null also for a plain zip
 */

/**
 * @param {Record<string, string>} fields
 * @param {(key: string) => string} [label] maps a field key to its display label
 * @returns {Row[]}
 */
const toRows = (fields, label = (key) => key) =>
	Object.entries(fields).map(([key, value]) => ({ label: label(key), value }));

/** Info dictionary keys shown as highlights, with their label id (`metadata.pdf.<id>`). */
const PDF_INFO_LABELS = {
	Title: 'title',
	Author: 'author',
	Subject: 'subject',
	Keywords: 'keywords',
	Creator: 'creator',
	Producer: 'producer',
	CreationDate: 'created',
	ModDate: 'modified'
};

/** Highlights filled from XMP when the Info dictionary lacks them: [label id, XMP field id]. */
const PDF_FROM_XMP = [
	['author', 'creator'],
	['title', 'title'],
	['creator', 'creatorTool'],
	['producer', 'producer'],
	['created', 'created'],
	['modified', 'modified']
];

/**
 * Builds the result for a PDF.
 * @param {Uint8Array} bytes
 * @returns {Pick<MetadataResult, 'highlights' | 'groups' | 'notes'>}
 */
export function pdfResult(bytes) {
	return pdfResultFrom(parsePdf(bytes));
}

/**
 * @param {import('./pdf.js').PdfMetadata} pdf
 * @returns {Pick<MetadataResult, 'highlights' | 'groups' | 'notes'>}
 */
function pdfResultFrom(pdf) {
	const notes = [];
	/** @type {Row[]} */
	const highlights = [
		{ label: t('metadata.pdf.version'), value: pdf.version },
		{ label: t('metadata.pdf.pages'), value: pdf.pages ? formatNumber(pdf.pages) : '' },
		{ label: t('metadata.pdf.encrypted'), value: pdf.encrypted ? t('common.yes') : t('common.no') }
	];
	const found = new Set();
	for (const [key, id] of Object.entries(PDF_INFO_LABELS)) {
		if (pdf.info[key]) {
			found.add(id);
			highlights.push({ label: t(`metadata.pdf.${id}`), value: pdf.info[key] });
		}
	}
	// Fill gaps from XMP when the Info dictionary lacks a field.
	for (const [id, xmpId] of PDF_FROM_XMP) {
		if (!found.has(id) && pdf.xmp[xmpId]) {
			found.add(id);
			highlights.push({ label: t(`metadata.pdf.${id}`), value: `${pdf.xmp[xmpId]} (XMP)` });
		}
	}

	if (pdf.infoStatus === 'unreadable') notes.push(t('metadata.pdf.noteUnreadable'));
	if (pdf.infoStatus === 'encrypted') notes.push(t('metadata.pdf.noteEncrypted'));
	if (pdf.infoStatus === 'missing' && !Object.keys(pdf.xmp).length)
		notes.push(t('metadata.pdf.noteMissing'));
	if (pdf.objectStreams) notes.push(t('metadata.pdf.noteObjectStreams'));

	/** @type {Group[]} */
	const groups = [];
	if (Object.keys(pdf.info).length)
		groups.push({ id: 'info', label: t('metadata.pdf.groupInfo'), rows: toRows(pdf.info) });
	if (Object.keys(pdf.xmp).length)
		groups.push({
			id: 'xmp',
			label: t('metadata.pdf.groupXmp'),
			rows: toRows(pdf.xmp, (id) => t(`metadata.xmp.${id}`))
		});
	return { highlights, groups, notes };
}

/**
 * Builds the result for an Office Open XML file, or null if the zip is not one.
 * @param {Uint8Array} bytes
 * @returns {(Pick<MetadataResult, 'highlights' | 'groups' | 'notes'> & { kind: string }) | null}
 */
export function officeResult(bytes) {
	const office = parseOffice(bytes);
	return office ? officeResultFrom(office) : null;
}

/**
 * @param {import('./office.js').OfficeMetadata} office
 * @returns {Pick<MetadataResult, 'highlights' | 'groups' | 'notes'> & { kind: string }}
 */
function officeResultFrom(office) {
	/** @param {string} id */
	const fieldLabel = (id) => t(`metadata.office.${id}`);
	const kind = t(`metadata.office.kind.${office.kind}`);
	const pickCore = [
		'creator',
		'lastModifiedBy',
		'created',
		'modified',
		'lastPrinted',
		'title',
		'revision'
	];
	const pickApp = [
		'application',
		'company',
		'manager',
		'template',
		'totalTime',
		'pages',
		'words',
		'slides'
	];
	/** @type {Row[]} */
	const highlights = [
		{ label: t('metadata.office.type'), value: kind },
		...pickCore.map((id) => ({ label: fieldLabel(id), value: office.core[id] ?? '' })),
		...pickApp.map((id) => ({ label: fieldLabel(id), value: office.app[id] ?? '' }))
	];
	if (office.commentAuthors.length)
		highlights.push({
			label: t('metadata.office.commentAuthors'),
			value: office.commentAuthors.join(', ')
		});

	/** @type {Group[]} */
	const groups = [];
	if (Object.keys(office.core).length)
		groups.push({
			id: 'core',
			label: t('metadata.office.groupCore'),
			rows: toRows(office.core, fieldLabel)
		});
	if (Object.keys(office.app).length)
		groups.push({
			id: 'app',
			label: t('metadata.office.groupApp'),
			rows: toRows(office.app, fieldLabel)
		});
	if (Object.keys(office.custom).length)
		groups.push({
			id: 'custom',
			label: t('metadata.office.groupCustom'),
			rows: toRows(office.custom)
		});

	const notes = [];
	if (!groups.length) notes.push(t('metadata.office.noteNoProperties'));
	notes.push(t('metadata.office.noteCounters'));
	return { kind, highlights: highlights.filter((row) => row.value), groups, notes };
}

/**
 * Reads a file once, entirely in the browser. The result does not depend on the language.
 * @param {File} file
 * @returns {Promise<RawMetadata>}
 */
export async function readMetadata(file) {
	const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
	const format = detectFormat(head);
	/** @type {RawMetadata} */
	const raw = {
		format,
		file: { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified },
		image: null,
		pdf: null,
		office: null
	};
	if (format && IMAGE_FORMATS.has(format)) raw.image = await readImageMetadata(file, format);
	else if (format === 'pdf') raw.pdf = parsePdf(new Uint8Array(await file.arrayBuffer()));
	else if (format === 'zip') raw.office = parseOffice(new Uint8Array(await file.arrayBuffer()));
	return raw;
}

/**
 * Turns the data read by `readMetadata()` into rows and notes in the current language.
 * @param {RawMetadata} raw
 * @returns {MetadataResult}
 */
export function buildResult(raw) {
	const { format, file } = raw;
	/** @type {MetadataResult} */
	const result = {
		format,
		formatLabel: formatLabel(format),
		isImage: format !== null && IMAGE_FORMATS.has(format),
		file: [
			{ label: t('metadata.file.name'), value: file.name },
			{
				label: t('metadata.file.size'),
				value: t('metadata.file.sizeValue', {
					size: formatBytes(file.size),
					bytes: formatNumber(file.size)
				})
			},
			{ label: t('metadata.file.mime'), value: file.type },
			{
				label: t('metadata.file.modified'),
				value: file.lastModified
					? formatDate(file.lastModified, { dateStyle: 'short', timeStyle: 'medium' })
					: ''
			}
		],
		highlights: [],
		groups: [],
		notes: []
	};

	if (raw.image) {
		result.highlights = imageHighlights(raw.image);
		result.groups = imageTagGroups(raw.image);
		const gpsLabel = t('metadata.image.gpsCoordinates');
		if (!result.groups.length) result.notes.push(t('metadata.note.noImageMetadata'));
		else if (!result.highlights.some((row) => row.label === gpsLabel))
			result.notes.push(t('metadata.note.noGps'));
		return result;
	}

	if (raw.pdf) {
		Object.assign(result, pdfResultFrom(raw.pdf));
		return result;
	}

	if (format === 'zip') {
		if (raw.office) {
			const office = officeResultFrom(raw.office);
			result.formatLabel = office.kind;
			Object.assign(result, {
				highlights: office.highlights,
				groups: office.groups,
				notes: office.notes
			});
		} else {
			result.notes.push(t('metadata.note.notOffice'));
		}
		return result;
	}

	result.notes.push(t('metadata.note.unsupported'));
	return result;
}

/**
 * Extracts the metadata of a file, entirely in the browser.
 * @param {File} file
 * @returns {Promise<MetadataResult>}
 */
export async function extractMetadata(file) {
	return buildResult(await readMetadata(file));
}
