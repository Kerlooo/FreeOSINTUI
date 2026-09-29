/**
 * IP address parsing, normalization and special-range classification.
 * Addresses are handled as byte arrays (4 bytes for IPv4, 16 for IPv6).
 */

/**
 * Parses a dotted-decimal IPv4 address. Leading zeros are rejected because some
 * tools read them as octal, so `010.0.0.1` would be ambiguous.
 * @param {string} text
 * @returns {number[] | null} the 4 bytes, or null when invalid
 */
export function parseIPv4(text) {
	const parts = text.split('.');
	if (parts.length !== 4) return null;
	const bytes = [];
	for (const part of parts) {
		if (!/^(0|[1-9]\d{0,2})$/.test(part)) return null;
		const value = Number(part);
		if (value > 255) return null;
		bytes.push(value);
	}
	return bytes;
}

/**
 * Parses an IPv6 address, including `::` compression and a trailing embedded IPv4
 * (e.g. `::ffff:192.0.2.1`). Zone ids (`fe80::1%eth0`) are not accepted.
 * @param {string} text
 * @returns {number[] | null} the 16 bytes, or null when invalid
 */
export function parseIPv6(text) {
	if (!/^[0-9a-fA-F:.]+$/.test(text)) return null;
	const halves = text.split('::');
	if (halves.length > 2) return null;

	/** @param {string} half */
	const toGroups = (half) => (half === '' ? [] : half.split(':'));
	const head = toGroups(halves[0]);
	const tail = halves.length === 2 ? toGroups(halves[1]) : [];
	const all = halves.length === 2 ? tail : head;

	// An embedded IPv4 can only be the last piece and counts as two groups.
	/** @type {number[]} */
	let v4Groups = [];
	const last = all[all.length - 1];
	if (last?.includes('.')) {
		const v4 = parseIPv4(last);
		if (!v4) return null;
		all.pop();
		v4Groups = [(v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]];
	}

	for (const group of [...head, ...tail]) {
		if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
	}

	const explicit = head.length + tail.length + v4Groups.length;
	/** @type {number[]} */
	let groups;
	if (halves.length === 2) {
		// `::` must stand for at least one zero group.
		if (explicit > 7) return null;
		groups = [
			...head.map((g) => parseInt(g, 16)),
			...Array(8 - explicit).fill(0),
			...tail.map((g) => parseInt(g, 16)),
			...v4Groups
		];
	} else {
		if (explicit !== 8) return null;
		groups = [...head.map((g) => parseInt(g, 16)), ...v4Groups];
	}
	return groups.flatMap((group) => [group >> 8, group & 0xff]);
}

/**
 * Formats IPv6 bytes in the canonical RFC 5952 form (lowercase, longest zero run compressed).
 * @param {number[]} bytes 16 bytes
 */
export function formatIPv6(bytes) {
	const groups = [];
	for (let i = 0; i < 16; i += 2) groups.push((bytes[i] << 8) | bytes[i + 1]);

	let bestStart = -1;
	let bestLength = 0;
	for (let i = 0; i < 8;) {
		if (groups[i] !== 0) {
			i++;
			continue;
		}
		let j = i;
		while (j < 8 && groups[j] === 0) j++;
		if (j - i > bestLength) {
			bestStart = i;
			bestLength = j - i;
		}
		i = j;
	}

	const hex = groups.map((group) => group.toString(16));
	// A single zero group is not compressed (RFC 5952 §4.2.2).
	if (bestLength < 2) return hex.join(':');
	const head = hex.slice(0, bestStart).join(':');
	const tail = hex.slice(bestStart + bestLength).join(':');
	return `${head}::${tail}`;
}

/**
 * Parses an IPv4 or IPv6 address and returns it in canonical form.
 * IPv4-mapped IPv6 addresses (`::ffff:a.b.c.d`) are turned into the plain IPv4 address.
 * @param {string} text
 * @returns {{ version: 4 | 6, address: string, bytes: number[], mapped: boolean } | null}
 */
export function parseIp(text) {
	const value = text.trim().replace(/^\[(.*)\]$/, '$1');
	const v4 = parseIPv4(value);
	if (v4) return { version: 4, address: v4.join('.'), bytes: v4, mapped: false };

	const v6 = parseIPv6(value);
	if (!v6) return null;
	const isMapped = v6.slice(0, 10).every((b) => b === 0) && v6[10] === 0xff && v6[11] === 0xff;
	if (isMapped) {
		const bytes = v6.slice(12);
		return { version: 4, address: bytes.join('.'), bytes, mapped: true };
	}
	return { version: 6, address: formatIPv6(v6), bytes: v6, mapped: false };
}

/** Hostname: dot-separated LDH labels ending in an alphabetic (or punycode) TLD. */
const HOSTNAME_RE =
	/^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/**
 * Reads the user input: an IP address, a hostname or a URL (its host is used).
 * @param {string} text
 * @returns {{ kind: 'ip', ip: NonNullable<ReturnType<typeof parseIp>> } | { kind: 'hostname', hostname: string } | { kind: 'error', error: string }}
 */
