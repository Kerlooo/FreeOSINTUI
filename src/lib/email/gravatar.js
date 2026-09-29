import { fetchJson } from '$lib/net.js';

/**
 * Gravatar identifies an address by the SHA-256 of the trimmed, lowercase email.
 * @param {string} email
 */
export async function gravatarHash(email) {
	const bytes = new TextEncoder().encode(email.trim().toLowerCase());
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Avatar URL that returns 404 (instead of a default image) when there is no Gravatar.
 * @param {string} hash
 * @param {number} [size]
 */
export function gravatarAvatarUrl(hash, size = 200) {
	return `https://gravatar.com/avatar/${hash}?d=404&s=${size}`;
}

/**
 * Keeps the useful public fields of a Gravatar v3 profile.
 * @param {any} json
 */
export function summarizeGravatarProfile(json) {
	return {
		displayName: json.display_name || null,
		profileUrl: json.profile_url || null,
		avatarUrl: json.avatar_url || null,
		location: json.location || null,
		description: json.description || null,
		jobTitle: json.job_title || null,
		company: json.company || null,
		pronouns: json.pronouns || null,
		accounts: (json.verified_accounts ?? [])
			.filter((/** @type {any} */ account) => !account.is_hidden && account.url)
			.map((/** @type {any} */ account) => ({
				label: account.service_label || account.service_type,
				url: account.url
			}))
	};
}

/**
 * Fetches the public Gravatar profile (no API key needed, rate limited). `null` when there is none.
 * @param {string} hash
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function lookupGravatarProfile(hash, options = {}) {
	const json = await fetchJson(`https://api.gravatar.com/v3/profiles/${hash}`, {
		...options,
		allowNotFound: true
	});
	return json ? summarizeGravatarProfile(json) : null;
}
