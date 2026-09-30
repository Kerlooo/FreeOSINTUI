/**
 * Email header analysis: puts together the parsed fields, the Received chain,
 * the authentication results, the triage findings and the pivots. Offline.
 */

import { parseIp } from '$lib/ip/address.js';
import {
	findEmails,
	messageIdDomain,
	organizationalDomain,
	parseAddressList,
	sameOrganization
} from './address.js';
import {
	parseArcTags,
	parseAuthenticationResults,
	parseDkimSignature,
	parseReceivedSpf,
	resultDomain
} from './auth.js';
import { decodeEncodedWords, getAll, getFirst, parseHeaders, parseMailDate } from './parse.js';
import { buildChain } from './received.js';

/** Fields shown in the summary, in display order. */
export const SUMMARY_FIELDS = [
	'From',
	'Sender',
	'Reply-To',
	'Return-Path',
	'To',
	'Cc',
	'Subject',
	'Date',
	'Message-ID',
	'X-Mailer',
	'User-Agent',
	'List-Unsubscribe',
	'Content-Type'
];

/** Headers some providers add with the client's IP address. */
export const SOURCE_IP_HEADERS = [
	'X-Originating-IP',
	'X-Sender-IP',
	'X-Source-IP',
	'X-Client-IP',
	'X-Remote-IP',
	'X-Real-IP',
	'X-MS-Exchange-Organization-OriginalClientIPAddress',
	'X-Forwarded-For'
];

/**
 * Ranges that never identify the sender on the Internet: private, loopback,
 * link-local, CGNAT, unspecified, unique local. Documentation ranges are not
 * listed here on purpose (they are what examples use).
 */
const INTERNAL_RANGES = [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.168.0.0', 16],
	['::', 128],
	['::1', 128],
	['fc00::', 7],
	['fe80::', 10]
].map(([network, length]) => ({
	bytes: /** @type {NonNullable<ReturnType<typeof parseIp>>} */ (parseIp(String(network))).bytes,
	length: Number(length)
}));

/**
 * @param {number[]} bytes
 * @param {number[]} network
 * @param {number} length
 */
function inPrefix(bytes, network, length) {
	if (bytes.length !== network.length) return false;
	for (let bit = 0; bit < length; bit += 8) {
		const bits = Math.min(8, length - bit);
		const mask = (0xff << (8 - bits)) & 0xff;
		if ((bytes[bit / 8] & mask) !== (network[bit / 8] & mask)) return false;
	}
	return true;
}

/**
 * True for addresses that belong to a local network rather than the Internet.
 * @param {string} address
 */
export function isInternalIp(address) {
	const ip = parseIp(address);
	if (!ip) return false;
	return INTERNAL_RANGES.some((range) => inPrefix(ip.bytes, range.bytes, range.length));
}

/** X-Mailer / User-Agent values of mass-mailing scripts often seen in spam and phishing. */
const SUSPICIOUS_MAILERS = [
	/php\s*mailer/i,
	/\bleaf\b/i,
	/swift\s*mailer/i,
	/send\s*blaster/i,
	/atomic\s*mail/i,
	/turbo[\s-]*mailer/i,
	/mass\s*mail/i,
	/bulk\s*mail/i,
	/gammadyne/i,
	/microsoft\s+cdo/i,
	/\bpython\b|smtplib/i,
	/\bperl\b/i,
	/^\s*php\//i
];

/** Delay between the Date header and the first Received stamp worth a note. */
export const DATE_DRIFT_MS = 60 * 60_000;
export const DATE_DRIFT_LARGE_MS = 24 * 60 * 60_000;

/** Severity order used to sort findings. */
export const SEVERITIES = ['high', 'medium', 'low', 'info'];

/**
 * @typedef {{ id: string, severity: 'high' | 'medium' | 'low' | 'info', params: Record<string, string | number> }} Finding
 */

/**
 * Overall result of a method in one Authentication-Results header: a pass wins
 * (several DKIM signatures can coexist), otherwise the first result.
 * @param {import('./auth.js').AuthResult[]} results
 * @param {string} method
 */
