<script>
	/**
	 * Panel of one archive source of the Passive Site Footprint.
	 * @type {{ id: string, title: string, source: string, busy?: boolean, children: import('svelte').Snippet }}
	 */
	let { id, title, source, busy = false, children } = $props();
</script>

<section class="panel" aria-labelledby={id} aria-busy={busy}>
	<header>
		<h2 {id}>{title}</h2>
		<span class="source">{source}</span>
	</header>
	{@render children()}
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
		font-size: 0.85rem;
		overflow-wrap: anywhere;
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

	.panel :global(p) {
		margin: 0;
		color: var(--color-text-dim);
	}

	.panel :global(p.error) {
		color: var(--color-danger);
	}
</style>
