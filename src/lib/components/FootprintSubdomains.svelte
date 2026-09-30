<script>
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ subdomains: { host: string, count: number }[] }} */
	let { subdomains } = $props();

	const PREVIEW = 100;
	let showAll = $state(false);
	let visible = $derived(showAll ? subdomains : subdomains.slice(0, PREVIEW));
</script>

<section class="panel" aria-labelledby="footprint-subdomains">
	<header>
		<h2 id="footprint-subdomains">
			{t('footprint.subdomains.title', { n: formatNumber(subdomains.length) })}
		</h2>
		{#if subdomains.length}
			<CopyButton
				value={subdomains.map((s) => s.host).join('\n')}
				label={t('footprint.subdomains.copyAll')}
			/>
		{/if}
	</header>
	{#if subdomains.length}
		<p>{t('footprint.subdomains.hint')}</p>
		<ul>
			{#each visible as { host, count } (host)}
				<li>
					<a href={resolve(`/domain?q=${encodeURIComponent(host)}`)}>{host}</a>
					<span class="count">{t('footprint.urls', { count, n: formatNumber(count) })}</span>
				</li>
			{/each}
		</ul>
		{#if subdomains.length > PREVIEW}
			<button type="button" onclick={() => (showAll = !showAll)}>
				{showAll
					? t('footprint.showLess')
					: t('footprint.showAll', { n: formatNumber(subdomains.length) })}
			</button>
		{/if}
	{:else}
		<p>{t('footprint.subdomains.empty')}</p>
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
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0 1rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--color-border);
		overflow-wrap: anywhere;
	}

	.count {
		color: var(--color-text-muted);
	}

	button {
		align-self: flex-start;
		padding: 0.3rem 0.8rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		cursor: pointer;
	}

	button:hover {
		border-color: var(--color-text);
		color: var(--color-text);
	}
</style>
