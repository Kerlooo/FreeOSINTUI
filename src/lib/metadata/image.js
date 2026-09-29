import exifr from 'exifr';
import { formatLocalDate, formatValue, mapLinks } from './format.js';

/**
 * Image metadata (EXIF, GPS, XMP, IPTC, ICC) read with exifr's full build, which supports
 * JPEG, TIFF, PNG and HEIC/AVIF. WebP is not supported by exifr, so its EXIF and XMP
 * chunks are wrapped in a minimal JPEG container that exifr can read.
 */

/** exifr options: every segment we display, kept separate (mergeOutput: false). */
export const EXIFR_OPTIONS = {
	tiff: true,
	ifd0: true,
	ifd1: false,
	exif: true,
	gps: true,
	interop: false,
	xmp: true,
	iptc: true,
	icc: true,
	jfif: true,
	ihdr: true,
	makerNote: false,
	userComment: true,
	mergeOutput: false,
	translateKeys: true,
	translateValues: true,
	reviveValues: true,
	sanitize: true
};

/** Readable names for exifr segment keys; XMP namespaces fall back to "XMP (<prefix>)". */
const SEGMENT_LABELS = {
	ifd0: 'EXIF — main image (IFD0)',
	exif: 'EXIF — capture settings',
	gps: 'GPS',
	interop: 'EXIF — interoperability',
	iptc: 'IPTC',
	icc: 'ICC color profile',
	jfif: 'JFIF',
	ihdr: 'PNG header and text chunks'
};

/**
 * @param {string} key
 */
export function segmentLabel(key) {
	return SEGMENT_LABELS[/** @type {keyof typeof SEGMENT_LABELS} */ (key)] ?? `XMP (${key})`;
}

/**
 * Collects the RIFF chunks of a WebP file.
 * @param {Uint8Array} bytes
 */
function webpChunks(bytes) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	/** @type {Record<string, Uint8Array>} */
	const chunks = {};
	for (let i = 12; i + 8 <= bytes.length;) {
		const id = String.fromCharCode(...bytes.subarray(i, i + 4));
		const size = view.getUint32(i + 4, true);
		chunks[id] ??= bytes.subarray(i + 8, i + 8 + size);
		i += 8 + size + (size & 1);
	}
	return chunks;
}

/**
 * Wraps the EXIF and XMP chunks of a WebP file in a JPEG made of APP1 segments only,
 * so exifr can parse them. Returns null when the WebP has no metadata chunks.
 * @param {Uint8Array} bytes
 */
