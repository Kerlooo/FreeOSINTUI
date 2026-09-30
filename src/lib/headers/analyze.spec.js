import { describe, expect, it } from 'vitest';
import { analyzeHeaders, isInternalIp } from './analyze.js';
import { SAMPLE_HEADERS } from './sample.js';

/** A clean, well-authenticated message (fake data). */
const CLEAN = `Received: from mx.example.com by inbox.example.com with LMTP; Tue, 29 Sep 2026 10:00:03 +0000
Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=bounce@news.example.net; dkim=pass header.d=example.net header.s=s1; dmarc=pass header.from=example.net
Received: from out.example.net (out.example.net [198.51.100.10]) by mx.example.com with ESMTPS id 1; Tue, 29 Sep 2026 10:00:02 +0000
Received: from [10.0.0.5] by out.example.net with ESMTPSA id 2; Tue, 29 Sep 2026 10:00:00 +0000
DKIM-Signature: v=1; a=rsa-sha256; d=example.net; s=s1; h=from:to:subject; bh=x; b=y
Return-Path: <bounce@news.example.net>
From: Example News <news@example.net>
To: alice@example.com
Subject: Weekly update
Date: Tue, 29 Sep 2026 09:59:58 +0000
Message-ID: <abc123@mail.example.net>
X-Mailer: Example Mailer 2.0
`;

/**
 * Replaces or appends header lines in the clean message.
 * @param {Record<string, string | null>} changes header name -> new value (null removes it)
 */
function variant(changes) {
	let lines = CLEAN.trim().split('\n');
	for (const [name, value] of Object.entries(changes)) {
		const prefix = `${name.toLowerCase()}:`;
		const index = lines.findIndex((line) => line.toLowerCase().startsWith(prefix));
		if (value === null) lines = lines.filter((line) => !line.toLowerCase().startsWith(prefix));
		else if (index >= 0) lines[index] = `${name}: ${value}`;
		else lines.push(`${name}: ${value}`);
	}
	return lines.join('\n');
}

/** @param {string} text */
function findingIds(text) {
	return analyzeHeaders(text)?.findings.map((finding) => finding.id) ?? [];
}

/** @param {string} text @param {string} id */
function finding(text, id) {
	return analyzeHeaders(text)?.findings.find((f) => f.id === id);
}

