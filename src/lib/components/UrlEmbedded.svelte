<script>
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { defang } from '$lib/url/refang.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * URLs found inside the analyzed one, each with a link that analyzes it.
	 * @type {{
	 *   embedded: { param: string | null, source: 'query' | 'fragment' | 'wrapper', url: string, encoding: string, redirectParam: boolean }[],
	 *   chain: string[]
	 * }}
	 */
	let { embedded, chain } = $props();

	/** @param {(typeof embedded)[number]} entry */
	const where = (entry) =>
		entry.source === 'wrapper'
			? t('url.embedded.wrapper')
			: t(`url.embedded.${entry.source}`, { param: entry.param ?? '' });
</script>

<ul>
	{#each embedded as entry (entry.url)}
		<li>
			<div class="meta">
				<span>{where(entry)}</span>
				<span class="tag">{t(`url.encoding.${entry.encoding}`)}</span>
				{#if entry.redirectParam}<span class="tag strong">{t('url.embedded.redirect')}</span>{/if}
			</div>
			<code>{defang(entry.url)}</code>
			<div class="actions">
				<a href={resolve(`/url?q=${encodeURIComponent(entry.url)}`)}>{t('url.pivot.analyze')}</a>
				<CopyButton value={entry.url} label={t('url.copyUrl')} />
			</div>
		</li>
	{/each}
</ul>

{#if chain.length > 1}
	<div class="chain">
		<span>{t('url.embedded.chain')}</span>
		<code>{defang(chain[chain.length - 1])}</code>
		<a href={resolve(`/url?q=${encodeURIComponent(chain[chain.length - 1])}`)}
			>{t('url.pivot.analyze')}</a
		>
	</div>
{/if}

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li,
	.chain {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	.chain {
		padding: 0.75rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	.meta,
	.actions {
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

	.tag.strong {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	code {
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}
</style>
