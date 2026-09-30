<script>
	import { resolve } from '$app/paths';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { overviewRows } from '$lib/url/rows.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ analysis: any }} */
	let { analysis } = $props();

	let host = $derived(analysis.host);
</script>

<KeyValueTable rows={overviewRows(analysis)} />

<div class="copies">
	<div class="copy">
		<span class="label">{t('url.row.defanged')}</span>
		<code>{analysis.defanged}</code>
		<CopyButton value={analysis.defanged} label={t('url.copyDefanged')} />
	</div>
	{#if analysis.cleaned.removed.length}
		<div class="copy">
			<span class="label">{t('url.row.cleaned')}</span>
			<code>{analysis.cleaned.url}</code>
			<CopyButton value={analysis.cleaned.url} label={t('url.copyCleaned')} />
		</div>
	{/if}
</div>

<p class="pivots">
	{#if host.kind === 'name'}
		<a href={resolve(`/domain?q=${encodeURIComponent(host.ascii)}`)}>{t('url.pivot.domain')}</a>
	{:else}
		<a href={resolve(`/ip?q=${encodeURIComponent(host.ip)}`)}>{t('url.pivot.ip')}</a>
	{/if}
</p>

<style>
	.copies {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.copy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 0.75rem;
		font-size: 0.85rem;
	}

	.label {
		color: var(--color-text-dim);
	}

	code {
		flex: 1 1 16rem;
		min-width: 0;
		padding: 0.35rem 0.5rem;
		background: var(--color-surface);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}

	.pivots {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0;
		font-size: 0.875rem;
	}
</style>