describe('analyzeHeaders', () => {
	it('returns null without headers', () => {
		expect(analyzeHeaders('')).toBeNull();
		expect(analyzeHeaders('just some text')).toBeNull();
	});

	it('reports only the positive note for a clean message', () => {
		expect(findingIds(CLEAN)).toEqual(['authPass']);
	});

	it('builds the summary, chain, origin and verdict', () => {
		const result = analyzeHeaders(CLEAN);
		expect(result?.summary.map((field) => field.name)).toEqual([
			'From',
			'Return-Path',
			'To',
			'Subject',
			'Date',
			'Message-ID',
			'X-Mailer'
		]);
		expect(result?.chain.hops.map((hop) => hop.from)).toEqual([
			'10.0.0.5',
			'out.example.net',
			'mx.example.com'
		]);
		expect(result?.chain.total).toBe(3_000);
		// The private first hop is skipped.
		expect(result?.origin).toEqual({ ip: '198.51.100.10', hopIndex: 1, host: 'out.example.net' });
		expect(result?.auth.verdict).toMatchObject({ spf: 'pass', dkim: 'pass', dmarc: 'pass' });
	});

	it('decodes the subject', () => {
		const result = analyzeHeaders(variant({ Subject: '=?utf-8?B?w4ljaMOpYW5jZQ==?=' }));
		expect(result?.summary.find((field) => field.name === 'Subject')?.value).toBe('Échéance');
	});

	it('flags a Return-Path in another domain', () => {
		expect(finding(variant({ 'Return-Path': '<b@example.org>' }), 'returnPathMismatch')).toEqual({
			id: 'returnPathMismatch',
			severity: 'medium',
			params: { from: 'example.net', returnPath: 'example.org' }
		});
	});

	it('flags a Reply-To that differs from From', () => {
		expect(finding(variant({ 'Reply-To': 'x@example.org' }), 'replyToDiffers')?.severity).toBe(
			'medium'
		);
		expect(finding(variant({ 'Reply-To': 'help@example.net' }), 'replyToDiffers')?.severity).toBe(
			'low'
		);
		expect(findingIds(variant({ 'Reply-To': 'NEWS@example.net' }))).not.toContain('replyToDiffers');
	});

	it('flags a display name with another address', () => {
		expect(
			finding(variant({ From: '"billing@example.com" <news@example.net>' }), 'displayNameEmail')
		).toEqual({
			id: 'displayNameEmail',
			severity: 'high',
			params: { name: 'billing@example.com', address: 'news@example.net' }
		});
		expect(findingIds(variant({ From: '"news@example.net" <news@example.net>' }))).not.toContain(
			'displayNameEmail'
		);
	});

	it('flags missing and multiple From addresses', () => {
		expect(findingIds(variant({ From: null }))).toContain('missingFrom');
		expect(findingIds(variant({ From: 'a@example.net, b@example.net' }))).toContain('multipleFrom');
	});

	it('flags authentication failures', () => {
		const withAuth = (/** @type {string} */ results) =>
			variant({ 'Authentication-Results': `mx.example.com; ${results}` });
		expect(
			findingIds(
				withAuth(
					'spf=fail smtp.mailfrom=example.net; dkim=fail header.d=example.net; dmarc=fail header.from=example.net'
				)
			)
		).toEqual(expect.arrayContaining(['dmarcFail', 'spfFail', 'dkimFail']));
		expect(
			finding(withAuth('spf=softfail; dkim=pass header.d=example.net; dmarc=pass'), 'spfFail')
				?.severity
		).toBe('medium');
		expect(findingIds(withAuth('spf=none; dkim=none; dmarc=none'))).toEqual(
			expect.arrayContaining(['spfNone', 'dkimNone', 'dmarcNone'])
		);
		expect(
			finding(withAuth('spf=permerror; dkim=pass header.d=example.net; dmarc=pass'), 'authError')
				?.params
		).toEqual({
			method: 'SPF',
			result: 'permerror'
		});
	});

	it('prefers a passing DKIM result over a failing one', () => {
		const text = variant({
			'Authentication-Results':
				'mx.example.com; spf=pass; dkim=fail header.d=other.example.org; dkim=pass header.d=example.net; dmarc=pass'
		});
		expect(findingIds(text)).toEqual(['authPass']);
	});

	it('notes the absence of authentication headers', () => {
		const ids = findingIds(variant({ 'Authentication-Results': null, 'DKIM-Signature': null }));
		expect(ids).toEqual(expect.arrayContaining(['noAuthResults', 'dkimNone']));
	});

	it('falls back to Received-SPF', () => {
		const text = variant({
			'Authentication-Results': null,
			'Received-SPF': 'fail (no) client-ip=192.0.2.9;'
		});
		expect(finding(text, 'spfFail')?.severity).toBe('high');
		expect(analyzeHeaders(text)?.pivots.ips.map((ip) => ip.address)).toContain('192.0.2.9');
	});

	it('flags DKIM signatures not aligned with From', () => {
		const text = variant({
			'Authentication-Results':
				'mx.example.com; spf=pass; dkim=pass header.d=esp.example.org; dmarc=pass',
			'DKIM-Signature': 'v=1; d=esp.example.org; s=s1'
		});
		expect(finding(text, 'dkimNotAligned')?.params).toEqual({
			domains: 'esp.example.org',
			from: 'example.net'
		});
		// Without Authentication-Results, the DKIM-Signature d= is used.
		const unsigned = variant({
			'Authentication-Results': null,
			'DKIM-Signature': 'v=1; d=example.org; s=s1'
		});
		expect(findingIds(unsigned)).toContain('dkimNotAligned');
	});

	it('flags an unrelated Message-ID domain', () => {
		expect(
			finding(variant({ 'Message-ID': '<1@smtp.example.org>' }), 'messageIdUnrelated')?.params
		).toEqual({
			domain: 'smtp.example.org',
			from: 'example.net'
		});
		expect(findingIds(variant({ 'Message-ID': '<1@localhost>' }))).not.toContain(
			'messageIdUnrelated'
		);
	});

	it('flags a Date far from the first Received stamp', () => {
		const hours = finding(variant({ Date: 'Tue, 29 Sep 2026 07:00:00 +0000' }), 'dateDrift');
		expect(hours).toEqual({
			id: 'dateDrift',
			severity: 'low',
			params: { durationMs: 3 * 3_600_000 }
		});
		expect(
			finding(variant({ Date: 'Sat, 26 Sep 2026 10:00:00 +0000' }), 'dateDrift')?.severity
		).toBe('medium');
		expect(
			finding(variant({ Date: 'Tue, 29 Sep 2026 12:00:00 +0000' }), 'dateDrift')?.params.durationMs
		).toBeLessThan(0);
	});

	it('flags clock skew, slow hops and missing Received headers', () => {
		const skew = CLEAN.replace('10:00:03 +0000', '09:59:00 +0000');
		expect(finding(skew, 'clockSkew')?.params).toEqual({ count: 1 });
		const slow = CLEAN.replace('10:00:03 +0000', '10:30:00 +0000');
		expect(findingIds(slow)).toContain('slowHop');
		expect(findingIds(CLEAN.replace(/^Received:.*\n/gm, ''))).toContain('noReceived');
	});

	it('flags a mass-mailing X-Mailer', () => {
		expect(finding(variant({ 'X-Mailer': 'PHPMailer 6.9.1' }), 'suspiciousMailer')?.params).toEqual(
			{
				mailer: 'PHPMailer 6.9.1'
			}
		);
		expect(findingIds(variant({ 'X-Mailer': 'Microsoft Outlook 16.0' }))).not.toContain(
			'suspiciousMailer'
		);
	});

	it('sorts findings by severity', () => {
		const severities = analyzeHeaders(SAMPLE_HEADERS)?.findings.map((f) => f.severity) ?? [];
		const order = ['high', 'medium', 'low', 'info'];
		expect([...severities].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(severities);
	});

	it('lists source IP headers and other X- headers', () => {
		const result = analyzeHeaders(
			variant({ 'X-Originating-IP': '[192.0.2.33]', 'X-Spam-Score': '5.1' })
		);
		expect(result?.sourceIps).toEqual([
			{ name: 'X-Originating-IP', value: '[192.0.2.33]', ip: '192.0.2.33', internal: false }
		]);
		expect(result?.otherHeaders.map((header) => header.name)).toEqual(['X-Spam-Score']);
	});

	it('collects pivots', () => {
		const result = analyzeHeaders(SAMPLE_HEADERS);
		expect(result?.pivots.ips).toEqual([
			{ address: '192.0.2.45', internal: false },
			{ address: '192.168.1.23', internal: true },
			{ address: '198.51.100.77', internal: false }
		]);
		expect(result?.pivots.domains).toEqual(
			expect.arrayContaining(['example.net', 'example.org', 'mailer.example.org'])
		);
		expect(result?.pivots.emails).toEqual(
			expect.arrayContaining([
				'no-reply@example.net',
				'recovery@example.org',
				'support@example.com'
			])
		);
	});
});

describe('sample headers', () => {
	it('only use reserved names and documentation or private addresses', () => {
		const result = analyzeHeaders(SAMPLE_HEADERS);
		for (const domain of result?.pivots.domains ?? [])
			expect(domain).toMatch(/(^|\.)example\.(com|net|org)$/);
		for (const { address } of result?.pivots.ips ?? []) {
			expect(address).toMatch(/^(192\.0\.2\.|198\.51\.100\.|192\.168\.|2001:db8:)/);
		}
		expect(result?.origin?.ip).toBe('192.0.2.45');
		expect(result?.findings.length).toBeGreaterThan(5);
	});
});

describe('isInternalIp', () => {
	it('recognizes local ranges but not documentation ones', () => {
		for (const ip of [
			'10.1.2.3',
			'172.16.0.1',
			'192.168.1.1',
			'127.0.0.1',
			'100.64.0.1',
			'::1',
			'fd00::1',
			'fe80::1'
		]) {
			expect(isInternalIp(ip), ip).toBe(true);
		}
		for (const ip of ['192.0.2.1', '198.51.100.1', '8.8.8.8', '2001:db8::1', 'nope']) {
			expect(isInternalIp(ip), ip).toBe(false);
		}
	});
});