function methodResult(results, method) {
	const matching = results.filter((result) => result.method === method);
	if (!matching.length) return null;
	return matching.find((result) => result.result === 'pass') ?? matching[0];
}

/** @param {string} value */
function firstIpIn(value) {
	for (const token of value.split(/[\s,;[\]()]+/)) {
		const ip = parseIp(token.replace(/^IPv6:/i, ''));
		if (ip) return ip.address;
	}
	return null;
}

/**
 * @param {ReturnType<typeof collect>} data
 * @returns {Finding[]}
 */
function computeFindings(data) {
	/** @type {Finding[]} */
	const findings = [];
	/**
	 * @param {string} id
	 * @param {Finding['severity']} severity
	 * @param {Record<string, string | number>} [params]
	 */
	const add = (id, severity, params = {}) => findings.push({ id, severity, params });

	const { from, replyTo, returnPath, chain, verdict, dkimDomains, messageId, date } = data;
	const sender = from[0] ?? null;
	const fromDomain = sender?.domain ?? '';

	if (!from.length) add('missingFrom', 'medium');
	else if (from.length > 1) add('multipleFrom', 'medium', { count: from.length });

	if (
		sender &&
		returnPath &&
		returnPath.domain &&
		!sameOrganization(returnPath.domain, fromDomain)
	) {
		add('returnPathMismatch', 'medium', { from: fromDomain, returnPath: returnPath.domain });
	}

	if (sender) {
		const different = replyTo.filter(
			(mailbox) => mailbox.address.toLowerCase() !== sender.address.toLowerCase()
		);
		if (different.length) {
			const otherOrg = different.some((mailbox) => !sameOrganization(mailbox.domain, fromDomain));
			add('replyToDiffers', otherOrg ? 'medium' : 'low', {
				from: sender.address,
				replyTo: different.map((mailbox) => mailbox.address).join(', ')
			});
		}
	}

	for (const mailbox of from) {
		const inName = findEmails(mailbox.name).filter(
			(email) => email !== mailbox.address.toLowerCase()
		);
		if (inName.length) {
			add('displayNameEmail', 'high', { name: inName[0], address: mailbox.address });
		}
	}

	const { spf, dkim, dmarc } = verdict;
	if (!verdict.hasAuthResults && !spf) {
		add('noAuthResults', 'info');
	}
	if (dmarc === 'fail') add('dmarcFail', 'high');
	else if (dmarc === 'none') add('dmarcNone', 'medium');
	else if (dmarc === 'temperror' || dmarc === 'permerror')
		add('authError', 'low', { method: 'DMARC', result: dmarc });

	if (spf === 'fail') add('spfFail', 'high', { result: spf });
	else if (spf === 'softfail') add('spfFail', 'medium', { result: spf });
	else if (spf === 'none' || spf === 'neutral') add('spfNone', 'low', { result: spf });
	else if (spf === 'temperror' || spf === 'permerror')
		add('authError', 'low', { method: 'SPF', result: spf });

	if (dkim === 'fail' || dkim === 'policy') add('dkimFail', 'medium', { result: dkim });
	else if (dkim === 'none' || (dkim === null && !data.dkimSignatures.length))
		add('dkimNone', 'low');
	else if (dkim === 'temperror' || dkim === 'permerror')
		add('authError', 'low', { method: 'DKIM', result: dkim });

	if (
		fromDomain &&
		dkimDomains.length &&
		!dkimDomains.some((domain) => sameOrganization(domain, fromDomain))
	) {
		add('dkimNotAligned', 'medium', { domains: dkimDomains.join(', '), from: fromDomain });
	}

	if (spf === 'pass' && dkim === 'pass' && dmarc === 'pass') add('authPass', 'info');

	const idDomain = messageIdDomain(messageId);
	if (fromDomain && idDomain.includes('.') && !sameOrganization(idDomain, fromDomain)) {
		add('messageIdUnrelated', 'low', { domain: idDomain, from: fromDomain });
	}

	const firstStamp = chain.start;
	if (date !== null && firstStamp !== null) {
		const drift = firstStamp - date;
		if (Math.abs(drift) > DATE_DRIFT_MS) {
			add('dateDrift', Math.abs(drift) > DATE_DRIFT_LARGE_MS ? 'medium' : 'low', {
				durationMs: drift
			});
		}
	}

	const negative = chain.hops.filter((hop) => hop.negative).length;
	if (negative) add('clockSkew', 'low', { count: negative });
	const slow = chain.hops.filter((hop) => hop.slow).length;
	if (slow) add('slowHop', 'info', { count: slow });
	if (!chain.hops.length) add('noReceived', 'info');

	if (data.mailer && SUSPICIOUS_MAILERS.some((pattern) => pattern.test(data.mailer ?? ''))) {
		add('suspiciousMailer', 'low', { mailer: data.mailer });
	}

	return findings.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));
}

