/**
 * Counts values and returns them as [value, count] pairs, most frequent first.
 * @param {Iterable<string>} values
 * @returns {[string, number][]}
 */
function countValues(values) {
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	return [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}

/**
 * Summary of the merged entries. `null` stands for an unknown MIME type or status.
 * MIME types beyond `topMime` are summed in `otherMime`.
 * @param {import('./merge.js').FootprintEntry[]} entries
 * @param {{ topMime?: number }} [options]
 */
export function computeStats(entries, { topMime = 8 } = {}) {
	const bySource = { commoncrawl: 0, wayback: 0, both: 0 };
	for (const entry of entries) {
		if (entry.sources.length > 1) bySource.both += 1;
		else if (entry.sources[0] === 'wayback') bySource.wayback += 1;
		else bySource.commoncrawl += 1;
	}

	const byYear = countValues(entries.map((entry) => entry.first.slice(0, 4))).sort((a, b) =>
		a[0] < b[0] ? -1 : 1
	);
	const mime = countValues(entries.map((entry) => entry.mime ?? ''));
	const byStatus = countValues(entries.map((entry) => entry.status ?? '')).sort((a, b) =>
		a[0] === '' ? 1 : b[0] === '' ? -1 : a[0] < b[0] ? -1 : 1
	);

	const toNullable = (/** @type {[string, number]} */ [value, count]) => ({
		value: value || null,
		count
	});
	return {
		total: entries.length,
		bySource,
		byYear: byYear.map(([year, count]) => ({ year, count })),
		byMime: mime.slice(0, topMime).map(toNullable),
		otherMime: mime.slice(topMime).reduce((sum, [, count]) => sum + count, 0),
		byStatus: byStatus.map(toNullable)
	};
}

/**
 * Hosts other than the target itself, with how many URLs each has, most URLs first.
 * @param {import('./merge.js').FootprintEntry[]} entries
 * @param {string} domain
 * @returns {{ host: string, count: number }[]}
 */
export function findSubdomains(entries, domain) {
	const suffix = `.${domain}`;
	const hosts = entries
		.map((entry) => entry.host)
		.filter((host) => host !== domain && host.endsWith(suffix));
	return countValues(hosts).map(([host, count]) => ({ host, count }));
}

/**
 * Unique query parameter names, with how many URLs use each, most used first.
 * @param {{ search: string }[]} entries
 * @returns {{ name: string, count: number }[]}
 */
export function extractParams(entries) {
	/** @type {string[]} */
	const names = [];
	for (const { search } of entries) {
		if (search.length < 2) continue;
		const seen = new Set();
		for (const part of search.slice(1).split(/[&;]/)) {
			let name = part.split('=')[0];
			try {
				name = decodeURIComponent(name.replace(/\+/g, ' '));
			} catch {
				// Keep the raw name when it is not valid percent-encoding.
			}
			name = name.trim();
			if (name && name.length <= 100 && !seen.has(name)) {
				seen.add(name);
				names.push(name);
			}
		}
	}
	return countValues(names).map(([name, count]) => ({ name, count }));
}

/**
 * Case-insensitive substring filter on the URL.
 * @template {{ url: string }} T
 * @param {T[]} entries
 * @param {string} query
 */
export function filterEntries(entries, query) {
	const needle = query.trim().toLowerCase();
	return needle ? entries.filter((entry) => entry.url.toLowerCase().includes(needle)) : entries;
}
