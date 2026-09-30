/**
 * Label/value rows for the URL breakdown and the remote result tables.
 */

import { t } from '$lib/i18n/i18n.svelte.js';

/**
 * @param {any} a successful result of analyzeUrl
 * @returns {{ label: string, value: string | null | undefined }[]}
 */
export function overviewRows(a) {
	const host = a.host;
	const isName = host.kind === 'name';
	return [
		{ label: t('url.row.scheme'), value: a.scheme },
		{ label: t('url.row.user'), value: a.username },
		{ label: t('url.row.password'), value: a.hasPassword ? t('url.row.passwordPresent') : null },
		{ label: t('url.row.host'), value: isName ? host.unicode : host.ip },
		{
			label: t('url.row.rawHost'),
			value: a.rawHost && a.rawHost.toLowerCase() !== a.hostname ? a.rawHost : null
		},
		{ label: t('url.row.hostAscii'), value: isName && host.idn ? host.ascii : null },
		{
			label: t('url.row.registrable'),
			value: isName
				? host.registrableUnicode === host.registrable
					? host.registrable
					: `${host.registrableUnicode} (${host.registrable})`
				: null
		},
		{ label: t('url.row.subdomain'), value: isName ? host.subdomain : null },
		{ label: t('url.row.suffix'), value: isName ? host.suffix : null },
		{
			label: t('url.row.scripts'),
			value: isName && host.nonLatin.length ? host.scripts.join(', ') : null
		},
		{ label: t('url.row.port'), value: a.port },
		{ label: t('url.row.path'), value: a.path !== '/' ? a.path : null },
		{ label: t('url.row.fragment'), value: a.fragment }
	];
}

/**
 * @param {any} data answer of /api/url/urlhaus when listed
 * @returns {{ label: string, value: string | number | null | undefined, href?: string }[]}
 */
export function urlhausRows(data) {
	const blacklists = Object.entries(data.blacklists ?? {})
		.map(([name, value]) => `${name}: ${value}`)
		.join(', ');
	return [
		{ label: t('url.urlhaus.row.status'), value: data.url_status },
		{ label: t('url.urlhaus.row.threat'), value: data.threat },
		{ label: t('url.urlhaus.row.tags'), value: (data.tags ?? []).join(', ') },
		{ label: t('url.urlhaus.row.added'), value: data.date_added },
		{ label: t('url.urlhaus.row.lastOnline'), value: data.last_online },
		{ label: t('url.urlhaus.row.payloads'), value: data.payload_count || null },
		{ label: t('url.urlhaus.row.blacklists'), value: blacklists },
		{
			label: t('url.urlhaus.row.reference'),
			value: data.reference,
			href: /^https:\/\/urlhaus\.abuse\.ch\//.test(data.reference ?? '')
				? data.reference
				: undefined
		}
	];
}
