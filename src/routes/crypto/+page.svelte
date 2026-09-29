<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import CryptoTxList from '$lib/components/CryptoTxList.svelte';
	import { analyzeAddress, checksumLabel, typeLabel } from '$lib/crypto/address.js';
	import { CHAINS } from '$lib/crypto/chains.js';
	import { formatAmount } from '$lib/crypto/format.js';
	import { traceAddress } from '$lib/crypto/trace.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	const SHOWN_TXS = 10;

	let input = $state('');
	let busy = $state(false);
	let error = $state('');
	/** @type {{ chain: 'btc' | 'ltc' | 'eth', address: string, type: string, typeLabel: string, checksumKind: 'eip55' | 'none' | 'bech32' | 'bech32m' | 'base58check', checksum: string } | null} */
	let target = $state(null);
	/** @type {Awaited<ReturnType<typeof traceAddress>> | null} */
	let data = $state(null);
	/** @type {AbortController | null} */
	let controller = null;

	let chain = $derived(target ? CHAINS[target.chain] : null);

	/** @param {string} value */
	async function lookup(value) {
		controller?.abort();
		const current = new AbortController();
		controller = current;

		error = '';
		target = null;
		data = null;
		busy = true;

		try {
			const analysis = await analyzeAddress(value);
			if (current.signal.aborted) return;
			if (!analysis.ok) {
				error = analysis.error;
				return;
			}
			target = analysis;
			data = await traceAddress(analysis, { signal: current.signal });
		} catch (err) {
			if (!current.signal.aborted) error = err instanceof Error ? err.message : String(err);
		} finally {
			if (controller === current) busy = false;
		}
	}

	/** @param {string} address */
	function retrace(address) {
		input = address;
		lookup(address);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	/** @param {Date | null} date */
	function formatDate(date) {
		return date ? date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : null;
	}

	let detectionRows = $derived(
		target && chain
			? [
					{ label: t('crypto.row.chain'), value: chain.name },
					{ label: t('crypto.row.type'), value: typeLabel(target.type) },
					{ label: t('crypto.row.checksum'), value: checksumLabel(target.checksumKind) }
				]
			: []
	);

	let summaryRows = $derived(
		data && chain
			? [
					{ label: t('crypto.row.balance'), value: formatAmount(data.balance, chain) },
					{
						label: t('crypto.row.received'),
						value: data.received === null ? null : formatAmount(data.received, chain)
					},
					{
						label: t('crypto.row.sent'),
						value: data.sent === null ? null : formatAmount(data.sent, chain)
					},
					{
						label: t('crypto.row.txs'),
						value: data.pendingTxCount
							? t('crypto.txCountUnconfirmed', {
									count: formatNumber(data.txCount),
									pending: formatNumber(data.pendingTxCount)
								})
							: formatNumber(data.txCount)
					},
					{ label: t('crypto.row.firstSeen'), value: formatDate(data.firstSeen) },
					{ label: t('crypto.row.lastSeen'), value: formatDate(data.lastSeen) },
					...data.extra
				]
			: []
	);
</script>

<svelte:head>
	<title>{t('tools.crypto.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('crypto.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.crypto.name')} description={t('crypto.intro')} />

<section class="panel" aria-labelledby="crypto-input-heading">
	<h2 id="crypto-input-heading">{t('crypto.addressHeading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('crypto.inputLabel')}
		placeholder="bc1q…, 1…, 3…, L…, M…, ltc1…, 0x…"
		buttonLabel={t('crypto.trace')}
		{busy}
		onsubmit={lookup}
	/>
	{#if error}
		<p class="error" role="alert">{error}</p>
	{:else}
		<p class="hint">{t('crypto.sourcesHint')}</p>
	{/if}
</section>

{#if target && chain}
	<div class="layout">
		<section class="panel" aria-labelledby="crypto-summary-heading">
			<div class="panel-head">
				<h2 id="crypto-summary-heading">{t('crypto.summary')}</h2>
				<CopyButton value={target.address} label={t('crypto.copyAddress')} />
			</div>
			<p class="address">{target.address}</p>
			<KeyValueTable rows={detectionRows} />
			{#if data}
				<KeyValueTable rows={summaryRows} />
			{:else if busy}
				<p class="hint">{t('crypto.loadingData')}</p>
			{/if}
			<ul class="explorers">
				{#each chain.explorers as explorer (explorer.name)}
					<li>
						<!-- External explorer link, so resolve() does not apply. -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a href={explorer.address(target.address)} target="_blank" rel="noopener noreferrer"
							>{explorer.name} ↗</a
						>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
		</section>

		<section class="panel" aria-labelledby="crypto-txs-heading">
			<h2 id="crypto-txs-heading">{t('crypto.latestTxs')}</h2>
			{#if data}
				{#if data.txs.length}
					<CryptoTxList txs={data.txs.slice(0, SHOWN_TXS)} {chain} ontrace={retrace} />
					{#if target.chain === 'eth'}
						<p class="hint">{t('crypto.ethNativeOnly')}</p>
					{/if}
				{:else}
					<p class="hint">{t('crypto.noTxs')}</p>
				{/if}
			{:else if busy}
				<p class="hint">{t('crypto.loadingTxs')}</p>
			{/if}
		</section>
	</div>
{/if}

<p class="note">{t('crypto.disclaimer')}</p>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	@media (min-width: 64rem) {
		.layout {
			grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
			align-items: start;
		}
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.panel-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.address {
		margin: 0;
		overflow-wrap: anywhere;
		font-weight: 700;
	}

	.explorers {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.explorers a {
		display: inline-block;
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.85rem;
		text-decoration: none;
	}

	.explorers a:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}

	.hint,
	.note {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.note {
		margin-top: 1.5rem;
		padding-left: 0.75rem;
		border-left: 2px solid var(--color-border);
	}

	.error {
		margin: 0;
		color: var(--color-danger);
	}
</style>
