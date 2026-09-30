<script>
	import { formatDuration, formatTimestamp } from '$lib/headers/format.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ chain: ReturnType<typeof import('$lib/headers/received.js').buildChain>, originIndex: number | null }} */
	let { chain, originIndex } = $props();

	/** @param {import('$lib/headers/received.js').ChainHop} hop */
	function rows(hop) {
		return [
			{ label: t('headers.hop.from'), value: hop.from },
			{ label: t('headers.hop.rdns'), value: hop.fromRdns },
			{ label: t('headers.hop.helo'), value: hop.fromHelo },
			{ label: t('headers.hop.ips'), value: hop.fromIps.join(', ') },
			{ label: t('headers.hop.by'), value: hop.by },
			{ label: t('headers.hop.with'), value: hop.with },
			{ label: t('headers.hop.id'), value: hop.id },
			{ label: t('headers.hop.for'), value: hop.for }
		].filter((row) => row.value);
	}
</script>

{#if chain.hops.length}
	<p class="meta">
		{t('headers.chainCount', { count: chain.hops.length })} · {t('headers.chainOrder')}
		{#if chain.total !== null}
			<br />{t('headers.chainTotal', { duration: formatDuration(chain.total) })}
		{/if}
	</p>
	<ol>
		{#each chain.hops as hop (hop.index)}
			<li class:origin={hop.index === originIndex}>
				<div class="head">
					<strong>{t('headers.hop', { number: hop.index + 1 })}</strong>
					<span class="time" title={hop.dateText ?? undefined}>
						{hop.date !== null ? formatTimestamp(hop.date) : t('headers.noDate')}
					</span>
					{#if hop.delay !== null}
						<span class="delay" class:warn={hop.slow} class:bad={hop.negative}>
							{hop.negative
								? formatDuration(hop.delay)
								: t('headers.delay', { duration: formatDuration(hop.delay) })}
							{#if hop.slow}· {t('headers.delaySlow')}{/if}
							{#if hop.negative}· {t('headers.delayNegative')}{/if}
						</span>
					{/if}
				</div>
				<dl>
					{#each rows(hop) as row (row.label)}
						<dt>{row.label}</dt>
						<dd>{row.value}</dd>
					{/each}
				</dl>
				<details>
					<summary>{t('headers.hop.raw')}</summary>
					<code>{hop.raw}</code>
				</details>
			</li>
		{/each}
	</ol>
{:else}
	<p class="meta">{t('headers.chainEmpty')}</p>
{/if}

<style>
	.meta {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow-wrap: anywhere;
	}

	li.origin {
		border-color: var(--color-text-muted);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
		align-items: baseline;
		margin-bottom: 0.4rem;
	}

	.time,
	.delay {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.delay.warn {
		color: var(--color-text);
	}

	.delay.bad {
		color: var(--color-danger);
	}

	dl {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 0.15rem 0.75rem;
		margin: 0;
		font-size: 0.85rem;
	}

	dt {
		color: var(--color-text-dim);
	}

	dd {
		margin: 0;
	}

	details {
		margin-top: 0.4rem;
		font-size: 0.8rem;
	}

	summary {
		color: var(--color-text-dim);
		cursor: pointer;
	}

	code {
		display: block;
		margin-top: 0.3rem;
		padding: 0.4rem;
		background: var(--color-surface);
		border-radius: var(--radius);
		white-space: pre-wrap;
	}

	@media (max-width: 30rem) {
		dl {
			grid-template-columns: minmax(0, 1fr);
		}

		dd {
			margin-bottom: 0.25rem;
		}
	}
</style>
