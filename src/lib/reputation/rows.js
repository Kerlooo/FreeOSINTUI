import { formatDate, formatNumber, t } from '$lib/i18n/i18n.svelte.js';
import { parseSourceDate } from './sources.js';

/**
 * Formats a source date in the current language, or returns the raw text when it cannot be parsed.
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function displayDate(value) {
	if (!value) return null;
	const date = parseSourceDate(value);
	return date
		? formatDate(date, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'
		: value;
}

/** @param {string[] | undefined} list */
const joined = (list) => (list?.length ? list.join(', ') : null);

/**
 * Label/value rows for the details of one source result (shown by KeyValueTable).
 * @param {string} sourceId
 * @param {import('./sources.js').SourceResult} result
 * @returns {{ label: string, value: string | number | null | undefined }[]}
 */
export function detailRows(sourceId, result) {
	const d = result.details ?? {};
	switch (sourceId) {
		case 'otx':
			return [
				{ label: t('reputation.otx.pulses'), value: formatNumber(d.count ?? 0) },
				{ label: t('reputation.otx.whitelisted'), value: joined(d.whitelisted) }
			];
		case 'sfs':
			if (!d.appears) return [];
			return [
				{ label: t('reputation.sfs.frequency'), value: formatNumber(d.frequency) },
				{
					label: t('reputation.sfs.confidence'),
					value: d.confidence === null || d.confidence === undefined ? null : `${d.confidence}%`
				},
				{ label: t('reputation.sfs.torexit'), value: d.torexit ? t('common.yes') : null }
			];
		case 'tor':
			return [
				{
					label: t('reputation.tor.exitNodes'),
					value: d.exit_nodes === undefined ? null : formatNumber(d.exit_nodes)
				}
			];
		case 'drop':
			return [
				{ label: t('reputation.drop.cidr'), value: d.cidr },
				{ label: t('reputation.drop.sblid'), value: d.sblid },
				{ label: t('reputation.drop.rir'), value: d.rir?.toUpperCase() }
			];
		case 'urlhaus':
			if (result.status !== 'listed') return [];
			return [
				{
					label: t('reputation.urlhaus.urlCount'),
					value: d.url_count === undefined ? null : formatNumber(d.url_count)
				},
				{
					label: t('reputation.urlhaus.online'),
					value: d.online === undefined ? null : formatNumber(d.online)
				},
				{ label: t('reputation.urlhaus.urlStatus'), value: d.url_status },
				{ label: t('reputation.urlhaus.threat'), value: d.threat ?? joined(d.threats) },
				{
					label: t('reputation.urlhaus.firstSeen'),
					value: displayDate(d.firstseen ?? d.date_added)
				},
				{
					label: t('reputation.urlhaus.blacklists'),
					value: d.blacklists
						? joined(Object.entries(d.blacklists).map(([name, value]) => `${name}: ${value}`))
						: null
				},
				{ label: t('reputation.tags'), value: joined(d.tags) }
			];
		case 'threatfox':
			return [
				{
					label: t('reputation.threatfox.count'),
					value: d.count === undefined ? null : formatNumber(d.count)
				}
			];
		default:
			return [];
	}
}
