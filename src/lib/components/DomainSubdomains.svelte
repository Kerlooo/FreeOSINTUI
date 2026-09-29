<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { t, formatNumber } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ result: { names: string[], source: string, partial: boolean, fallbackReason: string | null } }} */
	let { result } = $props();

	let filter = $state('');

	let visible = $derived.by(() => {
		const query = filter.trim().toLowerCase();
		return query ? result.names.filter((name) => name.includes(query)) : result.names;
	});
</script>

<p class="meta">
	<strong>{formatNumber(result.names.length)}</strong>
	{t('domain.subdomains.countFrom', { count: result.names.length })}
	<strong>{result.source}</strong>
	{#if result.partial}
		{t('domain.subdomains.partial')}
	{/if}
</p>
{#if result.fallbackReason}
	<p class="meta">{t('domain.subdomains.fallback', { reason: result.fallbackReason })}</p>
{/if}

{#if result.names.length}
	<div class="toolbar">
		<label class="visually-hidden" for="subdomain-filter"
			>{t('domain.subdomains.filterLabel')}</label
		>
		<input
			id="subdomain-filter"
			type="text"
			bind:value={filter}
			placeholder={t('domain.subdomains.filterPlaceholder')}
			autocomplete="off"
			spellcheck="false"
		/>
		<CopyButton value={visible.join('\n')} label={t('domain.subdomains.copyAll')} />
	</div>
	{#if visible.length}
		<ul>
			{#each visible as name (name)}
				<li>{name}</li>
			{/each}
		</ul>
		{#if filter.trim()}
			<p class="meta">
				{t('domain.subdomains.shown', {
					visible: formatNumber(visible.length),
					total: formatNumber(result.names.length)
				})}
			</p>
		{/if}
	{:else}
		<p class="meta">{t('domain.subdomains.noMatch')}</p>
	{/if}
{:else}
	<p class="meta">{t('domain.subdomains.none')}</p>
{/if}

<p class="meta">
	{t('domain.subdomains.note')}
</p>

<style>
	.meta {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	strong {
		color: var(--color-text);
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toolbar input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
	}

	ul {
		max-height: 24rem;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	li {
		padding: 0.25rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	li:last-child {
		border-bottom: none;
	}
</style>
