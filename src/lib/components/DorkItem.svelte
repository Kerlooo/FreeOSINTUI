<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ dork: { label: string, query: string, url: string } }} */
	let { dork } = $props();
</script>

<li class="dork">
	<span class="label">{dork.label}</span>
	<code>{dork.query}</code>
	<div class="actions">
		<!-- External Google URL, so resolve() does not apply. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={dork.url}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={t('dorks.searchLabel', { label: dork.label })}
		>
			{t('dorks.search')}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
		<CopyButton value={dork.query} label={t('dorks.copyLabel', { label: dork.label })} />
	</div>
</li>

<style>
	.dork {
		display: grid;
		grid-template-columns: 12rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem 1rem;
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.dork:hover {
		background: var(--color-surface);
	}

	.label {
		font-weight: 700;
		font-size: 0.9rem;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-text-dim);
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	a {
		padding: 0.25rem 0.6rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.8rem;
		text-decoration: none;
		white-space: nowrap;
	}

	a:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}

	@media (max-width: 48rem) {
		.dork {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		code {
			grid-column: 1 / -1;
			grid-row: 2;
		}
	}
</style>
