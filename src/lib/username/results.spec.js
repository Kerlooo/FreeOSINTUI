import { describe, expect, it } from 'vitest';
import { categoryLabel, foundUrls, groupByCategory, summarize } from './results.js';

const results = [
	{ name: 'GitHub', category: 'coding', status: 'found', url: 'https://github.com/x' },
	{ name: 'GitLab', category: 'coding', status: 'not_found', url: 'https://gitlab.com/x' },
	{ name: 'Reddit', category: 'social', status: 'found', url: 'https://reddit.com/u/x' },
	{ name: 'Adult', category: 'xx NSFW xx', status: 'found', url: null },
	{ name: 'Bitbucket', category: 'coding', status: 'found', url: 'https://bitbucket.org/x' },
	{ name: 'Slow', category: 'misc', status: 'error', url: null },
	{ name: 'Blocked', category: 'misc', status: 'unknown', url: null }
];

describe('summarize', () => {
	it('counts each status', () => {
		expect(summarize(results)).toEqual({ found: 4, unknown: 1, not_found: 1, error: 1 });
	});

	it('starts every status at zero', () => {
		expect(summarize([])).toEqual({ found: 0, unknown: 0, not_found: 0, error: 0 });
	});
});

describe('groupByCategory', () => {
	it('keeps only the selected statuses, sorted, NSFW last', () => {
		const groups = groupByCategory(results, ['found']);
		expect(groups.map((g) => g.label)).toEqual(['Coding', 'Social', 'NSFW']);
		expect(groups[0].results.map((r) => r.name)).toEqual(['Bitbucket', 'GitHub']);
	});

	it('drops categories with no matching result', () => {
		expect(groupByCategory(results, ['error']).map((g) => g.category)).toEqual(['misc']);
	});
});

describe('foundUrls', () => {
	it('lists found profile URLs, skipping missing ones', () => {
		expect(foundUrls(results)).toBe(
			'https://github.com/x\nhttps://reddit.com/u/x\nhttps://bitbucket.org/x'
		);
	});
});

describe('categoryLabel', () => {
	it('capitalizes and renames NSFW', () => {
		expect(categoryLabel('gaming')).toBe('Gaming');
		expect(categoryLabel('xx NSFW xx')).toBe('NSFW');
	});
});
