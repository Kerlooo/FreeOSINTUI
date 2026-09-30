<script>
	import { GENERATORS } from '$lib/lookalike/generators.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Checkbox list of permutation types with their candidate counts.
	 * @type {{ counts: Record<string, number>, selected: string[], disabled?: boolean }}
	 */
	let { counts, selected = $bindable(), disabled = false } = $props();

	let available = $derived(GENERATORS.filter((generator) => counts[generator.id] > 0));
</script>

<div class="picker">
	<div class="bulk">
		<button
			type="button"
			{disabled}
			onclick={() => (selected = available.map((generator) => generator.id))}
			>{t('lookalike.selectAll')}</button
		>
		<button type="button" {disabled} onclick={() => (selected = [])}
			>{t('lookalike.selectNone')}</button
		>
	</div>
	<ul>
		{#each available as generator (generator.id)}
			<li>
				<label>
					<input type="checkbox" bind:group={selected} value={generator.id} {disabled} />
					<span class="name">{generator.label}</span>
					<span class="count">{formatNumber(counts[generator.id])}</span>
				</label>
				<span class="description">{generator.description}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.bulk {
		display: flex;
		gap: 0.5rem;
	}

	.bulk button {
		padding: 0.2rem 0.75rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.bulk button:hover:not(:disabled) {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
		gap: 0.5rem 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	input {
		accent-color: var(--color-text);
	}

	.name {
		flex: 1;
	}

	.count {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.description {
		padding-left: 1.6rem;
		color: var(--color-text-muted);
		font-size: 0.78rem;
		overflow-wrap: anywhere;
	}
</style>
