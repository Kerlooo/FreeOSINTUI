import { t } from '$lib/i18n/i18n.svelte.js';

/**
 * Detects the file format from its first bytes (magic numbers), not from the extension,
 * which can be wrong or missing.
 * @param {Uint8Array} head the first bytes of the file (at least 16)
 * @returns {'jpeg' | 'png' | 'tiff' | 'webp' | 'heic' | 'pdf' | 'zip' | null}
 */
export function detectFormat(head) {
	const ascii = (start, end) => String.fromCharCode(...head.subarray(start, end));

	if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg';
	if (ascii(0, 8) === '\x89PNG\r\n\x1a\n') return 'png';
	if (ascii(0, 4) === 'II*\0' || ascii(0, 4) === 'MM\0*') return 'tiff';
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
	if (
		ascii(4, 8) === 'ftyp' &&
		/^(heic|heix|hevc|hevx|heim|heis|mif1|msf1|avif|avis)$/.test(ascii(8, 12))
	)
		return 'heic';
	// The PDF header may be preceded by some junk bytes; readers accept it within the first 1 KB.
	if (ascii(0, Math.min(head.length, 1024)).includes('%PDF-')) return 'pdf';
	if (ascii(0, 4) === 'PK\x03\x04') return 'zip';
	return null;
}

/** Formats handled by the image (exifr) parser. */
export const IMAGE_FORMATS = new Set(['jpeg', 'png', 'tiff', 'webp', 'heic']);

/**
 * Display name of a detected format, in the current language.
 * @param {string | null} format
 */
export function formatLabel(format) {
	return t(format ? `metadata.format.${format}` : 'metadata.format.unknown');
}
