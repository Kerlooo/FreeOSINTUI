<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { archiveUrl, timestampDay } from '$lib/footprint/merge.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ entry: import('$lib/footprint/merge.js').FootprintEntry }} */
	let { entry } = $props();

	let first = $derived(timestampDay(entry.first));
	let last = $derived(timestampDay(entry.last));
</script>

<li>
	<div class="url">
		<code>{entry.url}</code>
		<span class="actions">
			<!-- External archive link (never the live site), so resolve() does not apply. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a href={archiveUrl(entry)} target="_blank" rel="noopener noreferrer"
				>{t('footprint.list.archived')}</a
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<CopyButton value={entry.url} label={t('footprint.list.copyUrl')} />
		</span>
	</div>
	<div class="meta">
		<span>{first === last ? first : t('footprint.list.seen', { first, last })}</span>
		{#if entry.status}<span>HTTP {entry.status}</span>{/if}
		{#if entry.mime}<span>{entry.mime}</span>{/if}
		<span>{entry.sources.map((source) => t(`footprint.sourceShort.${source}`)).join(' + ')}</span>
	</div>
</li>

<style>
	li {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border);
		min-width: 0;
	}

	.url {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem 0.75rem;
	}

	code {
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-text);
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1rem;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}
</style>