export function parseInput(text) {
	let value = text.trim();
	if (!value) return { kind: 'error', error: 'Enter an IP address or a hostname.' };

	const ip = parseIp(value);
	if (ip) return { kind: 'ip', ip };

	// Accept a pasted URL or host:port and keep only the host.
	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
		try {
			value = new URL(value).hostname;
		} catch {
			return { kind: 'error', error: 'That URL is not valid.' };
		}
		const hostIp = parseIp(value);
		if (hostIp) return { kind: 'ip', ip: hostIp };
	}
	value = value
		.replace(/[/?#].*$/, '')
		.replace(/:\d+$/, '')
		.replace(/\.$/, '')
		.toLowerCase();

	if (HOSTNAME_RE.test(value)) return { kind: 'hostname', hostname: value };
	if (/^[\d.]+$/.test(value) || value.includes(':'))
		return { kind: 'error', error: 'That is not a valid IPv4 or IPv6 address.' };
	return { kind: 'error', error: 'Enter a valid IP address (IPv4 or IPv6) or a hostname.' };
}

/**
 * Special-purpose ranges (IANA registries). The first match wins, so specific
 * ranges come before broader ones.
 */
const SPECIAL_RANGES = [
	// IPv4
	['0.0.0.0/8', 'This network', 'Unspecified / "this network" address (0.0.0.0/8).'],
	['10.0.0.0/8', 'Private', 'Private network range (RFC 1918), used inside LANs.'],
	['100.64.0.0/10', 'CGNAT', 'Carrier-grade NAT range (RFC 6598), shared by ISP customers.'],
	['127.0.0.0/8', 'Loopback', 'Loopback address: it always points to the local machine.'],
	['169.254.0.0/16', 'Link-local', 'Link-local address (RFC 3927), self-assigned on a LAN.'],
	['172.16.0.0/12', 'Private', 'Private network range (RFC 1918), used inside LANs.'],
	['192.0.0.0/24', 'Reserved', 'IETF protocol assignments range (RFC 6890).'],
	['192.0.2.0/24', 'Documentation', 'Documentation range TEST-NET-1 (RFC 5737).'],
	['192.168.0.0/16', 'Private', 'Private network range (RFC 1918), used inside LANs.'],
	['198.18.0.0/15', 'Benchmarking', 'Network benchmarking range (RFC 2544).'],
	['198.51.100.0/24', 'Documentation', 'Documentation range TEST-NET-2 (RFC 5737).'],
	['203.0.113.0/24', 'Documentation', 'Documentation range TEST-NET-3 (RFC 5737).'],
	['224.0.0.0/4', 'Multicast', 'Multicast range: it identifies a group, not a host.'],
	['255.255.255.255/32', 'Broadcast', 'Limited broadcast address.'],
	['240.0.0.0/4', 'Reserved', 'Reserved for future use (class E).'],
	// IPv6
	['::/128', 'Unspecified', 'Unspecified IPv6 address.'],
	['::1/128', 'Loopback', 'Loopback address: it always points to the local machine.'],
	['100::/64', 'Discard', 'Discard-only range (RFC 6666).'],
	['2001:db8::/32', 'Documentation', 'Documentation range (RFC 3849).'],
	['3fff::/20', 'Documentation', 'Documentation range (RFC 9637).'],
	['fc00::/7', 'Private', 'Unique local address (RFC 4193), the IPv6 private range.'],
	['fe80::/10', 'Link-local', 'Link-local address, valid only on the local network segment.'],
	['ff00::/8', 'Multicast', 'Multicast range: it identifies a group, not a host.']
].map(([cidr, label, description]) => {
	const [network, length] = cidr.split('/');
	const parsed = /** @type {NonNullable<ReturnType<typeof parseIp>>} */ (parseIp(network));
	return { cidr, label, description, bytes: parsed.bytes, length: Number(length) };
});

/**
 * @param {number[]} bytes
 * @param {number[]} network
 * @param {number} length prefix length in bits
 */
function inPrefix(bytes, network, length) {
	if (bytes.length !== network.length) return false;
	for (let bit = 0; bit < length; bit += 8) {
		const bits = Math.min(8, length - bit);
		const mask = (0xff << (8 - bits)) & 0xff;
		const i = bit / 8;
		if ((bytes[i] & mask) !== (network[i] & mask)) return false;
	}
	return true;
}

/**
 * Tells whether an address is in a special-purpose (non-public) range.
 * Returns null for public, globally routable addresses.
 * @param {number[]} bytes 4 or 16 bytes, as returned by parseIp
 * @returns {{ cidr: string, label: string, description: string } | null}
 */
export function classifyIp(bytes) {
	const match = SPECIAL_RANGES.find((range) => inPrefix(bytes, range.bytes, range.length));
	if (match) return { cidr: match.cidr, label: match.label, description: match.description };
	// Only 2000::/3 is allocated as global unicast; the rest of the IPv6 space is reserved.
	if (bytes.length === 16 && (bytes[0] & 0xe0) !== 0x20)
		return {
			cidr: 'outside 2000::/3',
			label: 'Reserved',
			description: 'Outside the global unicast range (2000::/3): not routable on the internet.'
		};
	return null;
}
