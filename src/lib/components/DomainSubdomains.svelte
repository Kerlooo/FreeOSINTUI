<script>
	import CopyButton from '$lib/components/CopyButton.svelte';

	/** @type {{ result: { names: string[], source: string, partial: boolean, fallbackReason: string | null } }} */
	let { result } = $props();

	let filter = $state('');

	let visible = $derived.by(() => {
		const query = filter.trim().toLowerCase();
		return query ? result.names.filter((name) => name.includes(query)) : result.names;
	});
</script>

<p class="meta">
	<strong>{result.names.length}</strong> unique subdomains from <strong>{result.source}</strong>
	{#if result.partial}
		(first page of results only, the list may be incomplete)
	{/if}
</p>
{#if result.fallbackReason}
	<p class="meta">crt.sh failed ({result.fallbackReason}), so Cert Spotter was used instead.</p>
{/if}

{#if result.names.length}
	<div class="toolbar">
		<label class="visually-hidden" for="subdomain-filter">Filter subdomains</label>
		<input
			id="subdomain-filter"
			type="text"
			bind:value={filter}
			placeholder="Filter, e.g. mail"
			autocomplete="off"
			spellcheck="false"
		/>
		<CopyButton value={visible.join('\n')} label="Copy all listed subdomains" />
	</div>
	{#if visible.length}
		<ul>
			{#each visible as name (name)}
				<li>{name}</li>
			{/each}
		</ul>
		{#if filter.trim()}
			<p class="meta">{visible.length} of {result.names.length} shown.</p>
		{/if}
	{:else}
		<p class="meta">No subdomain matches the filter.</p>
	{/if}
{:else}
	<p class="meta">No subdomains found in certificate transparency logs.</p>
{/if}

<p class="meta">
	Names come from public TLS certificates: some may no longer resolve, and hosts without a public
	certificate are not listed.
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
