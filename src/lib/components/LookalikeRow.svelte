<script>
	import { resolve } from '$app/paths';
	import { GENERATORS } from '$lib/lookalike/generators.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * One lookalike and its DNS records.
	 * @type {{
	 *   candidate: import('$lib/lookalike/generators.js').Candidate,
	 *   result?: { status: 'done', records: import('$lib/lookalike/resolve.js').DnsRecords } | { status: 'error', error: string }
	 * }}
	 */
	let { candidate, result } = $props();

	let typeLabel = $derived(GENERATORS.find((generator) => generator.id === candidate.type)?.label);
	let records = $derived(result?.status === 'done' ? result.records : null);
	let addresses = $derived(records ? [...records.a, ...records.aaaa] : []);
</script>

<li class:registered={records?.registered}>
	<div class="name">
		<strong>{candidate.unicode}</strong>
		{#if candidate.unicode !== candidate.domain}
			<span class="puny">{t('lookalike.punycode', { domain: candidate.domain })}</span>
		{/if}
		<span class="type">{typeLabel}</span>
		{#if records?.mx.length}
			<span class="flag" title={t('lookalike.hasMxTitle')}>{t('lookalike.hasMx')}</span>
		{/if}
	</div>

	{#if !result}
		<p class="status">{t('lookalike.pending')}</p>
	{:else if result.status === 'error'}
		<p class="status error">{t('lookalike.lookupError', { message: result.error })}</p>
	{:else if !result.records.registered}
		<p class="status">{t('lookalike.unregistered')}</p>
	{:else}
		<dl>
			<dt>{t('lookalike.col.a')}</dt>
			<dd>
				{#each addresses as address (address)}
					<a href={resolve(`/ip?q=${encodeURIComponent(address)}`)}>{address}</a>
				{:else}
					—
				{/each}
			</dd>
			<dt>{t('lookalike.col.mx')}</dt>
			<dd>{result.records.mx.join(', ') || '—'}</dd>
			<dt>{t('lookalike.col.ns')}</dt>
			<dd>{result.records.ns.join(', ') || '—'}</dd>
		</dl>
		<div class="pivots">
			<a href={resolve(`/domain?q=${encodeURIComponent(candidate.domain)}`)}
				>{t('tools.domain.name')}</a
			>
			<a href={resolve(`/favicon?q=${encodeURIComponent(candidate.domain)}`)}
				>{t('tools.favicon.name')}</a
			>
		</div>
	{/if}
</li>

<style>
	li {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}

	.name {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
	}

	li:not(.registered) strong {
		color: var(--color-text-dim);
		font-weight: 400;
	}

	.puny,
	.type {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.flag {
		padding: 0 0.4rem;
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
		font-size: 0.75rem;
	}

	.status {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.status.error {
		color: var(--color-danger);
	}

	dl {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 0.15rem 0.75rem;
		margin: 0;
		font-size: 0.8rem;
	}

	dt {
		color: var(--color-text-dim);
	}

	dd {
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.75rem;
		margin: 0;
		min-width: 0;
	}

	.pivots {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		font-size: 0.8rem;
	}
</style>
