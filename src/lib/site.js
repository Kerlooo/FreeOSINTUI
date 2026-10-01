/** Public origin of the deployed site, used for canonical URLs, Open Graph and the sitemap. */
export const SITE_URL = 'https://freeosintui.vercel.app';

export const SITE_NAME = 'FreeOSINT-UI';

/**
 * Absolute URL of a site path, without a trailing slash except for the home page.
 * @param {string} path
 */
export function absoluteUrl(path) {
	const clean = path === '/' ? '/' : path.replace(/\/+$/, '');
	return SITE_URL + clean;
}

/**
 * schema.org JSON-LD for the home page, as a ready `<script>` tag. `<` is escaped so the
 * text can never close the tag.
 * @param {{ description: string, tools: { name: string, route: string }[] }} options
 */
export function structuredDataTag({ description, tools }) {
	const data = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: SITE_NAME,
		url: absoluteUrl('/'),
		description,
		applicationCategory: 'SecurityApplication',
		operatingSystem: 'Any',
		browserRequirements: 'Requires JavaScript',
		isAccessibleForFree: true,
		inLanguage: ['en', 'it', 'fr'],
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		author: { '@type': 'Person', name: 'kerlo', url: 'https://github.com/Kerlooo' },
		featureList: tools.map((tool) => tool.name),
		hasPart: tools.map((tool) => ({
			'@type': 'WebPage',
			name: tool.name,
			url: absoluteUrl(tool.route)
		}))
	};
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
