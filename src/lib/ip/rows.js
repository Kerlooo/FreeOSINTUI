import { t } from '$lib/i18n/i18n.svelte.js';

/**
 * Builds the KeyValueTable rows of the IP Analyzer sections.
 * @typedef {{ label: string, value: string | number | null | undefined, href?: string }} Row
 */

/**
 * @param {ReturnType<typeof import('./lookups.js').parseIpWhois>} geo
 * @returns {Row[]}
 */
export function geoRows(geo) {
	const coordinates =
		geo.latitude !== null && geo.longitude !== null
			? `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)} (${t('ip.row.map')})`
			: null;
	return [
		{
			label: t('ip.row.country'),
			value:
				geo.country &&
				[geo.flag, geo.country, geo.countryCode && `(${geo.countryCode})`].filter(Boolean).join(' ')
		},
		{ label: t('ip.row.region'), value: geo.region },
		{ label: t('ip.row.city'), value: [geo.city, geo.postal].filter(Boolean).join(' ') },
		{ label: t('ip.row.coordinates'), value: coordinates, href: geo.mapUrl ?? undefined },
		{
			label: t('ip.row.timezone'),
			value:
				geo.timezone &&
				[geo.timezone, geo.utcOffset && `UTC${geo.utcOffset}`].filter(Boolean).join(' ')
		},
		{
			label: t('ip.row.asn'),
			value: geo.asn,
			href: geo.asn ? `https://bgp.he.net/${geo.asn}` : undefined
		},
		{ label: t('ip.row.organization'), value: geo.org },
		{ label: t('ip.row.isp'), value: geo.isp !== geo.org ? geo.isp : null },
		{
			label: t('ip.row.domain'),
			value: geo.domain,
			href: geo.domain ? `https://${geo.domain}` : undefined
		}
	];
}

/**
 * @param {ReturnType<typeof import('$lib/rdap.js').summarizeRdap>} rdap
 * @returns {Row[]}
 */
export function rdapRows(rdap) {
	/** @type {Row[]} */
	const rows = [
		{ label: t('ip.row.networkName'), value: rdap.name },
		{ label: t('ip.row.handle'), value: rdap.handle },
		{ label: t('ip.row.range'), value: rdap.range },
		{ label: t('ip.row.cidr'), value: rdap.cidrs.join(', ') },
		{ label: t('ip.row.type'), value: rdap.type },
		{ label: t('ip.row.country'), value: rdap.country },
		{ label: t('ip.row.registered'), value: rdap.registered?.slice(0, 10) },
		{ label: t('ip.row.updated'), value: rdap.updated?.slice(0, 10) }
	];

	// KeyValueTable keys rows by label, so repeated roles get a number.
	/** @type {Record<string, number>} */
	const seen = {};
	// The abuse contact is the most useful one, so it comes first.
	const contacts = [...rdap.contacts].sort(
		(a, b) => Number(b.roles.includes('abuse')) - Number(a.roles.includes('abuse'))
	);
	for (const contact of contacts) {
		const role = contact.roles.join(', ') || t('ip.row.contactRole');
		seen[role] = (seen[role] ?? 0) + 1;
		const label = t('ip.row.contact', {
			role: `${role}${seen[role] > 1 ? ` #${seen[role]}` : ''}`
		});
		const value = [contact.name, contact.email && `<${contact.email}>`].filter(Boolean).join(' ');
		rows.push({
			label,
			value,
			href: contact.email ? `mailto:${contact.email}` : undefined
		});
	}
	return rows;
}
