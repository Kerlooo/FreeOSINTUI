<script>
	/** @type {{ breach: import('$lib/leaks/xposedornot.js').Breach }} */
	let { breach } = $props();

	const dateFormat = new Intl.DateTimeFormat('en-GB', {
		year: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	});

	let date = $derived(breach.date ? dateFormat.format(new Date(breach.date)) : null);
</script>

<li class="breach">
	<div class="head">
		<h3>{breach.id}</h3>
		{#if date}<span class="date">{date}</span>{/if}
	</div>
	<p class="meta">
		{#if breach.domain}<span>{breach.domain}</span>{/if}
		{#if breach.industry}<span>{breach.industry}</span>{/if}
		{#if breach.records !== null}<span>{breach.records.toLocaleString('en-US')} records</span>{/if}
		{#if breach.verified === false}<span>unverified</span>{/if}
	</p>
	{#if breach.exposedData.length}
		<ul class="tags" aria-label="Exposed data types">
			{#each breach.exposedData as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
	{#if breach.description}
		<p class="description">{breach.description}</p>
	{:else if !breach.date}
		<p class="description">No details available in the breach catalog.</p>
	{/if}
</li>

<style>
	.breach {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		min-width: 0;
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.25rem 1rem;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		overflow-wrap: anywhere;
	}

	.date {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		color: var(--color-text-dim);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tags li {
		padding: 0.05rem 0.5rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.75rem;
	}

	.description {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}
</style>
