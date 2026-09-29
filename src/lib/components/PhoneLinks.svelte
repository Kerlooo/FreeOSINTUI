<script>
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ links: { id: string, label: string, url: string }[], number: string }} */
	let { links, number } = $props();
</script>

<ul>
	{#each links as link (link.id)}
		<li>
			<!-- External links only, so resolve() does not apply. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</li>
	{/each}
	<li>
		<a href={resolve(`/dorks?type=phone&q=${encodeURIComponent(number)}`)}
			>{t('tools.dorks.name')}</a
		>
	</li>
</ul>

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.875rem;
		text-decoration: none;
	}

	a:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}
</style>
