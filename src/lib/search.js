/** @param {string} query */
export function googleSearchUrl(query) {
	return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
