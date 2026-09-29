import { describe, expect, it } from 'vitest';
import { parseDmarc, parseSpf } from '$lib/dns/email-auth.js';
import { emailSecurityFindings } from './email.js';

const levels = (findings) => findings.map((f) => f.level);

describe('emailSecurityFindings', () => {
	it('flags missing SPF and DMARC', () => {
		const findings = emailSecurityFindings({ spf: null, dmarc: null });
		expect(levels(findings)).toEqual(['bad', 'bad']);
		expect(findings[1].text).toMatch(/No DMARC/);
	});

	it('approves a strict setup', () => {
		const findings = emailSecurityFindings({
			spf: parseSpf('v=spf1 include:_spf.google.com -all'),
			dmarc: parseDmarc('v=DMARC1; p=reject; rua=mailto:d@example.com')
		});
		expect(levels(findings)).toEqual(['good', 'good']);
	});

	it('warns about soft policies, partial pct and missing reports', () => {
		const findings = emailSecurityFindings({
			spf: parseSpf('v=spf1 ~all'),
			dmarc: parseDmarc('v=DMARC1; p=quarantine; pct=50')
		});
		expect(levels(findings)).toEqual(['warn', 'good', 'warn', 'info']);
	});

	it('treats +all and p=none as weak', () => {
		const findings = emailSecurityFindings({
			spf: parseSpf('v=spf1 +all'),
			dmarc: parseDmarc('v=DMARC1; p=none; rua=mailto:d@example.com')
		});
		expect(levels(findings)).toEqual(['bad', 'warn']);
	});

	it('recognises redirect= and missing all', () => {
		expect(
			emailSecurityFindings({ spf: parseSpf('v=spf1 redirect=_spf.example.com'), dmarc: null })[0]
				.level
		).toBe('info');
		expect(emailSecurityFindings({ spf: parseSpf('v=spf1 mx'), dmarc: null })[0].level).toBe(
			'warn'
		);
	});
});
