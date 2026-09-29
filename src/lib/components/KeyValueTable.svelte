<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Two-column table of labelled values. Rows with an empty value are hidden.
	 * @type {{ rows: { label: string, value: string | number | null | undefined, href?: string }[] }}
	 */
	let { rows } = $props();

	let visible = $derived(
		rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== '')
	);
</script>

{#if visible.length}
	<dl>
		{#each visible as row (row.label)}
			<dt>{row.label}</dt>
			<dd>
				{#if row.href}
					<!-- External links only, so resolve() does not apply. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a href={row.href} target="_blank" rel="noopener noreferrer">{row.value}</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{:else}
					{row.value}
				{/if}
			</dd>
		{/each}
	</dl>
{:else}
	<p>{t('common.noData')}</p>
{/if}

<style>
	dl {
		display: grid;
		grid-template-columns: minmax(8rem, max-content) minmax(0, 1fr);
		margin: 0;
		font-size: 0.875rem;
	}

	dt,
	dd {
		margin: 0;
		padding: 0.45rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	dt {
		color: var(--color-text-dim);
	}

	dd {
		overflow-wrap: anywhere;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.875rem;
	}

	@media (max-width: 36rem) {
		dl {
			grid-template-columns: minmax(0, 1fr);
		}

		dt {
			padding-bottom: 0;
			border-bottom: none;
		}
	}
</style>
