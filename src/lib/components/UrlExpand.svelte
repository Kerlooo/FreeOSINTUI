<script>
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { defang } from '$lib/url/refang.js';
	import { MAX_EXPAND_HOPS } from '$lib/url/shorteners.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ data: { hops: { url: string, status: number, location: string | null }[], final: string | null, truncated: boolean } }} */
	let { data } = $props();
</script>

<ol>
	{#each data.hops as hop (hop.url)}
		<li>
			<code>{defang(hop.url)}</code>
			<span class="status">{t('url.expand.hop', { status: hop.status })}</span>
		</li>
	{/each}
</ol>

{#if data.final}
	<div class="final">
		<span class="label">{t('url.expand.final')}</span>
		<code>{defang(data.final)}</code>
		<div class="actions">
			<a href={resolve(`/url?q=${encodeURIComponent(data.final)}`)}>{t('url.pivot.analyze')}</a>
			<CopyButton value={data.final} label={t('url.copyUrl')} />
		</div>
	</div>
	{#if data.truncated}
		<p class="muted">{t('url.expand.truncated', { count: MAX_EXPAND_HOPS })}</p>
	{/if}
{:else}
	<p class="muted">{t('url.expand.noLocation')}</p>
{/if}

<style>
	ol {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.85rem;
	}

	li {
		overflow-wrap: anywhere;
	}

	.status {
		margin-left: 0.5rem;
		color: var(--color-text-dim);
	}

	.final {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.75rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		background: var(--color-surface);
		font-size: 0.85rem;
	}

	.label {
		color: var(--color-text-dim);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
	}

	code {
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}

	.muted {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
