import { t } from '$lib/i18n/i18n.svelte.js';

/** Result statuses returned by /api/username/check, in display order. */
export const STATUSES = ['found', 'unknown', 'not_found', 'error'].map((id) => ({
	id,
	get label() {
		return t(`username.status.${id}`);
	}
}));

/** WhatsMyName categories with a translated label (`username.category.<id>`). */
const CATEGORIES = [
	'archived',
	'art',
	'blog',
	'business',
	'coding',
	'dating',
	'finance',
	'gaming',
	'health',
	'hobby',
	'images',
	'misc',
	'music',
	'news',
	'political',
	'shopping',
	'social',
	'tech',
	'video'
];

export const NSFW_CATEGORY = 'xx NSFW xx';

/**
 * Display label for a WhatsMyName category.
 * @param {string} category
 */
export function categoryLabel(category) {
	if (category === NSFW_CATEGORY) return 'NSFW';
	if (CATEGORIES.includes(category)) return t(`username.category.${category}`);
	return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Counts results per status.
 * @param {{ status: string }[]} results
 * @returns {Record<string, number>}
 */
export function summarize(results) {
	/** @type {Record<string, number>} */
	const counts = Object.fromEntries(STATUSES.map((s) => [s.id, 0]));
	for (const result of results) counts[result.status] = (counts[result.status] ?? 0) + 1;
	return counts;
}

/**
 * Groups results by category, keeping only the given statuses.
 * Categories are sorted by name (NSFW last); sites inside a category by name.
 * @template {{ status: string, category: string, name: string }} R
 * @param {R[]} results
 * @param {string[]} statuses
 * @returns {{ category: string, label: string, results: R[] }[]}
 */
export function groupByCategory(results, statuses) {
	/** @type {Map<string, R[]>} */
	const groups = new Map();
	for (const result of results) {
		if (!statuses.includes(result.status)) continue;
		const list = groups.get(result.category) ?? [];
		list.push(result);
		groups.set(result.category, list);
	}
	return [...groups.entries()]
		.sort(([a], [b]) => {
			if (a === NSFW_CATEGORY) return 1;
			if (b === NSFW_CATEGORY) return -1;
			return a.localeCompare(b);
		})
		.map(([category, list]) => ({
			category,
			label: categoryLabel(category),
			results: list.toSorted((a, b) => a.name.localeCompare(b.name))
		}));
}

/**
 * Profile URLs of the found accounts, one per line, for copying.
 * @param {{ status: string, url: string | null }[]} results
 */
export function foundUrls(results) {
	return results
		.filter((r) => r.status === 'found' && r.url)
		.map((r) => r.url)
		.join('\n');
}
