import { describe, expect, it } from 'vitest';
import { formatClock } from './format.js';

describe('formatClock', () => {
	it('formats day, month and 24-hour time with zero padding', () => {
		const clock = formatClock(new Date(2026, 8, 5, 7, 3, 9));
		expect(clock).toEqual({ day: '05 Sep', time: '07:03:09', datetime: '2026-09-05T07:03:09' });
	});

	it('handles the end of the year', () => {
		expect(formatClock(new Date(2026, 11, 31, 23, 59, 59)).day).toBe('31 Dec');
	});

	it('uses the month name of the requested language', () => {
		const date = new Date(2026, 8, 29);
		expect(formatClock(date, 'it').day).toBe('29 set');
		expect(formatClock(date, 'fr').day).toBe('29 sept');
	});
});
