<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import HashResults from '$lib/components/HashResults.svelte';
	import HashVerifier from '$lib/components/HashVerifier.svelte';
	import ModeSwitch from '$lib/components/ModeSwitch.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { hashFile, hashText } from '$lib/hash/compute.js';
	import { findMatches } from '$lib/hash/identify.js';

	const MODES = [
		{ value: 'text', label: 'Text' },
		{ value: 'file', label: 'File' }
	];

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
	<title>Hash Checker — FreeOSINT-UI</title>
	<meta
		name="description"
		content="Compute MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE and CRC32 hashes of text or files, identify and verify hashes. Runs in your browser."
	/>
</svelte:head>

<ToolHeader
	title="Hash Checker"
	description="Compute the most common hashes of a text or a file, identify an unknown hash and check whether it matches. Everything runs locally: nothing leaves your browser."
/>

<div class="layout">
	<section class="panel" aria-labelledby="input-heading">
		<div class="panel-head">
			<h2 id="input-heading">Input</h2>
			<ModeSwitch bind:value={mode} options={MODES} label="Input type" />
		</div>

		{#if mode === 'text'}
			<label class="visually-hidden" for="hash-text">Text to hash</label>
			<textarea
				id="hash-text"
				bind:value={text}
				rows="6"
				placeholder="Type or paste text to hash…"
				spellcheck="false"></textarea>
			<p class="hint">Text is encoded as UTF-8. Hashes update as you type.</p>
		{:else}
			<FileDrop {file} onselect={selectFile} />
			{#if hashingFile}
				<ProgressBar value={fileProgress} label="Hashing file" />
			{/if}
			{#if fileError}
				<p class="error" role="alert">Could not read the file: {fileError}</p>
			{/if}
		{/if}

		<HashVerifier bind:value={expected} {digests} />
	</section>

	<section class="panel" aria-labelledby="results-heading">
		<h2 id="results-heading">Results</h2>
		{#if digests}
			<HashResults {digests} {matches} />
		{:else if hashingFile}
			<p class="hint">Hashing…</p>
		{:else}
			<p class="hint">
				{mode === 'text' ? 'Enter some text' : 'Choose a file'} to compute its hashes.
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
