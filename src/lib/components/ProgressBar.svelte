<script>
	/** @type {{ value: number, label: string }} */
	let { value, label } = $props();

	let percent = $derived(Math.round(value * 100));
</script>

<div class="progress">
	<div
		class="track"
		role="progressbar"
		aria-label={label}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={percent}
	>
		<div class="bar" style:width={`${percent}%`}></div>
	</div>
	<span>{percent}%</span>
</div>

<style>
	.progress {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.track {
		flex: 1;
		height: 0.6rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.bar {
		height: 100%;
		background: var(--color-text);
		box-shadow: 0 0 8px var(--color-text);
	}

	span {
		min-width: 3rem;
		text-align: right;
		font-size: 0.85rem;
	}
</style>
