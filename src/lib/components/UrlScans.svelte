<script>
	import { formatDate, t } from '$lib/i18n/i18n.svelte.js';
	import { defang } from '$lib/url/refang.js';

	/** @type {{ data: { total: number, search_url: string, results: any[] } }} */
	let { data } = $props();

	/** @param {string | null} value */
	function date(value) {
		if (!value) return '';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? value
			: formatDate(parsed, { dateStyle: 'medium', timeStyle: 'short' });
	}
</script>

<p class="muted">{t('url.urlscan.total', { count: data.total })}</p>

<!-- External urlscan.io links only, so resolve() does not apply. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<ul>
	{#each data.results as scan (scan.uuid)}
		<li>
			<div class="meta">
				<span>{date(scan.time)}</span>
				{#if scan.malicious}
					<span class="tag danger">{t('url.urlscan.malicious')}</span>
				{:else}
					<span class="tag">{t('url.urlscan.noVerdict')}</span>
				{/if}
				{#each scan.tags as tag (tag)}
					<span class="tag">{tag}</span>
				{/each}
				{#if scan.status}<span>HTTP {scan.status}</span>{/if}
				{#if scan.country}<span>{scan.country}</span>{/if}
			</div>
			<code>{defang(scan.task_url ?? '')}</code>
			{#if scan.page_url && scan.page_url !== scan.task_url}
				<code class="dim">→ {defang(scan.page_url)}</code>
			{/if}
			{#if scan.title}<span class="title">{scan.title}</span>{/if}
			<div class="links">
				<a href={scan.result_url} target="_blank" rel="noopener noreferrer"
					>{t('url.urlscan.result')}</a
				>
				<a href={scan.screenshot_url} target="_blank" rel="noopener noreferrer"
					>{t('url.urlscan.screenshot')}</a
				>
			</div>
		</li>
	{/each}
</ul>
<a class="all" href={data.search_url} target="_blank" rel="noopener noreferrer"
	>{t('url.urlscan.searchAll')}</a
>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	.meta,
	.links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		color: var(--color-text-dim);
	}

	.tag {
		padding: 0 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-muted);
		font-size: 0.7rem;
	}

	.tag.danger {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	code {
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}

	.dim,
	.title {
		color: var(--color-text-dim);
		overflow-wrap: anywhere;
	}

	.muted {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.all {
		font-size: 0.85rem;
	}
</style>
