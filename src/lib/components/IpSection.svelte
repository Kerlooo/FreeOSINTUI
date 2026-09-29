<script>
	/**
	 * One independently loaded result section of the IP Analyzer.
	 * Shows the loading, error and empty states; `children` renders the data.
	 * @type {{
	 *   id: string,
	 *   title: string,
	 *   source: string,
	 *   note?: string,
	 *   result: { status: 'loading' | 'done' | 'error', data?: any, error?: string },
	 *   isEmpty?: (data: any) => boolean,
	 *   emptyText?: string,
	 *   children: import('svelte').Snippet<[any]>
	 * }}
	 */
	let {
		id,
		title,
		source,
		note,
		result,
		isEmpty = (data) => data === null || data === undefined,
		emptyText = 'No data.',
		children
	} = $props();
</script>

<section class="panel" aria-labelledby={id} aria-busy={result.status === 'loading'}>
	<header>
		<h2 {id}>{title}</h2>
		<span class="source">{source}</span>
	</header>
	{#if note}
		<p class="note">{note}</p>
	{/if}

	{#if result.status === 'loading'}
		<p class="status">loading…</p>
	{:else if result.status === 'error'}
		<p class="status error" role="alert">{result.error}</p>
	{:else if isEmpty(result.data)}
		<p class="status">{emptyText}</p>
	{:else}
		{@render children(result.data)}
	{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.source {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.note {
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.status {
		color: var(--color-text-dim);
	}

	.status.error {
		color: var(--color-danger);
	}
</style>
