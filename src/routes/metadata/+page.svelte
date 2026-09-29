<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import MetadataPreview from '$lib/components/MetadataPreview.svelte';
	import MetadataGroups from '$lib/components/MetadataGroups.svelte';
	import MetadataReverseSearch from '$lib/components/MetadataReverseSearch.svelte';
	import { extractMetadata } from '$lib/metadata/extract.js';

	/** @type {File | null} */
	let file = $state(null);
	/** @type {import('$lib/metadata/extract.js').MetadataResult | null} */
	let result = $state(null);
	let busy = $state(false);
	let error = $state('');
	let run = 0;

	/** @param {File} selected */
	async function selectFile(selected) {
		const current = ++run;
		file = selected;
		result = null;
		error = '';
		busy = true;
		try {
			const extracted = await extractMetadata(selected);
			if (current === run) result = extracted;
		} catch (err) {
			if (current === run)
				error = `Could not read the metadata: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			if (current === run) busy = false;
		}
	}
</script>

<svelte:head>
	<title>Metadata Extractor — FreeOSINT-UI</title>
	<meta
		name="description"
		content="Extract EXIF, GPS, XMP and IPTC metadata from photos and author, software and dates from PDF and Office documents. Runs in your browser: the file is never uploaded."
	/>
</svelte:head>

<ToolHeader
	title="Metadata Extractor"
	description="Read hidden metadata from images (EXIF, GPS, XMP, IPTC), PDFs and Office documents: camera, location, author, software and dates. The file never leaves your browser."
/>

<div class="layout">
	<section class="panel" aria-labelledby="file-heading">
		<h2 id="file-heading">File</h2>
		<FileDrop {file} onselect={selectFile} />
		<p class="hint">
			Supported: JPEG, PNG, TIFF, WebP, HEIC/AVIF, PDF, DOCX, XLSX, PPTX. The file never leaves your
			browser.
		</p>
		<p class="hint">
			Social networks and messaging apps usually strip metadata from uploaded images, so look for
			the original file. Metadata can also be edited or forged: treat it as a lead, not as proof.
		</p>
		{#if result}
			<KeyValueTable
				rows={[{ label: 'Detected format', value: result.formatLabel }, ...result.file]}
			/>
		{/if}
		{#if file && result?.isImage}
			<MetadataPreview {file} />
		{/if}
	</section>

	<section class="panel" aria-labelledby="summary-heading" aria-busy={busy}>
		<h2 id="summary-heading">Key findings</h2>
		{#if busy}
			<p class="hint">Reading metadata…</p>
		{:else if error}
			<p class="error" role="alert">{error}</p>
		{:else if result}
			{#if result.highlights.length}
				<KeyValueTable rows={result.highlights} />
			{/if}
			{#each result.notes as note (note)}
				<p class="note">{note}</p>
			{/each}
		{:else}
			<p class="hint">Choose a file to read its metadata.</p>
		{/if}
	</section>
</div>

{#if result?.groups.length}
	<section class="panel wide" aria-labelledby="all-heading">
		<h2 id="all-heading">All metadata</h2>
		<MetadataGroups groups={result.groups} />
	</section>
{/if}

{#if result?.isImage}
	<section class="panel wide" aria-labelledby="reverse-heading">
		<h2 id="reverse-heading">Reverse image search</h2>
		<MetadataReverseSearch />
	</section>
{/if}

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

	.wide {
		margin-top: 1.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.note {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-left: 2px solid var(--color-text-muted);
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.error {
		margin: 0;
		color: var(--color-danger);
	}
</style>
