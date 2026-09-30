<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ links: ReturnType<typeof import('$lib/favicon/hash.js').searchLinks> }} */
	let { links } = $props();
</script>

<ul>
	{#each links as link (link.id)}
		<li>
			<div class="head">
				<!-- External links only, so resolve() does not apply. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<span class="by">{t('favicon.searchBy', { hash: t(`favicon.hash.${link.hash}`) })}</span>
				<CopyButton value={link.query} label={t('favicon.copyQuery')} />
			</div>
			<code>{link.query}</code>
			{#if link.id === 'urlscan'}
				<span class="note">{t('favicon.urlscanNote')}</span>
			{/if}
		</li>
	{/each}
</ul>

<style>
	ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
	}

	a {
		font-weight: 700;
	}

	.by {
		flex: 1;
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	code {
		font-family: var(--font-mono);
		color: var(--color-text-dim);
		font-size: 0.8rem;
		overflow-wrap: anywhere;
	}

	.note {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}
</style>
