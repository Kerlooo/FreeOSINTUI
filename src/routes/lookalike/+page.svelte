<script>
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import LookalikeTypePicker from '$lib/components/LookalikeTypePicker.svelte';
	import LookalikeRow from '$lib/components/LookalikeRow.svelte';
	import { parseDomain } from '$lib/lookalike/domain.js';
	import { countByType, generateLookalikes, pickForResolution } from '$lib/lookalike/generators.js';
	import { RESOLVE_LIMIT, resolveAll } from '$lib/lookalike/resolve.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/** @typedef {import('$lib/lookalike/generators.js').Candidate} Candidate */
	/** @typedef {{ status: 'done', records: import('$lib/lookalike/resolve.js').DnsRecords } | { status: 'error', error: string }} Result */

	let input = $state('');
	let inputError = $state('');

	/** @type {{ domain: string, unicode: string } | null} */
	let target = $state.raw(null);
	/** @type {Candidate[]} */
	let candidates = $state.raw([]);
	let counts = $derived(countByType(candidates));
	/** @type {string[]} */
	let selectedTypes = $state([]);
	let selectedTotal = $derived(selectedTypes.reduce((sum, type) => sum + (counts[type] ?? 0), 0));

	/** Candidates of the current (or last) resolution run. */
	/** @type {Candidate[]} */
	let runList = $state.raw([]);
	/** @type {Record<string, Result>} */
	let results = $state({});
	let running = $state(false);
	let stopped = $state(false);
	let showAll = $state(false);

	let done = $derived(runList.filter((candidate) => results[candidate.domain]).length);
	let registered = $derived(
		runList.filter((candidate) => {
			const result = results[candidate.domain];
			return result?.status === 'done' && result.records.registered;
		})
	);
	let errors = $derived(
		runList.filter((candidate) => results[candidate.domain]?.status === 'error').length
	);
	let visible = $derived(
		showAll
			? [...registered, ...runList.filter((candidate) => !registered.includes(candidate))]
			: registered
	);

	/** @type {AbortController | null} */
	let controller = null;

	/** @param {string} value */
	function submit(value) {
		stop();
		inputError = '';
		const parsed = parseDomain(value);
		if (parsed.error !== undefined) {
			inputError = parsed.error;
			target = null;
			candidates = [];
			runList = [];
			return;
		}
		target = { domain: parsed.domain, unicode: parsed.unicode };
		candidates = generateLookalikes(parsed);
		selectedTypes = Object.keys(counts).filter((type) => counts[type] > 0);
		start();
	}

	async function start() {
		stop();
		const current = new AbortController();
		controller = current;
		runList = pickForResolution(candidates, selectedTypes, RESOLVE_LIMIT);
		results = {};
		stopped = false;
		running = true;
		await resolveAll(
			runList.map((candidate) => candidate.domain),
			{
				signal: current.signal,
				onResult: (domain, records) => (results[domain] = { status: 'done', records }),
				onError: (domain, error) =>
					(results[domain] = {
						status: 'error',
						error: error instanceof Error ? error.message : String(error)
					})
			}
		);
		if (controller === current) {
			running = false;
			controller = null;
		}
	}

	function stop() {
		if (!controller) return;
		controller.abort();
		controller = null;
		running = false;
		stopped = true;
	}

	// Other tools link here with ?q=<domain>; the static page reads it in the browser.
	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q')?.trim();
		if (q) {
			input = q;
			submit(q);
		}
		return () => controller?.abort();
	});
</script>

<svelte:head>
	<title>{t('tools.lookalike.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('lookalike.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.lookalike.name')} description={t('lookalike.description')} />

<section class="panel" aria-labelledby="lookalike-target-heading">
	<h2 id="lookalike-target-heading">{t('lookalike.target')}</h2>
	<LookupForm
		bind:value={input}
		label={t('lookalike.inputLabel')}
		placeholder={t('lookalike.placeholder')}
		buttonLabel={t('lookalike.run')}
		onsubmit={submit}
	/>
	<p class:error={inputError} aria-live="polite">
		{#if inputError}
			{inputError}
		{:else if target}
			{t('lookalike.generated', { count: candidates.length, domain: target.unicode })}
		{:else}
			{t('lookalike.inputHint')}
		{/if}
	</p>
</section>

{#if target}
	<section class="panel" aria-labelledby="lookalike-types-heading">
		<h2 id="lookalike-types-heading">{t('lookalike.typesHeading')}</h2>
		<LookalikeTypePicker {counts} bind:selected={selectedTypes} disabled={running} />
		<p>
			{t('lookalike.selectedCount', { count: selectedTotal })} ·
			{t('lookalike.capNote', { limit: formatNumber(RESOLVE_LIMIT) })}
		</p>
		<div class="actions">
			{#if running}
				<button type="button" class="secondary" onclick={stop}>{t('lookalike.stop')}</button>
			{:else}
				<button type="button" disabled={!selectedTotal} onclick={start}
					>{t('lookalike.resolve')}</button
				>
			{/if}
		</div>
	</section>

	<section class="panel" aria-labelledby="lookalike-results-heading" aria-busy={running}>
		<header>
			<h2 id="lookalike-results-heading">{t('lookalike.resultsHeading')}</h2>
			{#if registered.length}
				<span class="copy">
					{t('lookalike.copyRegistered')}
					<CopyButton
						value={registered.map((candidate) => candidate.domain).join('\n')}
						label={t('lookalike.copyLabel')}
					/>
				</span>
			{/if}
		</header>

		{#if runList.length}
			<ProgressBar value={done / runList.length} label={t('lookalike.progressLabel')} />
			<p aria-live="polite">
				{t('lookalike.progress', {
					done: formatNumber(done),
					total: formatNumber(runList.length),
					registered: formatNumber(registered.length),
					errors: formatNumber(errors)
				})}
				{#if stopped}{t('lookalike.stopped')}{/if}
			</p>
			<label class="toggle">
				<input type="checkbox" bind:checked={showAll} />
				{t('lookalike.showAll')}
			</label>
			<p class="note">{t('lookalike.dnsNote')}</p>

			{#if visible.length}
				<ul>
					{#each visible as candidate (candidate.domain)}
						<LookalikeRow {candidate} result={results[candidate.domain]} />
					{/each}
				</ul>
			{:else if !running}
				<p>{t('lookalike.noneRegistered')}</p>
			{/if}
		{:else}
			<p>{t('lookalike.noResults')}</p>
		{/if}
	</section>
{/if}

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
		margin-bottom: 1.5rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	p.error {
		color: var(--color-danger);
	}

	.note {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.copy {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.toggle input {
		accent-color: var(--color-text);
	}

	.actions button {
		padding: 0.5rem 1.25rem;
		background: var(--color-text);
		border: 1px solid var(--color-text);
		border-radius: var(--radius);
		color: var(--color-bg);
		font-weight: 700;
		cursor: pointer;
	}

	.actions button.secondary {
		background: transparent;
		color: var(--color-text);
	}

	.actions button:disabled {
		background: transparent;
		border-color: var(--color-border);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
