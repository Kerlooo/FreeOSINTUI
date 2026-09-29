<script>
	import { STATUSES } from '$lib/username/results.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Live counters per status that double as filters for the results list.
	 * @type {{ counts: Record<string, number>, selected: string[] }}
	 */
	let { counts, selected = $bindable() } = $props();

	/** @param {string} id */
	function toggle(id) {
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
	}
</script>

<div class="filters" role="group" aria-label={t('username.filtersLabel')}>
	{#each STATUSES as status (status.id)}
		<button
			type="button"
			class={`chip ${status.id}`}
			aria-pressed={selected.includes(status.id)}
			onclick={() => toggle(status.id)}
		>
			<span class="count">{counts[status.id] ?? 0}</span>
			{status.label}
		</button>
	{/each}
</div>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.35rem 0.9rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.85rem;
		cursor: pointer;
	}

	.chip:hover {
		border-color: var(--color-text-muted);
	}

	.chip[aria-pressed='true'] {
		border-color: var(--color-text);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.count {
		font-weight: 700;
		font-size: 1rem;
	}

	.error .count {
		color: var(--color-danger);
	}

	.not_found .count {
		color: var(--color-text-muted);
	}
</style>
