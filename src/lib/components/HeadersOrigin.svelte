<script>
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * @type {{
	 *   origin: { ip: string, hopIndex: number, host: string | null } | null,
	 *   sourceIps: { name: string, value: string, ip: string | null, internal: boolean }[]
	 * }}
	 */
	let { origin, sourceIps } = $props();
</script>

{#if origin}
	<div class="origin">
		<span class="label">{t('headers.originLikely')}</span>
		<div class="ip">
			<strong>{origin.ip}</strong>
			<CopyButton value={origin.ip} />
			<a href={resolve(`/ip?q=${encodeURIComponent(origin.ip)}`)}>{t('tools.ip.name')}</a>
		</div>
		<span class="label">
			{t('headers.originHop')}
			{t('headers.originHopValue', {
				number: origin.hopIndex + 1,
				host: origin.host ?? t('common.unknown')
			})}
		</span>
	</div>
{:else}
	<p class="hint">{t('headers.originNone')}</p>
{/if}

{#if sourceIps.length}
	<h4>{t('headers.sourceIpHeading')}</h4>
	<ul>
		{#each sourceIps as item, index (index)}
			<li>
				<span class="label">{item.name}</span>
				<span class="value">{item.value}</span>
				{#if item.ip && !item.internal}
					<a href={resolve(`/ip?q=${encodeURIComponent(item.ip)}`)}>{t('tools.ip.name')}</a>
				{:else if item.internal}
					<span class="label">({t('headers.internal')})</span>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<p class="hint">{t('headers.originNote')}</p>

<style>
	.origin {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.75rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		overflow-wrap: anywhere;
	}

	.ip {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		font-size: 1.1rem;
	}

	.label,
	.hint {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.hint {
		margin: 0;
	}

	h4 {
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.6rem;
		align-items: center;
		font-size: 0.875rem;
	}

	.value {
		overflow-wrap: anywhere;
	}

	a {
		padding: 0.15rem 0.6rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.8rem;
		text-decoration: none;
	}

	a:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}
</style>
