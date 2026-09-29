import { parsePhoneNumberFromString, validatePhoneNumberLength } from 'libphonenumber-js/max';
import { googleSearchUrl } from '$lib/search.js';
import { t } from '$lib/i18n/i18n.svelte.js';
import { countryName, flagEmoji } from './countries.js';

/** libphonenumber number types that have a translated label (`phone.type.<TYPE>`). */
export const NUMBER_TYPES = [
	'MOBILE',
	'FIXED_LINE',
	'FIXED_LINE_OR_MOBILE',
	'VOIP',
	'TOLL_FREE',
	'PREMIUM_RATE',
	'SHARED_COST',
	'PERSONAL_NUMBER',
	'PAGER',
	'UAN',
	'VOICEMAIL'
];

const LENGTH_ERRORS = [
	'TOO_SHORT',
	'TOO_LONG',
	'INVALID_LENGTH',
	'INVALID_COUNTRY',
	'NOT_A_NUMBER'
];

/**
 * Translated message for a libphonenumber length validation result, or null.
 * @param {string | undefined} reason
 */
function lengthError(reason) {
	return reason && LENGTH_ERRORS.includes(reason) ? t(`phone.error.${reason}`) : null;
}

/**
 * Parses and describes a phone number, fully offline.
 * @param {string} raw number as typed (with or without +)
 * @param {string} [defaultCountry] ISO code used when the number has no international prefix
 */
export function analyzePhone(raw, defaultCountry = 'IT') {
	const input = raw.trim();
	if (!input) return { error: null, result: null };
	if (/[^\d\s+().\-/]/.test(input.replace(/^tel:/i, '').replace(/\s*(ext\.?|x|#)\s*\d+$/i, ''))) {
		return { error: t('phone.error.chars'), result: null };
	}

	const options = { defaultCountry: /** @type {any} */ (defaultCountry) };
	const phone = parsePhoneNumberFromString(input, options);
	if (!phone) {
		const reason = validatePhoneNumberLength(input, options);
		return { error: lengthError(reason) ?? t('phone.error.NOT_A_NUMBER'), result: null };
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
		{ id: 'international', label: t('phone.format.international'), value: international },
		{ id: 'national', label: t('phone.format.national'), value: national },
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
			lengthProblem: possible ? null : lengthError(validatePhoneNumberLength(input, options)),
			country,
			countryName: country ? countryName(country) : null,
			flag: flagEmoji(country),
			callingCode: `+${phone.countryCallingCode}`,
			nationalNumber: phone.nationalNumber,
			extension: phone.ext ?? null,
			type,
			typeLabel: type ? (NUMBER_TYPES.includes(type) ? t(`phone.type.${type}`) : type) : null,
			formats,
			links: [
				{ id: 'whatsapp', label: 'WhatsApp', url: `https://wa.me/${digits}` },
				{ id: 'telegram', label: 'Telegram', url: `https://t.me/+${digits}` },
				{
					id: 'google',
					label: t('phone.googleSearch'),
					url: googleSearchUrl(searchTerms.join(' OR '))
				}
			]
		}
	};
}
