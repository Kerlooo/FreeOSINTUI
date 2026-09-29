<script>
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ tool: { name: string, route: string, description: string } }} */
	let { tool } = $props();
</script>

<a class="card" href={resolve(tool.route)}>
	<h4>{tool.name}</h4>
	<p>{tool.description}</p>
	<span class="open" aria-hidden="true">{t('home.open')} &gt;</span>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		text-decoration: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.card:hover,
	.card:focus-visible {
		border-color: var(--color-text);
		box-shadow: 0 0 12px var(--color-text-muted);
	}

	h4 {
		margin: 0;
		font-size: 1.2rem;
	}

	p {
		flex: 1;
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.9rem;
	}

	.open {
		align-self: flex-end;
		font-size: 0.85rem;
	}
</style>
