<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ file: File }} */
	let { file } = $props();

	let url = $state('');
	let failed = $state(false);
	let dimensions = $state('');

	$effect(() => {
		const objectUrl = URL.createObjectURL(file);
		url = objectUrl;
		failed = false;
		dimensions = '';
		return () => URL.revokeObjectURL(objectUrl);
	});

	/** @param {Event & { currentTarget: HTMLImageElement }} event */
	function handleLoad(event) {
		const { naturalWidth, naturalHeight } = event.currentTarget;
		if (naturalWidth)
			dimensions = t('favicon.preview.dimensions', { size: `${naturalWidth} × ${naturalHeight}` });
	}
</script>

<figure>
	{#if failed}
		<p>{t('favicon.preview.unsupported')}</p>
	{:else if url}
		<!-- Shown at native size and enlarged, as favicons are tiny. -->
		<div class="tiles">
			<img
				class="native"
				src={url}
				alt={t('favicon.preview.alt', { name: file.name })}
				onload={handleLoad}
				onerror={() => (failed = true)}
			/>
			<img class="large" src={url} alt="" aria-hidden="true" />
		</div>
	{/if}
	{#if dimensions}
		<figcaption>{dimensions}</figcaption>
	{/if}
</figure>

<style>
	figure {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
	}

	.tiles {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.native {
		max-width: 4rem;
		max-height: 4rem;
	}

	.large {
		width: 6rem;
		height: 6rem;
		object-fit: contain;
		image-rendering: pixelated;
	}

	figcaption,
	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
