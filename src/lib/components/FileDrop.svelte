<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ file: File | null, onselect: (file: File) => void }} */
	let { file, onselect } = $props();

	let dragging = $state(false);

	/** @param {number} bytes */
	function formatSize(bytes) {
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		let size = bytes;
		let unit = 0;
		while (size >= 1024 && unit < units.length - 1) {
			size /= 1024;
			unit++;
		}
		return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} event */
	function handleChange(event) {
		const selected = event.currentTarget.files?.[0];
		if (selected) onselect(selected);
		event.currentTarget.value = '';
	}

	/** @param {DragEvent} event */
	function handleDrop(event) {
		event.preventDefault();
		dragging = false;
		const dropped = event.dataTransfer?.files[0];
		if (dropped) onselect(dropped);
	}
</script>

<label
	class="drop"
	class:dragging
	ondragover={(event) => {
		event.preventDefault();
		dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	ondrop={handleDrop}
>
	<input class="visually-hidden" type="file" onchange={handleChange} />
	{#if file}
		<span class="name">{file.name}</span>
		<span class="meta">{t('common.fileDropChosenHint', { size: formatSize(file.size) })}</span>
	{:else}
		<span class="name">{t('common.fileDropEmpty')}</span>
		<span class="meta">{t('common.fileDropEmptyHint')}</span>
	{/if}
</label>

<style>
	.drop {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		min-height: 9rem;
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px dashed var(--color-text-muted);
		border-radius: var(--radius);
		text-align: center;
		cursor: pointer;
		overflow-wrap: anywhere;
	}

	.drop:hover,
	.drop.dragging,
	.drop:focus-within {
		border-color: var(--color-text);
		box-shadow: 0 0 12px var(--color-text-muted);
	}

	.name {
		font-weight: 700;
	}

	.meta {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
