<script>
	/** @type {{ result: { snapshot: { url: string, date: string | null, status: string | null } | null, historyUrl: string } }} */
	let { result } = $props();
</script>

<!-- External Wayback Machine links, so resolve() does not apply. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if result.snapshot}
	<p>
		Closest snapshot: <strong>{result.snapshot.date ?? 'unknown date'}</strong>
		{#if result.snapshot.status}(HTTP {result.snapshot.status}){/if}
	</p>
	<p>
		<a href={result.snapshot.url} target="_blank" rel="noopener noreferrer">open snapshot ↗</a>
	</p>
{:else}
	<p>
		The Wayback availability API returned no snapshot. It sometimes misses even heavily archived
		sites, so check the full list below.
	</p>
{/if}
<p>
	<a href={result.historyUrl} target="_blank" rel="noopener noreferrer">all archived URLs ↗</a>
</p>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-dim);
		overflow-wrap: anywhere;
	}

	strong {
		color: var(--color-text);
	}
</style>
