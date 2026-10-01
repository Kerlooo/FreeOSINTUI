<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import ModeSwitch from '$lib/components/ModeSwitch.svelte';
	import FootprintCommonCrawl from '$lib/components/FootprintCommonCrawl.svelte';
	import FootprintWayback from '$lib/components/FootprintWayback.svelte';
	import FootprintStats from '$lib/components/FootprintStats.svelte';
	import FootprintSubdomains from '$lib/components/FootprintSubdomains.svelte';
	import FootprintUrls from '$lib/components/FootprintUrls.svelte';
	import FootprintParams from '$lib/components/FootprintParams.svelte';
	import { ApiError } from '$lib/api.js';
	import { normalizeFootprintDomain } from '$lib/footprint/normalize.js';
	import { lookupCommonCrawl } from '$lib/footprint/commoncrawl.js';
	import { lookupWaybackUrls } from '$lib/footprint/wayback.js';
	import { mergeRecords } from '$lib/footprint/merge.js';
	import { groupEntries } from '$lib/footprint/classify.js';
	import { computeStats, extractParams, findSubdomains } from '$lib/footprint/stats.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @typedef {{ status: 'loading' | 'done' | 'error', data?: any, error?: string, backendDown?: boolean }} SectionState */

	let input = $state('');
	let scope = $state('domain');
	let inputError = $state('');

	/** @type {{ domain: string, subdomains: boolean, run: number } | null} */
	let target = $state(null);
	/** @type {SectionState} */
	let cc = $state.raw({ status: 'loading' });
	/** @type {SectionState} */
	let wayback = $state.raw({ status: 'loading' });

	/** @type {AbortController | null} */
	let controller = null;
	let runs = 0;

	let busy = $derived(target !== null && (cc.status === 'loading' || wayback.status === 'loading'));

	let entries = $derived(
		mergeRecords([
			{ source: 'commoncrawl', records: cc.data?.records ?? [] },
			{ source: 'wayback', records: wayback.status === 'done' ? wayback.data.records : [] }
		])
	);
	let stats = $derived(computeStats(entries));
	let groups = $derived(groupEntries(entries));
	let subdomains = $derived(target ? findSubdomains(entries, target.domain) : []);
	let params = $derived(extractParams(groups.params));

	let scopeOptions = $derived([
		{ value: 'domain', label: t('footprint.scope.domain') },
		{ value: 'subdomains', label: t('footprint.scope.subdomains') }
	]);

	/** @param {string} value */
	function analyze(value) {
		const parsed = normalizeFootprintDomain(value);
		controller?.abort();
		controller = null;
		if (parsed.error) {
			inputError = parsed.error;
			target = null;
			return;
		}
		inputError = '';
		if (parsed.subdomains) scope = 'subdomains';
		const subdomains = scope === 'subdomains';
		input = subdomains && parsed.subdomains ? `*.${parsed.value}` : parsed.value;

		const current = new AbortController();
		controller = current;
		const { signal } = current;
		target = { domain: parsed.value, subdomains, run: ++runs };
		cc = { status: 'loading' };
		wayback = { status: 'loading' };

		lookupCommonCrawl(parsed.value, {
			subdomains,
			signal,
			onProgress: (partial) => {
				if (!signal.aborted) cc = { status: 'loading', data: partial };
			}
		})
			.then((data) => {
				if (!signal.aborted) cc = { status: 'done', data };
			})
			.catch((error) => {
				if (!signal.aborted) cc = { status: 'error', error: messageOf(error) };
			});

		lookupWaybackUrls(parsed.value, { subdomains, signal })
			.then((data) => {
				if (!signal.aborted) wayback = { status: 'done', data };
			})
			.catch((error) => {
				if (signal.aborted) return;
				wayback = {
					status: 'error',
					error: messageOf(error),
					backendDown: error instanceof ApiError && error.unreachable
				};
			});
	}

	/** @param {unknown} error */
	const messageOf = (error) => (error instanceof Error ? error.message : String(error));

	// Other tools link here with ?q=...; the static page reads it in the browser.
	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q')?.trim();
		if (q) {
			input = q;
			analyze(q);
		}
		return () => controller?.abort();
	});
</script>

<PageMeta
	title="{t('tools.footprint.name')} — FreeOSINT-UI"
	description={t('footprint.metaDescription')}
/>

<ToolHeader title={t('tools.footprint.name')} description={t('footprint.description')} />

<section class="panel" aria-labelledby="footprint-heading">
	<h2 id="footprint-heading">{t('footprint.heading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('footprint.inputLabel')}
		placeholder={t('footprint.placeholder')}
		buttonLabel={t('footprint.analyze')}
		onsubmit={analyze}
	/>
	<ModeSwitch bind:value={scope} options={scopeOptions} label={t('footprint.scope.label')} />
	{#if inputError}
		<p class="error" role="alert">{inputError}</p>
	{/if}
	<p class="passive"><strong>{t('footprint.passiveTitle')}</strong> {t('footprint.passive')}</p>
	{#if target}
		<p class="pivots">
			<span>{t('footprint.pivots')}</span>
			<a href={resolve(`/domain?q=${encodeURIComponent(target.domain)}`)}
				>{t('tools.domain.name')}</a
			>
			<a href={resolve(`/dorks?type=domain&q=${encodeURIComponent(target.domain)}`)}
				>{t('tools.dorks.name')}</a
			>
		</p>
	{/if}
</section>

{#if target}
	<div class="sources">
		<FootprintCommonCrawl result={cc} />
		<FootprintWayback result={wayback} />
	</div>

	{#key target.run}
		{#if entries.length}
			<div class="results" aria-live="polite">
				<FootprintStats {stats} />
				<FootprintUrls {entries} {groups} domain={target.domain} />
				<div class="pair">
					<FootprintSubdomains {subdomains} />
					<FootprintParams {params} />
				</div>
			</div>
		{:else if !busy}
			<p class="empty" role="status">{t('footprint.empty')}</p>
		{/if}
	{/key}
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
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.panel p.error {
		color: var(--color-danger);
	}

	.passive {
		padding: 0.6rem 0.8rem;
		background: var(--color-surface);
		border-left: 3px solid var(--color-text);
		border-radius: var(--radius);
	}

	.passive strong {
		color: var(--color-text);
	}

	.pivots {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
	}

	.sources,
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: 1.5rem;
	}

	.sources {
		margin-top: 1.5rem;
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.empty {
		margin: 1.5rem 0 0;
		color: var(--color-text-dim);
		font-size: 0.9rem;
	}
</style>
