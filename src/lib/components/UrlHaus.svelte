<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { urlhausRows } from '$lib/url/rows.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ data: { configured: boolean, listed?: boolean } & Record<string, any> }} */
	let { data } = $props();
</script>

{#if !data.configured}
	<p>{t('url.urlhaus.notConfigured')}</p>
{:else if !data.listed}
	<p>{t('url.urlhaus.notListed')}</p>
{:else}
	<p class="listed">{t('url.urlhaus.listed')}</p>
	<KeyValueTable rows={urlhausRows(data)} />
{/if}

<style>
	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.listed {
		color: var(--color-danger);
		font-weight: 700;
	}
</style>
