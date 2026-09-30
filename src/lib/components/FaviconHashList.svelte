<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ hashes: { mmh3: number, md5: string, sha256: string } }} */
	let { hashes } = $props();

	let rows = $derived([
		{ id: 'mmh3', label: t('favicon.hash.mmh3'), value: String(hashes.mmh3) },
		{ id: 'md5', label: t('favicon.hash.md5'), value: hashes.md5 },
		{ id: 'sha256', label: t('favicon.hash.sha256'), value: hashes.sha256 }
	]);
</script>

<dl>
	{#each rows as row (row.id)}
		<div class="row" class:primary={row.id === 'mmh3'}>
			<dt>{row.label}</dt>
			<dd>
				<code>{row.value}</code>
				<CopyButton value={row.value} label={row.label} />
			</dd>
		</div>
	{/each}
</dl>

<style>
	dl {
		display: flex;
		flex-direction: column;
		margin: 0;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	dt {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	dd {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	code {
		flex: 1;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}

	.primary code {
		font-size: 1.25rem;
		font-weight: 700;
	}
</style>
