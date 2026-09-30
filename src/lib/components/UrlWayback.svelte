<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ data: { snapshot: { url: string, date: string | null, status: string | null } | null, historyUrl: string } }} */
	let { data } = $props();
</script>

{#if data.snapshot}
	<KeyValueTable
		rows={[
			{ label: t('url.wayback.snapshot'), value: data.snapshot.url, href: data.snapshot.url },
			{ label: t('url.wayback.date'), value: data.snapshot.date },
			{ label: t('url.wayback.status'), value: data.snapshot.status }
		]}
	/>
{:else}
	<p>{t('url.wayback.none')}</p>
{/if}
<!-- External web.archive.org link, so resolve() does not apply. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a href={data.historyUrl} target="_blank" rel="noopener noreferrer">{t('url.wayback.history')} ↗</a>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	a {
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}
</style>
