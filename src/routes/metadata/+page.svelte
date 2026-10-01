<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import MetadataPreview from '$lib/components/MetadataPreview.svelte';
	import MetadataGroups from '$lib/components/MetadataGroups.svelte';
	import MetadataReverseSearch from '$lib/components/MetadataReverseSearch.svelte';
	import { buildResult, readMetadata } from '$lib/metadata/extract.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {File | null} */
	let file = $state(null);
	/** @type {import('$lib/metadata/extract.js').RawMetadata | null} */
	let raw = $state.raw(null);
	// Built from the parsed data, so labels follow the language without re-reading the file.
	let result = $derived(raw ? buildResult(raw) : null);
	let busy = $state(false);
	let error = $state('');
	let run = 0;

	/** @param {File} selected */
	async function selectFile(selected) {
		const current = ++run;
		file = selected;
		raw = null;
		error = '';
		busy = true;
		try {
			const extracted = await readMetadata(selected);
			if (current === run) raw = extracted;
		} catch (err) {
			if (current === run) error = err instanceof Error ? err.message : String(err);
		} finally {
			if (current === run) busy = false;
		}
	}
</script>

<PageMeta
	title="{t('tools.metadata.name')} — FreeOSINT-UI"
	description={t('metadata.metaDescription')}
/>

<ToolHeader title={t('tools.metadata.name')} description={t('metadata.description')} />

<div class="layout">
	<section class="panel" aria-labelledby="file-heading">
		<h2 id="file-heading">{t('metadata.fileHeading')}</h2>
		<FileDrop {file} onselect={selectFile} />
		<p class="hint">{t('metadata.supportedHint')}</p>
		<p class="hint">{t('metadata.strippedHint')}</p>
		{#if result}
			<KeyValueTable
				rows={[{ label: t('metadata.detectedFormat'), value: result.formatLabel }, ...result.file]}
			/>
		{/if}
		{#if file && result?.isImage}
			<MetadataPreview {file} />
		{/if}
	</section>

	<section class="panel" aria-labelledby="summary-heading" aria-busy={busy}>
		<h2 id="summary-heading">{t('metadata.summaryHeading')}</h2>
		{#if busy}
			<p class="hint">{t('metadata.reading')}</p>
		{:else if error}
			<p class="error" role="alert">{t('metadata.readError', { message: error })}</p>
		{:else if result}
			{#if result.highlights.length}
				<KeyValueTable rows={result.highlights} />
			{/if}
			{#each result.notes as note (note)}
				<p class="note">{note}</p>
			{/each}
		{:else}
			<p class="hint">{t('metadata.chooseFile')}</p>
		{/if}
	</section>
</div>

{#if result?.groups.length}
	<section class="panel wide" aria-labelledby="all-heading">
		<h2 id="all-heading">{t('metadata.allHeading')}</h2>
		<MetadataGroups groups={result.groups} />
	</section>
{/if}

{#if result?.isImage}
	<section class="panel wide" aria-labelledby="reverse-heading">
		<h2 id="reverse-heading">{t('metadata.reverseHeading')}</h2>
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
