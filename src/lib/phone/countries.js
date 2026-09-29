import { getCountries, getCountryCallingCode } from 'libphonenumber-js/max';

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
 * English name of a country or region code, falling back to the code itself.
 * @param {string | null | undefined} code
 */
export function countryName(code) {
	if (!code) return '';
	try {
		return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
	} catch {
		return code;
	}
}

/**
 * Every country known to libphonenumber, sorted by name, for the default country select.
 * @returns {{ code: string, name: string, callingCode: string, flag: string }[]}
 */
export function listCountries() {
	return getCountries()
		.map((code) => ({
			code,
			name: countryName(code),
			callingCode: getCountryCallingCode(code),
			flag: flagEmoji(code)
		}))
		.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
