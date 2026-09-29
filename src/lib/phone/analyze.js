import { parsePhoneNumberFromString, validatePhoneNumberLength } from 'libphonenumber-js/max';
import { googleSearchUrl } from '$lib/search.js';
import { countryName, flagEmoji } from './countries.js';

/** Human-readable labels for libphonenumber number types. */
export const NUMBER_TYPES = {
	MOBILE: 'Mobile',
	FIXED_LINE: 'Fixed line',
	FIXED_LINE_OR_MOBILE: 'Fixed line or mobile',
	VOIP: 'VoIP',
	TOLL_FREE: 'Toll free',
	PREMIUM_RATE: 'Premium rate',
	SHARED_COST: 'Shared cost',
	PERSONAL_NUMBER: 'Personal number',
	PAGER: 'Pager',
	UAN: 'Universal access number (UAN)',
	VOICEMAIL: 'Voicemail'
};

const LENGTH_ERRORS = {
	TOO_SHORT: 'The number is too short.',
	TOO_LONG: 'The number is too long.',
	INVALID_LENGTH: 'The number has an invalid length for this country.',
	INVALID_COUNTRY: 'Unknown country calling code. Check the prefix or pick a default country.',
	NOT_A_NUMBER: 'This does not look like a phone number.'
};

/**
 * Parses and describes a phone number, fully offline.
 * @param {string} raw number as typed (with or without +)
 * @param {string} [defaultCountry] ISO code used when the number has no international prefix
 */
export function analyzePhone(raw, defaultCountry = 'IT') {
	const input = raw.trim();
	if (!input) return { error: null, result: null };
	if (/[^\d\s+().\-/]/.test(input.replace(/^tel:/i, '').replace(/\s*(ext\.?|x|#)\s*\d+$/i, ''))) {
		return { error: 'Use digits, spaces, +, -, / and brackets only.', result: null };
	}

	const options = { defaultCountry: /** @type {any} */ (defaultCountry) };
	const phone = parsePhoneNumberFromString(input, options);
	if (!phone) {
		const reason = validatePhoneNumberLength(input, options);
		return { error: LENGTH_ERRORS[reason] ?? LENGTH_ERRORS.NOT_A_NUMBER, result: null };
	}

	const valid = phone.isValid();
	const possible = phone.isPossible();
	const type = phone.getType() ?? null;
	const country = phone.country ?? null;
	const e164 = phone.format('E.164');
	const digits = e164.slice(1);
	const international = phone.formatInternational();
	const national = phone.formatNational();

	const formats = [
		{ id: 'e164', label: 'E.164', value: e164 },
		{ id: 'international', label: 'International', value: international },
		{ id: 'national', label: 'National', value: national },
		{ id: 'rfc3966', label: 'RFC 3966', value: phone.getURI() }
	];

	const searchTerms = [
		...new Set([e164, international, national, phone.nationalNumber, digits])
	].map((term) => `"${term}"`);

	return {
		error: null,
		result: {
			valid,
			possible,
			lengthProblem: possible
				? null
				: (LENGTH_ERRORS[validatePhoneNumberLength(input, options)] ?? null),
			country,
			countryName: country ? countryName(country) : null,
			flag: flagEmoji(country),
			callingCode: `+${phone.countryCallingCode}`,
			nationalNumber: phone.nationalNumber,
			extension: phone.ext ?? null,
			type,
			typeLabel: type ? (NUMBER_TYPES[type] ?? type) : null,
			formats,
			links: [
				{ id: 'whatsapp', label: 'WhatsApp', url: `https://wa.me/${digits}` },
				{ id: 'telegram', label: 'Telegram', url: `https://t.me/+${digits}` },
				{ id: 'google', label: 'Google search', url: googleSearchUrl(searchTerms.join(' OR ')) }
			]
		}
	};
}
