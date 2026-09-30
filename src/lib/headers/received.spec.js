import { describe, expect, it } from 'vitest';
import { buildChain, durationParts, extractIps, parseReceived, SLOW_HOP_MS } from './received.js';

// Realistic but fake Received lines (reserved names, documentation addresses).
const GMAIL =
	'from mail-sor-f41.example.com (mail-sor-f41.example.com. [198.51.100.41]) by mx.example.com with SMTPS id a1sor123456lfb.12.2026.09.29.01.15.30 for <alice@example.com> (Google Transport Security); Tue, 29 Sep 2026 01:15:30 -0700 (PDT)';
const GMAIL_INTERNAL =
	'by 2001:db8:4864:20::1a with SMTP id x12csp123456ecr; Tue, 29 Sep 2026 01:15:31 -0700 (PDT)';
const OUTLOOK =
	'from DB9PR01MB1234.eurprd01.prod.example.com (2001:db8:10:1::12) by AM0PR01MB5678.eurprd01.prod.example.com with HTTPS; Tue, 29 Sep 2026 08:15:30 +0000';
const OUTLOOK_EDGE =
	'from EUR01-DB5-obe.outbound.protection.example.com (mail-db5eur01on2101.outbound.protection.example.com [198.51.100.101]) by mx.example.net (Postfix) with ESMTPS id 4Fq2Lk0m3Zz9sT for <bob@example.net>; Tue, 29 Sep 2026 10:15:34 +0200 (CEST)';
const OUTLOOK_MS =
	'from AM0PR01MB5678.eurprd01.prod.example.com ([fe80::1c2d:3e4f:5a6b:7c8d]) by AM0PR01MB5678.eurprd01.prod.example.com ([fe80::1c2d:3e4f:5a6b:7c8d%7]) with mapi id 15.20.7982.033; Tue, 29 Sep 2026 08:15:29 +0000';
const POSTFIX =
	'from mail.example.net (mail.example.net [198.51.100.25]) (using TLSv1.3 with cipher TLS_AES_256_GCM_SHA384 (256/256 bits) key-exchange X25519 server-signature RSA-PSS (2048 bits)) (No client certificate requested) by mx.example.com (Postfix) with ESMTPS id 4F1A2B3C4D for <bob@example.com>; Tue, 29 Sep 2026 10:15:30 +0200 (CEST)';
const POSTFIX_LOCAL =
	'by mail.example.net (Postfix, from userid 1000) id 0ABC123; Tue, 29 Sep 2026 10:15:29 +0200 (CEST)';
const EXIM =
	'from [192.0.2.10] (helo=workstation.local) by mail.example.org with esmtpsa (TLS1.3) tls TLS_AES_256_GCM_SHA384 (Exim 4.96) (envelope-from <carol@example.org>) id 1qABCD-000123-4X for dave@example.com; Tue, 29 Sep 2026 09:15:30 +0100';
const EXIM_V6 =
	'from [IPv6:2001:db8::25] (port=51234 helo=[IPv6:2001:db8::25]) by mail.example.org with esmtpsa id 1qABCE-000124-5Y; Tue, 29 Sep 2026 09:15:31 +0100';

describe('parseReceived', () => {
	it('parses a Gmail-style line', () => {
		expect(parseReceived(GMAIL)).toMatchObject({
			from: 'mail-sor-f41.example.com',
			fromRdns: 'mail-sor-f41.example.com',
			fromIps: ['198.51.100.41'],
			by: 'mx.example.com',
			with: 'SMTPS',
			id: 'a1sor123456lfb.12.2026.09.29.01.15.30',
			for: 'alice@example.com',
			date: Date.UTC(2026, 8, 29, 8, 15, 30)
		});
		expect(parseReceived(GMAIL_INTERNAL)).toMatchObject({
			from: null,
			fromIps: [],
			by: '2001:db8:4864:20::1a',
			with: 'SMTP',
			id: 'x12csp123456ecr'
		});
	});

	it('parses Outlook-style lines', () => {
		expect(parseReceived(OUTLOOK)).toMatchObject({
			from: 'DB9PR01MB1234.eurprd01.prod.example.com',
			fromIps: ['2001:db8:10:1::12'],
			by: 'AM0PR01MB5678.eurprd01.prod.example.com',
			with: 'HTTPS',
			id: null,
			date: Date.UTC(2026, 8, 29, 8, 15, 30)
		});
		expect(parseReceived(OUTLOOK_EDGE)).toMatchObject({
			fromRdns: 'mail-db5eur01on2101.outbound.protection.example.com',
			fromIps: ['198.51.100.101'],
			by: 'mx.example.net',
			for: 'bob@example.net'
		});
		expect(parseReceived(OUTLOOK_MS)).toMatchObject({
			fromIps: ['fe80::1c2d:3e4f:5a6b:7c8d'],
			with: 'mapi',
			id: '15.20.7982.033'
		});
	});

	it('parses Postfix lines, ignoring keywords inside comments', () => {
		expect(parseReceived(POSTFIX)).toMatchObject({
			from: 'mail.example.net',
			fromIps: ['198.51.100.25'],
			by: 'mx.example.com',
			with: 'ESMTPS',
			id: '4F1A2B3C4D',
			for: 'bob@example.com',
			date: Date.UTC(2026, 8, 29, 8, 15, 30)
		});
		expect(parseReceived(POSTFIX_LOCAL)).toMatchObject({
			from: null,
			by: 'mail.example.net',
			with: null,
			id: '0ABC123'
		});
	});

	it('parses Exim lines with helo and IP literals', () => {
		expect(parseReceived(EXIM)).toMatchObject({
			from: '192.0.2.10',
			fromHelo: 'workstation.local',
			fromIps: ['192.0.2.10'],
			by: 'mail.example.org',
			with: 'esmtpsa',
			id: '1qABCD-000123-4X',
			for: 'dave@example.com',
			date: Date.UTC(2026, 8, 29, 8, 15, 30)
		});
		expect(parseReceived(EXIM_V6)).toMatchObject({
			from: 'IPv6:2001:db8::25',
			fromIps: ['2001:db8::25']
		});
	});

	it('keeps a line without a date', () => {
		expect(parseReceived('from a.example.net by b.example.com')).toMatchObject({
			from: 'a.example.net',
			by: 'b.example.com',
			date: null
		});
	});
});

