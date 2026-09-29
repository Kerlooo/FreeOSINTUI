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
	{ id: 'pdf', label: 'PDF documents', filter: 'filetype:pdf' },
	{
		id: 'word',
		label: 'Word / text documents',
		filter: '(filetype:doc OR filetype:docx OR filetype:odt OR filetype:rtf)'
	},
	{
		id: 'sheet',
		label: 'Spreadsheets',
		filter: '(filetype:xls OR filetype:xlsx OR filetype:csv OR filetype:ods)'
	},
	{
		id: 'slides',
		label: 'Presentations',
		filter: '(filetype:ppt OR filetype:pptx OR filetype:odp)'
	},
	{ id: 'plain', label: 'Plain text and logs', filter: '(filetype:txt OR filetype:log)' }
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
		label: 'General',
		description: 'Exact mentions of the target anywhere on the web.',
		dorks: [
			{ id: 'exact', label: 'Exact match', types: ALL, build: (t) => t.exact },
			{
				id: 'intitle',
				label: 'In page title',
				types: ['username', 'email', 'name', 'domain'],
				build: (t) => `intitle:${t.exact}`
			},
			{ id: 'intext', label: 'In page text', types: ALL, build: (t) => `intext:${t.exact}` },
			{
				id: 'inurl',
				label: 'In URL (profile pages)',
				types: ['username'],
				build: (t) => `inurl:${t.value}`
			},
			{
				id: 'reversed',
				label: 'Surname first',
				types: ['name'],
				build: (t) => (t.reversed ? `"${t.reversed}"` : null)
			},
			{
				id: 'cv',
				label: 'CV / resume',
				types: ['name'],
				build: (t) => `${t.exact} (CV OR resume OR curriculum)`
			},
			{
				id: 'local-part',
				label: 'Email username on other sites',
				types: ['email'],
				build: (t) => `"${t.local}" -${t.exact}`
			},
			{
				id: 'domain-emails',
				label: 'Email addresses of the domain',
				types: ['domain'],
				build: (t) => `"@${t.value}"`
			},
			{
				id: 'outside',
				label: 'Mentions on other sites',
				types: ['domain'],
				build: (t) => `${t.exact} -site:${t.value}`
			},
			{
				id: 'no-social',
				label: 'Outside the main social networks',
				types: ['username', 'email', 'name', 'phone'],
				build: (t) => `${t.exact} ${MAIN_SOCIAL_EXCLUSIONS}`
			}
		]
	},
	{
		id: 'social',
		label: 'Social',
		description: 'Profiles, posts and comments on social networks, video and community platforms.',
		dorks: SOCIAL_SITES.map(({ id, label, site }) => ({
			id,
			label,
			types: ALL,
			build: (t) => `${site} ${t.exact}`
		}))
	},
	{
		id: 'documents',
		label: 'Documents',
		description: 'Indexed files that contain the target.',
		dorks: FILE_TYPES.map(({ id, label, filter }) => ({
			id,
			label,
			types: ALL,
			build: (t, type) => `${scope(t, type)} ${filter}`
		}))
	},
	{
		id: 'code',
		label: 'Code & dev',
		description: 'Repositories, snippets and developer Q&A.',
		dorks: CODE_SITES.map(({ id, label, site }) => ({
			id,
			label,
			types: ALL,
			build: (t) => `${site} ${t.exact}`
		}))
	},
	{
		id: 'pastes',
		label: 'Pastes & leaks',
		description: 'Paste sites and pages that mention the target together with leak keywords.',
		dorks: [
			...PASTE_SITES.map(({ id, label, site }) => ({
				id,
				label,
				types: ALL,
				build: (t) => `${site} ${t.exact}`
			})),
			{
				id: 'leak-words',
				label: 'Leak keywords',
				types: ALL,
				build: (t) => `${t.exact} (leak OR dump OR breach OR password)`
			}
		]
	},
	{
		id: 'exposure',
		label: 'Site exposure',
		description: 'What the domain exposes to search engines.',
		dorks: [
			{
				id: 'indexed',
				label: 'All indexed pages',
				types: ['domain'],
				build: (t) => `site:${t.value}`
			},
			{
				id: 'subdomains',
				label: 'Subdomains',
				types: ['domain'],
				build: (t) => `site:*.${t.value} -site:www.${t.value}`
			},
			{
				id: 'login',
				label: 'Login and admin pages',
				types: ['domain'],
				build: (t) =>
					`site:${t.value} (inurl:login OR inurl:signin OR inurl:admin OR inurl:dashboard)`
			},
			{
				id: 'index-of',
				label: 'Directory listings',
				types: ['domain'],
				build: (t) => `site:${t.value} intitle:"index of"`
			},
			{
				id: 'config',
				label: 'Config, backup and database files',
				types: ['domain'],
				build: (t) =>
					`site:${t.value} (ext:env OR ext:sql OR ext:bak OR ext:conf OR ext:ini OR ext:cfg)`
			},
			{
				id: 'errors',
				label: 'Error pages',
				types: ['domain'],
				build: (t) => `site:${t.value} ("sql syntax" OR "stack trace" OR "fatal error")`
			}
		]
	}
];