/**
 * Reads every piece of data the page and the findings need.
 * @param {import('./parse.js').Header[]} headers
 */
function collect(headers) {
	const from = parseAddressList(getFirst(headers, 'From'));
	const replyTo = parseAddressList(getFirst(headers, 'Reply-To'));
	const sender = parseAddressList(getFirst(headers, 'Sender'))[0] ?? null;
	const returnPathValue = getFirst(headers, 'Return-Path');
	const returnPath = parseAddressList(returnPathValue)[0] ?? null;
	const to = parseAddressList(getFirst(headers, 'To'));
	const cc = parseAddressList(getFirst(headers, 'Cc'));
	const dateText = getFirst(headers, 'Date');
	const messageId = getFirst(headers, 'Message-ID');
	const mailer = getFirst(headers, 'X-Mailer') ?? getFirst(headers, 'User-Agent');

	const chain = buildChain(getAll(headers, 'Received'));

	// The topmost Authentication-Results is the one added by the receiving server;
	// lower ones travelled with the message and can be forged.
	const authResults = getAll(headers, 'Authentication-Results').map(parseAuthenticationResults);
	const arcAuthResults = getAll(headers, 'ARC-Authentication-Results').map(
		parseAuthenticationResults
	);
	const receivedSpf = getAll(headers, 'Received-SPF').map(parseReceivedSpf);
	const dkimSignatures = getAll(headers, 'DKIM-Signature').map(parseDkimSignature);
	const arcSeals = getAll(headers, 'ARC-Seal').map(parseArcTags);
	const arcMessageSignatures = getAll(headers, 'ARC-Message-Signature').map(parseArcTags);

	const primary = authResults[0]?.results ?? [];
	const spfResult = methodResult(primary, 'spf');
	const dkimResult = methodResult(primary, 'dkim');
	const dmarcResult = methodResult(primary, 'dmarc');
	const arcResult = methodResult(primary, 'arc');
	const verdict = {
		hasAuthResults: authResults.length > 0,
		spf: spfResult?.result ?? receivedSpf[0]?.result ?? null,
		dkim: dkimResult?.result ?? null,
		dmarc: dmarcResult?.result ?? null,
		arc: arcResult?.result ?? null,
		spfDomain: spfResult ? resultDomain(spfResult) : null,
		dkimDomain: dkimResult ? resultDomain(dkimResult) : null,
		dmarcDomain: dmarcResult ? resultDomain(dmarcResult) : null
	};

	// Signing domains for the alignment check: the ones that passed if the receiver
	// says so, otherwise every DKIM-Signature d=.
	const passedDkim = primary
		.filter((result) => result.method === 'dkim' && result.result === 'pass')
		.map(resultDomain)
		.filter(Boolean);
	const dkimDomains = [
		...new Set(passedDkim.length ? passedDkim : dkimSignatures.map((s) => s.domain).filter(Boolean))
	];

	/** @type {{ name: string, value: string, ip: string | null }[]} */
	const sourceIps = [];
	for (const name of SOURCE_IP_HEADERS) {
		for (const value of getAll(headers, name)) {
			sourceIps.push({ name, value, ip: firstIpIn(value) });
		}
	}

	return {
		from,
		replyTo,
		sender,
		returnPath,
		returnPathValue,
		to,
		cc,
		dateText,
		date: parseMailDate(dateText),
		messageId,
		mailer,
		chain,
		authResults,
		arcAuthResults,
		receivedSpf,
		dkimSignatures,
		arcSeals,
		arcMessageSignatures,
		verdict,
		dkimDomains,
		sourceIps
	};
}

