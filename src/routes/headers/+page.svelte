<script>
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import HeadersFindings from '$lib/components/HeadersFindings.svelte';
	import HeadersOrigin from '$lib/components/HeadersOrigin.svelte';
	import HeadersChain from '$lib/components/HeadersChain.svelte';
	import HeadersAuth from '$lib/components/HeadersAuth.svelte';
	import HeadersPivots from '$lib/components/HeadersPivots.svelte';
	import HeadersRawList from '$lib/components/HeadersRawList.svelte';
	import { analyzeHeaders } from '$lib/headers/analyze.js';
	import { extractHeaderBlock } from '$lib/headers/parse.js';
	import { SAMPLE_HEADERS } from '$lib/headers/sample.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** Headers are at the start of a message: no need to read a large attachment. */
	const MAX_READ_BYTES = 2 * 1024 * 1024;

	let input = $state('');
	/** @type {File | null} */
	let file = $state(null);
	let fileError = $state('');
	let isExample = $state(false);

	let result = $derived(input.trim() ? analyzeHeaders(input) : null);

	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q');
		if (q) input = q;
	});

	/** @param {File} selected */
	async function selectFile(selected) {
		file = selected;
		fileError = '';
		isExample = false;
		try {
			input = extractHeaderBlock(await selected.slice(0, MAX_READ_BYTES).text());
		} catch (error) {
			fileError = t('headers.fileError', {
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	function loadExample() {
		input = SAMPLE_HEADERS;
		file = null;
		fileError = '';
		isExample = true;
	}

	function clear() {
		input = '';
		file = null;
		fileError = '';
		isExample = false;
	}
</script>

<svelte:head>
	<title>{t('tools.headers.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('headers.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.headers.name')} description={t('headers.description')} />

<div class="layout">
	<section class="panel input" aria-labelledby="headers-input-heading">
		<div class="panel-head">
			<h2 id="headers-input-heading">{t('headers.inputHeading')}</h2>
			<div class="actions">
				<button type="button" onclick={loadExample}>{t('headers.loadExample')}</button>
				<button type="button" onclick={clear} disabled={!input}>{t('headers.clear')}</button>
			</div>
		</div>
		<label class="visually-hidden" for="headers-text">{t('headers.inputLabel')}</label>
		<textarea
			id="headers-text"
			bind:value={input}
			oninput={() => (isExample = false)}
			rows="14"
			placeholder={t('headers.placeholder')}
			spellcheck="false"
			autocomplete="off"
			aria-describedby="headers-status"></textarea>
		<p id="headers-status" class="hint" class:error={input.trim() && !result} aria-live="polite">
			{#if !input.trim()}
				{t('headers.statusIdle')}
			{:else if !result}
				{t('headers.statusNone')}
			{:else}
				{t('headers.statusParsed', { count: result.headers.length })}
				{#if result.ignored}
					{t('headers.statusIgnored', { count: result.ignored })}
				{/if}
			{/if}
		</p>
		{#if isExample}
			<p class="note">{t('headers.exampleNote')}</p>
		{/if}
		<p class="hint">{t('headers.fileHint')}</p>
		<FileDrop {file} onselect={selectFile} />
		{#if fileError}
			<p class="error" role="alert">{fileError}</p>
		{/if}
	</section>

	{#if result}
		<section class="panel" aria-labelledby="headers-findings-heading">
			<h2 id="headers-findings-heading">{t('headers.findingsHeading')}</h2>
			<HeadersFindings findings={result.findings} />
			<p class="note">{t('headers.findingsNote')}</p>
		</section>

		<div class="columns">
			<section class="panel" aria-labelledby="headers-summary-heading">
				<h2 id="headers-summary-heading">{t('headers.summaryHeading')}</h2>
				<KeyValueTable
					rows={result.summary.map((field) => ({ label: field.name, value: field.value }))}
				/>
			</section>

			<section class="panel" aria-labelledby="headers-origin-heading">
				<h2 id="headers-origin-heading">{t('headers.originHeading')}</h2>
				<HeadersOrigin origin={result.origin} sourceIps={result.sourceIps} />
			</section>
		</div>

		<section class="panel" aria-labelledby="headers-chain-heading">
			<h2 id="headers-chain-heading">{t('headers.chainHeading')}</h2>
			<HeadersChain chain={result.chain} originIndex={result.origin?.hopIndex ?? null} />
		</section>

		<div class="columns">
			<section class="panel" aria-labelledby="headers-auth-heading">
				<h2 id="headers-auth-heading">{t('headers.authHeading')}</h2>
				<HeadersAuth auth={result.auth} />
			</section>

			<section class="panel" aria-labelledby="headers-pivot-heading">
				<h2 id="headers-pivot-heading">{t('headers.pivotHeading')}</h2>
				<HeadersPivots pivots={result.pivots} />
			</section>
		</div>

		<section class="panel raw">
			{#if result.otherHeaders.length}
				<HeadersRawList
					title={t('headers.otherHeading', { count: result.otherHeaders.length })}
					headers={result.otherHeaders}
				/>
			{/if}
			<HeadersRawList
				title={t('headers.allHeading', { count: result.headers.length })}
				headers={result.headers}
			/>
		</section>
	{:else if !input.trim()}
		<p class="hint">{t('headers.empty')}</p>
	{/if}
</div>

<style>
	.layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
	}

	@media (min-width: 64rem) {
		.columns {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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

	.panel.raw {
		gap: 0.75rem;
	}

	.panel-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.actions button {
		padding: 0.35rem 0.9rem;
		background: transparent;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.actions button:hover:not(:disabled) {
		background: var(--color-text);
		color: var(--color-bg);
	}

	.actions button:disabled {
		border-color: var(--color-border);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	textarea {
		resize: vertical;
		font-size: 0.8rem;
		white-space: pre;
		overflow-x: auto;
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
		margin: 0;
		color: var(--color-danger);
	}
</style>
