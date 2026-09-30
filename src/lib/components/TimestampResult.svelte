<script>
	import { resolve } from '$app/paths';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import TimestampDate from '$lib/components/TimestampDate.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ result: import('$lib/timestamp/decode.js').Interpretation, now: number }} */
	let { result, now } = $props();

	let rows = $derived(
		result.fields.map((field) => ({
			label: t(`timestamp.field.${field.id}`),
			value: field.valueKey
				? t(`timestamp.value.${field.valueKey}`, { value: field.value })
				: field.value
		}))
	);
	let macPivot = $derived(result.fields.find((field) => field.pivot === 'mac')?.value ?? null);
</script>

<article class:unlikely={!result.plausible}>
	<header>
		<h3>{t(`timestamp.format.${result.id}`)}</h3>
		{#if !result.plausible}
			<span class="badge">{t('timestamp.unlikely')}</span>
		{/if}
		{#if result.approximate}
			<span class="badge">{t('timestamp.approximate')}</span>
		{/if}
	</header>

	{#if result.ns !== null}
		<TimestampDate ns={result.ns} {now} />
	{:else}
		<p class="hint">{t('timestamp.noDate')}</p>
	{/if}

	{#if rows.length}
		<KeyValueTable {rows} />
	{/if}

	{#if result.note}
		<p class="note">{t(`timestamp.note.${result.note}`)}</p>
	{/if}

	{#if result.link || macPivot}
		<ul class="links">
			{#if result.link}
				<li>
					<!-- External link, so resolve() does not apply. -->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={result.link.href} target="_blank" rel="noopener noreferrer"
						>{t(`timestamp.link.${result.link.id}`)}</a
					>
				</li>
			{/if}
			{#if macPivot}
				<li>
					<a href={resolve(`/mac?q=${encodeURIComponent(macPivot)}`)}>{t('timestamp.pivotMac')}</a>
				</li>
			{/if}
		</ul>
	{/if}
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	article.unlikely {
		border-style: dashed;
	}

	article.unlikely h3 {
		color: var(--color-text-dim);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
	}

	.badge {
		padding: 0 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	.hint,
	.note {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.note {
		padding-left: 0.75rem;
		border-left: 2px solid var(--color-border);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.875rem;
	}
</style>
