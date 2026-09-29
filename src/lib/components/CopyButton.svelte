<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ value: string, label?: string }} */
	let { value, label } = $props();

	let copied = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	async function copy() {
		await navigator.clipboard.writeText(value);
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1500);
	}
</script>

<button type="button" onclick={copy} aria-label={`${label ?? t('common.copyLabel')}: ${value}`}>
	{copied ? t('common.copied') : t('common.copy')}
</button>

<style>
	button {
		min-width: 4.5rem;
		padding: 0.25rem 0.6rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.8rem;
		cursor: pointer;
	}

	button:hover {
		border-color: var(--color-text);
		color: var(--color-text);
	}
</style>
