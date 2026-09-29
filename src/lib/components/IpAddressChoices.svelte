<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Addresses a hostname resolved to; the selected one is analyzed.
	 * @type {{ hostname: string, addresses: { address: string, version: 4 | 6 }[], selected: string, onselect: (address: string) => void }}
	 */
	let { hostname, addresses, selected, onselect } = $props();
</script>

<div class="choices">
	<p>
		<strong>{hostname}</strong>
		{t('ip.choices.resolvesTo', { count: addresses.length })}
		<strong>{selected}</strong>{addresses.length > 1 ? t('ip.choices.pickAnother') : '.'}
	</p>
	{#if addresses.length > 1}
		<ul>
			{#each addresses as { address, version } (address)}
				<li>
					<button
						type="button"
						aria-pressed={address === selected}
						onclick={() => onselect(address)}
					>
						{address} <span>IPv{version}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	strong {
		color: var(--color-text);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	button {
		max-width: 100%;
		padding: 0.25rem 0.6rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.8rem;
		text-align: left;
		overflow-wrap: anywhere;
		cursor: pointer;
	}

	button:hover {
		border-color: var(--color-text-muted);
	}

	button[aria-pressed='true'] {
		background: var(--color-text);
		border-color: var(--color-text);
		color: var(--color-bg);
	}

	span {
		opacity: 0.7;
	}
</style>
