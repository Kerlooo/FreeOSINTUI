<script>
	import { describeFinding } from '$lib/headers/format.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ findings: import('$lib/headers/analyze.js').Finding[] }} */
	let { findings } = $props();

	let items = $derived(
		findings.map((finding, index) => ({
			key: `${finding.id}-${index}`,
			severity: finding.severity,
			...describeFinding(finding)
		}))
	);
</script>

{#if items.length}
	<ul>
		{#each items as item (item.key)}
			<li class={item.severity}>
				<span class="badge">{t(`headers.severity.${item.severity}`)}</span>
				<div>
					<strong>{item.title}</strong>
					<p>{item.detail}</p>
				</div>
			</li>
		{/each}
	</ul>
{:else}
	<p class="none">{t('headers.findingsNone')}</p>
{/if}

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-left-width: 4px;
		border-radius: var(--radius);
		overflow-wrap: anywhere;
	}

	li.high {
		border-left-color: var(--color-danger);
	}

	li.medium {
		border-left-color: var(--color-text);
	}

	li.low {
		border-left-color: var(--color-text-dim);
	}

	li.info {
		border-left-color: var(--color-text-muted);
	}

	.badge {
		flex: none;
		min-width: 4.5rem;
		padding: 0.1rem 0.4rem;
		border: 1px solid currentColor;
		border-radius: var(--radius);
		font-size: 0.75rem;
		text-align: center;
		text-transform: uppercase;
	}

	.high .badge {
		color: var(--color-danger);
	}

	.low .badge,
	.info .badge {
		color: var(--color-text-dim);
	}

	div {
		min-width: 0;
	}

	p {
		margin: 0.2rem 0 0;
		color: var(--color-text-dim);
		font-size: 0.875rem;
	}

	.none {
		margin: 0;
	}

	@media (max-width: 30rem) {
		li {
			flex-direction: column;
			gap: 0.4rem;
		}
	}
</style>
