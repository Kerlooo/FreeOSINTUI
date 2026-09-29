import { describe, expect, it } from 'vitest';
import { analyzeAddress, parseEmail } from './address.js';

describe('parseEmail', () => {
	it('normalizes case and whitespace', () => {
		expect(parseEmail('  John.Doe@Example.COM ')).toEqual({
			email: 'john.doe@example.com',
			local: 'john.doe',
			domain: 'example.com'
		});
	});

	it('converts internationalized domains to punycode', () => {
		expect(parseEmail('a@bücher.de').domain).toBe('xn--bcher-kva.de');
	});

	it.each([
		'',
		'john',
		'@example.com',
		'john@',
		'jo..hn@example.com',
		'john@example',
		'john@-x.com'
	])('rejects %j', (input) => {
		expect(parseEmail(input).error).toBeTruthy();
	});
});

describe('analyzeAddress', () => {
	it('detects free providers', () => {
		expect(analyzeAddress('john', 'gmail.com').freeProvider).toBe('Gmail');
		expect(analyzeAddress('john', 'libero.it').freeProvider).toBe('Libero Mail');
		expect(analyzeAddress('john', 'example.com').freeProvider).toBeNull();
	});

	it('detects role addresses, ignoring plus tags and separators', () => {
		expect(analyzeAddress('info', 'example.com').role).toBe(true);
		expect(analyzeAddress('support+eu', 'example.com')).toMatchObject({ role: true, tag: 'eu' });
		expect(analyzeAddress('no_reply', 'example.com').role).toBe(true);
		expect(analyzeAddress('john.doe', 'example.com').role).toBe(false);
	});
});
