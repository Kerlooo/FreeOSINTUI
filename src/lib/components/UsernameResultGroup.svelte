<script>
	import UsernameResultRow from '$lib/components/UsernameResultRow.svelte';

	/** @type {{ group: { category: string, label: string, results: { site: string, name: string, status: string, url: string | null, http_status: number | null, reason: string, unreliable?: boolean }[] } }} */
	let { group } = $props();
</script>

<section aria-label={`${group.label} results`}>
	<h3>{group.label} <span>({group.results.length})</span></h3>
	<ul>
		{#each group.results as result (result.site)}
			<UsernameResultRow {result} />
		{/each}
	</ul>
</section>

<style>
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}

	h3 span {
		color: var(--color-text-dim);
		font-weight: 400;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--color-border);
		border-bottom: none;
		border-radius: var(--radius);
	}
</style>
