import { describe, expect, it } from 'vitest';
import {
	extractCommitEmails,
	formatDate,
	isNoreplyEmail,
	mergeEmails,
	pickCommitRepos,
	profileRows,
	summarizeGpgKeys,
	summarizeRepos,
	summarizeSshKeys,
	websiteUrl
} from './analyze.js';

const repo = (name, extra = {}) => ({
	name,
	full_name: `alice/${name}`,
	fork: false,
	archived: false,
	size: 10,
	language: null,
	stargazers_count: 0,
	topics: [],
	pushed_at: '2024-01-01T00:00:00Z',
	...extra
});

const REPOS = [
	repo('web', {
		language: 'JavaScript',
		stargazers_count: 40,
		topics: ['osint', 'svelte'],
		pushed_at: '2024-06-01T00:00:00Z'
	}),
	repo('cli', {
		language: 'Python',
		stargazers_count: 5,
		topics: ['osint'],
		pushed_at: '2024-05-01T00:00:00Z'
	}),
	repo('bot', { language: 'Python', pushed_at: '2024-07-01T00:00:00Z', archived: true }),
	repo('empty', { size: 0, pushed_at: '2024-08-01T00:00:00Z' }),
	repo('linux', {
		fork: true,
		language: 'C',
		stargazers_count: 999,
		pushed_at: '2024-09-01T00:00:00Z'
	})
];

describe('summarizeRepos', () => {
	it('aggregates counts, languages, stars and topics', () => {
		const summary = summarizeRepos(REPOS);
		expect(summary).toMatchObject({ total: 5, sources: 4, forks: 1, archived: 1, stars: 45 });
		expect(summary.languages).toEqual([
			{ name: 'Python', count: 2, percent: 67 },
			{ name: 'JavaScript', count: 1, percent: 33 }
		]);
		expect(summary.topics).toEqual([
			{ name: 'osint', count: 2 },
			{ name: 'svelte', count: 1 }
		]);
		// Forks are left out of "most starred" (their stars belong to the original project).
		expect(summary.mostStarred.map((r) => r.name)).toEqual(['web', 'cli']);
		expect(summary.recent.map((r) => r.name)).toEqual(['linux', 'empty', 'bot', 'web', 'cli']);
	});

	it('handles users without repositories', () => {
		expect(summarizeRepos([])).toMatchObject({ total: 0, languages: [], mostStarred: [] });
	});
});

describe('pickCommitRepos', () => {
	it('picks the most recently pushed non-fork, non-empty repositories', () => {
		expect(pickCommitRepos(REPOS).map((r) => r.name)).toEqual(['bot', 'web', 'cli']);
		expect(pickCommitRepos(REPOS, 1).map((r) => r.name)).toEqual(['bot']);
	});
});

describe('isNoreplyEmail', () => {
	it('detects GitHub noreply addresses', () => {
		expect(isNoreplyEmail('12345+alice@users.noreply.github.com')).toBe(true);
		expect(isNoreplyEmail('alice@USERS.NOREPLY.GITHUB.COM')).toBe(true);
		expect(isNoreplyEmail('noreply@github.com')).toBe(true);
		expect(isNoreplyEmail('alice@example.com')).toBe(false);
	});
});

const commit = (
	author,
	committer,
	authorAccount,
	committerAccount,
	date = '2024-06-01T10:00:00Z'
) => ({
	html_url: `https://github.com/alice/web/commit/${date}`,
	commit: {
		author: { ...author, date },
		committer: { ...committer, date }
	},
	author: authorAccount,
	committer: committerAccount
});

const ALICE = { login: 'Alice' };
const BOB = { login: 'bob' };
const WEB_FLOW = { login: 'web-flow' };

describe('extractCommitEmails', () => {
	it('keeps identities linked to the user or to no account', () => {
		const commits = [
			commit(
				{ name: 'Alice', email: 'alice@example.com' },
				{ name: 'GitHub', email: 'noreply@github.com' },
				ALICE,
				WEB_FLOW
			),
			commit(
				{ name: 'Bob', email: 'bob@example.com' },
				{ name: 'Bob', email: 'bob@example.com' },
				BOB,
				BOB
			),
			commit(
				{ name: 'A. Work', email: 'alice@corp.example' },
				{ name: 'A. Work', email: 'alice@corp.example' },
				null,
				null
			)
		];
		const found = extractCommitEmails(commits, 'alice', 'alice/web');
		expect(found.map((e) => [e.email, e.linked])).toEqual([
			['alice@example.com', true],
			['alice@corp.example', false],
			['alice@corp.example', false]
		]);
		expect(found[0]).toMatchObject({ name: 'Alice', repo: 'alice/web' });
	});

	it('ignores commits with missing data', () => {
		expect(extractCommitEmails([{ commit: {} }, {}], 'alice', 'alice/web')).toEqual([]);
	});
});

