import { t } from '$lib/i18n/i18n.svelte.js';
import { resolveDns } from '$lib/dns/doh.js';
import { lookupEmailAuth } from '$lib/dns/email-auth.js';

/**
 * Parses MX answers ("10 mx.example.com") and sorts them by priority.
 * A "null MX" (RFC 7505: priority 0 and host ".") has an empty host.
 * @param {{ data: string, ttl: number }[]} answers
 */
export function parseMx(answers) {
	return answers
		.map((answer) => {
			const [priority, host = ''] = answer.data.trim().split(/\s+/);
			return {
				priority: Number(priority),
				host: host.replace(/\.$/, '').toLowerCase(),
				ttl: answer.ttl
			};
		})
		.sort((a, b) => a.priority - b.priority || a.host.localeCompare(b.host));
}

/**
 * @typedef {{ level: 'good' | 'warn' | 'bad', text: string }} Verdict
 */

/**
 * Builds a verdict whose text is translated when read, so it follows the current language.
 * @param {Verdict['level']} level
 * @param {string} key message key under `email.verdict.`
 * @param {Record<string, unknown> | (() => Record<string, unknown>)} [params]
 * @returns {Verdict}
 */
function verdict(level, key, params) {
	return {
		level,
		get text() {
			return t(`email.verdict.${key}`, typeof params === 'function' ? params() : params);
		}
	};
}

/**
 * Verdict on whether the domain can receive mail.
 * @param {{ host: string }[]} mx
 * @param {boolean} hasAddress whether the domain has an A/AAAA record (implicit MX fallback)
 * @returns {Verdict}
 */
export function mxVerdict(mx, hasAddress) {
	if (mx.length === 1 && mx[0].host === '') return verdict('bad', 'mx.null');
	if (mx.length) return verdict('good', 'mx.good', { count: mx.length });
	if (hasAddress) return verdict('warn', 'mx.fallback');
	return verdict('bad', 'mx.none');
}

/**
 * @param {{ allPolicy: string | null, mechanisms?: { name: string, value: string | null }[] } | null} spf
 * @returns {Verdict}
 */
export function spfVerdict(spf) {
	if (!spf) return verdict('bad', 'spf.none');
	switch (spf.allPolicy) {
		case 'fail':
			return verdict('good', 'spf.fail');
		case 'softfail':
			return verdict('warn', 'spf.softfail');
		case 'neutral':
			return verdict('bad', 'spf.neutral');
		case 'pass':
			return verdict('bad', 'spf.pass');
		default: {
			const redirect = spf.mechanisms?.find((m) => m.name === 'redirect')?.value;
			if (redirect) return verdict('warn', 'spf.redirect', { target: redirect });
			return verdict('warn', 'spf.noAll');
		}
	}
}

/**
 * @param {{ policy: string | null, percent: number } | null} dmarc
 * @returns {Verdict}
 */
export function dmarcVerdict(dmarc) {
	if (!dmarc) return verdict('bad', 'dmarc.none');
	const { percent } = dmarc;
	const partial = () => ({
		partial: percent < 100 ? t('email.verdict.dmarc.partial', { percent }) : ''
	});
	switch (dmarc.policy) {
		case 'reject':
			return verdict('good', 'dmarc.reject', partial);
		case 'quarantine':
			return verdict('warn', 'dmarc.quarantine', partial);
		case 'none':
			return verdict('warn', 'dmarc.monitor');
		default:
			return verdict('bad', 'dmarc.invalid');
	}
}

/**
 * Looks up MX, address fallback, SPF and DMARC for a mail domain.
 * @param {string} domain
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function lookupMailServer(domain, options = {}) {
	const [mxAnswers, auth] = await Promise.all([
		resolveDns(domain, 'MX', options),
		lookupEmailAuth(domain, options)
	]);
	const mx = parseMx(mxAnswers);
	let hasAddress = false;
	if (!mx.length) {
		const [a, aaaa] = await Promise.all([
			resolveDns(domain, 'A', options),
			resolveDns(domain, 'AAAA', options)
		]);
		hasAddress = a.length > 0 || aaaa.length > 0;
	}
	return {
		mx,
		hasAddress,
		spf: auth.spf,
		dmarc: auth.dmarc,
		verdicts: {
			mx: mxVerdict(mx, hasAddress),
			spf: spfVerdict(auth.spf),
			dmarc: dmarcVerdict(auth.dmarc)
		}
	};
}
