import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, MESSAGES, matchLocale, translate } from './catalog.js';

/** @param {import('./catalog.js').Message} message */
const placeholders = (message) =>
	[
		...new Set(
			Object.values(typeof message === 'string' ? { other: message } : message)
				.join(' ')
				.match(/\{\w+\}/g) ?? []
		)
	].sort();

describe('message catalog', () => {
	const english = MESSAGES[DEFAULT_LOCALE];

	it('has English messages', () => {
		expect(Object.keys(english).length).toBeGreaterThan(0);
	});

	for (const { code } of LOCALES.filter((locale) => locale.code !== DEFAULT_LOCALE)) {
		it(`${code} has exactly the English keys`, () => {
			expect(Object.keys(MESSAGES[code]).sort()).toEqual(Object.keys(english).sort());
		});

		it(`${code} keeps the English placeholders`, () => {
			for (const [key, message] of Object.entries(MESSAGES[code])) {
				expect(placeholders(message), key).toEqual(placeholders(english[key]));
			}
		});

		it(`${code} has an "other" plural form wherever English is plural`, () => {
			for (const [key, message] of Object.entries(english)) {
				if (typeof message === 'object') expect(MESSAGES[code][key], key).toHaveProperty('other');
			}
		});
	}
});

describe('translate', () => {
	it('fills placeholders', () => {
		expect(translate('en', 'common.httpError', { host: 'a.com', status: 500 })).toBe(
			'a.com answered with HTTP 500.'
		);
	});

	it('translates into the requested language', () => {
		expect(translate('it', 'nav.home')).toBe('Home');
		expect(translate('fr', 'nav.tools')).toBe('Outils');
		expect(translate('ja', 'nav.tools')).toBe('ツール');
	});

	it('selects plural forms by count', () => {
		expect(translate('en', 'home.toolCount', { count: 1 })).toBe('1 tool');
		expect(translate('en', 'home.toolCount', { count: 3 })).toBe('3 tools');
	});

	it('falls back to the key when a message is missing', () => {
		expect(translate('fr', 'missing.key')).toBe('missing.key');
	});
});

describe('matchLocale', () => {
	it('picks the first supported browser language', () => {
		expect(matchLocale(['de-DE', 'fr-CA', 'en'])).toBe('fr');
		expect(matchLocale(['it'])).toBe('it');
		expect(matchLocale(['ja-JP', 'en'])).toBe('ja');
	});

	it('defaults to English', () => {
		expect(matchLocale(['de', 'es'])).toBe('en');
		expect(matchLocale([])).toBe('en');
	});
});
