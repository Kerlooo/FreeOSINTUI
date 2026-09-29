import { keccak } from 'hash-wasm';
import { base58CheckDecode } from './base58.js';
import { decodeSegwit } from './bech32.js';
import { t } from '$lib/i18n/i18n.svelte.js';

/** Base58Check version bytes of mainnet addresses. */
const BASE58_VERSIONS = {
	0x00: { chain: 'btc', type: 'p2pkh' },
	0x05: { chain: 'btc', type: 'p2sh' },
	0x30: { chain: 'ltc', type: 'p2pkh' },
	0x32: { chain: 'ltc', type: 'p2sh' }
};

const SEGWIT_PREFIXES = { bc: 'btc', ltc: 'ltc' };

/** @param {{ version: number, program: number[] }} segwit */
function segwitType({ version, program }) {
	if (version === 0 && program.length === 20) return 'p2wpkh';
	if (version === 0) return 'p2wsh';
	if (version === 1 && program.length === 32) return 'p2tr';
	return `witness-v${version}`;
}

/**
 * Display label of an address type in the current language.
 * @param {string} type e.g. 'p2pkh', 'p2tr', 'witness-v2', 'account'
 */
export function typeLabel(type) {
	const witness = type.match(/^witness-v(\d+)$/);
	if (witness) return t('crypto.type.witness', { version: witness[1] });
	return t(`crypto.type.${type}`);
}

/**
 * Display label of a checksum verdict in the current language.
 * @param {'eip55' | 'none' | 'bech32' | 'bech32m' | 'base58check'} kind
 */
export function checksumLabel(kind) {
	return t(`crypto.checksum.${kind}`);
}

/**
 * Successful analysis result, with labels in the current language.
 * @param {{ chain: string, address: string, type: string, checksumKind: 'eip55' | 'none' | 'bech32' | 'bech32m' | 'base58check' }} result
 */
function detected(result) {
	return {
		ok: /** @type {const} */ (true),
		...result,
		typeLabel: typeLabel(result.type),
		checksum: checksumLabel(result.checksumKind)
	};
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
 * @returns {Promise<{ ok: true, chain: 'btc' | 'ltc' | 'eth', address: string, type: string, typeLabel: string, checksumKind: 'eip55' | 'none' | 'bech32' | 'bech32m' | 'base58check', checksum: string } | { ok: false, error: string }>}
 */
export async function analyzeAddress(raw) {
	const input = raw
		.trim()
		.replace(/^(bitcoin|litecoin|ethereum):/i, '')
		.replace(/[?@].*$/, '');
	if (!input) return { ok: false, error: t('crypto.error.empty') };

	if (/^0x[0-9a-f]{40}$/i.test(input)) {
		const hex = input.slice(2);
		const mixed = hex !== hex.toLowerCase() && hex !== hex.toUpperCase();
		if (mixed && !(await isValidEip55(input))) {
			return { ok: false, error: t('crypto.error.eip55') };
		}
		return detected({
			chain: 'eth',
			address: input,
			type: 'account',
			checksumKind: mixed ? 'eip55' : 'none'
		});
	}

	const prefix = input.toLowerCase().match(/^(bc|ltc|tb|tltc|bcrt)1/)?.[1];
	if (prefix) {
		if (!SEGWIT_PREFIXES[prefix]) return { ok: false, error: t('crypto.error.testnet') };
		const segwit = decodeSegwit(input, prefix);
		if (!segwit) return { ok: false, error: t('crypto.error.bech32') };
		return detected({
			chain: SEGWIT_PREFIXES[prefix],
			address: input.toLowerCase(),
			type: segwitType(segwit),
			checksumKind: segwit.version === 0 ? 'bech32' : 'bech32m'
		});
	}

	if (/^[1-9A-HJ-NP-Za-km-z]{25,36}$/.test(input)) {
		const decoded = await base58CheckDecode(input);
		if (!decoded) return { ok: false, error: t('crypto.error.base58') };
		const version = BASE58_VERSIONS[decoded.version];
		if (!version || decoded.payload.length !== 20) {
			return { ok: false, error: t('crypto.error.version') };
		}
		return detected({ address: input, ...version, checksumKind: 'base58check' });
	}

	return { ok: false, error: t('crypto.error.unknown') };
}
