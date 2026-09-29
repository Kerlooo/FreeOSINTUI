<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ result: { snapshot: { url: string, date: string | null, status: string | null } | null, historyUrl: string } }} */
	let { result } = $props();
</script>

<!-- External Wayback Machine links, so resolve() does not apply. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if result.snapshot}
	<p>
		{t('domain.archive.closest')}
		<strong>{result.snapshot.date ?? t('domain.archive.unknownDate')}</strong>
		{#if result.snapshot.status}(HTTP {result.snapshot.status}){/if}
	</p>
	<p>
		<a href={result.snapshot.url} target="_blank" rel="noopener noreferrer"
			>{t('domain.archive.open')}</a
		>
	</p>
{:else}
	<p>
		{t('domain.archive.none')}
	</p>
{/if}
<p>
	<a href={result.historyUrl} target="_blank" rel="noopener noreferrer">{t('domain.archive.all')}</a
	>
</p>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-dim);
		overflow-wrap: anywhere;
	}

	strong {
		color: var(--color-text);
	}
</style>
