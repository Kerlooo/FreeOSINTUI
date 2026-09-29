/**
 * Reverse image search engines. Search-by-URL links need a publicly reachable image URL;
 * for local files the user has to upload the image on the engine's own page.
 * Face-recognition services are deliberately not listed.
 */
export const REVERSE_ENGINES = [
	{
		id: 'google',
		name: 'Google Lens',
		uploadUrl: 'https://lens.google.com/',
		byUrl: (/** @type {string} */ url) =>
			`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`
	},
	{
		id: 'bing',
		name: 'Bing Visual Search',
		uploadUrl: 'https://www.bing.com/visualsearch',
		byUrl: (/** @type {string} */ url) =>
			`https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(url)}`
	},
	{
		id: 'yandex',
		name: 'Yandex Images',
		uploadUrl: 'https://yandex.com/images/',
		byUrl: (/** @type {string} */ url) =>
			`https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(url)}`
	},
	{
		id: 'tineye',
		name: 'TinEye',
		uploadUrl: 'https://tineye.com/',
		byUrl: (/** @type {string} */ url) => `https://tineye.com/search?url=${encodeURIComponent(url)}`
	}
];

/**
 * Validates an image URL and builds the search link for each engine.
 * @param {string} input
 * @returns {{ error: string, links: [] } | { error: null, links: { id: string, name: string, url: string }[] }}
 */
export function buildReverseSearchLinks(input) {
	const value = input.trim();
	if (!value) return { error: null, links: [] };
	let url;
	try {
		url = new URL(value);
	} catch {
		return { error: 'Enter a full URL starting with http:// or https://.', links: [] };
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:')
		return { error: 'Only http:// and https:// URLs can be searched.', links: [] };
	return {
		error: null,
		links: REVERSE_ENGINES.map((engine) => ({
			id: engine.id,
			name: engine.name,
			url: engine.byUrl(url.href)
		}))
	};
}