describe('extractIps', () => {
	it('finds valid addresses only', () => {
		expect(
			extractIps('(host [198.51.100.7]) TLSv1.3 [IPv6:2001:db8::1] 10:15:30 999.1.1.1')
		).toEqual(['198.51.100.7', '2001:db8::1']);
	});
});

describe('buildChain', () => {
	/** @param {string} from @param {string} by @param {string} date */
	const line = (from, by, date) => `from ${from} by ${by}; ${date}`;

	it('orders hops from origin to recipient and computes delays', () => {
		// Message order: newest on top.
		const chain = buildChain([
			line('b.example.net', 'c.example.com', 'Tue, 29 Sep 2026 10:00:40 +0000'),
			line('a.example.net', 'b.example.net', 'Tue, 29 Sep 2026 12:00:10 +0200'),
			line('origin.example.net', 'a.example.net', 'Tue, 29 Sep 2026 10:00:00 +0000')
		]);
		expect(chain.hops.map((hop) => hop.from)).toEqual([
			'origin.example.net',
			'a.example.net',
			'b.example.net'
		]);
		expect(chain.hops.map((hop) => hop.delay)).toEqual([null, 10_000, 30_000]);
		expect(chain.total).toBe(40_000);
		expect(chain.hops.some((hop) => hop.slow || hop.negative)).toBe(false);
	});

	it('flags slow hops and negative delays (clock skew)', () => {
		const chain = buildChain([
			line('c.example.net', 'd.example.com', 'Tue, 29 Sep 2026 10:59:00 +0000'),
			line('b.example.net', 'c.example.net', 'Tue, 29 Sep 2026 11:00:00 +0000'),
			line('a.example.net', 'b.example.net', 'Tue, 29 Sep 2026 10:00:00 +0000')
		]);
		expect(chain.hops[1]).toMatchObject({ delay: 3_600_000, slow: true, negative: false });
		expect(chain.hops[2]).toMatchObject({ delay: -60_000, slow: false, negative: true });
		expect(3_600_000 > SLOW_HOP_MS).toBe(true);
		expect(chain.total).toBe(3_540_000);
	});

	it('skips hops without a date when computing delays', () => {
		const chain = buildChain([
			line('b.example.net', 'c.example.com', 'Tue, 29 Sep 2026 10:00:05 +0000'),
			'from a.example.net by b.example.net',
			line('o.example.net', 'a.example.net', 'Tue, 29 Sep 2026 10:00:00 +0000')
		]);
		expect(chain.hops.map((hop) => hop.delay)).toEqual([null, null, 5_000]);
		expect(chain.total).toBe(5_000);
	});

	it('has no total with fewer than two dated hops', () => {
		expect(
			buildChain([line('a.example.net', 'b.example.com', 'Tue, 29 Sep 2026 10:00:00 +0000')]).total
		).toBeNull();
		expect(buildChain([]).hops).toEqual([]);
	});
});

describe('durationParts', () => {
	it('picks a readable unit', () => {
		expect(durationParts(4_400)).toEqual({ value: 4, unit: 'second' });
		expect(durationParts(-90_000)).toEqual({ value: -1.5, unit: 'minute' });
		expect(durationParts(2 * 3_600_000)).toEqual({ value: 2, unit: 'hour' });
		expect(durationParts(3 * 86_400_000)).toEqual({ value: 3, unit: 'day' });
	});
});
