<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { afterNavigate } from '$app/navigation';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import UrlSection from '$lib/components/UrlSection.svelte';
	import UrlOverview from '$lib/components/UrlOverview.svelte';
	import UrlFindings from '$lib/components/UrlFindings.svelte';
	import UrlParams from '$lib/components/UrlParams.svelte';
	import UrlEmbedded from '$lib/components/UrlEmbedded.svelte';
	import UrlExpand from '$lib/components/UrlExpand.svelte';
	import UrlScans from '$lib/components/UrlScans.svelte';
	import UrlHaus from '$lib/components/UrlHaus.svelte';
	import UrlWayback from '$lib/components/UrlWayback.svelte';
	import { ApiError } from '$lib/api.js';
	import { analyzeUrl } from '$lib/url/analyze.js';
	import {
		expandShortUrl,
		lookupUrlWayback,
		lookupUrlhaus,
		lookupUrlscan
	} from '$lib/url/remote.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @typedef {{ status: 'loading' | 'done' | 'error' | 'backend', data?: any, error?: string }} SectionState */

	let input = $state('');
	/** The submitted input; the offline analysis is derived from it so it follows the language. */
	let submitted = $state('');
	let analysis = $derived(submitted ? analyzeUrl(submitted) : null);
	let result = $derived(analysis && !analysis.error ? /** @type {any} */ (analysis) : null);

	/** @type {Record<'expand' | 'urlscan' | 'urlhaus' | 'wayback', SectionState>} */
	let sections = $state({
		expand: { status: 'loading' },
		urlscan: { status: 'loading' },
		urlhaus: { status: 'loading' },
		wayback: { status: 'loading' }
	});

	/** @type {AbortController | null} */
	let controller = null;
	let lastQuery = '';

	/** @param {string} value */
	function submit(value) {
		controller?.abort();
		controller = null;
		submitted = value;
		const current = analyzeUrl(value);
		if (current.error) return;
		const a = /** @type {any} */ (current);

		const next = new AbortController();
		controller = next;
		const options = { signal: next.signal };
		if (a.shortener) load('expand', expandShortUrl(a.href, options), next.signal);
		if (scanHost(a)) load('urlscan', lookupUrlscan(scanHost(a), options), next.signal);
		load('urlhaus', lookupUrlhaus(a.href, options), next.signal);
		load('wayback', lookupUrlWayback(a.href, options), next.signal);
	}

	/**
	 * Host searched on urlscan.io: hostnames and public IPv4 addresses.
	 * @param {any} a
	 */
	function scanHost(a) {
		if (a.host.kind === 'name') return a.host.dotless ? '' : a.host.ascii;
		if (a.host.kind === 'ipv4' && !a.special) return a.host.ip;
		return '';
	}

	/**
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
			if (signal.aborted) return;
			if (error instanceof ApiError && error.unreachable) sections[key] = { status: 'backend' };
			else
				sections[key] = {
					status: 'error',
					error: error instanceof Error ? error.message : String(error)
				};
		}
	}

	// Pages are prerendered: ?q= is read in the browser, also when an embedded URL is opened here.
	afterNavigate(() => {
		const q = new URLSearchParams(window.location.search).get('q')?.trim();
		if (q && q !== lastQuery) {
			lastQuery = q;
			input = q;
			submit(q);
		}
	});

	/** @param {any[]} list */
	const isEmptyList = (list) => !list?.length;
</script>

<PageMeta title="{t('tools.url.name')} — FreeOSINT-UI" description={t('url.metaDescription')} />

<ToolHeader title={t('tools.url.name')} description={t('url.description')} />

<section class="panel" aria-labelledby="url-heading">
	<h2 id="url-heading">{t('url.heading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('url.inputLabel')}
		placeholder={t('url.placeholder')}
		buttonLabel={t('url.analyze')}
		onsubmit={submit}
	/>
	{#if analysis?.error}
		<p class="error" role="alert">{analysis.error}</p>
	{:else}
		<p>{t('url.hint')}</p>
	{/if}
</section>

{#if result}
	<div class="results" aria-live="polite">
		<UrlSection id="url-findings" title={t('url.findings.title')} note={t('url.findings.note')}>
			<UrlFindings findings={result.findings} />
		</UrlSection>

		<UrlSection id="url-overview" title={t('url.overview.title')}>
			<UrlOverview analysis={result} />
		</UrlSection>

		{#if result.embedded.length}
			<UrlSection id="url-embedded" title={t('url.embedded.title')} note={t('url.embedded.note')}>
				<UrlEmbedded embedded={result.embedded} chain={result.chain} />
			</UrlSection>
		{/if}

		<UrlSection id="url-params" title={t('url.params.title')}>
			<UrlParams params={result.params} />
		</UrlSection>

		{#if result.shortener}
			<UrlSection
				id="url-expand"
				title={t('url.expand.title')}
				source={t('url.expand.source')}
				note={t('url.expand.note')}
				result={sections.expand}
			>
				{#snippet children(/** @type {any} */ data)}
					<UrlExpand {data} />
				{/snippet}
			</UrlSection>
		{/if}

		{#if scanHost(result)}
			<UrlSection
				id="url-urlscan"
				title={t('url.urlscan.title')}
				source="urlscan.io"
				note={t('url.urlscan.note')}
				result={sections.urlscan}
				isEmpty={(data) => isEmptyList(data?.results)}
				emptyText={t('url.urlscan.empty')}
			>
				{#snippet children(/** @type {any} */ data)}
					<UrlScans {data} />
				{/snippet}
			</UrlSection>
		{/if}

		<UrlSection
			id="url-urlhaus"
			title={t('url.urlhaus.title')}
			source="abuse.ch"
			note={t('url.urlhaus.note')}
			result={sections.urlhaus}
		>
			{#snippet children(/** @type {any} */ data)}
				<UrlHaus {data} />
			{/snippet}
		</UrlSection>

		<UrlSection
			id="url-wayback"
			title={t('url.wayback.title')}
			source="archive.org"
			note={t('url.wayback.note')}
			result={sections.wayback}
		>
			{#snippet children(/** @type {any} */ data)}
				<UrlWayback {data} />
			{/snippet}
		</UrlSection>
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
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.panel p.error {
		color: var(--color-danger);
	}

	.results {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
		gap: 1.5rem;
		margin-top: 1.5rem;
	}
</style>