/**
 * First hop (from the origin) whose sending side has an Internet address.
 * @param {ReturnType<typeof buildChain>} chain
 * @returns {{ ip: string, hopIndex: number, host: string | null } | null}
 */
export function findOrigin(chain) {
	for (const hop of chain.hops) {
		const ip = hop.fromIps.find((address) => !isInternalIp(address));
		if (ip) return { ip, hopIndex: hop.index, host: hop.fromRdns ?? hop.from };
	}
	return null;
}

/**
 * @param {ReturnType<typeof collect>} data
 */
function collectPivots(data) {
	/** @type {Map<string, { address: string, internal: boolean }>} */
	const ips = new Map();
	/** @param {string | null | undefined} address */
	const addIp = (address) => {
		const ip = address ? parseIp(address) : null;
		if (ip && !ips.has(ip.address))
			ips.set(ip.address, { address: ip.address, internal: isInternalIp(ip.address) });
	};
	for (const item of data.sourceIps) addIp(item.ip);
	for (const hop of data.chain.hops) hop.fromIps.forEach(addIp);
	for (const spf of data.receivedSpf) addIp(spf.props['client-ip']);

	const mailboxes = [
		...data.from,
		...(data.sender ? [data.sender] : []),
		...data.replyTo,
		...(data.returnPath ? [data.returnPath] : []),
		...data.to,
		...data.cc
	];
	const emails = new Set(
		mailboxes.map((m) => m.address.toLowerCase()).filter((a) => a.includes('@'))
	);
	for (const mailbox of data.from) findEmails(mailbox.name).forEach((email) => emails.add(email));

	const domains = new Set(
		[
			...data.from.map((m) => m.domain),
			data.sender?.domain,
			...data.replyTo.map((m) => m.domain),
			data.returnPath?.domain,
			...data.dkimSignatures.map((s) => s.domain),
			data.verdict.spfDomain,
			data.verdict.dmarcDomain,
			messageIdDomain(data.messageId)
		]
			.filter((domain) => domain && domain.includes('.') && !parseIp(domain))
			.map((domain) => /** @type {string} */ (domain).toLowerCase())
	);

	return { ips: [...ips.values()], domains: [...domains], emails: [...emails] };
}

/**
 * Analyzes pasted headers (or a whole message).
 * @param {string} text
 */
export function analyzeHeaders(text) {
	const { headers, ignored } = parseHeaders(text);
	if (!headers.length) return null;
	const data = collect(headers);

	const summary = SUMMARY_FIELDS.map((name) => ({ name, value: getFirst(headers, name) }))
		.filter((field) => field.value !== null)
		.map((field) => ({
			name: field.name,
			value: decodeEncodedWords(/** @type {string} */ (field.value))
		}));

	const shown = new Set(
		[...SUMMARY_FIELDS, 'Received', ...SOURCE_IP_HEADERS].map((n) => n.toLowerCase())
	);
	const otherHeaders = headers.filter(
		(header) => header.key.startsWith('x-') && !shown.has(header.key)
	);

	return {
		headers,
		ignored,
		summary,
		from: data.from,
		chain: data.chain,
		origin: findOrigin(data.chain),
		sourceIps: data.sourceIps.map((item) => ({
			...item,
			internal: item.ip ? isInternalIp(item.ip) : false
		})),
		auth: {
			verdict: data.verdict,
			authResults: data.authResults,
			arcAuthResults: data.arcAuthResults,
			receivedSpf: data.receivedSpf,
			dkimSignatures: data.dkimSignatures,
			arcSeals: data.arcSeals,
			arcMessageSignatures: data.arcMessageSignatures
		},
		findings: computeFindings(data),
		pivots: collectPivots(data),
		otherHeaders,
		fromOrganization: organizationalDomain(data.from[0]?.domain)
	};
}
