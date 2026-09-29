<script>
	/** @type {{ value: string, id: string, label: string }} */
	let { value = $bindable(), id, label } = $props();

	let visible = $state(false);
</script>

<div class="field">
	<label class="visually-hidden" for={id}>{label}</label>
	<input
		{id}
		type={visible ? 'text' : 'password'}
		bind:value
		placeholder="Password to check"
		autocomplete="off"
		autocapitalize="off"
		spellcheck="false"
	/>
	<button
		type="button"
		onclick={() => (visible = !visible)}
		aria-pressed={visible}
		aria-controls={id}
	>
		{visible ? 'hide' : 'show'}
	</button>
</div>

<style>
	.field {
		display: flex;
		flex: 1;
		min-width: 0;
	}

	input {
		flex: 1;
		min-width: 0;
		width: 100%;
		padding: 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-right: none;
		border-radius: var(--radius) 0 0 var(--radius);
		color: var(--color-text);
	}

	input:focus {
		border-color: var(--color-text);
		outline: none;
	}

	button {
		padding: 0 0.9rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 0 var(--radius) var(--radius) 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		cursor: pointer;
	}

	button:hover {
		color: var(--color-text);
		border-color: var(--color-text);
	}
</style>
