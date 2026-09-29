import { githubFetch } from './api.js';
import { extractCommitEmails, mergeEmails, pickCommitRepos } from './analyze.js';

/**
 * The API calls made for one lookup. A full lookup costs at most
 * 5 + COMMIT_REPOS requests out of the 60 per hour allowed without login.
 */

/** Number of repositories whose recent commits are scanned for emails. */
export const COMMIT_REPOS = 3;
/** Commits read per repository. */
export const COMMITS_PER_REPO = 30;
export const MAX_REQUESTS = 5 + COMMIT_REPOS;

/**
 * @typedef {{ signal?: AbortSignal, fetch?: typeof fetch, onRate?: (rate: import('./api.js').RateLimit) => void }} LookupOptions
 */

/**
 * @param {string} path
 * @param {LookupOptions & { allowNotFound?: boolean, emptyStatuses?: number[] }} options
 */
async function call(path, { onRate, ...options }) {
	const { data, rate } = await githubFetch(path, options);
	if (rate && onRate) onRate(rate);
	return data;
}

/**
 * Profile of a user or organization; null when the account does not exist.
 * @param {string} username
 * @param {LookupOptions} [options]
 */
export function fetchProfile(username, options = {}) {
	return call(`/users/${encodeURIComponent(username)}`, { ...options, allowNotFound: true });
}

/**
 * Up to 100 public repositories, most recently pushed first.
 * @param {string} username
 * @param {LookupOptions} [options]
 * @returns {Promise<any[]>}
 */
export async function fetchRepos(username, options = {}) {
	return (
		(await call(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, {
			...options,
			allowNotFound: true
		})) ?? []
	);
}

/**
 * Public organization memberships.
 * @param {string} username
 * @param {LookupOptions} [options]
 * @returns {Promise<any[]>}
 */
export async function fetchOrgs(username, options = {}) {
	return (
		(await call(`/users/${encodeURIComponent(username)}/orgs`, {
			...options,
			allowNotFound: true
		})) ?? []
	);
}

/**
 * Public SSH and GPG keys. github.com/<user>.keys and .gpg send no CORS headers, so the
 * API endpoints are used instead.
 * @param {string} username
 * @param {LookupOptions} [options]
 * @returns {Promise<{ ssh: any[], gpg: any[] }>}
 */
export async function fetchKeys(username, options = {}) {
	const user = encodeURIComponent(username);
	const [ssh, gpg] = await Promise.all([
		call(`/users/${user}/keys`, { ...options, allowNotFound: true }),
		call(`/users/${user}/gpg_keys`, { ...options, allowNotFound: true })
	]);
	return { ssh: ssh ?? [], gpg: gpg ?? [] };
}

/**
 * Scans the latest commits of a few of the user's own repositories and returns the
 * deduplicated author/committer emails. The public events feed no longer includes
 * commits in PushEvent payloads, so the commits endpoint is used.
 * Empty repositories (HTTP 409) and missing ones are skipped.
 * @param {string} login
 * @param {any[]} repos response of fetchRepos
 * @param {LookupOptions} [options]
 */
export async function fetchCommitEmails(login, repos, options = {}) {
	const picked = pickCommitRepos(repos, COMMIT_REPOS);
	const results = await Promise.all(
		picked.map(async (repo) => {
			const commits = await call(
				`/repos/${repo.full_name
					.split('/')
					.map(encodeURIComponent)
					.join('/')}/commits?per_page=${COMMITS_PER_REPO}`,
				{ ...options, allowNotFound: true, emptyStatuses: [409] }
			);
			return extractCommitEmails(commits ?? [], login, repo.full_name);
		})
	);
	return {
		emails: mergeEmails(results.flat()),
		scanned: picked.map((repo) => repo.full_name)
	};
}
