<script>
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import ReputationSection from '$lib/components/ReputationSection.svelte';
	import ReputationSummary from '$lib/components/ReputationSummary.svelte';
	import { ApiError, BACKEND_START_COMMAND } from '$lib/api.js';
	import { parseIndicator } from '$lib/reputation/indicator.js';
	import { countResults, sourcesFor } from '$lib/reputation/sources.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * @typedef {import('$lib/reputation/indicator.js').Indicator} Indicator
	 * @typedef {{ status: 'loading' | 'done' | 'error', data?: import('$lib/reputation/sources.js').SourceResult, error?: string, unreachable?: boolean }} SectionState
	 */

	let input = $state('');
	let inputError = $state('');
	/** @type {Indicator | null} */
	let indicator = $state.raw(null);
	/** @type {ReturnType<typeof sourcesFor>} */
	let sources = $state.raw([]);
	/** @type {Record<string, SectionState>} */
	let sections = $state({});
	/** @type {AbortController | null} */
	let controller = null;

	let counts = $derived(countResults(sources.map((source) => sections[source.id])));
	let backendDown = $derived(sources.some((source) => sections[source.id]?.unreachable));

	/** Pivot to the IP or Domain Analyzer for the indicator's host. */
	let pivot = $derived.by(() => {
		if (!indicator) return null;
		if (indicator.kind === 'ip') return { tool: 'ip', value: indicator.value };
		if (indicator.kind === 'domain') return { tool: 'domain', value: indicator.value };
		if (indicator.kind === 'email') return { tool: 'domain', value: indicator.domain };
		return indicator.hostIp
			? { tool: 'ip', value: indicator.host }
			: { tool: 'domain', value: indicator.host };
	});

	/** @param {string} value */
	function check(value) {
		controller?.abort();
		controller = null;
		inputError = '';
		indicator = null;
		sources = [];
		sections = {};

		const parsed = parseIndicator(value);
		if (parsed.kind === 'error') {
			inputError = parsed.error;
			return;
		}
		indicator = parsed;
		// Private, loopback and other special addresses cannot be on any public list.
		if (parsed.kind === 'ip' && parsed.special) return;

		const current = new AbortController();
		controller = current;
		sources = sourcesFor(parsed);
		sections = Object.fromEntries(sources.map((source) => [source.id, { status: 'loading' }]));
		for (const source of sources) {
			load(source.id, source.lookup(parsed, { signal: current.signal }), current.signal);
		}
	}

	/**
	 * Runs one source's lookup, ignoring results of a check that was replaced.
	 * @param {string} id
	 * @param {Promise<import('$lib/reputation/sources.js').SourceResult>} promise
	 * @param {AbortSignal} signal
	 */
	async function load(id, promise, signal) {
		try {
			const data = await promise;
			if (!signal.aborted) sections[id] = { status: 'done', data };
		} catch (error) {
			if (signal.aborted) return;
			sections[id] = {
				status: 'error',
				error: error instanceof Error ? error.message : String(error),
				unreachable: error instanceof ApiError && error.unreachable
			};
		}
	}

	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q');
		if (q) {
			input = q;
			check(q);
		}
		return () => controller?.abort();
	});
</script>

<svelte:head>
	<title>{t('tools.reputation.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('reputation.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.reputation.name')} description={t('reputation.description')} />

<section class="panel" aria-labelledby="reputation-heading">
	<h2 id="reputation-heading">{t('reputation.heading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('reputation.inputLabel')}
		placeholder={t('reputation.placeholder')}
		buttonLabel={t('reputation.check')}
		onsubmit={check}
	/>
	<p class:error={inputError} aria-live="polite">
		{#if inputError}
			{inputError}
		{:else if indicator}
			{t('reputation.checking')}
			{t(`reputation.kind.${indicator.kind}`)} <strong>{indicator.value}</strong>
			<CopyButton value={indicator.value} />
		{:else}
			{t('reputation.hint')}
		{/if}
	</p>
	{#if pivot}
		<p>
			{t('reputation.pivots')}
			{#if pivot.tool === 'ip'}
				<a href={resolve(`/ip?q=${encodeURIComponent(pivot.value)}`)}>{t('reputation.pivot.ip')}</a>
			{:else}
				<a href={resolve(`/domain?q=${encodeURIComponent(pivot.value)}`)}
					>{t('reputation.pivot.domain')}</a
				>
			{/if}
		</p>
	{/if}
	{#if backendDown}
		<div class="backend" role="alert">
			<p>
				<strong>{t('backend.down')}</strong>
				{t('reputation.backendPartial')}
			</p>
			<code>{BACKEND_START_COMMAND}</code>
		</div>
	{/if}
</section>

{#if indicator?.kind === 'ip' && indicator.special}
	<section class="panel notice" role="status">
		<h2>{t('reputation.special.title', { label: indicator.special.label })}</h2>
		<p class="block">
			<strong>{indicator.value}</strong>: {indicator.special.description}
		</p>
		<p class="block">{t('reputation.special.skipped')}</p>
	</section>
{:else if sources.length}
	<div class="summary">
		<ReputationSummary {counts} />
	</div>
	<div class="results">
		{#each sources as source (source.id)}
			<ReputationSection {source} result={sections[source.id] ?? { status: 'loading' }} />
		{/each}
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

	.panel p.block {
		display: block;
	}

	.panel p strong {
		color: var(--color-text);
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.panel p.error {
		color: var(--color-danger);
	}

	.notice {
		margin-top: 1.5rem;
		border-color: var(--color-text-muted);
		background: var(--color-surface);
	}

	.backend {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
	}

	.backend p {
		display: block;
		color: var(--color-text);
	}

	.backend p strong {
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

	.summary {
		margin-top: 1.5rem;
	}

	.results {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
		gap: 1.5rem;
		margin-top: 1.5rem;
	}
</style>
