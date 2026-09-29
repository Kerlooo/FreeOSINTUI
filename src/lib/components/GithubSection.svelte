<script>
	/**
	 * Panel for one lookup section, with loading and error states.
	 * @type {{ id: string, title: string, status: 'idle' | 'loading' | 'done' | 'error', error?: string, children: import('svelte').Snippet }}
	 */
	let { id, title, status, error = '', children } = $props();
</script>

<section class="panel" aria-labelledby={`${id}-heading`} aria-busy={status === 'loading'}>
	<h2 id={`${id}-heading`}>{title}</h2>
	{#if status === 'loading'}
		<p class="hint">Loading…</p>
	{:else if status === 'error'}
		<p class="error" role="alert">{error}</p>
	{:else if status === 'done'}
		{@render children()}
	{/if}
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

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.error {
		margin: 0;
		color: var(--color-danger);
	}
</style>
