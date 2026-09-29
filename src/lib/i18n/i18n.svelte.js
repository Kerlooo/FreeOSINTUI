import { DEFAULT_LOCALE, isLocale, matchLocale, translate } from './catalog.js';

const STORAGE_KEY = 'locale';

const current = $state({ locale: DEFAULT_LOCALE });

/** Current language code (`en`, `it`, `fr`), also usable with Intl APIs. */
export function getLocale() {
	return current.locale;
}

/**
 * Translates a key in the current language. Reading it in a template or `$derived`
 * re-renders when the language changes.
 * @param {string} key
 * @param {Record<string, unknown>} [params]
 */
export function t(key, params) {
	return translate(current.locale, key, params);
}

/**
 * Formats a number with the separators of the current language.
 * @param {number | bigint} value
 * @param {Intl.NumberFormatOptions} [options]
 */
export function formatNumber(value, options) {
	return new Intl.NumberFormat(current.locale, options).format(value);
}

/**
 * Formats a date in the current language.
 * @param {Date | number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(value, options = { dateStyle: 'medium', timeStyle: 'short' }) {
	return new Intl.DateTimeFormat(current.locale, options).format(value);
}

/**
 * Switches language, remembers it and updates `<html lang>`.
 * @param {string} locale
 */
export function setLocale(locale) {
	if (!isLocale(locale)) return;
	current.locale = locale;
	document.documentElement.lang = locale;
	try {
		localStorage.setItem(STORAGE_KEY, locale);
	} catch {
		// Storage can be blocked (private mode): the choice lasts until the page is closed.
	}
}

/** Restores the saved language, or picks one from the browser settings. Browser only. */
export function initLocale() {
	let saved = null;
	try {
		saved = localStorage.getItem(STORAGE_KEY);
	} catch {
		// Ignore blocked storage.
	}
	setLocale(isLocale(saved) ? /** @type {string} */ (saved) : matchLocale(navigator.languages));
}
