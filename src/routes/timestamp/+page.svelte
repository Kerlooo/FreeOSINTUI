<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import TimestampDate from '$lib/components/TimestampDate.svelte';
	import TimestampResult from '$lib/components/TimestampResult.svelte';
	import TimestampValueList from '$lib/components/TimestampValueList.svelte';
	import { decodeInput } from '$lib/timestamp/decode.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	let input = $state('');
	let now = $state(Date.now());
	let showUnlikely = $state(false);

	let decoding = $derived(decodeInput(input, { now }));
	let results = $derived(decoding.kind === 'ids' ? decoding.results : []);
	let plausible = $derived(results.filter((r) => r.plausible));
	let unlikely = $derived(results.filter((r) => !r.plausible));
	let visible = $derived(plausible.length && !showUnlikely ? plausible : results);

	function useNow() {
		now = Date.now();
		input = new Date(now).toISOString();
	}

	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q')?.trim();
		if (q) input = q;
		// Keeps "x minutes ago" and the plausibility window current.
		const timer = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(timer);
	});
</script>

<PageMeta
	title="{t('tools.timestamp.name')} — FreeOSINT-UI"
	description={t('timestamp.metaDescription')}
/>

<ToolHeader title={t('tools.timestamp.name')} description={t('timestamp.description')} />

<div class="layout">
	<section class="panel" aria-labelledby="timestamp-input-heading">
		<h2 id="timestamp-input-heading">{t('timestamp.inputHeading')}</h2>
		<label class="visually-hidden" for="timestamp-input">{t('timestamp.inputLabel')}</label>
		<div class="row">
			<input
				id="timestamp-input"
				type="text"
				bind:value={input}
				placeholder="1212092628029698048"
				autocomplete="off"
				spellcheck="false"
				aria-invalid={decoding.kind === 'error' ? 'true' : undefined}
				aria-describedby="timestamp-status"
			/>
			<button type="button" onclick={useNow}>{t('timestamp.now')}</button>
		</div>
		<p
			id="timestamp-status"
			class="hint"
			class:error={decoding.kind === 'error'}
			aria-live="polite"
		>
			{#if decoding.kind === 'error'}
				{t(`timestamp.error.${decoding.error}`)}
			{:else}
				{t('timestamp.statusIdle')}
			{/if}
		</p>
		<p class="note">{t('timestamp.accepted')}</p>
	</section>

	<section class="panel" aria-labelledby="timestamp-results-heading">
		{#if decoding.kind === 'date'}
			<h2 id="timestamp-results-heading">{t('timestamp.dateHeading')}</h2>
			<TimestampDate ns={decoding.ns} {now} />
			<h3>{t('timestamp.numericHeading')}</h3>
			<TimestampValueList values={decoding.numeric} />
			<h3>{t('timestamp.idsHeading')}</h3>
			<TimestampValueList values={decoding.ids} />
			<p class="hint">{t('timestamp.idsHint')}</p>
		{:else}
			<h2 id="timestamp-results-heading">{t('timestamp.resultsHeading')}</h2>
			{#if decoding.kind === 'ids'}
				{#if decoding.hint}
					<p class="hint">
						{t('timestamp.fromLink', { platform: t(`timestamp.platform.${decoding.hint}`) })}
					</p>
				{/if}
				{#if !plausible.length}
					<p class="hint">{t('timestamp.noPlausible')}</p>
				{/if}
				{#each visible as result (result.id)}
					<TimestampResult {result} {now} />
				{/each}
				{#if plausible.length && unlikely.length}
					<button type="button" class="toggle" onclick={() => (showUnlikely = !showUnlikely)}>
						{showUnlikely
							? t('timestamp.hideUnlikely')
							: t('timestamp.showUnlikely', { count: unlikely.length })}
					</button>
				{/if}
			{:else}
				<p class="hint">{t('timestamp.empty')}</p>
			{/if}
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
		min-width: 0;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	h3 {
		margin: 0.5rem 0 0;
		font-size: 1rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.row input {
		flex: 1 1 14rem;
		min-width: 0;
	}

	button {
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		cursor: pointer;
	}

	button:hover {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	.toggle {
		align-self: flex-start;
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
		color: var(--color-danger);
	}
</style>
