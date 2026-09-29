import { t } from '$lib/i18n/i18n.svelte.js';

/**
 * @typedef {{ level: 'good' | 'warn' | 'bad' | 'info', key: string, params?: Record<string, unknown>, readonly text: string }} Finding
 */

/**
 * Builds a finding whose text follows the current language.
 * @param {Finding['level']} level
 * @param {string} key message key in the `dns` namespace
 * @param {Record<string, unknown>} [params]
 * @returns {Finding}
 */
function finding(level, key, params) {
	return {
		level,
		key,
		params,
		get text() {
			return t(`dns.${key}`, params);
		}
	};
}

/**
 * Turns the SPF/DMARC records of a domain into plain-language findings.
 * @param {{ spf: ReturnType<typeof import('$lib/dns/email-auth.js').parseSpf> | null, dmarc: ReturnType<typeof import('$lib/dns/email-auth.js').parseDmarc> | null }} auth
 * @returns {Finding[]}
 */
export function emailSecurityFindings({ spf, dmarc }) {
	/** @type {Finding[]} */
	const findings = [];

	if (!spf) {
		findings.push(finding('bad', 'spf.missing'));
	} else if (spf.allPolicy === 'fail') {
		findings.push(finding('good', 'spf.fail'));
	} else if (spf.allPolicy === 'softfail') {
		findings.push(finding('warn', 'spf.softfail'));
	} else if (spf.allPolicy === 'neutral' || spf.allPolicy === 'pass') {
		findings.push(finding('bad', 'spf.open', { all: spf.allPolicy === 'pass' ? '+all' : '?all' }));
	} else if (spf.mechanisms.some((m) => m.name === 'redirect')) {
		findings.push(finding('info', 'spf.redirect'));
	} else {
		findings.push(finding('warn', 'spf.noAll'));
	}

	if (!dmarc) {
		findings.push(finding('bad', 'dmarc.missing'));
	} else {
		const policy = dmarc.policy?.toLowerCase();
		if (policy === 'reject') {
			findings.push(finding('good', 'dmarc.reject'));
		} else if (policy === 'quarantine') {
			findings.push(finding('good', 'dmarc.quarantine'));
		} else if (policy === 'none') {
			findings.push(finding('warn', 'dmarc.none'));
		} else {
			findings.push(finding('bad', 'dmarc.invalid'));
		}
		if ((policy === 'reject' || policy === 'quarantine') && dmarc.percent < 100) {
			findings.push(finding('warn', 'dmarc.partial', { percent: dmarc.percent }));
		}
		if (!dmarc.reports.length) {
			findings.push(finding('info', 'dmarc.noReports'));
		}
	}

	return findings;
}
