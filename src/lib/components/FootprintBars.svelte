<script>
	import { formatNumber } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Labelled horizontal bars, widths relative to the largest count.
	 * @type {{ title: string, rows: { label: string, count: number }[] }}
	 */
	let { title, rows } = $props();

	let max = $derived(Math.max(1, ...rows.map((row) => row.count)));
</script>

<div class="bars">
	<h3>{title}</h3>
	<ul>
		{#each rows as row (row.label)}
			<li>
				<span class="label">{row.label}</span>
				<span class="track" aria-hidden="true">
					<span class="bar" style:width="{(row.count / max) * 100}%"></span>
				</span>
				<span class="count">{formatNumber(row.count)}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.bars {
		min-width: 0;
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.95rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.8rem;
	}

	li {
		display: grid;
		grid-template-columns: minmax(0, 9rem) minmax(2rem, 1fr) auto;
		align-items: center;
		gap: 0.5rem;
	}

	.label {
		color: var(--color-text-dim);
		overflow-wrap: anywhere;
	}

	.track {
		height: 0.6rem;
		background: var(--color-surface);
		border-radius: var(--radius);
	}

	.bar {
		display: block;
		height: 100%;
		min-width: 2px;
		background: var(--color-text-muted);
		border-radius: var(--radius);
	}

	.count {
		text-align: right;
	}
</style>
