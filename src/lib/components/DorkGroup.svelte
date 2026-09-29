<script>
	import DorkItem from '$lib/components/DorkItem.svelte';

	/** @type {{ group: { id: string, label: string, description: string, dorks: { id: string, label: string, query: string, url: string }[] } }} */
	let { group } = $props();
</script>

<section class="group" id={`dorks-${group.id}`} aria-labelledby={`dorks-${group.id}-heading`}>
	<header>
		<h2 id={`dorks-${group.id}-heading`}>
			{group.label} <span class="count">({group.dorks.length})</span>
		</h2>
		<p>{group.description}</p>
	</header>
	<ul>
		{#each group.dorks as dork (dork.id)}
			<DorkItem {dork} />
		{/each}
	</ul>
</section>

<style>
	.group {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		scroll-margin-top: 5rem;
	}

	header {
		padding: 1rem 0.75rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.count {
		color: var(--color-text-muted);
	}

	p {
		margin: 0.25rem 0 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	ul :global(li:last-child) {
		border-bottom: none;
	}
</style>
