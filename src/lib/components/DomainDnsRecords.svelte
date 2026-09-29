<script>
	/** @type {{ groups: { type: string, records: { name: string, ttl: number, data: string }[], error: string | null }[] }} */
	let { groups } = $props();

	let total = $derived(groups.reduce((sum, group) => sum + group.records.length, 0));
</script>

{#if total === 0 && groups.every((group) => !group.error)}
	<p class="empty">No DNS records found: the domain may not exist or not be delegated.</p>
{/if}

<div class="groups">
	{#each groups as group (group.type)}
		<div class="group">
			<h3>{group.type} <span class="count">({group.records.length})</span></h3>
			{#if group.error}
				<p class="error">{group.error}</p>
			{:else if group.records.length === 0}
				<p class="empty">No {group.type} records.</p>
			{:else}
				<ul>
					{#each group.records as record, index (index)}
						<li>
							<code>{record.data}</code>
							<span class="ttl" title="Time to live">TTL {record.ttl}s</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/each}
</div>

<style>
	.groups {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h3 {
		margin: 0 0 0.35rem;
		font-size: 0.95rem;
		text-shadow: none;
	}

	.count {
		color: var(--color-text-muted);
		font-weight: 400;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		padding: 0.35rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	code {
		min-width: 0;
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}

	.ttl {
		flex-shrink: 0;
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-dim);
	}

	p.error {
		color: var(--color-danger);
	}

	@media (max-width: 36rem) {
		li {
			flex-direction: column;
		}
	}
</style>
