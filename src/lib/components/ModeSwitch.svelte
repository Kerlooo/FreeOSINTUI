<script>
	/** @type {{ value: string, options: { value: string, label: string }[], label: string }} */
	let { value = $bindable(), options, label } = $props();
</script>

<div class="switch" role="radiogroup" aria-label={label}>
	{#each options as option (option.value)}
		<label class:active={value === option.value}>
			<input class="visually-hidden" type="radio" bind:group={value} value={option.value} />
			{option.label}
		</label>
	{/each}
</div>

<style>
	.switch {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	label {
		padding: 0.4rem 1.1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		cursor: pointer;
	}

	label:hover {
		color: var(--color-text);
	}

	label.active {
		border-color: var(--color-text);
		background: var(--color-text);
		color: var(--color-bg);
	}

	label:focus-within {
		outline: 2px solid var(--color-text);
		outline-offset: 2px;
	}
</style>
