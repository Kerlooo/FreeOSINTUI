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
			? `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)} (map ↗)`
			: null;
	return [
		{
			label: 'Country',
			value:
				geo.country &&
				[geo.flag, geo.country, geo.countryCode && `(${geo.countryCode})`].filter(Boolean).join(' ')
		},
		{ label: 'Region', value: geo.region },
		{ label: 'City', value: [geo.city, geo.postal].filter(Boolean).join(' ') },
		{ label: 'Coordinates', value: coordinates, href: geo.mapUrl ?? undefined },
		{
			label: 'Timezone',
			value:
				geo.timezone &&
				[geo.timezone, geo.utcOffset && `UTC${geo.utcOffset}`].filter(Boolean).join(' ')
		},
		{ label: 'ASN', value: geo.asn, href: geo.asn ? `https://bgp.he.net/${geo.asn}` : undefined },
		{ label: 'Organization', value: geo.org },
		{ label: 'ISP', value: geo.isp !== geo.org ? geo.isp : null },
		{
			label: 'Domain',
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
		{ label: 'Network name', value: rdap.name },
		{ label: 'Handle', value: rdap.handle },
		{ label: 'Range', value: rdap.range },
		{ label: 'CIDR', value: rdap.cidrs.join(', ') },
		{ label: 'Type', value: rdap.type },
		{ label: 'Country', value: rdap.country },
		{ label: 'Registered', value: rdap.registered?.slice(0, 10) },
		{ label: 'Last changed', value: rdap.updated?.slice(0, 10) }
	];

	// KeyValueTable keys rows by label, so repeated roles get a number.
	/** @type {Record<string, number>} */
	const seen = {};
	// The abuse contact is the most useful one, so it comes first.
	const contacts = [...rdap.contacts].sort(
		(a, b) => Number(b.roles.includes('abuse')) - Number(a.roles.includes('abuse'))
	);
	for (const contact of contacts) {
		const role = contact.roles.join(', ') || 'contact';
		seen[role] = (seen[role] ?? 0) + 1;
		const label = `Contact: ${role}${seen[role] > 1 ? ` #${seen[role]}` : ''}`;
		const value = [contact.name, contact.email && `<${contact.email}>`].filter(Boolean).join(' ');
		rows.push({
			label,
			value,
			href: contact.email ? `mailto:${contact.email}` : undefined
		});
	}
	return rows;
}
