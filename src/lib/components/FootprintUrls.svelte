<script>
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import FootprintUrlRow from '$lib/components/FootprintUrlRow.svelte';
	import { GROUP_IDS } from '$lib/footprint/classify.js';
	import { filterEntries } from '$lib/footprint/stats.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * Archived URLs with a group ("type") filter, a text filter, pagination and export.
	 * @type {{
	 *   entries: import('$lib/footprint/merge.js').FootprintEntry[],
	 *   groups: Record<string, import('$lib/footprint/merge.js').FootprintEntry[]>,
	 *   domain: string
	 * }}
	 */
	let { entries, groups, domain } = $props();

	const PAGE_SIZE = 100;

	/** 'all' or a group id. Starts on the first non-empty interesting group. */
	let group = $state('auto');
	let query = $state('');
	let page = $state(0);

	let selected = $derived(
		group === 'auto' ? (GROUP_IDS.find((id) => groups[id]?.length) ?? 'all') : group
	);
	let source = $derived(selected === 'all' ? entries : (groups[selected] ?? []));
	let filtered = $derived(filterEntries(source, query));
	let pages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	let current = $derived(Math.min(page, pages - 1));
	let visible = $derived(filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE));
	let asText = $derived(filtered.map((entry) => entry.url).join('\n'));

	let options = $derived([
		{ value: 'all', label: `${t('footprint.group.all')} (${formatNumber(entries.length)})` },
		...GROUP_IDS.map((id) => ({
			value: id,
			label: `${t(`footprint.group.${id}`)} (${formatNumber(groups[id]?.length ?? 0)})`
		}))
	]);

	function exportText() {
		const blob = new Blob([`${asText}\n`], { type: 'text/plain;charset=utf-8' });
		const href = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = href;
		link.download = `footprint-${domain}-${selected}.txt`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(href), 1000);
	}
</script>

<section class="panel" aria-labelledby="footprint-urls">
	<h2 id="footprint-urls">{t('footprint.list.title')}</h2>
	<p class="hint">{t('footprint.list.hint')}</p>

	<div class="toolbar">
		<label>
			<span>{t('footprint.list.typeLabel')}</span>
			<select
				value={selected}
				onchange={(event) => {
					group = event.currentTarget.value;
					page = 0;
				}}
			>
				{#each options as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>
		<label>
			<span>{t('footprint.list.filterLabel')}</span>
			<input
				type="text"
				bind:value={query}
				oninput={() => (page = 0)}
				placeholder={t('footprint.list.filterPlaceholder')}
				autocomplete="off"
				spellcheck="false"
			/>
		</label>
	</div>

	{#if selected !== 'all'}
		<p class="hint">
			{t(`footprint.groupHint.${selected}`)}
			{#if selected === 'documents'}
				<a href={resolve('/metadata')}>{t('tools.metadata.name')}</a>
			{/if}
		</p>
	{/if}

	<div class="summary">
		<span>
			{t('footprint.list.shown', {
				visible: formatNumber(filtered.length),
				total: formatNumber(source.length)
			})}
		</span>
		{#if filtered.length}
			<span class="buttons">
				<CopyButton value={asText} label={t('footprint.list.copyAll')} />
				<button type="button" onclick={exportText}>{t('footprint.list.export')}</button>
			</span>
		{/if}
	</div>

	{#if visible.length}
		<ul>
			{#each visible as entry (entry.key)}
				<FootprintUrlRow {entry} />
			{/each}
		</ul>
		{#if pages > 1}
			<nav class="pager" aria-label={t('footprint.list.pages')}>
				<button type="button" disabled={current === 0} onclick={() => (page = current - 1)}
					>{t('footprint.list.previous')}</button
				>
				<span>{t('footprint.list.page', { page: current + 1, pages })}</span>
				<button type="button" disabled={current >= pages - 1} onclick={() => (page = current + 1)}
					>{t('footprint.list.next')}</button
				>
			</nav>
		{/if}
	{:else}
		<p class="hint">{t('footprint.list.empty')}</p>
	{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.toolbar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: 0.75rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		font-size: 0.8rem;
		color: var(--color-text-dim);
	}

	select,
	input {
		width: 100%;
		min-width: 0;
		padding: 0.45rem 0.6rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text);
		font: inherit;
		font-size: 0.85rem;
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.buttons {
		display: flex;
		gap: 0.5rem;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	button {
		padding: 0.25rem 0.7rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.8rem;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	button:disabled {
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	.pager {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 0.8rem;
		color: var(--color-text-dim);
	}
</style>
