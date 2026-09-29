<script>
	import { formatResetTime } from '$lib/github/api.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ rate: import('$lib/github/api.js').RateLimit }} */
	let { rate } = $props();
</script>

<p class="rate" class:low={rate.remaining < 10}>
	{t('github.rate.status', {
		remaining: rate.remaining,
		limit: rate.limit,
		reset: formatResetTime(rate.reset)
	})}
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
