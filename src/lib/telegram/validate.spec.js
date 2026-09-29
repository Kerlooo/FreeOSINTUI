import { describe, expect, it } from 'vitest';
import { normalizeTelegramUsername } from './validate.js';

describe('normalizeTelegramUsername', () => {
	it.each([
		['durov', 'durov'],
		['@durov', 'durov'],
		['t.me/durov', 'durov'],
		['https://t.me/s/telegram', 'telegram'],
		['https://telegram.me/BotFather?start=1', 'BotFather']
	])('%s -> %s', (input, expected) => {
		expect(normalizeTelegramUsername(input)).toEqual({ value: expected, error: null });
	});

	it('rejects invalid usernames', () => {
		expect(normalizeTelegramUsername('').error).toMatch(/Enter/);
		expect(normalizeTelegramUsername('abc').error).not.toBeNull();
		expect(normalizeTelegramUsername('1durov').error).not.toBeNull();
		expect(normalizeTelegramUsername('du-rov').error).not.toBeNull();
	});
});
