<script>
	import { formatClock } from '$lib/clock/format.js';
	import { getLocale } from '$lib/i18n/i18n.svelte.js';

	/** @type {Date | null} */
	let now = $state(null);

	// Pages are prerendered: the time is only set in the browser.
	$effect(() => {
		now = new Date();
		const timer = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(timer);
	});

	const clock = $derived(now && formatClock(now, getLocale()));
</script>

{#if clock}
	<time class="clock" datetime={clock.datetime}>
		<span class="day">{clock.day}</span>
		<span class="time">{clock.time}</span>
	</time>
{/if}

<style>
	.clock {
		display: inline-flex;
		gap: 0.5rem;
		padding: 0.15rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.day {
		color: var(--color-text-dim);
	}

	.time {
		color: var(--color-text);
		text-shadow: 0 0 6px var(--color-text-muted);
	}
</style>
