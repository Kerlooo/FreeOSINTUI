<script>
	import FootprintSource from '$lib/components/FootprintSource.svelte';
	import { CC_INDEXES } from '$lib/footprint/commoncrawl.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Status of the Common Crawl queries: one line per crawl, filled as each one answers.
	 * @type {{ result: { status: 'loading' | 'done' | 'error', data?: import('$lib/footprint/commoncrawl.js').CcResult, error?: string } }}
	 */
	let { result } = $props();

	let indexes = $derived(result.data?.indexes ?? []);
</script>

<FootprintSource
	id="footprint-cc"
	title={t('footprint.source.commoncrawl')}
	source="index.commoncrawl.org"
	busy={result.status === 'loading'}
>
	<p>{t('footprint.cc.note', { count: CC_INDEXES })}</p>
	{#if result.status === 'error'}
		<p class="error" role="alert">{result.error}</p>
	{:else}
		{#if indexes.length}
			<ul>
				{#each indexes as index (index.id)}
					<li>
						<span class="name">{index.name}</span>
						{#if index.error}
							<span class="error">{index.error}</span>
						{:else}
							<span>
								{t('footprint.captures', { count: index.count, n: formatNumber(index.count) })}
								{#if index.truncated}{t('footprint.limitReached')}{/if}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if result.status === 'loading'}
			<p>{t('footprint.cc.loading', { done: indexes.length, total: CC_INDEXES })}</p>
		{/if}
	{/if}
</FootprintSource>

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0 1rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px solid var(--color-border);
	}

	.name {
		color: var(--color-text);
	}

	.error {
		color: var(--color-danger);
	}
</style>
