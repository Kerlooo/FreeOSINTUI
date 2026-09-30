<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { detailRows, displayDate } from '$lib/reputation/rows.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Details of one reputation result: checked value, data date, fields and recent entries.
	 * @type {{ sourceId: string, result: import('$lib/reputation/sources.js').SourceResult }}
	 */
	let { sourceId, result } = $props();

	let rows = $derived([
		{ label: t('reputation.checked'), value: result.checked },
		{ label: t(`reputation.date.${sourceId}`), value: displayDate(result.date) },
		...detailRows(sourceId, result)
	]);

	/** @type {any[]} */
	let pulses = $derived(sourceId === 'otx' ? (result.details?.pulses ?? []) : []);
	/** @type {any[]} */
	let iocs = $derived(sourceId === 'threatfox' ? (result.details?.iocs ?? []) : []);
</script>

<KeyValueTable {rows} />

{#if pulses.length}
	<h3>{t('reputation.otx.recent')}</h3>
	<ul>
		{#each pulses as pulse, i (pulse.id || i)}
			<li>
				<span class="name">{pulse.name}</span>
				<span class="meta">
					{displayDate(pulse.date) ?? ''}{#if pulse.malware.length}
						· {pulse.malware.join(', ')}{/if}{#if pulse.tags.length}
						· {pulse.tags.join(', ')}{/if}
				</span>
			</li>
		{/each}
	</ul>
{/if}

{#if iocs.length}
	<h3>{t('reputation.threatfox.recent')}</h3>
	<ul>
		{#each iocs as ioc, i (i)}
			<li>
				<span class="name">{ioc.ioc}</span>
				<span class="meta">
					{[
						ioc.malware,
						ioc.threat_type,
						ioc.confidence === null || ioc.confidence === undefined
							? null
							: t('reputation.threatfox.confidence', { value: ioc.confidence }),
						displayDate(ioc.last_seen ?? ioc.first_seen),
						ioc.tags?.length ? ioc.tags.join(', ') : null
					]
						.filter(Boolean)
						.join(' · ')}
				</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	h3 {
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.45rem 0;
		border-bottom: 1px solid var(--color-border);
		overflow-wrap: anywhere;
	}

	.meta {
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}
</style>
