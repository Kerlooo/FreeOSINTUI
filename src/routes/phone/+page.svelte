<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import PhoneFormats from '$lib/components/PhoneFormats.svelte';
	import PhoneLinks from '$lib/components/PhoneLinks.svelte';
	import { analyzePhone } from '$lib/phone/analyze.js';
	import { listCountries } from '$lib/phone/countries.js';
	import { getLocale, t } from '$lib/i18n/i18n.svelte.js';

	let countries = $derived(listCountries(getLocale()));

	let input = $state('');
	let defaultCountry = $state('IT');

	let analysis = $derived(analyzePhone(input, defaultCountry));
	let result = $derived(analysis.result);

	let rows = $derived(
		result
			? [
					{
						label: t('phone.row.valid'),
						value: result.valid
							? t('common.yes')
							: result.possible
								? t('phone.notAssigned')
								: result.lengthProblem
									? t('phone.noWithReason', { reason: result.lengthProblem })
									: t('common.no')
					},
					{
						label: t('phone.row.possible'),
						value: result.possible ? t('common.yes') : t('common.no')
					},
					{
						label: t('phone.row.country'),
						value: result.country
							? `${result.flag} ${result.countryName} (${result.country})`
							: null
					},
					{ label: t('phone.row.callingCode'), value: result.callingCode },
					{ label: t('phone.row.nationalNumber'), value: result.nationalNumber },
					{ label: t('phone.row.extension'), value: result.extension },
					{
						label: t('phone.row.type'),
						value: result.typeLabel ?? (result.valid ? t('common.unknown') : null)
					}
				]
			: []
	);
</script>

<svelte:head>
	<title>{t('tools.phone.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('phone.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.phone.name')} description={t('phone.description')} />

<div class="layout">
	<section class="panel" aria-labelledby="phone-input-heading">
		<h2 id="phone-input-heading">{t('phone.numberHeading')}</h2>
		<label class="visually-hidden" for="phone-number">{t('phone.numberLabel')}</label>
		<input
			id="phone-number"
			type="text"
			inputmode="tel"
			bind:value={input}
			placeholder="+39 333 123 4567"
			autocomplete="off"
			spellcheck="false"
			aria-invalid={analysis.error ? 'true' : undefined}
			aria-describedby="phone-status"
		/>
		<label class="country">
			<span>{t('phone.defaultCountry')}</span>
			<select bind:value={defaultCountry}>
				{#each countries as country (country.code)}
					<option value={country.code}
						>{country.flag} {country.name} (+{country.callingCode})</option
					>
				{/each}
			</select>
		</label>
		<p id="phone-status" class="hint" class:error={analysis.error} aria-live="polite">
			{#if analysis.error}
				{analysis.error}
			{:else if result}
				{result.valid ? t('phone.statusValid') : t('phone.statusInvalid')}
			{:else}
				{t('phone.statusIdle')}
			{/if}
		</p>
		<p class="note">
			{t('phone.note')}
		</p>
	</section>

	<section class="panel" aria-labelledby="phone-results-heading">
		<h2 id="phone-results-heading">{t('phone.resultsHeading')}</h2>
		{#if result}
			<KeyValueTable {rows} />
			<h3>{t('phone.formatsHeading')}</h3>
			<PhoneFormats formats={result.formats} />
			<h3>{t('phone.pivotHeading')}</h3>
			<PhoneLinks
				links={result.links}
				number={result.formats.find((f) => f.id === 'international')?.value ?? input}
			/>
			<p class="hint">
				{t('phone.pivotHint')}
			</p>
		{:else}
			<p class="hint">{t('phone.empty')}</p>
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

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	h3 {
		margin: 0.5rem 0 0;
		font-size: 1rem;
	}

	.country {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.875rem;
		color: var(--color-text-dim);
	}

	select {
		width: 100%;
		padding: 0.6rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text);
		font: inherit;
	}

	select:focus {
		border-color: var(--color-text);
		outline: none;
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
