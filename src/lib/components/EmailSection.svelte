<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Result panel of the Email Analyzer with loading and error states.
	 * @type {{ id: string, title: string, loading?: boolean, error?: string, children?: import('svelte').Snippet }}
	 */
	let { id, title, loading = false, error = '', children } = $props();
</script>

<section class="panel" aria-labelledby={id} aria-busy={loading}>
	<h2 {id}>{title}</h2>
	{#if loading}
		<p class="status">{t('email.lookingUp')}</p>
	{:else if error}
		<p class="status error" role="alert">{error}</p>
	{:else}
		{@render children?.()}
	{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.status {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.875rem;
	}

	.error {
		color: var(--color-danger);
		overflow-wrap: anywhere;
	}
</style>
