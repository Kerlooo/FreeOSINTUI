import { t } from '$lib/i18n/i18n.svelte.js';

/** Same rule as the backend (backend/app/telegram.py USERNAME_RE). */
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;

/**
 * Accepts "@name", "name", "t.me/name" or "https://t.me/s/name" and returns the bare username.
 * @param {string} input
 * @returns {{ value: string, error: string | null }}
 */
export function normalizeTelegramUsername(input) {
	let value = input.trim();
	const link = value.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([^/?#]+)/i);
	if (link) value = link[1];
	value = value.replace(/^@/, '');
	if (!value) return { value, error: t('telegram.error.empty') };
	if (!USERNAME_RE.test(value)) return { value, error: t('telegram.error.invalid') };
	return { value, error: null };
}

const TYPES = ['channel', 'group', 'bot', 'user', 'unknown'];

/**
 * Translated label for an account type returned by /api/telegram (unknown values pass through).
 * @param {string} type
 */
export function typeLabel(type) {
	return TYPES.includes(type) ? t(`telegram.type.${type}`) : type;
}

/**
 * Translated label for a channel counter as named by t.me ("subscribers", "photos", ...),
 * falling back to the capitalized original.
 * @param {string} kind
 */
export function counterLabel(kind) {
	const key = `telegram.counter.${kind.toLowerCase().replace(/s$/, '')}`;
	const label = t(key);
	return label === key ? kind.charAt(0).toUpperCase() + kind.slice(1) : label;
}
