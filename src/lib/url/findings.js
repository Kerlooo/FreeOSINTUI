/**
 * Turns an offline URL analysis into a list of findings with a severity.
 * Wording stays neutral: these are signs worth checking, not verdicts.
 */

import { t } from '$lib/i18n/i18n.svelte.js';

/** Severity order, most important first. */
export const SEVERITIES = /** @type {const} */ (['warning', 'notice', 'info']);

/** A subdomain chain at least this deep is reported. */
const DEEP_SUBDOMAIN = 4;
/** A hostname at least this long is reported. */
const LONG_HOST = 60;

/**
 * @typedef {{ id: string, severity: typeof SEVERITIES[number], message: string }} Finding
 */

/**
 * @param {any} a result of buildAnalysis in analyze.js (without findings)
 * @returns {Finding[]}
 */
export function buildFindings(a) {
	/** @type {Finding[]} */
	const list = [];
	/**
	 * @param {string} id
	 * @param {Finding['severity']} severity
	 * @param {Record<string, string | number>} [params]
	 */
	const add = (id, severity, params) =>
		list.push({ id, severity, message: t(`url.finding.${id}`, params) });

	const host = a.host;

	if (a.username || a.hasPassword) {
		add('userinfo', 'warning', { user: a.username || '…', host: a.hostname });
	}

	if (host.kind === 'ipv4' && host.obfuscated) {
		add('ipObfuscated', 'warning', { raw: a.rawHost, ip: host.ip });
	}
	if (host.kind !== 'name') {
		add('ipLiteral', 'notice', { ip: host.ip });
		if (a.special) add('ipSpecial', 'notice', { ip: host.ip, label: a.special.label });
	}

	if (host.kind === 'name') {
		if (host.lookalike) {
			add('lookalike', 'warning', { host: host.unicode, skeleton: host.lookalike });
		}
		if (host.mixedLabels.length) {
			add('mixedScript', host.riskyMix ? 'warning' : 'notice', {
				labels: host.mixedLabels.join(', ')
			});
		}
		if (host.idn) add('idn', 'notice', { ascii: host.ascii, unicode: host.unicode });
		if (host.brands.length) {
			add('brand', 'notice', { brands: host.brands.join(', '), domain: host.registrable });
		}
		if (host.subdomainDepth >= DEEP_SUBDOMAIN) {
			add('deepSubdomain', 'notice', { count: host.subdomainDepth });
		}
		if (host.ascii.length >= LONG_HOST) add('longHost', 'notice', { length: host.ascii.length });
		if (host.hosting) add('hosting', 'info', { suffix: host.suffix });
		if (host.dotless) add('dotless', 'notice', { host: host.ascii });
	}

	const redirects = a.embedded.filter(
		(/** @type {any} */ e) => e.redirectParam || e.source === 'wrapper'
	);
	if (redirects.length) add('embedded', 'notice', { count: redirects.length });
	else if (a.embedded.length) add('embeddedOther', 'info', { count: a.embedded.length });
	if (a.chain.length > 1) add('nested', 'notice', { count: a.chain.length });
	if (a.redirector) add('redirector', 'info', { name: t(`url.redirector.${a.redirector}`) });
	if (a.shortener) add('shortener', 'info', { host: a.hostname });

	if (a.scheme === 'http') add('http', 'info');
	if (a.port) add('port', 'info', { port: a.port });
	if (a.cleaned.removed.length) add('tracking', 'info', { count: a.cleaned.removed.length });
	if (a.refanged) add('refanged', 'info');
	if (a.schemeAdded) add('schemeAdded', 'info');

	return list.sort((x, y) => SEVERITIES.indexOf(x.severity) - SEVERITIES.indexOf(y.severity));
}
