import { formatDate, formatNumber, t } from '$lib/i18n/i18n.svelte.js';
import { durationParts } from './received.js';

/**
 * Localized duration such as "1.5 min" or "-2 s".
 * @param {number} ms
 */
export function formatDuration(ms) {
	const { value, unit } = durationParts(ms);
	return formatNumber(value, { style: 'unit', unit, unitDisplay: 'short' });
}

/**
 * Localized timestamp with seconds, in the viewer's time zone.
 * @param {number} ms
 */
export function formatTimestamp(ms) {
	return formatDate(ms, { dateStyle: 'medium', timeStyle: 'medium' });
}

/**
 * Title and explanation of a finding in the current language.
 * @param {import('./analyze.js').Finding} finding
 */
export function describeFinding(finding) {
	/** @type {Record<string, string | number>} */
	const params = { ...finding.params };
	if (typeof params.durationMs === 'number') params.duration = formatDuration(params.durationMs);
	return {
		title: t(`headers.finding.${finding.id}.title`, params),
		detail: t(`headers.finding.${finding.id}.detail`, params)
	};
}
