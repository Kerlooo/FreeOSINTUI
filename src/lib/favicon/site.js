/**
 * Turns a domain or URL typed by the user into the conventional `/favicon.ico` URL
 * of that site, for the user to open and save. Returns null for invalid input.
 * @param {string} input
 */
export function faviconUrl(input) {
	const raw = input.trim();
	if (!raw) return null;
	try {
		const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
		if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
		return `${url.protocol}//${url.host}/favicon.ico`;
	} catch {
		return null;
	}
}
