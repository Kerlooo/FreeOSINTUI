// MAC address parsing, normalized notations and the flags carried by the first octet.

/**
 * @typedef {object} ParsedMac
 * @property {string} input
 * @property {string} hex 12 uppercase hex digits, or 6 for an OUI prefix alone
 * @property {boolean} prefixOnly true when only the OUI (first 3 octets) was given
 * @property {boolean} multicast I/G bit: group address
 * @property {boolean} local U/L bit: locally administered (not assigned by IEEE)
 * @property {boolean} broadcast FF:FF:FF:FF:FF:FF
 * @property {{ id: string, value: string }[]} formats key of `mac.format.<id>` and value
 */

/** Separated notations: 6 (or 3 for a prefix) groups of 1-2 hex digits. */
const SEPARATED = /^[0-9a-f]{1,2}([:\- .])[0-9a-f]{1,2}(?:\1[0-9a-f]{1,2}){1,4}$/i;
const CISCO = /^[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}$/i;

/**
 * Hex digits of a MAC or OUI in any common notation, or null.
 * @param {string} text
 */
export function macHex(text) {
	const value = text.trim();
	if (/^[0-9a-f]{12}$/i.test(value) || /^[0-9a-f]{6}$/i.test(value)) return value.toUpperCase();
	if (CISCO.test(value)) return value.replaceAll('.', '').toUpperCase();
	if (SEPARATED.test(value)) {
		const groups = value.split(/[:\- .]/);
		if (groups.length !== 6 && groups.length !== 3) return null;
		return groups
			.map((group) => group.padStart(2, '0'))
			.join('')
			.toUpperCase();
	}
	return null;
}

/** @param {string} hex @param {string} separator */
function octets(hex, separator) {
	return /** @type {string[]} */ (hex.match(/../g)).join(separator);
}

/**
 * Modified EUI-64 interface identifier (RFC 4291): FFFE inserted in the middle and the
 * U/L bit flipped. This is what SLAAC puts in the second half of an IPv6 address.
 * @param {string} hex 12 hex digits
 */
export function eui64InterfaceId(hex) {
	const first = (parseInt(hex.slice(0, 2), 16) ^ 0x02).toString(16).padStart(2, '0');
	const eui = `${first}${hex.slice(2, 6)}fffe${hex.slice(6)}`.toLowerCase();
	return /** @type {string[]} */ (eui.match(/.{4}/g))
		.map((group) => group.replace(/^0+(?=.)/, ''))
		.join(':');
}

/**
 * Parses a MAC address (or a bare OUI) and describes it.
 * @param {string} text
 * @returns {ParsedMac | null}
 */
export function parseMac(text) {
	const hex = macHex(text);
	if (!hex) return null;
	const first = parseInt(hex.slice(0, 2), 16);
	const prefixOnly = hex.length === 6;
	const lower = hex.toLowerCase();

	const formats = prefixOnly
		? [
				{ id: 'colon', value: octets(hex, ':') },
				{ id: 'hyphen', value: octets(hex, '-') },
				{ id: 'bare', value: hex }
			]
		: [
				{ id: 'colon', value: octets(hex, ':') },
				{ id: 'colonLower', value: octets(lower, ':') },
				{ id: 'hyphen', value: octets(hex, '-') },
				{ id: 'cisco', value: /** @type {string[]} */ (lower.match(/.{4}/g)).join('.') },
				{ id: 'bare', value: hex },
				{ id: 'eui64', value: eui64InterfaceId(hex) },
				{ id: 'linkLocal', value: `fe80::${eui64InterfaceId(hex)}` }
			];

	return {
		input: text.trim(),
		hex,
		prefixOnly,
		multicast: (first & 0x01) === 1,
		local: (first & 0x02) === 2,
		broadcast: hex === 'FFFFFFFFFFFF',
		formats
	};
}

/**
 * One entry per non-empty line (commas and semicolons also separate).
 * @param {string} text
 * @returns {{ input: string, mac: ParsedMac | null }[]}
 */
export function parseMacList(text) {
	return text
		.split(/[\n,;]+/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((input) => ({ input, mac: parseMac(input) }));
}
