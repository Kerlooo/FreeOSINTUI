<script>
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import UsernameStatusFilters from '$lib/components/UsernameStatusFilters.svelte';
	import UsernameResultGroup from '$lib/components/UsernameResultGroup.svelte';
	import { ApiError, BACKEND_START_COMMAND, apiGet } from '$lib/api.js';
	import { runPool } from '$lib/username/pool.js';
	import { NSFW_CATEGORY, foundUrls, groupByCategory, summarize } from '$lib/username/results.js';
	import { normalizeUsername } from '$lib/username/validate.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	const CONCURRENCY = 8;

	/** @typedef {{ id: string, name: string, category: string, unreliable: boolean }} Site */
	/** @typedef {{ site: string, name: string, category: string, status: string, url: string | null, http_status: number | null, reason: string, unreliable?: boolean }} Result */

	/** @type {Site[]} */
	let sites = $state([]);
	let loadingSites = $state(true);
	let backendDown = $state(false);
	let error = $state('');

	let input = $state('');
	let includeNsfw = $state(false);
	let scanning = $state(false);
	let scannedName = $state('');
	let total = $state(0);
	/** @type {Result[]} */
	let results = $state([]);
	let selected = $state(['found']);
	/** @type {AbortController | null} */
	let controller = null;

	let counts = $derived(summarize(results));
	let groups = $derived(groupByCategory(results, selected));
	let urls = $derived(foundUrls(results));
	let targetSites = $derived(
		includeNsfw ? sites : sites.filter((s) => s.category !== NSFW_CATEGORY)
	);

	async function loadSites() {
		loadingSites = true;
		backendDown = false;
		error = '';
		try {
			const data = await apiGet('/api/username/sites');
			sites = data.sites;
		} catch (e) {
			if (e instanceof ApiError && e.unreachable) backendDown = true;
			else error = e instanceof Error ? e.message : String(e);
		} finally {
			loadingSites = false;
		}
	}

	onMount(loadSites);

	/** @param {string} value */
	async function scan(value) {
		const { value: username, error: invalid } = normalizeUsername(value);
		if (invalid) {
			error = invalid;
			return;
		}
		controller?.abort();
		const current = new AbortController();
		controller = current;
		error = '';
		results = [];
		scannedName = username;
		const list = targetSites;
		total = list.length;
		scanning = true;

		await runPool(
			list,
			async (site, signal) => {
				try {
					/** @type {Result} */
					const result = await apiGet('/api/username/check', {
						params: { username, site: site.id },
						signal
					});
					return { ...result, unreliable: site.unreliable };
				} catch (e) {
					if (e instanceof ApiError && e.unreachable) {
						backendDown = true;
						current.abort();
					}
					throw e;
				}
			},
			{
				concurrency: CONCURRENCY,
				signal: current.signal,
				onResult: (result) => results.push(result),
				onError: (e, site) =>
					results.push({
						site: site.id,
						name: site.name,
						category: site.category,
						status: 'error',
						url: null,
						http_status: null,
						reason: e instanceof Error ? e.message : String(e),
						unreliable: site.unreliable
					})
			}
		);

		if (controller === current) {
			scanning = false;
			controller = null;
		}
	}

	function cancel() {
		controller?.abort();
		controller = null;
		scanning = false;
	}
</script>

<svelte:head>
	<title>{t('tools.username.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('username.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.username.name')} description={t('username.description')} />

<section class="panel" aria-labelledby="username-heading">
	<h2 id="username-heading">{t('username.heading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('username.inputLabel')}
		placeholder={t('username.placeholder')}
		buttonLabel={t('username.scan')}
		busy={scanning || loadingSites || backendDown}
		onsubmit={scan}
	/>
	<label class="option">
		<input type="checkbox" bind:checked={includeNsfw} disabled={scanning} />
		{t('username.includeNsfw')}
	</label>

	{#if backendDown}
		<div class="notice" role="alert">
			<p>
				<strong>{t('backend.down')}</strong>
				{t('backend.needed')}
			</p>
			<code>{BACKEND_START_COMMAND}</code>
			<button type="button" onclick={loadSites}>{t('backend.retry')}</button>
		</div>
	{:else if error}
		<p class="error" role="alert">{error}</p>
	{:else if loadingSites}
		<p>{t('username.loadingSites')}</p>
	{:else}
		<p>{t('username.sitesToCheck', { count: targetSites.length })}</p>
	{/if}
</section>

{#if total}
	<section class="panel results" aria-labelledby="results-heading">
		<div class="results-head">
			<h2 id="results-heading">{t('username.resultsFor')} <strong>{scannedName}</strong></h2>
			<div class="actions">
				{#if scanning}
					<button type="button" class="cancel" onclick={cancel}>{t('username.cancel')}</button>
				{/if}
				{#if urls}
					<CopyButton value={urls} label={t('username.copyUrls')} />
				{/if}
			</div>
		</div>

		<ProgressBar value={results.length / total} label={t('username.sitesChecked')} />
		<p aria-live="polite">
			{t('username.progress', { done: results.length, total })}{scanning ? '…' : '.'}
		</p>

		<UsernameStatusFilters {counts} bind:selected />

		{#if groups.length}
			<div class="groups">
				{#each groups as group (group.category)}
					<UsernameResultGroup {group} />
				{/each}
			</div>
		{:else}
			<p>{scanning ? t('username.noResultsYet') : t('username.noResults')}</p>
		{/if}
	</section>
{/if}

<section class="notes" aria-label={t('username.aboutLabel')}>
	<p>
		<strong>{t('username.falsePositivesTitle')}</strong>
		{t('username.falsePositives')}
	</p>
	<p>
		{t('username.creditsBefore')}
		<a href="https://github.com/WebBreacher/WhatsMyName" target="_blank" rel="noopener noreferrer"
			>WhatsMyName</a
		>
		{t('username.creditsMiddle')}
		<a
			href="https://creativecommons.org/licenses/by-sa/4.0/"
			target="_blank"
			rel="noopener noreferrer">CC BY-SA 4.0</a
		>.
	</p>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.results {
		margin-top: 1.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
		overflow-wrap: anywhere;
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

	.option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--color-text-dim);
		cursor: pointer;
	}

	.option input {
		accent-color: var(--color-text);
	}

	.notice {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
	}

	.notice p {
		color: var(--color-text);
	}

	.notice strong {
		color: var(--color-danger);
	}

	code {
		max-width: 100%;
		padding: 0.4rem 0.6rem;
		background: var(--color-surface);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.results-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	button.cancel,
	.notice button {
		padding: 0.25rem 0.8rem;
		background: transparent;
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.notice button {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	.groups {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.notes {
		margin-top: 2rem;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.notes p {
		max-width: 50rem;
	}
</style>
