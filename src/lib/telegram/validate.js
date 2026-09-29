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
	if (!value) return { value, error: 'Enter a Telegram username.' };
	if (!USERNAME_RE.test(value))
		return {
			value,
			error:
				"Telegram usernames are 5-32 characters: letters, digits and '_', starting with a letter."
		};
	return { value, error: null };
}

/** Labels for the account types returned by /api/telegram. */
export const TYPE_LABELS = {
	channel: 'Channel',
	group: 'Group',
	bot: 'Bot',
	user: 'User',
	unknown: 'Unknown'
};
