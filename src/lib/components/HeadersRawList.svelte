<script>
	/** @type {{ title: string, headers: { name: string, value: string }[], open?: boolean }} */
	let { title, headers, open = false } = $props();
</script>

<details {open}>
	<summary>{title}</summary>
	<dl>
		{#each headers as header, index (index)}
			<dt>{header.name}</dt>
			<dd>{header.value}</dd>
		{/each}
	</dl>
</details>

<style>
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

	dl {
		margin: 0;
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
	}

	dt {
		color: var(--color-text-dim);
		overflow-wrap: anywhere;
	}

	dd {
		margin: 0 0 0.4rem;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
</style>
