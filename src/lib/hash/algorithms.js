import {
	createBLAKE2b,
	createBLAKE3,
	createCRC32,
	createMD5,
	createRIPEMD160,
	createSHA1,
	createSHA224,
	createSHA256,
	createSHA3,
	createSHA384,
	createSHA512
} from 'hash-wasm';

/**
 * Algorithms computed by the hash tool, in display order.
 * `hexLength` is the length of the hex digest, used to identify hashes.
 */
export const ALGORITHMS = [
	{ id: 'md5', label: 'MD5', hexLength: 32, create: () => createMD5() },
	{ id: 'sha1', label: 'SHA-1', hexLength: 40, create: () => createSHA1() },
	{ id: 'sha224', label: 'SHA-224', hexLength: 56, create: () => createSHA224() },
	{ id: 'sha256', label: 'SHA-256', hexLength: 64, create: () => createSHA256() },
	{ id: 'sha384', label: 'SHA-384', hexLength: 96, create: () => createSHA384() },
	{ id: 'sha512', label: 'SHA-512', hexLength: 128, create: () => createSHA512() },
	{ id: 'sha3-256', label: 'SHA3-256', hexLength: 64, create: () => createSHA3(256) },
	{ id: 'sha3-512', label: 'SHA3-512', hexLength: 128, create: () => createSHA3(512) },
	{ id: 'blake2b-512', label: 'BLAKE2b-512', hexLength: 128, create: () => createBLAKE2b(512) },
	{ id: 'blake3', label: 'BLAKE3', hexLength: 64, create: () => createBLAKE3() },
	{ id: 'ripemd160', label: 'RIPEMD-160', hexLength: 40, create: () => createRIPEMD160() },
	{ id: 'crc32', label: 'CRC32', hexLength: 8, create: () => createCRC32() }
];
