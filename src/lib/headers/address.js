/**
 * Address fields (From, To, Reply-To...) and domain helpers for alignment checks.
 */

import { decodeEncodedWords, splitTopLevel, stripComments } from './parse.js';

/** @typedef {{ name: string, address: string, domain: string }} Mailbox */

const EMAIL_RE =
	/[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+/g;

/** @param {string} address */
function domainOf(address) {
	const at = address.lastIndexOf('@');
	return at < 0
		? ''
		: address
				.slice(at + 1)
				.toLowerCase()
				.replace(/\.$/, '');
}

/** @param {string} name */
function cleanName(name) {
	let value = name.trim();
	if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
		value = value.slice(1, -1).replace(/\\(.)/g, '$1');
	}
	return decodeEncodedWords(value).replace(/\s+/g, ' ').trim();
}

/**
 * Parses an address list (`"Alice" <alice@example.com>, bob@example.net`), including
 * group syntax (`undisclosed-recipients:;`) and encoded-word display names.
 * @param {string | null | undefined} value
 * @returns {Mailbox[]}
 */
export function parseAddressList(value) {
	if (!value) return [];
	/** @type {Mailbox[]} */
	const mailboxes = [];
	for (let part of splitTopLevel(value, ',')) {
		// Group syntax: `name: a@x, b@y;` — drop the group name and the terminator.
		const group = /^\s*[^"<>@,:]*:(.*)$/.exec(part);
		if (group && !/^\s*"/.test(part)) part = group[1];
		part = part.replace(/;\s*$/, '').trim();
		if (!part) continue;

		const angle = /^(.*)<([^<>]*)>\s*(?:\(.*\))?\s*$/s.exec(part);
		if (angle) {
			const address = stripComments(angle[2]).text.replace(/\s+/g, '');
			mailboxes.push({ name: cleanName(angle[1]), address, domain: domainOf(address) });
			continue;
		}
		const { text, comments } = stripComments(part);
		const address = text.replace(/\s+/g, '');
		if (!address.includes('@')) continue;
		// Old style `alice@example.com (Alice)` keeps the name in a comment.
		mailboxes.push({
			name: cleanName(comments.join(' ')),
			address,
			domain: domainOf(address)
		});
	}
	return mailboxes;
}

/**
 * Email addresses written inside a text, such as a display name.
 * @param {string} text
 */
export function findEmails(text) {
	return [...text.matchAll(EMAIL_RE)].map((match) => match[0].toLowerCase());
}

/**
 * Second-level labels under which registrations happen one level deeper (co.uk,
 * com.au...). Not a full Public Suffix List, only the common ones.
 */
const TWO_LEVEL_SUFFIXES = new Set([
	'ac.uk',
	'co.uk',
	'gov.uk',
	'ltd.uk',
	'me.uk',
	'net.uk',
	'org.uk',
	'plc.uk',
	'com.au',
	'net.au',
	'org.au',
	'edu.au',
	'gov.au',
	'co.nz',
	'org.nz',
	'co.jp',
	'ne.jp',
	'or.jp',
	'ac.jp',
	'co.kr',
	'co.in',
	'co.il',
	'co.za',
	'com.ar',
	'com.br',
	'com.cn',
	'com.hk',
	'com.mx',
	'com.my',
	'com.pl',
	'com.sg',
	'com.tr',
	'com.tw',
	'com.ua',
	'net.br',
	'org.br'
]);

/**
 * Registrable ("organizational") domain used for relaxed alignment:
 * `mail.news.example.co.uk` → `example.co.uk`.
 * @param {string | null | undefined} domain
 */
export function organizationalDomain(domain) {
	if (!domain) return '';
	const labels = domain.toLowerCase().replace(/\.$/, '').split('.').filter(Boolean);
	if (labels.length <= 2) return labels.join('.');
	const lastTwo = labels.slice(-2).join('.');
	return TWO_LEVEL_SUFFIXES.has(lastTwo) ? labels.slice(-3).join('.') : lastTwo;
}

/**
 * Relaxed alignment (DMARC style): same organizational domain.
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 */
export function sameOrganization(a, b) {
	const left = organizationalDomain(a);
	return left !== '' && left === organizationalDomain(b);
}

/**
 * Domain part of a Message-ID (`<abc@mail.example.com>` → `mail.example.com`).
 * @param {string | null | undefined} value
 */
export function messageIdDomain(value) {
	if (!value) return '';
	const match = /<?[^<>@\s]+@([^<>\s]+?)>?\s*$/.exec(value.trim());
	return match
		? match[1]
				.toLowerCase()
				.replace(/[\].]+$/, '')
				.replace(/^\[/, '')
		: '';
}
