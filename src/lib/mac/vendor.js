// Vendor lookup in the IEEE registries (static/data/oui.json, built by scripts/update-oui.js).
import { fetchJson } from '$lib/net.js';

/**
 * @typedef {Record<string, string | [string, string]>} Registry prefix -> name or [name, country]
 * @typedef {{ updated?: string, l: Registry, m: Registry, s: Registry }} OuiData
 * @typedef {{ registry: 'MA-L' | 'MA-M' | 'MA-S', prefix: string, bits: number, organization: string, country: string | null }} Vendor
 */

/** Longest assignment first: an MA-S block lies inside an MA-L registered to the IEEE RA. */
const REGISTRIES = /** @type {const} */ ([
	{ key: 's', registry: 'MA-S', length: 9, bits: 36 },
	{ key: 'm', registry: 'MA-M', length: 7, bits: 28 },
	{ key: 'l', registry: 'MA-L', length: 6, bits: 24 }
]);

/**
 * Organization owning the longest IEEE prefix matching a MAC (or OUI).
 * @param {string} hex uppercase hex digits (6 or 12)
 * @param {OuiData} data
 * @returns {Vendor | null}
 */
export function lookupVendor(hex, data) {
	// A group address uses its owner's OUI with the I/G bit set (01:00:5E is IANA's 00:00:5E).
	const first = (parseInt(hex.slice(0, 2), 16) & 0xfe).toString(16).padStart(2, '0');
	const unicast = `${first.toUpperCase()}${hex.slice(2)}`;
	for (const { key, registry, length, bits } of REGISTRIES) {
		if (unicast.length < length) continue;
		const prefix = unicast.slice(0, length);
		const entry = data[key]?.[prefix];
		if (!entry) continue;
		const [organization, country = null] = Array.isArray(entry) ? entry : [entry];
		return { registry, prefix, bits, organization, country };
	}
	return null;
}

/** @type {Promise<OuiData> | null} */
let cached = null;

/**
 * Downloads the vendor table once per session (about 2 MB, 0.6 MB compressed).
 * @param {string} url absolute URL of oui.json
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 * @returns {Promise<OuiData>}
 */
export function loadOuiData(url, options = {}) {
	cached ??= fetchJson(url, { timeoutMs: 30000, ...options }).then(
		(data) => /** @type {OuiData} */ (data),
		(error) => {
			cached = null;
			throw error;
		}
	);
	return cached;
}
