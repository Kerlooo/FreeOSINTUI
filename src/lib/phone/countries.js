import { getCountries, getCountryCallingCode } from 'libphonenumber-js/max';
import { getLocale } from '$lib/i18n/i18n.svelte.js';

/**
 * Turns an ISO 3166-1 alpha-2 code into its flag emoji (regional indicator symbols).
 * @param {string | null | undefined} code
 */
export function flagEmoji(code) {
	if (!code || !/^[A-Za-z]{2}$/.test(code)) return '';
	return String.fromCodePoint(
		...[...code.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
	);
}

/**
 * Name of a country or region code in the given language, falling back to the code itself.
 * @param {string | null | undefined} code
 * @param {string} [locale] defaults to the current site language
 */
export function countryName(code, locale = getLocale()) {
	if (!code) return '';
	try {
		return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
	} catch {
		return code;
	}
}

/**
 * Every country known to libphonenumber, sorted by name, for the default country select.
 * @param {string} [locale] language of the names, defaults to the current site language
 * @returns {{ code: string, name: string, callingCode: string, flag: string }[]}
 */
export function listCountries(locale = getLocale()) {
	return getCountries()
		.map((code) => ({
			code,
			name: countryName(code, locale),
			callingCode: getCountryCallingCode(code),
			flag: flagEmoji(code)
		}))
		.sort((a, b) => a.name.localeCompare(b.name, locale));
}
