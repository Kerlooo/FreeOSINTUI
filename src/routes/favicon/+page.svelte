<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import FaviconPreview from '$lib/components/FaviconPreview.svelte';
	import FaviconHashList from '$lib/components/FaviconHashList.svelte';
	import FaviconSearchLinks from '$lib/components/FaviconSearchLinks.svelte';
	import { MAX_FAVICON_BYTES, faviconHashes, searchLinks } from '$lib/favicon/hash.js';
	import { detectImageFormat } from '$lib/favicon/format.js';
	import { faviconUrl } from '$lib/favicon/site.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	let site = $state('');
	let siteUrl = $derived(faviconUrl(site));

	/** @type {File | null} */
	let file = $state(null);
	/** @type {{ label: string, mime: string } | null} */
	let format = $state.raw(null);
	/** @type {{ mmh3: number, md5: string, sha256: string } | null} */
	let hashes = $state.raw(null);
	let links = $derived(hashes ? searchLinks(hashes) : []);
	let busy = $state(false);
	let error = $state('');
	let run = 0;

	let details = $derived(
		file
			? [
					{ label: t('favicon.row.format'), value: format?.label ?? t('common.unknown') },
					{ label: t('favicon.row.mime'), value: file.type },
					{
						label: t('favicon.row.size'),
						value: t('favicon.row.bytes', { count: file.size })
					}
				]
			: []
	);

	/** @param {File} selected */
	async function selectFile(selected) {
		const current = ++run;
		file = selected;
		format = null;
		hashes = null;
		error = '';
		if (selected.size > MAX_FAVICON_BYTES) {
			error = t('favicon.tooLarge', {
				size: `${formatNumber(selected.size / 1024 / 1024, { maximumFractionDigits: 1 })} MB`
			});
			return;
		}
		busy = true;
		try {
			const bytes = new Uint8Array(await selected.arrayBuffer());
			const detected = detectImageFormat(bytes);
			const computed = await faviconHashes(bytes);
			if (current !== run) return;
			format = detected;
			hashes = computed;
		} catch (err) {
			if (current === run)
				error = t('favicon.readError', {
					message: err instanceof Error ? err.message : String(err)
				});
		} finally {
			if (current === run) busy = false;
		}
	}

	// Other tools link here with ?q=<domain> to prefill the favicon link.
	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q')?.trim();
		if (q) site = q;
	});
</script>

<PageMeta
	title="{t('tools.favicon.name')} — FreeOSINT-UI"
	description={t('favicon.metaDescription')}
/>

<ToolHeader title={t('tools.favicon.name')} description={t('favicon.description')} />

<div class="layout">
	<section class="panel" aria-labelledby="favicon-file-heading">
		<h2 id="favicon-file-heading">{t('favicon.fileHeading')}</h2>
		<p class="hint">{t('favicon.whyUpload')}</p>
		<div class="site">
			<label for="favicon-site">{t('favicon.siteLabel')}</label>
			<input
				id="favicon-site"
				type="text"
				bind:value={site}
				placeholder={t('favicon.sitePlaceholder')}
				autocomplete="off"
				spellcheck="false"
			/>
			{#if siteUrl}
				<!-- External link only, so resolve() does not apply. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a href={siteUrl} target="_blank" rel="noopener noreferrer"
					>{t('favicon.openFavicon', { url: siteUrl })}</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<p class="hint">{t('favicon.siteHint')}</p>
			{:else if site.trim()}
				<p class="error">{t('favicon.siteInvalid')}</p>
			{/if}
		</div>
		<FileDrop {file} onselect={selectFile} />
		<p class="hint">{t('favicon.exactBytes')}</p>
		{#if file && !error}
			<FaviconPreview {file} />
			<KeyValueTable rows={details} />
		{/if}
	</section>

	<div class="column">
		<section class="panel" aria-labelledby="favicon-hashes-heading" aria-busy={busy}>
			<h2 id="favicon-hashes-heading">{t('favicon.hashesHeading')}</h2>
			{#if busy}
				<p class="hint">{t('favicon.computing')}</p>
			{:else if error}
				<p class="error" role="alert">{error}</p>
			{:else if hashes}
				{#if !format}
					<p class="warning" role="status">{t('favicon.notImage')}</p>
				{/if}
				<FaviconHashList {hashes} />
				<p class="hint">{t('favicon.mmh3Note')}</p>
			{:else}
				<p class="hint">{t('favicon.chooseFile')}</p>
			{/if}
		</section>

		{#if hashes}
			<section class="panel" aria-labelledby="favicon-search-heading">
				<h2 id="favicon-search-heading">{t('favicon.searchHeading')}</h2>
				<p class="hint">{t('favicon.searchNote')}</p>
				<FaviconSearchLinks {links} />
			</section>
		{/if}
	</div>
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

	.column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
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

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.site {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	label {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	a {
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.hint {
		color: var(--color-text-dim);
	}

	.error {
		color: var(--color-danger);
	}

	.warning {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
	}
</style>
