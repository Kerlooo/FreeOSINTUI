<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Listing counts across all sources, with the "a listing is a lead" caution.
	 * @type {{ counts: { listed: number, notListed: number, unavailable: number, pending: number } }}
	 */
	let { counts } = $props();

	let answered = $derived(counts.listed + counts.notListed);
</script>

<section
	class="panel"
	class:flagged={counts.listed > 0}
	aria-labelledby="reputation-summary"
	aria-live="polite"
>
	<h2 id="reputation-summary">{t('reputation.summary.title')}</h2>
	{#if answered}
		<p class="main">
			{counts.listed
				? t('reputation.summary.listed', { count: counts.listed, total: answered })
				: t('reputation.summary.none', { total: answered })}
		</p>
	{/if}
	{#if counts.pending}
		<p>{t('reputation.summary.pending', { count: counts.pending })}</p>
	{/if}
	{#if counts.unavailable}
		<p>{t('reputation.summary.unavailable', { count: counts.unavailable })}</p>
	{/if}
	<p class="caution">{t('reputation.summary.caution')}</p>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	.panel.flagged {
		border-color: var(--color-danger);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.main {
		color: var(--color-text);
		font-size: 1rem;
	}

	.flagged .main {
		color: var(--color-danger);
	}

	.caution {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}
</style>
