import { CATEGORIES } from './templates.js';
import { TARGET_TYPES } from './targets.js';
import { googleSearchUrl } from '$lib/search.js';

/**
 * Builds the dorks for a target, grouped by category. Categories with no dork for
 * this type are left out.
 * @param {string} typeId one of the TARGET_TYPES ids
 * @param {string} raw the input as typed by the user
 * @returns {{ error: string | null, target: { value: string } | null, groups: { id: string, label: string, description: string, dorks: { id: string, label: string, query: string, url: string }[] }[] }}
 */
export function generateDorks(typeId, raw) {
	const type = TARGET_TYPES.find((t) => t.id === typeId);
	if (!type) throw new Error(`Unknown target type: ${typeId}`);
	if (!raw.trim()) return { error: null, target: null, groups: [] };

	const target = type.normalize(raw);
	if (target.error) return { error: target.error, target: null, groups: [] };

	const groups = CATEGORIES.map((category) => ({
		id: category.id,
		label: category.label,
		description: category.description,
		dorks: category.dorks
			.filter((dork) => dork.types.includes(typeId))
			.map((dork) => ({ id: dork.id, label: dork.label, query: dork.build(target, typeId) }))
			.filter((dork) => dork.query)
			.map((dork) => ({ ...dork, url: googleSearchUrl(dork.query) }))
	})).filter((group) => group.dorks.length);

	return { error: null, target, groups };
}
