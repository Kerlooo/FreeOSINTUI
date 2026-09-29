import { fetchJson } from '$lib/net.js';

/** Reads a field from a jCard (`vcardArray`), e.g. 'fn' or 'email'. */
function vcardField(entity, field) {
	const entry = entity.vcardArray?.[1]?.find((item) => item[0] === field);
	if (!entry) return null;
	return Array.isArray(entry[3]) ? entry[3].filter(Boolean).join(', ') : entry[3] || null;
}

/** Flattens nested entities (e.g. a registrar's abuse contact) into one list. */
function flattenEntities(entities = []) {
	return entities.flatMap((entity) => [entity, ...flattenEntities(entity.entities)]);
}

/**
 * Turns a raw RDAP domain or IP network object into the fields shown in the UI.
 * @param {any} data
 */
export function summarizeRdap(data) {
	const events = Object.fromEntries(
		(data.events ?? []).map((event) => [event.eventAction, event.eventDate])
	);
	const contacts = flattenEntities(data.entities)
		.map((entity) => ({
			roles: entity.roles ?? [],
			name: vcardField(entity, 'fn'),
			email: vcardField(entity, 'email'),
			handle: entity.handle ?? null
		}))
		.filter((contact) => contact.name || contact.email);
	const cidrs = (data.cidr0_cidrs ?? []).map((c) => `${c.v4prefix ?? c.v6prefix}/${c.length}`);

	return {
		handle: data.handle ?? null,
		name: data.ldhName?.toLowerCase() ?? data.name ?? null,
		status: data.status ?? [],
		registered: events.registration ?? null,
		expires: events.expiration ?? null,
		updated: events['last changed'] ?? null,
		nameservers: (data.nameservers ?? []).map((ns) => ns.ldhName.toLowerCase()),
		dnssec: data.secureDNS?.delegationSigned ?? null,
		registrar: contacts.find((c) => c.roles.includes('registrar'))?.name ?? null,
		contacts,
		// IP networks only.
		range: data.startAddress ? `${data.startAddress} – ${data.endAddress}` : null,
		cidrs,
		country: data.country ?? null,
		type: data.type ?? null
	};
}

/**
 * Looks up a domain or an IP address via the rdap.org bootstrap service (CORS-enabled).
 * Returns `null` when the registry has no record.
 * @param {'domain' | 'ip'} kind
 * @param {string} query
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function lookupRdap(kind, query, options = {}) {
	// Colons stay unencoded: rdap.org rejects IPv6 addresses written with %3A.
	const path = encodeURIComponent(query).replace(/%3A/gi, ':');
	const data = await fetchJson(`https://rdap.org/${kind}/${path}`, {
		...options,
		allowNotFound: true
	});
	return data && summarizeRdap(data);
}
