<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ params: { name: string, value: string, tracking: boolean, embedded: string | null }[] }} */
	let { params } = $props();
</script>

{#if params.length}
	<dl>
		{#each params as param, index (index)}
			<dt>
				<span class="name">{param.name}</span>
				{#if param.tracking}<span class="tag">{t('url.params.tracking')}</span>{/if}
				{#if param.embedded}<span class="tag embedded">{t('url.params.embedded')}</span>{/if}
			</dt>
			<dd>{param.value}</dd>
		{/each}
	</dl>
{:else}
	<p>{t('url.params.empty')}</p>
{/if}

<style>
	dl {
		display: grid;
		grid-template-columns: minmax(6rem, max-content) minmax(0, 1fr);
		margin: 0;
		font-size: 0.875rem;
	}

	dt,
	dd {
		margin: 0;
		padding: 0.45rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		overflow-wrap: anywhere;
	}

	dt {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.5rem;
		color: var(--color-text-dim);
	}

	.tag {
		padding: 0 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-muted);
		font-size: 0.7rem;
	}

	.tag.embedded {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	@media (max-width: 30rem) {
		dl {
			grid-template-columns: minmax(0, 1fr);
		}

		dt {
			border-bottom: none;
			padding-bottom: 0;
		}
	}
</style>
