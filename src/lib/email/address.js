import { t } from '$lib/i18n/i18n.svelte.js';

/** Free webmail domains mapped to the provider name. */
export const FREE_PROVIDERS = {
	'gmail.com': 'Gmail',
	'googlemail.com': 'Gmail',
	'outlook.com': 'Outlook',
	'outlook.it': 'Outlook',
	'hotmail.com': 'Outlook (Hotmail)',
	'hotmail.it': 'Outlook (Hotmail)',
	'hotmail.co.uk': 'Outlook (Hotmail)',
	'live.com': 'Outlook (Live)',
	'live.it': 'Outlook (Live)',
	'msn.com': 'Outlook (MSN)',
	'yahoo.com': 'Yahoo Mail',
	'yahoo.it': 'Yahoo Mail',
	'yahoo.co.uk': 'Yahoo Mail',
	'ymail.com': 'Yahoo Mail',
	'aol.com': 'AOL Mail',
	'icloud.com': 'iCloud Mail',
	'me.com': 'iCloud Mail',
	'mac.com': 'iCloud Mail',
	'proton.me': 'Proton Mail',
	'protonmail.com': 'Proton Mail',
	'protonmail.ch': 'Proton Mail',
	'pm.me': 'Proton Mail',
	'tutanota.com': 'Tuta',
	'tuta.io': 'Tuta',
	'gmx.com': 'GMX',
	'gmx.net': 'GMX',
	'gmx.de': 'GMX',
	'web.de': 'WEB.DE',
	'mail.com': 'mail.com',
	'zoho.com': 'Zoho Mail',
	'yandex.com': 'Yandex Mail',
	'yandex.ru': 'Yandex Mail',
	'mail.ru': 'Mail.ru',
	'libero.it': 'Libero Mail',
	'virgilio.it': 'Virgilio Mail',
	'tiscali.it': 'Tiscali Mail',
	'alice.it': 'TIM Alice Mail',
	'tim.it': 'TIM Mail',
	'fastwebnet.it': 'Fastweb Mail',
	'email.it': 'Email.it',
	'inwind.it': 'Libero Mail (Inwind)',
	'orange.fr': 'Orange Mail',
	'free.fr': 'Free Mail',
	'laposte.net': 'La Poste Mail',
	'qq.com': 'QQ Mail',
	'163.com': 'NetEase Mail',
	'naver.com': 'Naver Mail'
};

/** Local parts that usually belong to a role or a team rather than a person. */
export const ROLE_LOCAL_PARTS = new Set([
	'abuse',
	'accounting',
	'admin',
	'administrator',
	'billing',
	'careers',
	'contact',
	'contacts',
	'customerservice',
	'dev',
	'help',
	'helpdesk',
	'hello',
	'hostmaster',
	'hr',
	'info',
	'jobs',
	'legal',
	'mail',
	'marketing',
	'media',
	'news',
	'newsletter',
	'no-reply',
	'noc',
	'noreply',
	'office',
	'postmaster',
	'press',
	'privacy',
	'root',
	'sales',
	'security',
	'service',
	'staff',
	'support',
	'team',
	'webmaster',
	// Common Italian role addresses.
	'amministrazione',
	'commerciale',
	'segreteria',
	'ufficio'
]);

const LOCAL_PART = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Validates and normalizes an email address (trimmed, lowercase, domain converted to ASCII).
 * Returns `{ error }` (a message in the current language) for invalid input.
 * @param {string} input
 * @returns {{ email: string, local: string, domain: string, error?: undefined } | { error: string }}
 */
export function parseEmail(input) {
	const value = input.trim().toLowerCase();
	if (!value) return { error: t('email.error.empty') };
	const at = value.lastIndexOf('@');
	if (at < 1 || at === value.length - 1) return { error: t('email.error.shape') };

	const local = value.slice(0, at);
	let domain = value.slice(at + 1).replace(/\.$/, '');
	if (local.length > 64) return { error: t('email.error.localTooLong') };
	if (!LOCAL_PART.test(local)) return { error: t('email.error.localInvalid') };

	// Internationalized domains are converted to punycode (xn--...) by the URL parser.
	try {
		domain = new URL(`http://${domain}`).hostname;
	} catch {
		return { error: t('email.error.domainInvalid') };
	}
	const labels = domain.split('.');
	const tld = labels.at(-1) ?? '';
	if (
		domain.length > 253 ||
		labels.length < 2 ||
		!labels.every((label) => DOMAIN_LABEL.test(label)) ||
		!/^([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(tld)
	)
		return { error: t('email.error.domainExample') };

	return { email: `${local}@${domain}`, local, domain };
}

/**
 * Describes the parts of an already-validated address.
 * @param {string} local
 * @param {string} domain
 */
export function analyzeAddress(local, domain) {
	const [base, ...tagParts] = local.split('+');
	return {
		local,
		domain,
		tag: tagParts.length ? tagParts.join('+') : null,
		freeProvider: FREE_PROVIDERS[domain] ?? null,
		role: ROLE_LOCAL_PARTS.has(base) || ROLE_LOCAL_PARTS.has(base.replace(/[._-]/g, ''))
	};
}
