<script>
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ pivots: { ips: { address: string, internal: boolean }[], domains: string[], emails: string[] } }} */
	let { pivots } = $props();

	/** @param {string} value */
	const q = (value) => encodeURIComponent(value);
</script>

{#if pivots.ips.length}
	<h4>{t('headers.pivotIps')}</h4>
	<ul>
		{#each pivots.ips as ip (ip.address)}
			<li>
				<span class="value">{ip.address}</span>
				{#if ip.internal}
					<span class="tag">{t('headers.internal')}</span>
				{:else}
					<a href={resolve(`/ip?q=${q(ip.address)}`)}>{t('tools.ip.name')}</a>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

{#if pivots.domains.length}
	<h4>{t('headers.pivotDomains')}</h4>
	<ul>
		{#each pivots.domains as domain (domain)}
			<li>
				<span class="value">{domain}</span>
				<a href={resolve(`/domain?q=${q(domain)}`)}>{t('tools.domain.name')}</a>
				<a href={resolve(`/dorks?type=domain&q=${q(domain)}`)}>{t('headers.pivotDorks')}</a>
			</li>
		{/each}
	</ul>
{/if}

{#if pivots.emails.length}
	<h4>{t('headers.pivotEmails')}</h4>
	<ul>
		{#each pivots.emails as email (email)}
			<li>
				<span class="value">{email}</span>
				<a href={resolve(`/email?q=${q(email)}`)}>{t('tools.email.name')}</a>
				<a href={resolve(`/leaks?email=${q(email)}`)}>{t('tools.leaks.name')}</a>
				<a href={resolve(`/dorks?type=email&q=${q(email)}`)}>{t('headers.pivotDorks')}</a>
			</li>
		{/each}
	</ul>
{/if}

<p class="hint">{t('headers.pivotHint')}</p>

<style>
	h4 {
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.6rem;
		align-items: center;
		font-size: 0.875rem;
	}

	.value {
		min-width: 0;
		margin-right: auto;
		overflow-wrap: anywhere;
	}

	a,
	.tag {
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

	.tag {
		border-color: var(--color-border);
		color: var(--color-text-dim);
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
