import { describe, expect, it } from 'vitest';
import { MESSAGES } from '$lib/i18n/catalog.js';
import { analyzeHeaders } from './analyze.js';
import { describeFinding, formatDuration } from './format.js';
import { SAMPLE_HEADERS } from './sample.js';

/** Every finding id produced by analyze.js. */
const FINDING_IDS = [
	'missingFrom',
	'multipleFrom',
	'returnPathMismatch',
	'replyToDiffers',
	'displayNameEmail',
	'dmarcFail',
	'dmarcNone',
	'spfFail',
	'spfNone',
	'dkimFail',
	'dkimNone',
	'authError',
	'noAuthResults',
	'dkimNotAligned',
	'authPass',
	'messageIdUnrelated',
	'dateDrift',
	'clockSkew',
	'slowHop',
	'noReceived',
	'suspiciousMailer'
];

describe('describeFinding', () => {
	it('has a title and a detail for every finding', () => {
		for (const id of FINDING_IDS) {
			expect(MESSAGES.en[`headers.finding.${id}.title`], id).toBeDefined();
			expect(MESSAGES.en[`headers.finding.${id}.detail`], id).toBeDefined();
		}
	});

	it('fills the parameters and formats durations', () => {
		expect(
			describeFinding({ id: 'dateDrift', severity: 'low', params: { durationMs: 2 * 3_600_000 } })
				.detail
		).toContain('2 hr');
		expect(
			describeFinding({ id: 'clockSkew', severity: 'low', params: { count: 2 } }).detail
		).toMatch(/^2 hops/);
	});

	it('only emits known ids for the sample', () => {
		for (const finding of analyzeHeaders(SAMPLE_HEADERS)?.findings ?? []) {
			expect(FINDING_IDS).toContain(finding.id);
		}
	});
});

describe('formatDuration', () => {
	it('formats seconds and minutes', () => {
		expect(formatDuration(5_000)).toBe('5 sec');
		expect(formatDuration(-90_000)).toBe('-1.5 min');
	});
});
