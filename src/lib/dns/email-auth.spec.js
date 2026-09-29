import { describe, expect, it } from 'vitest';
import { parseDmarc, parseSpf } from './email-auth.js';

describe('parseSpf', () => {
	it('reads mechanisms, includes and the all policy', () => {
		const spf = parseSpf('v=spf1 ip4:192.0.2.0/24 include:_spf.google.com ~all');
		expect(spf.includes).toEqual(['_spf.google.com']);
		expect(spf.allPolicy).toBe('softfail');
		expect(spf.mechanisms[0]).toEqual({ qualifier: 'pass', name: 'ip4', value: '192.0.2.0/24' });
	});

	it('has no all policy when missing', () => {
		expect(parseSpf('v=spf1 mx').allPolicy).toBeNull();
	});
});

describe('parseDmarc', () => {
	it('reads policy, percentage and report addresses', () => {
		const dmarc = parseDmarc(
			'v=DMARC1; p=reject; sp=none; pct=50; rua=mailto:a@x.com,mailto:b@x.com'
		);
		expect(dmarc).toMatchObject({
			policy: 'reject',
			subdomainPolicy: 'none',
			percent: 50,
			reports: ['mailto:a@x.com', 'mailto:b@x.com']
		});
	});
});
