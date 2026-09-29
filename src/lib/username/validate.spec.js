import { describe, expect, it } from 'vitest';
import { normalizeUsername } from './validate.js';

describe('normalizeUsername', () => {
	it('accepts valid usernames and strips @', () => {
		expect(normalizeUsername('  @john.doe_1 ')).toEqual({ value: 'john.doe_1', error: null });
	});

	it('rejects empty and invalid input', () => {
		expect(normalizeUsername('   ').error).toMatch(/Enter/);
		expect(normalizeUsername('john doe').error).toMatch(/letters/);
		expect(normalizeUsername('a/../b').error).not.toBeNull();
		expect(normalizeUsername('a'.repeat(65)).error).not.toBeNull();
	});
});
