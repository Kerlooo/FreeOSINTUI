import { describe, expect, it } from 'vitest';
import {
	findEmails,
	messageIdDomain,
	organizationalDomain,
	parseAddressList,
	sameOrganization
} from './address.js';

describe('parseAddressList', () => {
	it('parses display names, bare addresses and comments', () => {
		expect(
			parseAddressList('"Doe, John" <john@example.com>, bob@example.net (Bob), <carol@Example.org>')
		).toEqual([
			{ name: 'Doe, John', address: 'john@example.com', domain: 'example.com' },
			{ name: 'Bob', address: 'bob@example.net', domain: 'example.net' },
			{ name: '', address: 'carol@Example.org', domain: 'example.org' }
		]);
	});

	it('decodes encoded-word display names', () => {
		expect(parseAddressList('=?UTF-8?Q?Ren=C3=A9e?= <renee@example.com>')[0].name).toBe('Renée');
	});

	it('handles group syntax and empty groups', () => {
		expect(parseAddressList('undisclosed-recipients:;')).toEqual([]);
		expect(parseAddressList('Team: a@example.com, b@example.com;').map((m) => m.address)).toEqual([
			'a@example.com',
			'b@example.com'
		]);
	});

	it('returns an empty list for missing values', () => {
		expect(parseAddressList(null)).toEqual([]);
	});
});

describe('domain helpers', () => {
	it('finds the organizational domain', () => {
		expect(organizationalDomain('mail.news.example.com')).toBe('example.com');
		expect(organizationalDomain('smtp.example.co.uk')).toBe('example.co.uk');
		expect(organizationalDomain('example.org.')).toBe('example.org');
		expect(sameOrganization('bounce.example.com', 'EXAMPLE.com')).toBe(true);
		expect(sameOrganization('example.com', 'example.net')).toBe(false);
		expect(sameOrganization('', '')).toBe(false);
	});

	it('reads the Message-ID domain', () => {
		expect(messageIdDomain('<abc.123@mail.Example.com>')).toBe('mail.example.com');
		expect(messageIdDomain('no-domain')).toBe('');
	});

	it('finds addresses inside text', () => {
		expect(findEmails('"PayPal Service@Example.com"')).toEqual(['service@example.com']);
	});
});
