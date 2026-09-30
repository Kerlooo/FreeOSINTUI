import { describe, expect, it } from 'vitest';
import {
	parseArcTags,
	parseAuthenticationResults,
	parseDkimSignature,
	parseReceivedSpf,
	resultDomain
} from './auth.js';

describe('parseAuthenticationResults', () => {
	it('parses a Gmail-style value', () => {
		const parsed = parseAuthenticationResults(
			'mx.example.com; dkim=pass header.i=@example.net header.s=sel1 header.b="Ab1/Cd2"; spf=pass (example.com: domain of bounce@example.net designates 198.51.100.25 as permitted sender) smtp.mailfrom=bounce@example.net; dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=example.net; arc=none'
		);
		expect(parsed.authservId).toBe('mx.example.com');
		expect(parsed.instance).toBeNull();
		expect(parsed.results.map((r) => [r.method, r.result])).toEqual([
			['dkim', 'pass'],
			['spf', 'pass'],
			['dmarc', 'pass'],
			['arc', 'none']
		]);
		expect(parsed.results[0].props).toEqual({
			'header.i': '@example.net',
			'header.s': 'sel1',
			'header.b': 'Ab1/Cd2'
		});
		expect(parsed.results[1].comment).toContain('designates 198.51.100.25');
		expect(parsed.results[2].comment).toBe('p=REJECT sp=REJECT dis=NONE');
		expect(parsed.results.map(resultDomain)).toEqual([
			'example.net',
			'example.net',
			'example.net',
			''
		]);
	});

	it('parses an Outlook-style value without authserv-id', () => {
		const parsed = parseAuthenticationResults(
			'spf=fail (sender IP is 192.0.2.99) smtp.mailfrom=example.org; dkim=none (message not signed) header.d=none;dmarc=fail action=oreject header.from=example.org;compauth=fail reason=000'
		);
		expect(parsed.authservId).toBe('');
		expect(parsed.results.map((r) => [r.method, r.result])).toEqual([
			['spf', 'fail'],
			['dkim', 'none'],
			['dmarc', 'fail'],
			['compauth', 'fail']
		]);
		expect(parsed.results[3].props.reason).toBe('000');
	});

	it('reads the ARC instance', () => {
		const parsed = parseAuthenticationResults('i=2; mx.example.com; arc=pass (i=1)');
		expect(parsed).toMatchObject({ instance: 2, authservId: 'mx.example.com' });
		expect(parsed.results[0]).toMatchObject({ method: 'arc', result: 'pass', comment: 'i=1' });
	});
});

describe('parseReceivedSpf', () => {
	it('reads result, comment and key-value pairs', () => {
		expect(
			parseReceivedSpf(
				'softfail (example.com: domain of transitioning x@example.net does not designate 192.0.2.1 as permitted sender) client-ip=192.0.2.1; envelope-from="x@example.net"; helo=mail.example.net;'
			)
		).toEqual({
			result: 'softfail',
			comment:
				'example.com: domain of transitioning x@example.net does not designate 192.0.2.1 as permitted sender',
			props: {
				'client-ip': '192.0.2.1',
				'envelope-from': 'x@example.net',
				helo: 'mail.example.net'
			}
		});
	});
});

describe('parseDkimSignature', () => {
	it('reads the tags and the signed header list', () => {
		expect(
			parseDkimSignature(
				'v=1; a=rsa-sha256; c=relaxed/relaxed; d=Example.net; s=sel1; t=1790668530; h=From:To:Subject: Date :Message-ID; i=@example.net; bh=abc; b=AbC dEf gHi'
			)
		).toEqual({
			domain: 'example.net',
			selector: 'sel1',
			algorithm: 'rsa-sha256',
			canonicalization: 'relaxed/relaxed',
			headers: ['From', 'To', 'Subject', 'Date', 'Message-ID'],
			identity: '@example.net',
			timestamp: 1790668530000,
			expiration: null
		});
	});
});

describe('parseArcTags', () => {
	it('reads ARC-Seal tags', () => {
		expect(
			parseArcTags('i=2; a=rsa-sha256; t=1; cv=Pass; d=example.com; s=arc-2026; b=xyz')
		).toEqual({
			instance: 2,
			domain: 'example.com',
			selector: 'arc-2026',
			algorithm: 'rsa-sha256',
			chainValidation: 'pass'
		});
	});
});
