<script>
	/**
	 * Panel for one Domain Analyzer section, with its own loading and error state.
	 * @type {{ id: string, title: string, subtitle?: string, section: { status: 'idle' | 'loading' | 'done' | 'error', error?: string | null }, loadingText?: string, children: import('svelte').Snippet }}
	 */
	let { id, title, subtitle = '', section, loadingText = 'Loading…', children } = $props();
</script>

<section class="panel" aria-labelledby={id} aria-busy={section.status === 'loading'}>
	<header>
		<h2 {id}>{title}</h2>
		{#if subtitle}<span class="subtitle">{subtitle}</span>{/if}
	</header>
	<div aria-live="polite">
		{#if section.status === 'loading'}
			<p class="status">{loadingText}</p>
		{:else if section.status === 'error'}
			<p class="status error">{section.error}</p>
		{:else if section.status === 'done'}
			{@render children()}
		{/if}
	</div>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.status {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}

	.status.error {
		color: var(--color-danger);
	}
</style>