describe('mergeEmails', () => {
	it('dedupes case-insensitively and merges names and repos', () => {
		const merged = mergeEmails([
			{
				email: 'Alice@Example.com',
				name: 'Alice',
				repo: 'alice/web',
				url: 'u1',
				date: '2024-01-01',
				linked: true
			},
			{
				email: 'alice@example.com',
				name: 'Alice Smith',
				repo: 'alice/cli',
				url: 'u2',
				date: '2024-03-01',
				linked: false
			},
			{
				email: '1+alice@users.noreply.github.com',
				name: 'Alice',
				repo: 'alice/web',
				url: 'u3',
				date: '2024-05-01',
				linked: true
			},
			{
				email: 'old@example.org',
				name: 'alice',
				repo: 'alice/web',
				url: 'u4',
				date: '2023-01-01',
				linked: false
			},
			{
				email: 'old@example.org',
				name: 'alice',
				repo: 'alice/web',
				url: 'u5',
				date: '2023-02-01',
				linked: false
			}
		]);
		expect(merged.map((e) => e.email)).toEqual([
			'Alice@Example.com',
			'old@example.org',
			'1+alice@users.noreply.github.com'
		]);
		expect(merged[0]).toMatchObject({
			names: ['Alice', 'Alice Smith'],
			repos: ['alice/web', 'alice/cli'],
			commits: 2,
			linked: true,
			noreply: false,
			lastSeen: '2024-03-01',
			url: 'u2'
		});
		expect(merged[1]).toMatchObject({ commits: 2, linked: false, repos: ['alice/web'] });
		expect(merged[2].noreply).toBe(true);
	});
});

describe('keys', () => {
	it('summarizes SSH key types', () => {
		const summary = summarizeSshKeys([
			{
				id: 1,
				key: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIabcdefghijklmnop',
				created_at: '2024-01-01T00:00:00Z'
			},
			{ id: 2, key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ' },
			{ id: 3, key: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIzzzz' }
		]);
		expect(summary.count).toBe(3);
		expect(summary.types).toEqual([
			{ type: 'ssh-ed25519', count: 2 },
			{ type: 'ssh-rsa', count: 1 }
		]);
		expect(summary.keys[0]).toMatchObject({
			tail: 'Iabcdefghijklmnop'.slice(-16),
			created: '2024-01-01 00:00 UTC'
		});
	});

	it('summarizes GPG keys with their emails', () => {
		const [key] = summarizeGpgKeys([
			{
				id: 7,
				key_id: '3262EFF25BA0D270',
				emails: [{ email: 'alice@example.com', verified: true }],
				subkeys: [{}],
				can_sign: true,
				revoked: false,
				created_at: '2020-01-01T00:00:00Z',
				expires_at: null
			}
		]);
		expect(key).toMatchObject({
			keyId: '3262EFF25BA0D270',
			emails: [{ email: 'alice@example.com', verified: true }],
			subkeys: 1,
			canSign: true,
			expires: 'never'
		});
	});
});

describe('profile helpers', () => {
	it('formats dates and website URLs', () => {
		expect(formatDate('2011-09-03T15:26:22Z')).toBe('2011-09-03 15:26 UTC');
		expect(formatDate(null)).toBe('');
		expect(websiteUrl('example.com/blog')).toBe('https://example.com/blog');
		expect(websiteUrl('http://example.com')).toBe('http://example.com/');
		expect(websiteUrl('javascript:alert(1)')).toBe('');
		expect(websiteUrl('')).toBe('');
	});

	it('builds profile rows with links', () => {
		const rows = profileRows({
			login: 'alice',
			html_url: 'https://github.com/alice',
			blog: 'alice.dev',
			twitter_username: 'alice_x',
			email: null,
			followers: 3,
			created_at: '2011-09-03T15:26:22Z'
		});
		const byLabel = Object.fromEntries(rows.map((row) => [row.label, row]));
		expect(byLabel.Website.href).toBe('https://alice.dev/');
		expect(byLabel['X / Twitter']).toMatchObject({
			value: '@alice_x',
			href: 'https://x.com/alice_x'
		});
		expect(byLabel['Public email'].value).toBeNull();
		expect(byLabel.Created.value).toBe('2011-09-03 15:26 UTC');
	});
});
