<script>
	import { formatAmount, shortenHash } from '$lib/crypto/format.js';

	/**
	 * Latest transactions of a traced address. Counterparties are buttons that trace them in turn.
	 * @type {{
	 *   txs: { id: string, time: Date | null, confirmed: boolean, failed: boolean, coinbase: boolean, direction: string, amount: bigint, method?: string | null, counterparties: string[] }[],
	 *   chain: { symbol: string, decimals: number, displayDecimals: number, explorers: { name: string, tx: (id: string) => string }[] },
	 *   ontrace: (address: string) => void
	 * }}
	 */
	let { txs, chain, ontrace } = $props();

	const SHOWN_COUNTERPARTIES = 3;
	const DIRECTIONS = { in: '↓ in', out: '↑ out', self: '↻ self' };

	/** @param {Date | null} time */
	function formatDate(time) {
		return time ? time.toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'pending';
	}
</script>

<ul>
	{#each txs as tx (tx.id)}
		<li>
			<div class="head">
				<!-- External explorer link, so resolve() does not apply. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					class="txid"
					href={chain.explorers[0].tx(tx.id)}
					target="_blank"
					rel="noopener noreferrer"
					title={tx.id}
				>
					{shortenHash(tx.id)} ↗
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<span class="date">{formatDate(tx.time)}</span>
			</div>
			<div class="body">
				<span class="direction {tx.direction}">{DIRECTIONS[tx.direction]}</span>
				<span class="amount">
					{tx.direction === 'out' ? '-' : tx.direction === 'in' ? '+' : ''}{formatAmount(
						tx.amount,
						chain
					)}
				</span>
				{#if tx.failed}<span class="tag failed">failed</span>{/if}
				{#if !tx.confirmed}<span class="tag">unconfirmed</span>{/if}
				{#if tx.coinbase}<span class="tag">coinbase</span>{/if}
				{#if tx.method}<span class="tag">{tx.method}</span>{/if}
			</div>
			{#if tx.counterparties.length}
				<div class="parties">
					<span class="label">{tx.direction === 'out' ? 'to' : 'from'}</span>
					{#each tx.counterparties.slice(0, SHOWN_COUNTERPARTIES) as address (address)}
						<button
							type="button"
							onclick={() => ontrace(address)}
							title={`Trace ${address}`}
							aria-label={`Trace ${address}`}
						>
							{shortenHash(address, 10, 6)}
						</button>
					{/each}
					{#if tx.counterparties.length > SHOWN_COUNTERPARTIES}
						<span class="label">+{tx.counterparties.length - SHOWN_COUNTERPARTIES} more</span>
					{/if}
				</div>
			{/if}
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.65rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.875rem;
	}

	li:hover {
		background: var(--color-surface);
	}

	.head,
	.body,
	.parties {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.75rem;
	}

	.head {
		justify-content: space-between;
	}

	.txid {
		overflow-wrap: anywhere;
	}

	.date,
	.label {
		color: var(--color-text-dim);
	}

	.direction {
		font-weight: 700;
	}

	.direction.out,
	.direction.self {
		color: var(--color-text-dim);
	}

	.amount {
		overflow-wrap: anywhere;
	}

	.tag {
		padding: 0 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.75rem;
	}

	.tag.failed {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	button {
		padding: 0.1rem 0.5rem;
		background: transparent;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.8rem;
		cursor: pointer;
	}

	button:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}
</style>
