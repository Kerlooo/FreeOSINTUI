<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import HashResults from '$lib/components/HashResults.svelte';
	import HashVerifier from '$lib/components/HashVerifier.svelte';
	import ModeSwitch from '$lib/components/ModeSwitch.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { hashFile, hashText } from '$lib/hash/compute.js';
	import { findMatches } from '$lib/hash/identify.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	let modes = $derived([
		{ value: 'text', label: t('hash.mode.text') },
		{ value: 'file', label: t('hash.mode.file') }
	]);

	let mode = $state('text');
	let expected = $state('');

	let text = $state('');
	/** @type {Record<string, string> | null} */
	let textDigests = $state(null);

	/** @type {File | null} */
	let file = $state(null);
	/** @type {Record<string, string> | null} */
	let fileDigests = $state(null);
	let fileProgress = $state(0);
	let fileError = $state('');
	/** @type {AbortController | null} */
	let fileController = null;

	$effect(() => {
		const current = text;
		if (!current) {
			textDigests = null;
			return;
		}
		hashText(current).then((digests) => {
			// Ignore results for text that has changed in the meantime.
			if (text === current) textDigests = digests;
		});
	});

	/** @param {File} selected */
	async function selectFile(selected) {
		fileController?.abort();
		const controller = new AbortController();
		fileController = controller;

		file = selected;
		fileDigests = null;
		fileError = '';
		fileProgress = 0;

		try {
			fileDigests = await hashFile(selected, {
				signal: controller.signal,
				onProgress: (fraction) => (fileProgress = fraction)
			});
		} catch (error) {
			if (!controller.signal.aborted) {
				fileError = error instanceof Error ? error.message : String(error);
			}
		}
	}

	let digests = $derived(mode === 'text' ? textDigests : fileDigests);
	let matches = $derived(digests ? findMatches(expected, digests) : []);
	let hashingFile = $derived(mode === 'file' && file !== null && !fileDigests && !fileError);
</script>

<svelte:head>
	<title>{t('tools.hash.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('hash.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.hash.name')} description={t('hash.intro')} />

<div class="layout">
	<section class="panel" aria-labelledby="input-heading">
		<div class="panel-head">
			<h2 id="input-heading">{t('hash.inputHeading')}</h2>
			<ModeSwitch bind:value={mode} options={modes} label={t('hash.inputType')} />
		</div>

		{#if mode === 'text'}
			<label class="visually-hidden" for="hash-text">{t('hash.textLabel')}</label>
			<textarea
				id="hash-text"
				bind:value={text}
				rows="6"
				placeholder={t('hash.textPlaceholder')}
				spellcheck="false"></textarea>
			<p class="hint">{t('hash.textHint')}</p>
		{:else}
			<FileDrop {file} onselect={selectFile} />
			{#if hashingFile}
				<ProgressBar value={fileProgress} label={t('hash.hashingFile')} />
			{/if}
			{#if fileError}
				<p class="error" role="alert">{t('hash.fileError', { error: fileError })}</p>
			{/if}
		{/if}

		<HashVerifier bind:value={expected} {digests} />
	</section>

	<section class="panel" aria-labelledby="results-heading">
		<h2 id="results-heading">{t('hash.resultsHeading')}</h2>
		{#if digests}
			<HashResults {digests} {matches} />
		{:else if hashingFile}
			<p class="hint">{t('hash.hashing')}</p>
		{:else}
			<p class="hint">
				{mode === 'text' ? t('hash.emptyText') : t('hash.emptyFile')}
			</p>
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

	textarea {
		resize: vertical;
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.error {
		margin: 0;
		color: var(--color-danger);
	}
</style>
