import { fetchJson } from '$lib/net.js';

/**
 * Cleans certificate names: lowercase, no wildcards, only valid subdomains of `domain`
 * (the domain itself is dropped), deduplicated and sorted.
 * @param {string[]} names
 * @param {string} domain
 */
export function cleanNames(names, domain) {
	const suffix = `.${domain}`;
	const unique = new Set();
	for (const raw of names) {
		const name = raw
			.trim()
			.toLowerCase()
			.replace(/^(\*\.)+/, '')
			.replace(/\.$/, '');
		if (name.endsWith(suffix) && /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/.test(name)) unique.add(name);
	}
	return [...unique].sort((a, b) => {
		// Sort by label from the right, so hosts of the same subdomain stay together.
		const left = a.split('.').reverse().join('.');
		const right = b.split('.').reverse().join('.');
		return left < right ? -1 : left > right ? 1 : 0;
	});
}

/**
 * Extracts names from a crt.sh JSON answer (`name_value` holds newline-separated names).
 * @param {{ name_value?: string, common_name?: string }[]} entries
 * @param {string} domain
 */
export function parseCrtSh(entries, domain) {
	if (!Array.isArray(entries)) throw new Error('crt.sh returned an unexpected response.');
	return cleanNames(
		entries.flatMap((entry) => [
			...(entry.name_value ?? '').split('\n'),
			...(entry.common_name ? [entry.common_name] : [])
		]),
		domain
	);
}

/**
 * Extracts names from a Cert Spotter issuances answer (with `expand=dns_names`).
 * @param {{ dns_names?: string[] }[]} issuances
 * @param {string} domain
 */
export function parseCertSpotter(issuances, domain) {
	if (!Array.isArray(issuances)) throw new Error('Cert Spotter returned an unexpected response.');
	return cleanNames(
		issuances.flatMap((issuance) => issuance.dns_names ?? []),
		domain
	);
}

/**
 * Finds subdomains from certificate transparency logs: crt.sh first (complete but slow and
 * often overloaded), Cert Spotter as fallback (fast, but only its first page of results).
 * @param {string} domain
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 * @returns {Promise<{ names: string[], source: 'crt.sh' | 'Cert Spotter', partial: boolean, fallbackReason: string | null }>}
 */
export async function findSubdomains(domain, options = {}) {
	let fallbackReason = null;
	try {
		const entries = await fetchJson(
			`https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`,
			{ ...options, timeoutMs: 30000 }
		);
		return { names: parseCrtSh(entries, domain), source: 'crt.sh', partial: false, fallbackReason };
	} catch (error) {
		if (options.signal?.aborted) throw error;
		fallbackReason = error instanceof Error ? error.message : 'crt.sh failed.';
	}

	const issuances = await fetchJson(
		`https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names`,
		options
	);
	return {
		names: parseCertSpotter(issuances, domain),
		source: 'Cert Spotter',
		partial: true,
		fallbackReason
	};
}
