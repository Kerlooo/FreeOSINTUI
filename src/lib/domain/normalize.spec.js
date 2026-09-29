import { describe, expect, it } from 'vitest';
import { formatDate, normalizeDomain } from './normalize.js';

describe('normalizeDomain', () => {
	it('strips scheme, path, www and case', () => {
		expect(normalizeDomain(' HTTPS://www.Example.com/path?q=1 ')).toEqual({ value: 'example.com' });
		expect(normalizeDomain('sub.example.co.uk.')).toEqual({ value: 'sub.example.co.uk' });
	});

	it('rejects invalid input', () => {
		expect(normalizeDomain('not a domain').error).toBeTruthy();
		expect(normalizeDomain('localhost').error).toBeTruthy();
	});
});

describe('formatDate', () => {
	it('formats ISO dates and passes through null', () => {
		expect(formatDate('1995-08-14T04:00:00Z')).toBe('1995-08-14');
		expect(formatDate(null)).toBeNull();
		expect(formatDate('garbage')).toBe('garbage');
	});
});
