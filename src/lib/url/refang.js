/**
 * Refang and defang URLs, as found in threat reports and chat messages.
 */

/** Ordered replacements that undo common defanging styles. */
const REFANG_RULES = [
	[/\[\s*:\s*\/\s*\/\s*\]/g, '://'],
	[/\[\s*:\s*\]/g, ':'],
	[/[[({]\s*(?:\.|dot)\s*[\])}]/gi, '.'],
	[/[[({]\s*(?:@|at)\s*[\])}]/gi, '@'],
	[/[[({]\s*\/\s*[\])}]/g, '/'],
	[/^(?:hxxp|hXXp|hxp|h\*\*p|h__p|meow)(s?)(?=:|\[)/i, 'http$1'],
	[/^(?:fxp|fxxp)(s?):/i, 'ftp$1:']
];

/**
 * Turns a defanged URL (`hxxps[://]evil[.]com`, `evil(.)com`, `user[at]host`) back into a URL.
 * Surrounding quotes, angle brackets and whitespace are removed.
 * @param {string} input
 */
export function refang(input) {
	let text = String(input ?? '')
		.trim()
		.replace(/^[<"'`]+|[>"'`]+$/g, '')
		.replace(/\s+/g, '');
	for (const [pattern, replacement] of REFANG_RULES) {
		text = text.replace(pattern, /** @type {string} */ (replacement));
	}
	return text;
}

/**
 * Makes a URL safe to paste in reports: `https://a.b/c` → `hxxps[://]a[.]b/c`.
 * Only the scheme and the host part are changed, so the path stays readable.
 * @param {string} url
 */
export function defang(url) {
	const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)(.*)$/is.exec(url);
	if (!match) return url.replaceAll('.', '[.]');
	const [, scheme, authority, rest] = match;
	const safeScheme = scheme.replace(/^http/i, (s) => (s === 'HTTP' ? 'HXXP' : 'hxxp'));
	const safeAuthority = authority.replaceAll('.', '[.]').replaceAll('@', '[@]');
	return `${safeScheme}[://]${safeAuthority}${rest}`;
}
