<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';

	/** @type {{ groups: { id: string, label: string, rows: { label: string, value: string }[] }[] }} */
	let { groups } = $props();
</script>

<div class="groups">
	{#each groups as group (group.id)}
		<details open={groups.length <= 3}>
			<summary>{group.label} <span class="count">({group.rows.length})</span></summary>
			<KeyValueTable rows={group.rows} />
		</details>
	{/each}
</div>

<style>
	.groups {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	details {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	summary {
		padding: 0.6rem 0.75rem;
		font-weight: 700;
		cursor: pointer;
		overflow-wrap: anywhere;
	}

	summary:hover {
		background: var(--color-surface);
	}

	details[open] summary {
		border-bottom: 1px solid var(--color-border);
	}

	.count {
		color: var(--color-text-dim);
		font-weight: 400;
	}
</style>
