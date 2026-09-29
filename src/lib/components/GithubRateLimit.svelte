<script>
	import { formatResetTime } from '$lib/github/api.js';

	/** @type {{ rate: import('$lib/github/api.js').RateLimit }} */
	let { rate } = $props();
</script>

<p class="rate" class:low={rate.remaining < 10}>
	GitHub API: {rate.remaining} / {rate.limit} requests left this hour, resets {formatResetTime(
		rate.reset
	)}.
</p>

<style>
	.rate {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.low {
		color: var(--color-danger);
	}
</style>
