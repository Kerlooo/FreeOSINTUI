import { t } from '$lib/i18n/i18n.svelte.js';

/** Same rule as the backend (backend/app/wmn.py USERNAME_RE). */
const USERNAME_RE = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * Cleans a username typed by the user (trims, drops a leading @).
 * @param {string} input
 * @returns {{ value: string, error: string | null }}
 */
export function normalizeUsername(input) {
	const value = input.trim().replace(/^@/, '');
	if (!value) return { value, error: t('username.error.empty') };
	if (!USERNAME_RE.test(value)) return { value, error: t('username.error.invalid') };
	return { value, error: null };
}
