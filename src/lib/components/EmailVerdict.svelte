<script>
	/** @type {{ label: string, verdict: { level: 'good' | 'warn' | 'bad', text: string } }} */
	let { label, verdict } = $props();

	const BADGES = { good: 'OK', warn: 'WEAK', bad: 'RISK' };
</script>

<div class="verdict {verdict.level}">
	<span class="badge">{BADGES[verdict.level]}</span>
	<p><strong>{label}:</strong> {verdict.text}</p>
</div>

<style>
	.verdict {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		font-size: 0.875rem;
	}

	.badge {
		flex: none;
		min-width: 3.5rem;
		padding: 0.1rem 0.4rem;
		border: 1px solid currentColor;
		border-radius: var(--radius);
		font-size: 0.75rem;
		font-weight: 700;
		text-align: center;
	}

	.good .badge {
		color: var(--color-text);
	}

	.warn .badge {
		color: var(--color-text-dim);
		border-style: dashed;
	}

	.bad .badge {
		color: var(--color-danger);
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		overflow-wrap: anywhere;
	}

	strong {
		color: var(--color-text);
	}
</style>
