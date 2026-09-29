import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

/** Formatting helpers shared by the metadata parsers. */

/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0');

/**
 * Formats a Date using its local wall-clock fields. exifr turns EXIF dates (which carry
 * no time zone) into local-time Dates, so reading the local fields back gives the
 * original value written by the camera.
 * @param {Date} date
 */
export function formatLocalDate(date) {
	if (Number.isNaN(date.getTime())) return '';
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
		`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	);
}

/**
 * Human-readable file size.
 * @param {number} bytes
 */
export function formatBytes(bytes) {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let size = bytes;
	let unit = 0;
	while (size >= 1024 && unit < units.length - 1) {
		size /= 1024;
		unit++;
	}
	const digits = unit === 0 ? 0 : 1;
	const number = formatNumber(size, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
	return `${number} ${units[unit]}`;
}

const MAX_VALUE_LENGTH = 400;

/**
 * Turns any tag value produced by exifr into a display string.
 * Binary blobs are summarised instead of dumped.
 * @param {unknown} value
 * @returns {string}
 */
export function formatValue(value) {
	if (value === null || value === undefined) return '';
	if (value instanceof Date) return formatLocalDate(value);
	if (value instanceof Uint8Array || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
		const length = /** @type {{ byteLength: number }} */ (value).byteLength;
		return t('metadata.value.binary', { size: formatBytes(length) });
	}
	if (Array.isArray(value)) {
		if (value.length > 32 && value.every((item) => typeof item === 'number')) {
			return t('metadata.value.numeric', { count: value.length });
		}
		return value.map(formatValue).join(', ');
	}
	if (typeof value === 'number') {
		return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
	}
	if (typeof value === 'object') {
		// Typed arrays that were converted to plain objects ({0: 1, 1: 2, …}).
		const entries = Object.entries(value);
		if (
			entries.length &&
			entries.every(([key, item]) => /^\d+$/.test(key) && typeof item === 'number')
		) {
			return entries.length > 32
				? t('metadata.value.numeric', { count: entries.length })
				: entries.map(([, item]) => item).join(', ');
		}
		return truncate(JSON.stringify(value));
	}
	return truncate(String(value).replace(/\0+$/, '').trim());
}

/** @param {string} text */
function truncate(text) {
	return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text;
}

/**
 * OpenStreetMap and Google Maps links for a coordinate pair.
 * @param {number} latitude
 * @param {number} longitude
 */
export function mapLinks(latitude, longitude) {
	const lat = Number(latitude.toFixed(6));
	const lon = Number(longitude.toFixed(6));
	return {
		osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
		google: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
	};
}
