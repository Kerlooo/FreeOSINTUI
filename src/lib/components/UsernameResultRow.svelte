<script>
	/**
	 * @type {{ result: { name: string, status: string, url: string | null, http_status: number | null, reason: string, unreliable?: boolean } }}
	 */
	let { result } = $props();

	const LABELS = { found: 'found', not_found: 'not found', unknown: 'unknown', error: 'error' };
</script>

<li class="row">
	<span class="name">
		{result.name}
		{#if result.unreliable}
			<span class="flag" title="Behind bot protection: results may be unreliable">*</span>
		{/if}
	</span>
	<span class={`status ${result.status}`}>{LABELS[result.status] ?? result.status}</span>
	<span class="reason">{result.reason}</span>
	{#if result.url}
		<!-- External profile URL, so resolve() does not apply. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={result.url}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`Open ${result.name} profile`}
		>
			open ↗
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<span></span>
	{/if}
</li>

<style>
	.row {
		display: grid;
		grid-template-columns: 12rem 6.5rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.25rem 1rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.875rem;
	}

	.row:hover {
		background: var(--color-surface);
	}

	.name {
		font-weight: 700;
		overflow-wrap: anywhere;
	}

	.flag {
		color: var(--color-text-dim);
		cursor: help;
	}

	.status {
		font-size: 0.8rem;
	}

	.status.found {
		color: var(--color-text);
		font-weight: 700;
	}

	.status.not_found {
		color: var(--color-text-muted);
	}

	.status.unknown {
		color: var(--color-text-dim);
	}

	.status.error {
		color: var(--color-danger);
	}

	.reason {
		color: var(--color-text-muted);
		font-size: 0.8rem;
		overflow-wrap: anywhere;
	}

	a {
		padding: 0.2rem 0.6rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.8rem;
		text-decoration: none;
		white-space: nowrap;
	}

	a:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}

	@media (max-width: 48rem) {
		.row {
			grid-template-columns: minmax(0, 1fr) auto auto;
		}

		.reason {
			grid-column: 1 / -1;
			grid-row: 2;
		}
	}
</style>
