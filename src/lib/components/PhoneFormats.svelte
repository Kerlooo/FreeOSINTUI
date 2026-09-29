<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ formats: { id: string, label: string, value: string }[] }} */
	let { formats } = $props();
</script>

<ul>
	{#each formats as format (format.id)}
		<li>
			<span class="label">{format.label}</span>
			<code>{format.value}</code>
			<CopyButton value={format.value} label={t('phone.copyFormat', { format: format.label })} />
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 9rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem 1rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.label {
		color: var(--color-text-dim);
		font-size: 0.875rem;
	}

	code {
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}

	@media (max-width: 36rem) {
		li {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.label {
			grid-column: 1 / -1;
		}
	}
</style>
