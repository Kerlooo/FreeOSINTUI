<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ params: { name: string, count: number }[] }} */
	let { params } = $props();

	const PREVIEW = 150;
	let showAll = $state(false);
	let visible = $derived(showAll ? params : params.slice(0, PREVIEW));
</script>

<section class="panel" aria-labelledby="footprint-params">
	<header>
		<h2 id="footprint-params">{t('footprint.params.title', { n: formatNumber(params.length) })}</h2>
		{#if params.length}
			<CopyButton
				value={params.map((p) => p.name).join('\n')}
				label={t('footprint.params.copyAll')}
			/>
		{/if}
	</header>
	{#if params.length}
		<p>{t('footprint.params.hint')}</p>
		<ul>
			{#each visible as { name, count } (name)}
				<li title={t('footprint.urls', { count, n: formatNumber(count) })}>
					<code>{name}</code> <span>{formatNumber(count)}</span>
				</li>
			{/each}
		</ul>
		{#if params.length > PREVIEW}
			<button type="button" onclick={() => (showAll = !showAll)}>
				{showAll
					? t('footprint.showLess')
					: t('footprint.showAll', { n: formatNumber(params.length) })}
			</button>
		{/if}
	{:else}
		<p>{t('footprint.params.empty')}</p>
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
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.8rem;
	}

	li {
		max-width: 100%;
		padding: 0.15rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow-wrap: anywhere;
	}

	code {
		font-family: var(--font-mono);
		color: var(--color-text);
	}

	span {
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
