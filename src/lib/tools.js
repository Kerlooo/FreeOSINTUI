/** Tool categories, in display order. */
export const CATEGORIES = [
	{ id: 'search', label: 'Search' },
	{ id: 'people', label: 'People & accounts' },
	{ id: 'network', label: 'Domains & network' },
	{ id: 'breaches', label: 'Breaches' },
	{ id: 'files', label: 'Files & hashes' },
	{ id: 'blockchain', label: 'Blockchain' }
];

/**
 * Every tool available on the site. The home page and the navbar both read this list,
 * so a new tool is added here.
 */
export const TOOLS = [
	{
		id: 'dorks',
		name: 'Google Dork Generator',
		route: '/dorks',
		category: 'search',
		description:
			'Generate Google dorks for a username, email, name, phone number or domain, grouped by type (social, documents, code, pastes) with direct search links.'
	},
	{
		id: 'hash',
		name: 'Hash Checker',
		route: '/hash',
		category: 'files',
		description:
			'Compute MD5, SHA-1, SHA-2, SHA-3, BLAKE and CRC32 hashes of text or files, identify an unknown hash and verify it.'
	},
	{
		id: 'domain',
		name: 'Domain Analyzer',
		route: '/domain',
		category: 'network',
		description:
			'Analyze a domain: DNS records, SPF/DMARC email security, RDAP registration data, subdomains from certificate transparency and Wayback Machine snapshots.'
	},
	{
		id: 'ip',
		name: 'IP Analyzer',
		route: '/ip',
		category: 'network',
		description:
			'Analyze an IPv4/IPv6 address or hostname: approximate geolocation, ASN and ISP, reverse DNS, RDAP network owner and abuse contact, and open ports and CVEs from Shodan InternetDB (passive).'
	},
	{
		id: 'email',
		name: 'Email Analyzer',
		route: '/email',
		category: 'people',
		description:
			'Analyze an email address: syntax, free or disposable provider, role address, MX mail servers, SPF/DMARC protection and public Gravatar profile.'
	},
	{
		id: 'leaks',
		name: 'Leak Check',
		route: '/leaks',
		category: 'breaches',
		description:
			'Check which known data breaches include an email address, and whether a password has been exposed (k-anonymity: the password never leaves your browser).'
	},
	{
		id: 'username',
		name: 'Username Analyzer',
		route: '/username',
		category: 'people',
		description:
			'Check whether a username exists on hundreds of websites and social networks (WhatsMyName list). Requires the Python backend.'
	},
	{
		id: 'phone',
		name: 'Phone Analyzer',
		route: '/phone',
		category: 'people',
		description:
			'Validate a phone number offline: country, number type (mobile, fixed line, VoIP, toll free), standard formats and WhatsApp, Telegram and Google search links.'
	},
	{
		id: 'telegram',
		name: 'Telegram OSINT',
		route: '/telegram',
		category: 'people',
		description:
			'Look up a Telegram username: account type (channel, group, bot, user), name, bio, subscribers or members and latest channel posts. Requires the Python backend.'
	},
	{
		id: 'crypto',
		name: 'Crypto Tracer',
		route: '/crypto',
		category: 'blockchain',
		description:
			'Detect and validate a Bitcoin, Litecoin or Ethereum address, then trace its balance, totals and latest transactions, following counterparties with one click.'
	},
	{
		id: 'github',
		name: 'GitHub OSINT',
		route: '/github',
		category: 'people',
		description:
			'Investigate a GitHub user: profile, repositories and top languages, organizations, emails leaked in public commits, SSH and GPG keys.'
	},
	{
		id: 'metadata',
		name: 'Metadata Extractor',
		route: '/metadata',
		category: 'files',
		description:
			'Read hidden metadata from images (EXIF, GPS with map links, XMP, IPTC), PDFs and Office documents: camera, location, author, software and dates. The file never leaves your browser.'
	}
];

/** Categories that have at least one tool, each with its tools. */
export function toolsByCategory() {
	return CATEGORIES.map((category) => ({
		...category,
		tools: TOOLS.filter((tool) => tool.category === category.id)
	})).filter((category) => category.tools.length);
}
