<script>
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import DorkGroup from '$lib/components/DorkGroup.svelte';
	import ModeSwitch from '$lib/components/ModeSwitch.svelte';
	import { generateDorks } from '$lib/dorks/generate.js';
	import { TARGET_TYPES } from '$lib/dorks/targets.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	let typeOptions = $derived(TARGET_TYPES.map((type) => ({ value: type.id, label: type.label })));

	let typeId = $state('username');
	let input = $state('');

	// Other tools link here with ?type=<target type>&q=<value>; the static page reads it in the browser.
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const type = params.get('type');
		if (TARGET_TYPES.some((target) => target.id === type)) typeId = /** @type {string} */ (type);
		input = params.get('q') ?? '';
	});

	let type = $derived(TARGET_TYPES.find((target) => target.id === typeId));
	let result = $derived(generateDorks(typeId, input));
	let total = $derived(result.groups.reduce((sum, group) => sum + group.dorks.length, 0));
</script>

<svelte:head>
	<title>{t('tools.dorks.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('tools.dorks.description')} />
</svelte:head>

<ToolHeader title={t('tools.dorks.name')} description={t('dorks.intro')} />

<section class="panel" aria-labelledby="target-heading">
	<h2 id="target-heading">{t('dorks.targetHeading')}</h2>
	<ModeSwitch bind:value={typeId} options={typeOptions} label={t('dorks.targetType')} />

	<label class="visually-hidden" for="dork-target">{type.label}</label>
	<input
		id="dork-target"
		type="text"
		bind:value={input}
		placeholder={t('dorks.placeholder', { label: type.label, example: type.placeholder })}
		autocomplete="off"
		spellcheck="false"
		aria-invalid={result.error ? 'true' : undefined}
		aria-describedby="dork-target-status"
	/>
	<p id="dork-target-status" class:error={result.error} aria-live="polite">
		{#if result.error}
			{result.error}
		{:else if result.target}
			{t('dorks.statusCount', { count: total })} <strong>{result.target.value}</strong>
		{:else}
			{t('dorks.statusIdle')}
		{/if}
	</p>
</section>

{#if result.groups.length}
	<nav class="jump" aria-label={t('dorks.categoriesNav')}>
		{#each result.groups as group (group.id)}
			<a href={`#dorks-${group.id}`}>{group.label} ({group.dorks.length})</a>
		{/each}
	</nav>

	<div class="groups">
		{#each result.groups as group (group.id)}
			<DorkGroup {group} />
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
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.panel p strong {
		color: var(--color-text);
	}

	.panel p.error {
		color: var(--color-danger);
	}

	input[aria-invalid='true'] {
		border-color: var(--color-danger);
	}

	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 1.5rem 0 1rem;
		font-size: 0.9rem;
	}

	.jump a {
		color: var(--color-text-dim);
	}

	.jump a:hover {
		color: var(--color-text);
	}

	.groups {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
</style>
