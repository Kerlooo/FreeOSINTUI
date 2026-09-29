<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ file: File }} */
	let { file } = $props();

	let url = $state('');
	let failed = $state(false);
	let size = $state('');

	$effect(() => {
		const objectUrl = URL.createObjectURL(file);
		url = objectUrl;
		failed = false;
		size = '';
		return () => URL.revokeObjectURL(objectUrl);
	});

	/** @param {Event & { currentTarget: HTMLImageElement }} event */
	function handleLoad(event) {
		size = `${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight} px`;
	}
</script>

<figure>
	{#if failed}
		<p class="hint">{t('metadata.preview.unsupported')}</p>
	{:else if url}
		<img
			src={url}
			alt={t('metadata.preview.alt', { name: file.name })}
			onload={handleLoad}
			onerror={() => (failed = true)}
		/>
	{/if}
	{#if size}
		<figcaption>{t('metadata.preview.size', { size })}</figcaption>
	{/if}
</figure>

<style>
	figure {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
	}

	img {
		display: block;
		max-width: 100%;
		max-height: 22rem;
		object-fit: contain;
		align-self: flex-start;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	figcaption,
	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
