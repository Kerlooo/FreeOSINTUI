/**
 * Groups of "interesting" archived URLs. An entry can be in several groups.
 * Ids are also i18n keys (footprint.group.<id>).
 */

const DOCUMENTS = new Set([
	'pdf',
	'doc',
	'docx',
	'xls',
	'xlsx',
	'ppt',
	'pptx',
	'odt',
	'ods',
	'odp',
	'rtf',
	'csv',
	'txt'
]);

const ARCHIVES = new Set([
	'zip',
	'tar',
	'gz',
	'tgz',
	'bz2',
	'xz',
	'rar',
	'7z',
	'bak',
	'backup',
	'old',
	'orig',
	'swp',
	'sql',
	'db',
	'sqlite',
	'dump'
]);

const CONFIG = new Set([
	'env',
	'ini',
	'yml',
	'yaml',
	'toml',
	'json',
	'xml',
	'log',
	'conf',
	'cfg',
	'config',
	'properties',
	'htaccess',
	'htpasswd',
	'pem',
	'key'
]);

const SCRIPTS = new Set([
	'js',
	'mjs',
	'php',
	'php3',
	'php4',
	'php5',
	'phtml',
	'asp',
	'aspx',
	'ashx',
	'asmx',
	'jsp',
	'jspx',
	'do',
	'action',
	'cgi',
	'pl'
]);

/** Path segments (without extension) that point at login, admin or API areas. */
const ADMIN_SEGMENTS = new Set([
	'admin',
	'administrator',
	'admins',
	'wp-admin',
	'wp-login',
	'login',
	'logon',
	'log-in',
	'signin',
	'sign-in',
	'signup',
	'register',
	'dashboard',
	'cpanel',
	'phpmyadmin',
	'backend',
	'console',
	'manager',
	'auth',
	'oauth',
	'sso',
	'account',
	'api',
	'graphql',
	'swagger',
	'wp-json'
]);

/** Config or secret files recognized by name or folder rather than extension. */
const SECRET_PATH =
	/(^|\/)(\.git|\.svn|\.hg)(\/|$)|(^|\/)(\.env[^/]*|\.ds_store|wp-config[^/]*|web\.config|config\.php[^/]*|settings\.py|id_rsa[^/]*)$/;

/**
 * Lowercased, decoded path of an entry.
 * @param {string} path
 */
function cleanPath(path) {
	try {
		return decodeURIComponent(path).toLowerCase();
	} catch {
		return path.toLowerCase();
	}
}

/**
 * Extension of the last path segment ("report.PDF" -> "pdf", ".env" -> "env"), or ''.
 * @param {string} path already lowercased
 */
export function extensionOf(path) {
	const name = path.slice(path.lastIndexOf('/') + 1);
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot + 1);
}

/** @typedef {{ id: string, test: (entry: { path: string, search: string }) => boolean }} Group */

/** @type {Group[]} */
export const GROUPS = [
	{ id: 'documents', test: ({ path }) => DOCUMENTS.has(extensionOf(cleanPath(path))) },
	{ id: 'archives', test: ({ path }) => ARCHIVES.has(extensionOf(cleanPath(path))) },
	{
		id: 'config',
		test: ({ path }) => {
			const clean = cleanPath(path);
			return CONFIG.has(extensionOf(clean)) || SECRET_PATH.test(clean);
		}
	},
	{ id: 'scripts', test: ({ path }) => SCRIPTS.has(extensionOf(cleanPath(path))) },
	{
		id: 'admin',
		test: ({ path }) =>
			cleanPath(path)
				.split('/')
				.some((segment) => ADMIN_SEGMENTS.has(segment.replace(/\.[a-z0-9]+$/, '')))
	},
	{ id: 'params', test: ({ search }) => search.length > 1 }
];

export const GROUP_IDS = GROUPS.map((group) => group.id);

/**
 * Ids of the groups an entry belongs to.
 * @param {{ path: string, search: string }} entry
 */
export function classifyEntry(entry) {
	return GROUPS.filter((group) => group.test(entry)).map((group) => group.id);
}

/**
 * Entries of every group, in the order of GROUPS.
 * @template {{ path: string, search: string }} T
 * @param {T[]} entries
 * @returns {Record<string, T[]>}
 */
export function groupEntries(entries) {
	/** @type {Record<string, T[]>} */
	const groups = Object.fromEntries(GROUP_IDS.map((id) => [id, []]));
	for (const entry of entries) {
		for (const id of classifyEntry(entry)) groups[id].push(entry);
	}
	return groups;
}
