<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ findings: { id: string, severity: 'warning' | 'notice' | 'info', message: string }[] }} */
	let { findings } = $props();
</script>

{#if findings.length}
	<ul>
		{#each findings as finding (finding.id)}
			<li class={finding.severity}>
				<span class="badge">{t(`url.severity.${finding.severity}`)}</span>
				<span class="message">{finding.message}</span>
			</li>
		{/each}
	</ul>
{:else}
	<p>{t('url.findings.none')}</p>
{/if}

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
		padding: 0.5rem 0.75rem;
		border-left: 3px solid var(--color-border);
		background: var(--color-surface);
		border-radius: var(--radius);
		font-size: 0.875rem;
	}

	li.warning {
		border-left-color: var(--color-danger);
	}

	li.notice {
		border-left-color: var(--color-text);
	}

	.badge {
		min-width: 5.5rem;
		color: var(--color-text-dim);
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	li.warning .badge {
		color: var(--color-danger);
	}

	.message {
		flex: 1 1 14rem;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
