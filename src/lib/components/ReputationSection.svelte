<script>
	import ReputationDetails from '$lib/components/ReputationDetails.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * One independently loaded reputation source.
	 * @type {{
	 *   source: { id: string, name: string, backend: boolean },
	 *   result: { status: 'loading' | 'done' | 'error', data?: import('$lib/reputation/sources.js').SourceResult, error?: string, unreachable?: boolean }
	 * }}
	 */
	let { source, result } = $props();

	const headingId = $derived(`reputation-${source.id}`);

	/** Badge state: listed, not listed or unavailable (errors, missing key, backend down). */
	let badge = $derived.by(() => {
		if (result.status === 'loading') return 'loading';
		if (result.status === 'error') return 'unavailable';
		if (result.data?.status === 'listed') return 'listed';
		if (result.data?.status === 'not_listed') return 'notListed';
		return 'unavailable';
	});
</script>

<section class="panel" aria-labelledby={headingId} aria-busy={result.status === 'loading'}>
	<header>
		<h2 id={headingId}>{source.name}</h2>
		<span class="badge {badge}">{t(`reputation.status.${badge}`)}</span>
	</header>
	<p class="note">{t(`reputation.${source.id}.note`)}</p>

	{#if result.status === 'error'}
		<p class="status" class:error={!result.unreachable} role="alert">
			{result.unreachable ? t('reputation.backendUnavailable') : result.error}
		</p>
	{:else if result.status === 'done' && result.data}
		{#if result.data.reason === 'notConfigured'}
			<p class="status">{t('reputation.notConfigured')}</p>
		{:else}
			<ReputationDetails sourceId={source.id} result={result.data} />
			{#if result.data.link}
				<!-- External source page, so resolve() does not apply. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a href={result.data.link} target="_blank" rel="noopener noreferrer"
					>{t('reputation.open', { source: source.name })}</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
		{/if}
	{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.badge {
		padding: 0.1rem 0.5rem;
		border: 1px solid currentColor;
		border-radius: var(--radius);
		font-size: 0.8rem;
		text-transform: uppercase;
	}

	.badge.listed {
		color: var(--color-danger);
	}

	.badge.notListed {
		color: var(--color-text);
	}

	.badge.unavailable,
	.badge.loading {
		color: var(--color-text-muted);
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.note {
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.status {
		color: var(--color-text-dim);
	}

	.status.error {
		color: var(--color-danger);
	}

	a {
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}
</style>
