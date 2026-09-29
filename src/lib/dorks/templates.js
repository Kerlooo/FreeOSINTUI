import { t as translate } from '$lib/i18n/i18n.svelte.js';

const ALL = ['username', 'email', 'name', 'phone', 'domain'];

/** Social platforms searched in the "Social" category. */
const SOCIAL_SITES = [
	{ id: 'x', label: 'X / Twitter', site: '(site:x.com OR site:twitter.com)' },
	{ id: 'facebook', label: 'Facebook', site: 'site:facebook.com' },
	{ id: 'instagram', label: 'Instagram', site: 'site:instagram.com' },
	{ id: 'linkedin', label: 'LinkedIn', site: 'site:linkedin.com' },
	{ id: 'tiktok', label: 'TikTok', site: 'site:tiktok.com' },
	{ id: 'youtube', label: 'YouTube', site: 'site:youtube.com' },
	{ id: 'reddit', label: 'Reddit', site: 'site:reddit.com' },
	{ id: 'pinterest', label: 'Pinterest', site: 'site:pinterest.com' },
	{ id: 'telegram', label: 'Telegram', site: 'site:t.me' },
	{ id: 'twitch', label: 'Twitch', site: 'site:twitch.tv' },
	{ id: 'threads', label: 'Threads', site: 'site:threads.net' },
	{ id: 'bluesky', label: 'Bluesky', site: 'site:bsky.app' },
	{ id: 'tumblr', label: 'Tumblr', site: 'site:tumblr.com' },
	{ id: 'medium', label: 'Medium', site: 'site:medium.com' },
	{ id: 'quora', label: 'Quora', site: 'site:quora.com' },
	{ id: 'vk', label: 'VK', site: 'site:vk.com' }
];

const MAIN_SOCIAL_EXCLUSIONS = [
	'facebook.com',
	'instagram.com',
	'x.com',
	'twitter.com',
	'linkedin.com',
	'youtube.com',
	'tiktok.com',
	'reddit.com'
]
	.map((site) => `-site:${site}`)
	.join(' ');

/** Documents are searched as mentions of the target, or on the site itself for a domain. */
const scope = (target, type) => (type === 'domain' ? `site:${target.value}` : target.exact);

const FILE_TYPES = [
	{
		id: 'pdf',
		get label() {
			return translate('dorks.dork.pdf');
		},
		filter: 'filetype:pdf'
	},
	{
		id: 'word',
		get label() {
			return translate('dorks.dork.word');
		},
		filter: '(filetype:doc OR filetype:docx OR filetype:odt OR filetype:rtf)'
	},
	{
		id: 'sheet',
		get label() {
			return translate('dorks.dork.sheet');
		},
		filter: '(filetype:xls OR filetype:xlsx OR filetype:csv OR filetype:ods)'
	},
	{
		id: 'slides',
		get label() {
			return translate('dorks.dork.slides');
		},
		filter: '(filetype:ppt OR filetype:pptx OR filetype:odp)'
	},
	{
		id: 'plain',
		get label() {
			return translate('dorks.dork.plain');
		},
		filter: '(filetype:txt OR filetype:log)'
	}
];

const CODE_SITES = [
	{ id: 'github', label: 'GitHub', site: 'site:github.com' },
	{ id: 'gist', label: 'GitHub Gist', site: 'site:gist.github.com' },
	{ id: 'gitlab', label: 'GitLab', site: 'site:gitlab.com' },
	{ id: 'bitbucket', label: 'Bitbucket', site: 'site:bitbucket.org' },
	{ id: 'stackoverflow', label: 'Stack Overflow', site: 'site:stackoverflow.com' }
];

const PASTE_SITES = [
	{ id: 'pastebin', label: 'Pastebin', site: 'site:pastebin.com' },
	{ id: 'justpaste', label: 'JustPaste.it', site: 'site:justpaste.it' },
	{ id: 'rentry', label: 'Rentry', site: 'site:rentry.co' },
	{ id: 'controlc', label: 'ControlC', site: 'site:controlc.com' },
	{ id: 'pasteee', label: 'Paste.ee', site: 'site:paste.ee' }
];

/**
 * Dork categories, in display order. Each dork has an `id`, a `label`, the target
 * `types` it applies to and a `build(target, type)` function returning the query,
 * or `null` when it does not apply to this particular target.
 */
