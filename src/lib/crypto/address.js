import { keccak } from 'hash-wasm';
import { base58CheckDecode } from './base58.js';
import { decodeSegwit } from './bech32.js';

/** Base58Check version bytes of mainnet addresses. */
const BASE58_VERSIONS = {
	0x00: { chain: 'btc', type: 'p2pkh', typeLabel: 'P2PKH (legacy)' },
	0x05: { chain: 'btc', type: 'p2sh', typeLabel: 'P2SH (script / nested SegWit)' },
	0x30: { chain: 'ltc', type: 'p2pkh', typeLabel: 'P2PKH (legacy)' },
	0x32: { chain: 'ltc', type: 'p2sh', typeLabel: 'P2SH (script / nested SegWit)' }
};

const SEGWIT_PREFIXES = { bc: 'btc', ltc: 'ltc' };

/** @param {{ version: number, program: number[] }} segwit */
function segwitType({ version, program }) {
	if (version === 0 && program.length === 20)
		return { type: 'p2wpkh', typeLabel: 'P2WPKH (native SegWit)' };
	if (version === 0) return { type: 'p2wsh', typeLabel: 'P2WSH (native SegWit script)' };
	if (version === 1 && program.length === 32) return { type: 'p2tr', typeLabel: 'P2TR (Taproot)' };
	return { type: `witness-v${version}`, typeLabel: `SegWit v${version}` };
}

/**
 * Verifies the EIP-55 mixed-case checksum of an Ethereum address.
 * @param {string} address 0x + 40 hex characters
 */
export async function isValidEip55(address) {
	const hex = address.slice(2);
	const hash = await keccak(hex.toLowerCase(), 256);
	return [...hex].every((char, i) => {
		if (!/[a-f]/i.test(char)) return true;
		const upper = parseInt(hash[i], 16) >= 8;
		return upper ? char === char.toUpperCase() : char === char.toLowerCase();
	});
}

/**
 * Detects the chain and type of a wallet address and verifies its checksum
 * (Base58Check, Bech32/Bech32m or EIP-55).
 * @param {string} raw
 * @returns {Promise<{ ok: true, chain: 'btc' | 'ltc' | 'eth', address: string, type: string, typeLabel: string, checksum: string } | { ok: false, error: string }>}
 */
export async function analyzeAddress(raw) {
	const input = raw
		.trim()
		.replace(/^(bitcoin|litecoin|ethereum):/i, '')
		.replace(/[?@].*$/, '');
	if (!input) return { ok: false, error: 'Enter a wallet address.' };

	if (/^0x[0-9a-f]{40}$/i.test(input)) {
		const hex = input.slice(2);
		const mixed = hex !== hex.toLowerCase() && hex !== hex.toUpperCase();
		if (mixed && !(await isValidEip55(input))) {
			return { ok: false, error: 'Invalid EIP-55 checksum: the address has a typo.' };
		}
		return {
			ok: true,
			chain: 'eth',
			address: input,
			type: 'account',
			typeLabel: 'Account (EOA or contract)',
			checksum: mixed ? 'EIP-55 checksum valid' : 'No checksum (single-case address)'
		};
	}

	const prefix = input.toLowerCase().match(/^(bc|ltc|tb|tltc|bcrt)1/)?.[1];
	if (prefix) {
		if (!SEGWIT_PREFIXES[prefix])
			return { ok: false, error: 'Testnet addresses are not supported.' };
		const segwit = decodeSegwit(input, prefix);
		if (!segwit)
			return { ok: false, error: 'Invalid Bech32 address (bad characters or checksum).' };
		return {
			ok: true,
			chain: SEGWIT_PREFIXES[prefix],
			address: input.toLowerCase(),
			...segwitType(segwit),
			checksum: `${segwit.version === 0 ? 'Bech32' : 'Bech32m'} checksum valid`
		};
	}

	if (/^[1-9A-HJ-NP-Za-km-z]{25,36}$/.test(input)) {
		const decoded = await base58CheckDecode(input);
		if (!decoded)
			return { ok: false, error: 'Invalid Base58Check checksum: the address has a typo.' };
		const version = BASE58_VERSIONS[decoded.version];
		if (!version || decoded.payload.length !== 20) {
			return { ok: false, error: 'Unsupported address version (testnet or another coin).' };
		}
		return { ok: true, address: input, ...version, checksum: 'Base58Check checksum valid' };
	}

	return {
		ok: false,
		error: 'Not a recognized Bitcoin, Litecoin or Ethereum address.'
	};
}
