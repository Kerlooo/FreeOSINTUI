/** Image formats a favicon is commonly served in, recognised by their first bytes. */
const SIGNATURES = [
	{ label: 'ICO', mime: 'image/x-icon', bytes: [0x00, 0x00, 0x01, 0x00] },
	{ label: 'CUR', mime: 'image/x-icon', bytes: [0x00, 0x00, 0x02, 0x00] },
	{ label: 'PNG', mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
	{ label: 'GIF', mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
	{ label: 'JPEG', mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
	{ label: 'BMP', mime: 'image/bmp', bytes: [0x42, 0x4d] }
];

/**
 * Guesses the image format from magic bytes (SVG and WebP need a closer look).
 * @param {Uint8Array} bytes
 * @returns {{ label: string, mime: string } | null}
 */
export function detectImageFormat(bytes) {
	for (const { label, mime, bytes: signature } of SIGNATURES) {
		if (signature.every((byte, i) => bytes[i] === byte)) return { label, mime };
	}
	const ascii = (/** @type {number} */ start, /** @type {number} */ end) =>
		String.fromCharCode(...bytes.subarray(start, end));
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP')
		return { label: 'WebP', mime: 'image/webp' };
	const head = new TextDecoder().decode(bytes.subarray(0, 512)).trimStart().toLowerCase();
	if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg')))
		return { label: 'SVG', mime: 'image/svg+xml' };
	return null;
}
