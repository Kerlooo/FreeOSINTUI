import { t } from '$lib/i18n/i18n.svelte.js';

/** Removes double quotes, which would break a quoted Google search term. */
const stripQuotes = (value) => value.replace(/"/g, '');

/** Wraps a term in double quotes for an exact-match search. */
export const quote = (value) => `"${stripQuotes(value)}"`;

/**
 * Kinds of target the generator accepts. `normalize` turns raw input into a target:
 * `value` is the cleaned input, `exact` the exact-match search term, plus type-specific parts.
 * It returns `{ error }` when the input is not valid for the type.
 */
export const TARGET_TYPES = [
	{
		id: 'username',
		get label() {
			return t('dorks.type.username');
		},
		placeholder: 'johndoe',
		normalize(raw) {
			const value = stripQuotes(raw.trim().replace(/^@/, '').replace(/\s+/g, ''));
			if (!value) return { error: t('dorks.error.username') };
			return { value, exact: quote(value) };
		}
	},
	{
		id: 'email',
		get label() {
			return t('dorks.type.email');
		},
		placeholder: 'john.doe@example.com',
		normalize(raw) {
			const value = stripQuotes(raw.trim().toLowerCase());
			const match = value.match(/^([^\s@]+)@([^\s@]+\.[^\s@]+)$/);
			if (!match) return { error: t('dorks.error.email') };
			return { value, exact: quote(value), local: match[1], domain: match[2] };
		}
	},
	{
		id: 'name',
		get label() {
			return t('dorks.type.name');
		},
		placeholder: 'John Doe',
		normalize(raw) {
			const value = stripQuotes(raw.trim().replace(/\s+/g, ' '));
			if (!value) return { error: t('dorks.error.name') };
			const words = value.split(' ');
			// "Doe John" is common in lists and documents, so it is searched too.
			const reversed = words.length === 2 ? `${words[1]} ${words[0]}` : null;
			return { value, exact: quote(value), reversed };
		}
	},
	{
		id: 'phone',
		get label() {
			return t('dorks.type.phone');
		},
		placeholder: '+39 333 123 4567',
		normalize(raw) {
			const value = stripQuotes(raw.trim().replace(/\s+/g, ' '));
			const digits = value.replace(/\D/g, '');
			if (digits.length < 6 || /[^\d\s+().-]/.test(value)) {
				return { error: t('dorks.error.phone') };
			}
			// Pages write numbers in many formats: search both as typed and as bare digits.
			const variants = [
				...new Set([value, digits, value.startsWith('+') ? `+${digits}` : null])
			].filter(Boolean);
			const exact = variants.map(quote).join(' OR ');
			return { value, exact: variants.length > 1 ? `(${exact})` : exact, digits };
		}
	},
	{
		id: 'domain',
		get label() {
			return t('dorks.type.domain');
		},
		placeholder: 'example.com',
		normalize(raw) {
			const value = raw
				.trim()
				.toLowerCase()
				.replace(/^[a-z]+:\/\//, '')
				.replace(/[/?#].*$/, '')
				.replace(/^www\./, '');
			if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value)) {
				return { error: t('dorks.error.domain') };
			}
			return { value, exact: quote(value) };
		}
	}
];
