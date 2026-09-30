// Downloads the IEEE MAC address registries (MA-L, MA-M, MA-S) and writes the compact
// vendor table used by the MAC Address Vendor Lookup (/mac): static/data/oui.json.
//
// Run manually: `node scripts/update-oui.js`
// Offline, from CSV files already downloaded into a folder: `node scripts/update-oui.js --from <dir>`
// (file names: oui.csv, mam.csv, oui36.csv).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SOURCES = [
	{ key: 'l', file: 'oui.csv', url: 'https://standards-oui.ieee.org/oui/oui.csv', length: 6 },
	{ key: 'm', file: 'mam.csv', url: 'https://standards-oui.ieee.org/oui28/mam.csv', length: 7 },
	{ key: 's', file: 'oui36.csv', url: 'https://standards-oui.ieee.org/oui36/oui36.csv', length: 9 }
];

// IEEE rejects some non-browser clients.
const USER_AGENT =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const OUTPUT = path.resolve(import.meta.dirname, '../static/data/oui.json');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * Minimal RFC 4180 parser: quoted fields, doubled quotes, newlines inside quotes.
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsv(text) {
	const rows = [];
	let row = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (quoted) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					quoted = false;
				}
			} else {
				field += char;
			}
		} else if (char === '"') {
			quoted = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n' || char === '\r') {
			if (char === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}
	if (field || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows;
}

/**
 * Best-effort ISO country code: IEEE addresses end with "<country> <postal code>".
 * @param {string} address
 */
function countryCode(address) {
	const match = /.*\s([A-Z]{2})(?:\s+[A-Z0-9][A-Z0-9 -]{0,11})?\s*$/.exec(` ${address.trim()}`);
	if (!match) return null;
	const code = match[1];
	return regionNames.of(code) !== code ? code : null;
}

/** @param {{ file: string, url: string }} source @param {string | null} fromDir */
async function load(source, fromDir) {
	if (fromDir) return readFile(path.join(fromDir, source.file), 'utf8');
	const response = await fetch(source.url, { headers: { 'user-agent': USER_AGENT } });
	if (!response.ok) throw new Error(`${source.url}: HTTP ${response.status}`);
	return response.text();
}

async function main() {
	const fromIndex = process.argv.indexOf('--from');
	const fromDir = fromIndex > -1 ? process.argv[fromIndex + 1] : null;

	/** @type {Record<string, Record<string, string | [string, string]>>} */
	const data = {};
	for (const source of SOURCES) {
		const rows = parseCsv(await load(source, fromDir));
		const table = {};
		for (const [registry, assignment, name, address = ''] of rows.slice(1)) {
			if (!registry || !assignment) continue;
			const prefix = assignment.trim().toUpperCase();
			if (!new RegExp(`^[0-9A-F]{${source.length}}$`).test(prefix)) continue;
			const organization = name.replace(/\s+/g, ' ').trim();
			if (!organization) continue;
			const country = countryCode(address);
			table[prefix] = country ? [organization, country] : organization;
		}
		data[source.key] = Object.fromEntries(
			Object.entries(table).sort(([a], [b]) => a.localeCompare(b))
		);
		console.log(`${source.file}: ${Object.keys(table).length} assignments`);
	}

	const json = JSON.stringify({ updated: new Date().toISOString().slice(0, 10), ...data });
	await mkdir(path.dirname(OUTPUT), { recursive: true });
	await writeFile(OUTPUT, json);
	console.log(`Wrote ${OUTPUT} (${(json.length / 1024).toFixed(0)} KiB)`);
}

await main();