export const CATEGORIES = [
	{
		id: 'general',
		get label() {
			return translate('dorks.category.general.label');
		},
		get description() {
			return translate('dorks.category.general.description');
		},
		dorks: [
			{
				id: 'exact',
				get label() {
					return translate('dorks.dork.exact');
				},
				types: ALL,
				build: (t) => t.exact
			},
			{
				id: 'intitle',
				get label() {
					return translate('dorks.dork.intitle');
				},
				types: ['username', 'email', 'name', 'domain'],
				build: (t) => `intitle:${t.exact}`
			},
			{
				id: 'intext',
				get label() {
					return translate('dorks.dork.intext');
				},
				types: ALL,
				build: (t) => `intext:${t.exact}`
			},
			{
				id: 'inurl',
				get label() {
					return translate('dorks.dork.inurl');
				},
				types: ['username'],
				build: (t) => `inurl:${t.value}`
			},
			{
				id: 'reversed',
				get label() {
					return translate('dorks.dork.reversed');
				},
				types: ['name'],
				build: (t) => (t.reversed ? `"${t.reversed}"` : null)
			},
			{
				id: 'cv',
				get label() {
					return translate('dorks.dork.cv');
				},
				types: ['name'],
				build: (t) => `${t.exact} (CV OR resume OR curriculum)`
			},
			{
				id: 'local-part',
				get label() {
					return translate('dorks.dork.localPart');
				},
				types: ['email'],
				build: (t) => `"${t.local}" -${t.exact}`
			},
			{
				id: 'domain-emails',
				get label() {
					return translate('dorks.dork.domainEmails');
				},
				types: ['domain'],
				build: (t) => `"@${t.value}"`
			},
			{
				id: 'outside',
				get label() {
					return translate('dorks.dork.outside');
				},
				types: ['domain'],
				build: (t) => `${t.exact} -site:${t.value}`
			},
			{
				id: 'no-social',
				get label() {
					return translate('dorks.dork.noSocial');
				},
				types: ['username', 'email', 'name', 'phone'],
				build: (t) => `${t.exact} ${MAIN_SOCIAL_EXCLUSIONS}`
			}
		]
	},
	{
		id: 'social',
		get label() {
			return translate('dorks.category.social.label');
		},
		get description() {
			return translate('dorks.category.social.description');
		},
		dorks: SOCIAL_SITES.map(({ id, label, site }) => ({
			id,
			label,
			types: ALL,
			build: (t) => `${site} ${t.exact}`
		}))
	},
	{
		id: 'documents',
		get label() {
			return translate('dorks.category.documents.label');
		},
		get description() {
			return translate('dorks.category.documents.description');
		},
		// Labels are getters, so they are copied as getters to follow the language.
		dorks: FILE_TYPES.map((fileType) => ({
			id: fileType.id,
			get label() {
				return fileType.label;
			},
			types: ALL,
			build: (target, type) => `${scope(target, type)} ${fileType.filter}`
		}))
	},
	{
		id: 'code',
		get label() {
			return translate('dorks.category.code.label');
		},
		get description() {
			return translate('dorks.category.code.description');
		},
		dorks: CODE_SITES.map(({ id, label, site }) => ({
			id,
			label,
			types: ALL,
			build: (t) => `${site} ${t.exact}`
		}))
	},
	{
		id: 'pastes',
		get label() {
			return translate('dorks.category.pastes.label');
		},
		get description() {
			return translate('dorks.category.pastes.description');
		},
		dorks: [
			...PASTE_SITES.map(({ id, label, site }) => ({
				id,
				label,
				types: ALL,
				build: (t) => `${site} ${t.exact}`
			})),
			{
				id: 'leak-words',
				get label() {
					return translate('dorks.dork.leakWords');
				},
				types: ALL,
				build: (t) => `${t.exact} (leak OR dump OR breach OR password)`
			}
		]
	},
	{
		id: 'exposure',
		get label() {
			return translate('dorks.category.exposure.label');
		},
		get description() {
			return translate('dorks.category.exposure.description');
		},
		dorks: [
			{
				id: 'indexed',
				get label() {
					return translate('dorks.dork.indexed');
				},
				types: ['domain'],
				build: (t) => `site:${t.value}`
			},
			{
				id: 'subdomains',
				get label() {
					return translate('dorks.dork.subdomains');
				},
				types: ['domain'],
				build: (t) => `site:*.${t.value} -site:www.${t.value}`
			},
			{
				id: 'login',
				get label() {
					return translate('dorks.dork.login');
				},
				types: ['domain'],
				build: (t) =>
					`site:${t.value} (inurl:login OR inurl:signin OR inurl:admin OR inurl:dashboard)`
			},
			{
				id: 'index-of',
				get label() {
					return translate('dorks.dork.indexOf');
				},
				types: ['domain'],
				build: (t) => `site:${t.value} intitle:"index of"`
			},
			{
				id: 'config',
				get label() {
					return translate('dorks.dork.config');
				},
				types: ['domain'],
				build: (t) =>
					`site:${t.value} (ext:env OR ext:sql OR ext:bak OR ext:conf OR ext:ini OR ext:cfg)`
			},
			{
				id: 'errors',
				get label() {
					return translate('dorks.dork.errors');
				},
				types: ['domain'],
				build: (t) => `site:${t.value} ("sql syntax" OR "stack trace" OR "fatal error")`
			}
		]
	}
];
