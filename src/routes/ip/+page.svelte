<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import IpSection from '$lib/components/IpSection.svelte';
	import IpScanResults from '$lib/components/IpScanResults.svelte';
	import IpAddressChoices from '$lib/components/IpAddressChoices.svelte';
	import { classifyIp, parseInput, parseIp } from '$lib/ip/address.js';
	import {
		lookupGeo,
		lookupInternetDb,
		lookupIpRdap,
		lookupPtr,
		resolveHostname
	} from '$lib/ip/lookups.js';
	import { geoRows, rdapRows } from '$lib/ip/rows.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @typedef {{ status: 'loading' | 'done' | 'error', data?: any, error?: string }} SectionState */

	let input = $state('');
	let inputError = $state('');
	let resolving = $state(false);

	/** @type {{ hostname: string, addresses: { address: string, version: 4 | 6 }[] } | null} */
	let resolved = $state(null);

	/** @type {NonNullable<ReturnType<typeof parseIp>> | null} */
	let target = $state(null);
	/** @type {ReturnType<typeof classifyIp>} */
	let special = $state.raw(null);

	/** @type {Record<'geo' | 'ptr' | 'rdap' | 'scan', SectionState>} */
	let sections = $state({
		geo: { status: 'loading' },
		ptr: { status: 'loading' },
		rdap: { status: 'loading' },
		scan: { status: 'loading' }
	});

	/** @type {AbortController | null} */
	let resolveController = null;
	/** @type {AbortController | null} */
	let analysisController = null;

	/** @param {string} value */
	async function submit(value) {
		resolveController?.abort();
		analysisController?.abort();
		inputError = '';
		resolved = null;
		target = null;
		resolving = false;

		const parsed = parseInput(value);
		if (parsed.kind === 'error') {
			inputError = parsed.error;
			return;
		}
		if (parsed.kind === 'ip') {
			analyze(parsed.ip);
			return;
		}

		const controller = new AbortController();
		resolveController = controller;
		resolving = true;
		try {
			const addresses = await resolveHostname(parsed.hostname, { signal: controller.signal });
			if (controller.signal.aborted) return;
			if (!addresses.length) {
				inputError = t('ip.noAddresses', { hostname: parsed.hostname });
				return;
			}
			resolved = { hostname: parsed.hostname, addresses };
			select(addresses[0].address);
		} catch (error) {
			if (!controller.signal.aborted)
				inputError = error instanceof Error ? error.message : String(error);
		} finally {
			if (resolveController === controller) resolving = false;
		}
	}

	/** @param {string} address */
	function select(address) {
		const ip = parseIp(address);
		if (ip) analyze(ip);
	}

	/** @param {NonNullable<ReturnType<typeof parseIp>>} ip */
	function analyze(ip) {
		analysisController?.abort();
		target = ip;
		special = classifyIp(ip.bytes);
		if (special) return;

		const controller = new AbortController();
		analysisController = controller;
		const options = { signal: controller.signal };
		load('geo', lookupGeo(ip.address, options), controller.signal);
		load('ptr', lookupPtr(ip.address, options), controller.signal);
		load('rdap', lookupIpRdap(ip.address, options), controller.signal);
		load('scan', lookupInternetDb(ip.address, options), controller.signal);
	}

	/**
	 * Runs one section's lookup, ignoring results of an analysis that was replaced.
	 * @param {keyof typeof sections} key
	 * @param {Promise<any>} promise
	 * @param {AbortSignal} signal
	 */
	async function load(key, promise, signal) {
		sections[key] = { status: 'loading' };
		try {
			const data = await promise;
			if (!signal.aborted) sections[key] = { status: 'done', data };
		} catch (error) {
			if (!signal.aborted)
				sections[key] = {
					status: 'error',
					error: error instanceof Error ? error.message : String(error)
				};
		}
	}

	/** @param {any[] | null} list */
	const isEmptyList = (list) => !list?.length;
</script>

<svelte:head>
	<title>{t('tools.ip.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('ip.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.ip.name')} description={t('ip.intro')} />

<section class="panel" aria-labelledby="ip-target-heading">
	<h2 id="ip-target-heading">{t('ip.target')}</h2>
	<LookupForm
		bind:value={input}
		label={t('ip.inputLabel')}
		placeholder={t('ip.placeholder')}
		buttonLabel={t('ip.analyze')}
		busy={resolving}
		onsubmit={submit}
	/>
	<p class:error={inputError} aria-live="polite">
		{#if inputError}
			{inputError}
		{:else if resolving}
			{t('ip.resolving')}
		{:else if target}
			{t('ip.analyzing')} <strong>{target.address}</strong> (IPv{target.version}{target.mapped
				? t('ip.unwrapped')
				: ''})
			<CopyButton value={target.address} label={t('ip.copyAddress')} />
		{:else}
			{t('ip.inputHint')}
		{/if}
	</p>
	{#if resolved && target}
		<IpAddressChoices
			hostname={resolved.hostname}
			addresses={resolved.addresses}
			selected={target.address}
			onselect={select}
		/>
	{/if}
</section>

{#if target && special}
	<section class="panel notice" role="status">
		<h2>{t('ip.special.title', { label: special.label })}</h2>
		<p>
			<strong>{target.address}</strong>
			{t('ip.special.isIn')} <code>{special.cidr}</code>. {special.description}
		</p>
		<p>
			{t('ip.special.skipped')}
		</p>
	</section>
{:else if target}
	<div class="results">
		<IpSection
			id="ip-geo"
			title={t('ip.geo.title')}
			source="ipwho.is"
			note={t('ip.geo.note')}
			result={sections.geo}
		>
			{#snippet children(/** @type {any} */ geo)}
				<KeyValueTable rows={geoRows(geo)} />
			{/snippet}
		</IpSection>

		<IpSection
			id="ip-ptr"
			title={t('ip.ptr.title')}
			source={t('ip.ptr.source')}
			result={sections.ptr}
			isEmpty={isEmptyList}
			emptyText={t('ip.ptr.empty')}
		>
			{#snippet children(/** @type {string[]} */ names)}
				<ul class="names">
					{#each names as name (name)}
						<li>{name}</li>
					{/each}
				</ul>
			{/snippet}
		</IpSection>

		<IpSection
			id="ip-rdap"
			title={t('ip.rdap.title')}
			source="rdap.org"
			note={t('ip.rdap.note')}
			result={sections.rdap}
			emptyText={t('ip.rdap.empty')}
		>
			{#snippet children(/** @type {any} */ rdap)}
				<KeyValueTable rows={rdapRows(rdap)} />
			{/snippet}
		</IpSection>

		<IpSection
			id="ip-scan"
			title={t('ip.scan.title')}
			source="Shodan InternetDB"
			note={t('ip.scan.note')}
			result={sections.scan}
			emptyText={t('ip.scan.empty')}
		>
			{#snippet children(/** @type {any} */ scan)}
				<IpScanResults data={scan} />
			{/snippet}
		</IpSection>
	</div>
{/if}

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.panel p {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.5rem;
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.panel p strong {
		color: var(--color-text);
	}

	.panel p.error {
		color: var(--color-danger);
	}

	.notice {
		margin-top: 1.5rem;
		border-color: var(--color-text-muted);
		background: var(--color-surface);
	}

	.notice p {
		display: block;
	}

	code {
		font-family: var(--font-mono);
		color: var(--color-text);
	}

	.results {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.names {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.875rem;
	}

	.names li {
		padding: 0.45rem 0;
		border-bottom: 1px solid var(--color-border);
		overflow-wrap: anywhere;
	}
</style>
