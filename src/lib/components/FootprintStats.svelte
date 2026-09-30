<script>
	import FootprintBars from '$lib/components/FootprintBars.svelte';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ stats: ReturnType<typeof import('$lib/footprint/stats.js').computeStats> }} */
	let { stats } = $props();

	let sourceRows = $derived([
		{ label: t('footprint.stats.onlyCommoncrawl'), count: stats.bySource.commoncrawl },
		{ label: t('footprint.stats.onlyWayback'), count: stats.bySource.wayback },
		{ label: t('footprint.stats.both'), count: stats.bySource.both }
	]);
	let yearRows = $derived(stats.byYear.map(({ year, count }) => ({ label: year, count })));
	let mimeRows = $derived([
		...stats.byMime.map(({ value, count }) => ({
			label: value ?? t('footprint.stats.unknown'),
			count
		})),
		...(stats.otherMime ? [{ label: t('footprint.stats.other'), count: stats.otherMime }] : [])
	]);
	let statusRows = $derived(
		stats.byStatus.map(({ value, count }) => ({
			label: value ?? t('footprint.stats.unknown'),
			count
		}))
	);
</script>

<section class="panel" aria-labelledby="footprint-stats">
	<h2 id="footprint-stats">{t('footprint.stats.title')}</h2>
	<p class="total">
		<strong>{formatNumber(stats.total)}</strong>
		{t('footprint.stats.total', { count: stats.total })}
	</p>
	<div class="grid">
		<FootprintBars title={t('footprint.stats.bySource')} rows={sourceRows} />
		<FootprintBars title={t('footprint.stats.byStatus')} rows={statusRows} />
		<FootprintBars title={t('footprint.stats.byMime')} rows={mimeRows} />
		<FootprintBars title={t('footprint.stats.byYear')} rows={yearRows} />
	</div>
	<p class="note">{t('footprint.stats.note')}</p>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-dim);
	}

	.total strong {
		color: var(--color-text);
		font-size: 1.4rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: 1.25rem 2rem;
	}

	.note {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
</style>
