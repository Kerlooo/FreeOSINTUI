<script>
	import FootprintSource from '$lib/components/FootprintSource.svelte';
	import { BACKEND_START_COMMAND } from '$lib/api.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Status of the Wayback Machine query (through the backend).
	 * @type {{ result: { status: 'loading' | 'done' | 'error', data?: { records: any[], truncated: boolean }, error?: string, backendDown?: boolean } }}
	 */
	let { result } = $props();
</script>

<FootprintSource
	id="footprint-wayback"
	title={t('footprint.source.wayback')}
	source="web.archive.org"
	busy={result.status === 'loading'}
>
	<p>{t('footprint.wayback.note')}</p>
	{#if result.status === 'loading'}
		<p>{t('footprint.wayback.loading')}</p>
	{:else if result.status === 'error' && result.backendDown}
		<div class="notice" role="alert">
			<p>
				<strong>{t('backend.down')}</strong>
				{t('footprint.wayback.backendNeeded')}
			</p>
			<code>{BACKEND_START_COMMAND}</code>
		</div>
	{:else if result.status === 'error'}
		<p class="error" role="alert">{result.error}</p>
	{:else if result.data}
		<p class="count">
			{t('footprint.captures', {
				count: result.data.records.length,
				n: formatNumber(result.data.records.length)
			})}
			{#if result.data.truncated}{t('footprint.limitReached')}{/if}
		</p>
	{/if}
</FootprintSource>

<style>
	.count {
		color: var(--color-text);
	}

	.notice {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
	}

	.notice p {
		color: var(--color-text);
	}

	.notice strong {
		color: var(--color-danger);
	}

	code {
		max-width: 100%;
		padding: 0.4rem 0.6rem;
		background: var(--color-surface);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}
</style>
