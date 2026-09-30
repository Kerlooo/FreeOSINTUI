import { t } from '$lib/i18n/i18n.svelte.js';

/** Tool categories, in display order. Names and descriptions live in `i18n/messages/tools.js`. */
export const CATEGORIES = [
	'search',
	'people',
	'network',
	'threat',
	'breaches',
	'files',
	'blockchain',
	'utilities'
].map((id) => ({
	id,
	get label() {
		return t(`tools.category.${id}`);
	}
}));

/**
 * Every tool available on the site. The home page and the navbar both read this list,
 * so a new tool is added here.
 */
export const TOOLS = /** @type {{ id: string, route: string, category: string }[]} */ ([
	{
		id: 'dorks',
		route: '/dorks',
		category: 'search'
	},
	{
		id: 'hash',
		route: '/hash',
		category: 'files'
	},
	{
		id: 'domain',
		route: '/domain',
		category: 'network'
	},
	{
		id: 'ip',
		route: '/ip',
		category: 'network'
	},
	{
		id: 'email',
		route: '/email',
		category: 'people'
	},
	{
		id: 'leaks',
		route: '/leaks',
		category: 'breaches'
	},
	{
		id: 'username',
		route: '/username',
		category: 'people'
	},
	{
		id: 'phone',
		route: '/phone',
		category: 'people'
	},
	{
		id: 'telegram',
		route: '/telegram',
		category: 'people'
	},
	{
		id: 'crypto',
		route: '/crypto',
		category: 'blockchain'
	},
	{
		id: 'github',
		route: '/github',
		category: 'people'
	},
	{
		id: 'metadata',
		route: '/metadata',
		category: 'files'
	},
	{
		id: 'lookalike',
		route: '/lookalike',
		category: 'network'
	},
	{
		id: 'favicon',
		route: '/favicon',
		category: 'network'
	},
	{
		id: 'headers',
		route: '/headers',
		category: 'threat'
	}
]).map((tool) => ({
	...tool,
	/** @returns {string} */
	get name() {
		return t(`tools.${tool.id}.name`);
	},
	/** @returns {string} */
	get description() {
		return t(`tools.${tool.id}.description`);
	}
}));

/** Categories that have at least one tool, each with its tools. */
export function toolsByCategory() {
	return CATEGORIES.map((category) => ({
		id: category.id,
		// A getter, not a copy, so the label follows the current language.
		get label() {
			return category.label;
		},
		tools: TOOLS.filter((tool) => tool.category === category.id)
	})).filter((category) => category.tools.length);
}
