import { describe, expect, it } from 'vitest';
import {
	decodeEncodedWords,
	extractHeaderBlock,
	getAll,
	getFirst,
	parseHeaders,
	parseMailDate,
	splitTopLevel,
	stripComments
} from './parse.js';

describe('extractHeaderBlock', () => {
	it('stops at the first empty line and skips an mbox separator', () => {
		const eml =
			'\r\nFrom MAILER-DAEMON Tue Sep 29 10:00:00 2026\r\nSubject: hi\r\nTo: a@example.com\r\n\r\nBody: not a header\r\n';
		expect(extractHeaderBlock(eml)).toBe('Subject: hi\nTo: a@example.com');
	});
});

describe('parseHeaders', () => {
	it('unfolds continuation lines (spaces and tabs)', () => {
		const { headers } = parseHeaders(
			'Subject: a very\n  long subject\n\tline\nReceived: from a.example.net\n        by b.example.com; Tue, 29 Sep 2026 10:00:00 +0000\n'
		);
		expect(headers).toEqual([
			{ name: 'Subject', key: 'subject', value: 'a very long subject line' },
			{
				name: 'Received',
				key: 'received',
				value: 'from a.example.net by b.example.com; Tue, 29 Sep 2026 10:00:00 +0000'
			}
		]);
	});

	it('counts lines that are not header fields', () => {
		const { headers, ignored } = parseHeaders(
			'  orphan continuation\nnot a header line\nTo: a@example.com'
		);
		expect(headers).toHaveLength(1);
		expect(ignored).toBe(2);
	});

	it('keeps an empty value and colons inside the value', () => {
		const { headers } = parseHeaders('X-Empty:\nX-Time: 10:15:30');
		expect(getFirst(headers, 'x-empty')).toBe('');
		expect(getFirst(headers, 'X-TIME')).toBe('10:15:30');
	});

	it('returns repeated fields in order', () => {
		const { headers } = parseHeaders('Received: one\nX: y\nReceived: two');
		expect(getAll(headers, 'received')).toEqual(['one', 'two']);
		expect(getFirst(headers, 'missing')).toBeNull();
	});
});

describe('decodeEncodedWords', () => {
	it('decodes base64 and quoted-printable words', () => {
		expect(decodeEncodedWords('=?UTF-8?B?Q2lhbyDwn5GL?=')).toBe('Ciao 👋');
		expect(decodeEncodedWords('=?utf-8?Q?Caf=C3=A9_cr=C3=A8me?=')).toBe('Café crème');
		expect(decodeEncodedWords('=?ISO-8859-1?Q?Andr=E9?= Dupont')).toBe('André Dupont');
	});

	it('drops whitespace between adjacent encoded words only', () => {
		expect(decodeEncodedWords('=?utf-8?Q?Hello?= =?utf-8?Q?_world?=')).toBe('Hello world');
		expect(decodeEncodedWords('Re: =?utf-8?B?b2s=?= done')).toBe('Re: ok done');
	});

	it('leaves plain and malformed text untouched', () => {
		expect(decodeEncodedWords('Plain subject')).toBe('Plain subject');
		expect(decodeEncodedWords('=?utf-8?X?abc?=')).toBe('=?utf-8?X?abc?=');
	});

	it('falls back to UTF-8 for unknown charsets', () => {
		expect(decodeEncodedWords('=?x-unknown?B?b2s=?=')).toBe('ok');
	});
});

describe('parseMailDate', () => {
	it('parses numeric zones', () => {
		expect(parseMailDate('Tue, 29 Sep 2026 12:15:30 +0200 (CEST)')).toBe(
			Date.UTC(2026, 8, 29, 10, 15, 30)
		);
		expect(parseMailDate('29 Sep 2026 03:15:30 -0700')).toBe(Date.UTC(2026, 8, 29, 10, 15, 30));
	});

	it('parses obsolete forms', () => {
		expect(parseMailDate('Tue, 29 Sep 26 10:15 GMT')).toBe(Date.UTC(2026, 8, 29, 10, 15, 0));
		expect(parseMailDate('Tue, 29 Sep 2026 06:15:30 EDT')).toBe(Date.UTC(2026, 8, 29, 10, 15, 30));
		expect(parseMailDate('Tue, 29 Sep 1998 10:15:30 +0000')).toBe(
			Date.UTC(1998, 8, 29, 10, 15, 30)
		);
	});

	it('returns null for missing or invalid dates', () => {
		expect(parseMailDate(null)).toBeNull();
		expect(parseMailDate('not a date')).toBeNull();
	});
});

describe('splitTopLevel and stripComments', () => {
	it('ignores separators inside quotes, comments and angle brackets', () => {
		expect(splitTopLevel('"Doe, John" <j@example.com>, (a, b) x@example.net', ',')).toEqual([
			'"Doe, John" <j@example.com>',
			' (a, b) x@example.net'
		]);
	});

	it('removes nested comments', () => {
		expect(stripComments('pass (outer (inner) text) rest')).toEqual({
			text: 'pass rest',
			comments: ['outer (inner) text']
		});
	});
});
