import { md5, sha256 } from 'hash-wasm';
import { murmur3 } from './mmh3.js';

/** Largest favicon accepted: real ones are a few KB, this only guards against huge files. */
export const MAX_FAVICON_BYTES = 5 * 1024 * 1024;

/**
 * Base64 of `bytes` with a newline every 76 characters and a trailing newline,
 * exactly like Python's `base64.encodebytes()` (empty input gives an empty string).
 * @param {Uint8Array} bytes
 */
export function base64Lines(bytes) {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk)
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	const encoded = btoa(binary);
	return encoded.replace(/.{1,76}/g, '$&\n');
}

/**
 * Shodan's favicon hash: mmh3 of the line-wrapped base64 of the raw bytes.
 * @param {Uint8Array} bytes
 */
export function shodanFaviconHash(bytes) {
	return murmur3(new TextEncoder().encode(base64Lines(bytes)));
}

/**
 * All hashes shown by the tool.
 * @param {Uint8Array} bytes
 * @returns {Promise<{ mmh3: number, md5: string, sha256: string }>}
 */
export async function faviconHashes(bytes) {
	const [md5Hex, sha256Hex] = await Promise.all([md5(bytes), sha256(bytes)]);
	return { mmh3: shodanFaviconHash(bytes), md5: md5Hex, sha256: sha256Hex };
}

/** @param {string} text */
const base64Utf8 = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));

/**
 * Search engine queries and links for a favicon's hashes.
 * @param {{ mmh3: number, md5: string, sha256: string }} hashes
 * @returns {{ id: string, name: string, hash: 'mmh3' | 'md5' | 'sha256', query: string, url: string }[]}
 */
export function searchLinks({ mmh3, md5, sha256 }) {
	const fofa = `icon_hash="${mmh3}"`;
	const zoomeye = `iconhash="${md5}"`;
	const censys = `host.services.endpoints.http.favicons.hash_md5="${md5}" or web.endpoints.http.favicons.hash_md5="${md5}"`;
	const shodan = `http.favicon.hash:${mmh3}`;
	const urlscan = `hash:${sha256}`;
	return [
		{
			id: 'shodan',
			name: 'Shodan',
			hash: 'mmh3',
			query: shodan,
			url: `https://www.shodan.io/search?query=${encodeURIComponent(shodan)}`
		},
		{
			id: 'fofa',
			name: 'FOFA',
			hash: 'mmh3',
			query: fofa,
			url: `https://en.fofa.info/result?qbase64=${encodeURIComponent(base64Utf8(fofa))}`
		},
		{
			id: 'zoomeye',
			name: 'ZoomEye',
			hash: 'md5',
			query: zoomeye,
			url: `https://www.zoomeye.ai/searchResult?q=${encodeURIComponent(base64Utf8(zoomeye))}`
		},
		{
			id: 'censys',
			name: 'Censys',
			hash: 'md5',
			query: censys,
			url: `https://platform.censys.io/search?q=${encodeURIComponent(censys)}`
		},
		{
			id: 'urlscan',
			name: 'urlscan.io',
			hash: 'sha256',
			query: urlscan,
			url: `https://urlscan.io/search/#${encodeURIComponent(urlscan)}`
		}
	];
}
