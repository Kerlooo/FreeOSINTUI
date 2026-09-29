/**
 * Pure functions turning GitHub API responses into what the page shows.
 * Kept free of fetch calls so they can be tested with fixture JSON.
 */

import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

/**
 * Formats an ISO timestamp as "YYYY-MM-DD HH:mm UTC".
 * @param {string | null | undefined} iso
 */
export function formatDate(iso) {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/**
 * Adds a scheme to a blog/website field, which users often type without it.
 * Returns '' for values that are not http(s) URLs.
 * @param {string | null | undefined} blog
 */
export function websiteUrl(blog) {
	const value = (blog ?? '').trim();
	if (!value) return '';
	const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
	try {
		const url = new URL(withScheme);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
	} catch {
		return '';
	}
}

/**
 * Formats a counter with the separators of the current language; missing values stay missing.
 * @param {number | null | undefined} value
 */
function count(value) {
	return typeof value === 'number' ? formatNumber(value) : value;
}

/**
 * Profile fields as KeyValueTable rows, labelled in the current language.
 * Empty values are hidden by the table.
 * @param {any} user response of /users/<username>
 * @returns {{ label: string, value: string | number | null | undefined, href?: string }[]}
 */
export function profileRows(user) {
	const blog = websiteUrl(user.blog);
	return [
		{ label: t('github.profile.username'), value: user.login, href: user.html_url },
		{ label: t('github.profile.name'), value: user.name },
		{ label: t('github.profile.accountType'), value: user.type },
		{ label: t('github.profile.accountId'), value: user.id },
		{ label: t('github.profile.bio'), value: user.bio },
		{ label: t('github.profile.company'), value: user.company },
		{ label: t('github.profile.location'), value: user.location },
		{
			label: t('github.profile.email'),
			value: user.email,
			href: user.email ? `mailto:${user.email}` : undefined
		},
		{ label: t('github.profile.website'), value: user.blog, href: blog || undefined },
		{
			label: t('github.profile.twitter'),
			value: user.twitter_username ? `@${user.twitter_username}` : '',
			href: user.twitter_username ? `https://x.com/${user.twitter_username}` : undefined
		},
		{ label: t('github.profile.hireable'), value: user.hireable ? t('common.yes') : '' },
		{ label: t('github.profile.followers'), value: count(user.followers) },
		{ label: t('github.profile.following'), value: count(user.following) },
		{ label: t('github.profile.repos'), value: count(user.public_repos) },
		{ label: t('github.profile.gists'), value: count(user.public_gists) },
		{ label: t('github.profile.created'), value: formatDate(user.created_at) },
		{ label: t('github.profile.updated'), value: formatDate(user.updated_at) },
		{ label: t('github.profile.staff'), value: user.site_admin ? t('common.yes') : '' }
	];
}

/**
 * Aggregates a user's repositories.
 * Languages are counted on non-fork repositories only (a fork's language is someone else's code).
 * @param {any[]} repos response of /users/<username>/repos
 */
export function summarizeRepos(repos) {
	const sources = repos.filter((repo) => !repo.fork);
	/** @type {Map<string, number>} */
	const languageCounts = new Map();
	for (const repo of sources) {
		if (repo.language)
			languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
	}
	const withLanguage = [...languageCounts.values()].reduce((sum, count) => sum + count, 0);
	const languages = [...languageCounts]
		.map(([name, count]) => ({ name, count, percent: Math.round((count / withLanguage) * 100) }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

	/** @type {Map<string, number>} */
	const topicCounts = new Map();
	for (const repo of sources) {
		for (const topic of repo.topics ?? [])
			topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
	}
	const topics = [...topicCounts]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, 15)
		.map(([name, count]) => ({ name, count }));

	const byPushed = (a, b) => String(b.pushed_at ?? '').localeCompare(String(a.pushed_at ?? ''));

	return {
		total: repos.length,
		sources: sources.length,
		forks: repos.length - sources.length,
		archived: repos.filter((repo) => repo.archived).length,
		stars: sources.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0),
		languages,
		topics,
		mostStarred: [...sources]
			.filter((repo) => repo.stargazers_count > 0)
			.sort((a, b) => b.stargazers_count - a.stargazers_count)
			.slice(0, 5),
		recent: [...repos].sort(byPushed).slice(0, 15)
	};
}

/**
 * Chooses the repositories whose commits are scanned for emails: the most recently
 * pushed non-fork, non-empty ones.
 * @param {any[]} repos
 * @param {number} [max]
 */
export function pickCommitRepos(repos, max = 3) {
	return repos
		.filter((repo) => !repo.fork && repo.size > 0)
		.sort((a, b) => String(b.pushed_at ?? '').localeCompare(String(a.pushed_at ?? '')))
		.slice(0, max);
}

/**
 * True for GitHub's private "noreply" addresses, which hide the real email.
 * @param {string} email
 */
export function isNoreplyEmail(email) {
	return /@users\.noreply\.github\.com$/i.test(email) || /^noreply@github\.com$/i.test(email);
}

/**
 * @typedef {object} CommitEmail
 * @property {string} email
 * @property {string} name
 * @property {string} repo full repository name
 * @property {string} url commit page
 * @property {string} date
 * @property {boolean} linked true when GitHub linked the commit to this account
 */

/**
 * Collects author/committer identities from a repository's commits, keeping those that
 * GitHub linked to `login` and those not linked to any account (author/committer null).
 * GitHub's own web-flow committer (noreply@github.com) is skipped.
 * @param {any[]} commits response of /repos/<owner>/<repo>/commits
 * @param {string} login
 * @param {string} repo
 * @returns {CommitEmail[]}
 */
export function extractCommitEmails(commits, login, repo) {
	const target = login.toLowerCase();
	/** @type {CommitEmail[]} */
	const found = [];
	for (const commit of commits) {
		for (const role of /** @type {const} */ (['author', 'committer'])) {
			const identity = commit.commit?.[role];
			const account = commit[role];
			const email = identity?.email?.trim();
			if (!email || /^noreply@github\.com$/i.test(email)) continue;
			const linked = account?.login?.toLowerCase() === target;
			if (!linked && account) continue; // Linked to another account: someone else.
			found.push({
				email,
				name: identity.name ?? '',
				repo,
				url: commit.html_url ?? '',
				date: identity.date ?? '',
				linked
			});
		}
	}
	return found;
}

/**
 * @typedef {object} EmailSummary
 * @property {string} email
 * @property {string[]} names
 * @property {string[]} repos
 * @property {number} commits number of author/committer occurrences
 * @property {boolean} linked seen at least once on a commit linked to the account
 * @property {boolean} noreply
 * @property {string} lastSeen ISO date of the latest occurrence
 * @property {string} url a commit where it appears
 */

/**
 * Deduplicates emails (case-insensitive), merging names and repositories.
 * Linked emails come first, then by number of occurrences; noreply addresses last.
 * @param {CommitEmail[]} entries
 * @returns {EmailSummary[]}
 */
export function mergeEmails(entries) {
	/** @type {Map<string, EmailSummary>} */
	const byEmail = new Map();
	for (const entry of entries) {
		const key = entry.email.toLowerCase();
		let summary = byEmail.get(key);
		if (!summary) {
			summary = {
				email: entry.email,
				names: [],
				repos: [],
				commits: 0,
				linked: false,
				noreply: isNoreplyEmail(entry.email),
				lastSeen: '',
				url: entry.url
			};
			byEmail.set(key, summary);
		}
		summary.commits++;
		summary.linked ||= entry.linked;
		if (entry.name && !summary.names.includes(entry.name)) summary.names.push(entry.name);
		if (!summary.repos.includes(entry.repo)) summary.repos.push(entry.repo);
		if (entry.date > summary.lastSeen) {
			summary.lastSeen = entry.date;
			summary.url = entry.url || summary.url;
		}
	}
	return [...byEmail.values()].sort(
		(a, b) =>
			Number(a.noreply) - Number(b.noreply) ||
			Number(b.linked) - Number(a.linked) ||
			b.commits - a.commits ||
			a.email.localeCompare(b.email)
	);
}

/**
 * Summarises public SSH keys: type counts and a short tail of each key for comparison.
 * @param {any[]} keys response of /users/<username>/keys
 */
export function summarizeSshKeys(keys) {
	/** @type {Map<string, number>} */
	const types = new Map();
	const list = keys.map((key) => {
		const [type = 'unknown', body = ''] = String(key.key ?? '').split(/\s+/);
		types.set(type, (types.get(type) ?? 0) + 1);
		return { id: key.id, type, tail: body.slice(-16), created: formatDate(key.created_at) };
	});
	return {
		count: keys.length,
		types: [...types].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
		keys: list
	};
}

/**
 * Summarises public GPG keys, including the emails they declare (a frequent source of
 * real addresses).
 * @param {any[]} keys response of /users/<username>/gpg_keys
 */
export function summarizeGpgKeys(keys) {
	return keys.map((key) => ({
		id: key.id,
		keyId: key.key_id ?? '',
		emails: (key.emails ?? []).map((/** @type {any} */ item) => ({
			email: item.email,
			verified: Boolean(item.verified)
		})),
		subkeys: (key.subkeys ?? []).length,
		canSign: Boolean(key.can_sign),
		revoked: Boolean(key.revoked),
		created: formatDate(key.created_at),
		expires: key.expires_at ? formatDate(key.expires_at) : t('github.keys.never')
	}));
}
