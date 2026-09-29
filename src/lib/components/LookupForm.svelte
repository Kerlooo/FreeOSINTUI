<script>
	/**
	 * Single-field search form used by lookup tools.
	 * @type {{ value: string, label: string, placeholder?: string, buttonLabel?: string, busy?: boolean, onsubmit: (value: string) => void }}
	 */
	let {
		value = $bindable(),
		label,
		placeholder = '',
		buttonLabel = 'Look up',
		busy = false,
		onsubmit
	} = $props();

	const id = $props.id();

	/** @param {SubmitEvent} event */
	function handleSubmit(event) {
		event.preventDefault();
		if (value.trim() && !busy) onsubmit(value.trim());
	}
</script>

<form onsubmit={handleSubmit}>
	<label class="visually-hidden" for={id}>{label}</label>
	<input {id} type="text" bind:value {placeholder} autocomplete="off" spellcheck="false" />
	<button type="submit" disabled={busy || !value.trim()}>{busy ? 'working…' : buttonLabel}</button>
</form>

<style>
	form {
		display: flex;
		gap: 0.5rem;
	}

	input {
		flex: 1;
		min-width: 0;
	}

	button {
		padding: 0 1.25rem;
		background: var(--color-text);
		border: 1px solid var(--color-text);
		border-radius: var(--radius);
		color: var(--color-bg);
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
	}

	button:disabled {
		background: transparent;
		color: var(--color-text-muted);
		border-color: var(--color-border);
		cursor: not-allowed;
	}
</style>