export function webpToJpegSegments(bytes) {
	const chunks = webpChunks(bytes);
	const encoder = new TextEncoder();
	/** @type {Uint8Array[]} */
	const parts = [new Uint8Array([0xff, 0xd8])];

	/** @param {Uint8Array} header @param {Uint8Array} data */
	const addSegment = (header, data) => {
		const length = header.length + data.length + 2;
		if (length > 0xffff) return;
		parts.push(new Uint8Array([0xff, 0xe1, length >> 8, length & 0xff]), header, data);
	};

	let exif = chunks.EXIF;
	if (exif) {
		// Some writers keep the JPEG-style "Exif\0\0" prefix inside the chunk.
		if (String.fromCharCode(...exif.subarray(0, 4)) === 'Exif') exif = exif.subarray(6);
		addSegment(encoder.encode('Exif\0\0'), exif);
	}
	if (chunks['XMP ']) addSegment(encoder.encode('http://ns.adobe.com/xap/1.0/\0'), chunks['XMP ']);
	if (parts.length === 1) return null;

	parts.push(new Uint8Array([0xff, 0xd9]));
	const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

/**
 * Parses image metadata. `input` is a File/Blob in the browser or bytes in tests.
 * Returns the exifr output grouped by segment, or {} when the image has no metadata.
 * @param {Blob | Uint8Array | ArrayBuffer} input
 * @param {string} format detected format (see detect.js)
 * @returns {Promise<Record<string, Record<string, unknown>>>}
 */
export async function readImageMetadata(input, format) {
	let source = input;
	if (format === 'webp') {
		const bytes =
			input instanceof Uint8Array
				? input
				: new Uint8Array(input instanceof ArrayBuffer ? input : await input.arrayBuffer());
		const wrapped = webpToJpegSegments(bytes);
		if (!wrapped) return {};
		source = wrapped;
	}
	const output = await exifr.parse(/** @type {any} */ (source), EXIFR_OPTIONS);
	return output ?? {};
}

/**
 * Reads the first non-empty value among `keys` in the given segments.
 * @param {Record<string, Record<string, unknown>>} segments
 * @param {[string, string][]} keys [segment, tag] pairs
 */
function pick(segments, keys) {
	for (const [segment, tag] of keys) {
		const value = segments[segment]?.[tag];
		if (value !== undefined && value !== null && value !== '') return value;
	}
	return undefined;
}

/**
 * Extracts decimal GPS coordinates, or null when missing or invalid.
 * exifr adds `latitude`/`longitude` to the gps segment when GPSLatitude/Ref are present.
 * @param {Record<string, Record<string, unknown>>} segments
 */
export function extractGps(segments) {
	const gps = segments.gps;
	if (!gps) return null;
	const latitude = Number(gps.latitude);
	const longitude = Number(gps.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
	// Many phones write 0,0 when they have no fix.
	if (latitude === 0 && longitude === 0) return null;

	let altitude = null;
	if (typeof gps.GPSAltitude === 'number' && Number.isFinite(gps.GPSAltitude)) {
		const below = gps.GPSAltitudeRef === 1 || /below/i.test(String(gps.GPSAltitudeRef ?? ''));
		altitude = below ? -gps.GPSAltitude : gps.GPSAltitude;
	}
	return { latitude, longitude, altitude };
}

/**
 * @param {unknown} value
 */
function display(value) {
	if (value === undefined) return '';
	if (value instanceof Date) return formatLocalDate(value);
	return formatValue(value);
}

/**
 * The most useful fields for an investigation, as KeyValueTable rows.
 * @param {Record<string, Record<string, unknown>>} segments
 * @returns {{ label: string, value: string, href?: string }[]}
 */
export function imageHighlights(segments) {
	const make = display(pick(segments, [['ifd0', 'Make']]));
	const model = display(pick(segments, [['ifd0', 'Model']]));
	const camera = model.toLowerCase().startsWith(make.toLowerCase())
		? model
		: [make, model].filter(Boolean).join(' ');

	const width = pick(segments, [
		['exif', 'ExifImageWidth'],
		['ifd0', 'ImageWidth'],
		['ihdr', 'ImageWidth']
	]);
	const height = pick(segments, [
		['exif', 'ExifImageHeight'],
		['ifd0', 'ImageHeight'],
		['ihdr', 'ImageHeight']
	]);

	const offset = display(
		pick(segments, [
			['exif', 'OffsetTimeOriginal'],
			['exif', 'OffsetTime']
		])
	);
	const original = display(
		pick(segments, [
			['exif', 'DateTimeOriginal'],
			['exif', 'CreateDate'],
			['exif', 'DateTimeDigitized'],
			['xmp', 'CreateDate'],
			['photoshop', 'DateCreated']
		])
	);

	const rows = [
		{ label: 'Camera', value: camera },
		{
			label: 'Lens',
			value: display(
				pick(segments, [
					['exif', 'LensModel'],
					['exif', 'LensMake'],
					['aux', 'Lens']
				])
			)
		},
		{
			label: 'Camera serial number',
			value: display(
				pick(segments, [
					['exif', 'BodySerialNumber'],
					['aux', 'SerialNumber']
				])
			)
		},
		{
			label: 'Software',
			value: display(
				pick(segments, [
					['ifd0', 'Software'],
					['xmp', 'CreatorTool']
				])
			)
		},
		{ label: 'Original date', value: original && offset ? `${original} ${offset}` : original },
		{
			label: 'Modified date',
			value: display(
				pick(segments, [
					['ifd0', 'ModifyDate'],
					['xmp', 'ModifyDate']
				])
			)
		},
		{ label: 'Dimensions', value: width && height ? `${width} × ${height} px` : '' },
		{
			label: 'Author',
			value: display(
				pick(segments, [
					['ifd0', 'Artist'],
					['dc', 'creator'],
					['iptc', 'Byline'],
					['ifd0', 'XPAuthor']
				])
			)
		},
		{
			label: 'Copyright',
			value: display(
				pick(segments, [
					['ifd0', 'Copyright'],
					['dc', 'rights'],
					['iptc', 'CopyrightNotice']
				])
			)
		},
		{
			label: 'Description',
			value: display(
				pick(segments, [
					['ifd0', 'ImageDescription'],
					['dc', 'description'],
					['iptc', 'Caption'],
					['exif', 'UserComment']
				])
			)
		},
		{ label: 'Owner name', value: display(pick(segments, [['exif', 'CameraOwnerName']])) }
	];

	const gps = extractGps(segments);
	if (gps) {
		const links = mapLinks(gps.latitude, gps.longitude);
		const coords = `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`;
		rows.push(
			{ label: 'GPS coordinates', value: coords },
			{
				label: 'GPS altitude',
				value: gps.altitude === null ? '' : `${Number(gps.altitude.toFixed(1))} m`
			},
			{ label: 'OpenStreetMap', value: 'open map ↗', href: links.osm },
			{ label: 'Google Maps', value: 'open map ↗', href: links.google }
		);
	}
	return rows.filter((row) => row.value);
}

/**
 * Every tag grouped by segment, for the full table.
 * @param {Record<string, Record<string, unknown>>} segments
 * @returns {{ id: string, label: string, rows: { label: string, value: string }[] }[]}
 */
export function imageTagGroups(segments) {
	return Object.entries(segments)
		.filter(([, tags]) => tags && typeof tags === 'object')
		.map(([id, tags]) => ({
			id,
			label: segmentLabel(id),
			rows: Object.entries(tags)
				.map(([label, value]) => ({ label, value: display(value) }))
				.filter((row) => row.value)
		}))
		.filter((group) => group.rows.length);
}
