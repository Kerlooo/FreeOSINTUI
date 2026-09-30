<script>
	import { BACKEND_START_COMMAND } from '$lib/api.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * One independently loaded result section of the URL Analyzer.
	 * `result.status === 'backend'` shows the "backend not running" notice.
	 * @type {{
	 *   id: string,
	 *   title: string,
	 *   source?: string,
	 *   note?: string,
	 *   result?: { status: 'loading' | 'done' | 'error' | 'backend', data?: any, error?: string },
	 *   isEmpty?: (data: any) => boolean,
	 *   emptyText?: string,
	 *   children: import('svelte').Snippet<[any]>
	 * }}
	 */
	let {
		id,
		title,
		source,
		note,
		result = { status: 'done', data: true },
		isEmpty = (data) => data === null || data === undefined,
		emptyText,
		children
	} = $props();
</script>

<section class="panel" aria-labelledby={id} aria-busy={result.status === 'loading'}>
	<header>
		<h2 {id}>{title}</h2>
		{#if source}<span class="source">{source}</span>{/if}
	</header>
	{#if note}
		<p class="note">{note}</p>
	{/if}

	{#if result.status === 'loading'}
		<p class="status">{t('url.loading')}</p>
	{:else if result.status === 'backend'}
		<div class="notice" role="alert">
			<p><strong>{t('backend.down')}</strong> {t('backend.needed')}</p>
			<code>{BACKEND_START_COMMAND}</code>
		</div>
	{:else if result.status === 'error'}
		<p class="status error" role="alert">{result.error}</p>
	{:else if isEmpty(result.data)}
		<p class="status">{emptyText ?? t('common.noData')}</p>
	{:else}
		{@render children(result.data)}
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
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.source {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.note {
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.status {
		color: var(--color-text-dim);
	}

	.status.error {
		color: var(--color-danger);
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

	.notice strong {
		color: var(--color-danger);
	}

	code {
		max-width: 100%;
		padding: 0.4rem 0.6rem;
		background: var(--color-surface);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}
</style>
