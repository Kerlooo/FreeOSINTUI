<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import MacDetails from '$lib/components/MacDetails.svelte';
	import MacTable from '$lib/components/MacTable.svelte';
	import { parseMacList } from '$lib/mac/parse.js';
	import { loadOuiData, lookupVendor } from '$lib/mac/vendor.js';
	import { formatDate, t } from '$lib/i18n/i18n.svelte.js';

	let input = $state('');
	/** @type {import('$lib/mac/vendor.js').OuiData | null} */
	let data = $state.raw(null);
	let loading = $state(false);
	let loadError = $state('');

	let list = $derived(parseMacList(input));
	let validCount = $derived(list.filter((row) => row.mac).length);
	let single = $derived(list.length === 1 ? list[0].mac : null);

	/** @param {import('$lib/mac/parse.js').ParsedMac} mac */
	function vendorOf(mac) {
		return data && !mac.broadcast ? lookupVendor(mac.hex, data) : null;
	}

	/** @param {import('$lib/mac/parse.js').ParsedMac} mac */
	function vendorText(mac) {
		if (loadError) return t('mac.vendorError', { message: loadError });
		if (!data) return t('mac.loadingVendors');
		const vendor = vendorOf(mac);
		if (vendor) return vendor.organization === 'Private' ? t('mac.private') : vendor.organization;
		return mac.local ? t('mac.noVendorLocal') : t('mac.notFound');
	}

	let tableRows = $derived(
		list.map(({ input, mac }) => ({
			input,
			mac: mac ? mac.formats[0].value : null,
			vendor: mac ? vendorText(mac) : t('mac.invalid'),
			flags: mac
				? [
						...(mac.broadcast ? [t('mac.flag.broadcast')] : []),
						...(mac.multicast && !mac.broadcast ? [t('mac.flag.multicast')] : []),
						...(mac.local && !mac.broadcast ? [t('mac.flag.local')] : [])
					]
				: []
		}))
	);

	let updated = $derived(
		data?.updated
			? formatDate(new Date(`${data.updated}T00:00:00Z`), { dateStyle: 'long', timeZone: 'UTC' })
			: null
	);

	// The vendor table (about 0.6 MB compressed) is only downloaded once an address is typed.
	$effect(() => {
		if (!validCount || data || loading || loadError) return;
		loading = true;
		loadOuiData(new URL(asset('/data/oui.json'), window.location.href).href)
			.then((result) => (data = result))
			.catch((error) => (loadError = error.message))
			.finally(() => (loading = false));
	});

	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q')?.trim();
		if (q) input = q;
	});
</script>

<PageMeta title="{t('tools.mac.name')} — FreeOSINT-UI" description={t('mac.metaDescription')} />

<ToolHeader title={t('tools.mac.name')} description={t('mac.description')} />

<div class="layout">
	<section class="panel" aria-labelledby="mac-input-heading">
		<h2 id="mac-input-heading">{t('mac.inputHeading')}</h2>
		<label class="visually-hidden" for="mac-input">{t('mac.inputLabel')}</label>
		<textarea
			id="mac-input"
			rows="5"
			bind:value={input}
			placeholder="f0:18:98:12:34:56"
			autocomplete="off"
			spellcheck="false"
			aria-invalid={list.length === 1 && !single ? 'true' : undefined}
			aria-describedby="mac-status"></textarea>
		<p id="mac-status" class="hint" class:error={list.length === 1 && !single} aria-live="polite">
			{#if list.length === 1 && !single}
				{t('mac.invalid')}
			{:else if list.length > 1}
				{t('mac.statusCount', { count: validCount })}
			{:else}
				{t('mac.statusIdle')}
			{/if}
		</p>
		<p class="note">{t('mac.accepted')}</p>
		<p class="note">
			{t('mac.source')}
			{#if updated}{t('mac.updated', { date: updated })}{/if}
		</p>
	</section>

	<section class="panel" aria-labelledby="mac-results-heading">
		<h2 id="mac-results-heading">{t('mac.resultsHeading')}</h2>
		{#if single}
			<MacDetails mac={single} vendor={vendorOf(single)} vendorText={vendorText(single)} />
		{:else if list.length > 1}
			<MacTable rows={tableRows} />
		{:else}
			<p class="hint">{t('mac.empty')}</p>
		{/if}
	</section>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
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
		min-width: 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	textarea {
		resize: vertical;
		font-family: var(--font-mono);
	}

	.hint,
	.note {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.note {
		padding-left: 0.75rem;
		border-left: 2px solid var(--color-border);
	}

	.error {
		color: var(--color-danger);
	}
</style>
