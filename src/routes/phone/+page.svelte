<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import PhoneFormats from '$lib/components/PhoneFormats.svelte';
	import PhoneLinks from '$lib/components/PhoneLinks.svelte';
	import { analyzePhone } from '$lib/phone/analyze.js';
	import { listCountries } from '$lib/phone/countries.js';

	const COUNTRIES = listCountries();

	let input = $state('');
	let defaultCountry = $state('IT');

	let analysis = $derived(analyzePhone(input, defaultCountry));
	let result = $derived(analysis.result);

	let rows = $derived(
		result
			? [
					{
						label: 'Valid',
						value: result.valid
							? 'yes'
							: result.possible
								? 'no (length is possible, but the number is not assigned in the numbering plan)'
								: `no${result.lengthProblem ? ` (${result.lengthProblem})` : ''}`
					},
					{ label: 'Possible', value: result.possible ? 'yes' : 'no' },
					{
						label: 'Country',
						value: result.country
							? `${result.flag} ${result.countryName} (${result.country})`
							: null
					},
					{ label: 'Calling code', value: result.callingCode },
					{ label: 'National number', value: result.nationalNumber },
					{ label: 'Extension', value: result.extension },
					{ label: 'Number type', value: result.typeLabel ?? (result.valid ? 'Unknown' : null) }
				]
			: []
	);
</script>

<svelte:head>
	<title>Phone Analyzer — FreeOSINT-UI</title>
	<meta
		name="description"
		content="Analyze a phone number offline: validity, country, number type (mobile, fixed line, VoIP, toll free), standard formats and WhatsApp, Telegram and Google search links."
	/>
</svelte:head>

<ToolHeader
	title="Phone Analyzer"
	description="Check whether a phone number is valid, which country it belongs to and what kind of line it is, get it in every standard format and pivot to messaging apps and search. Everything runs locally: nothing leaves your browser."
/>

<div class="layout">
	<section class="panel" aria-labelledby="phone-input-heading">
		<h2 id="phone-input-heading">Number</h2>
		<label class="visually-hidden" for="phone-number">Phone number</label>
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
			<span>Default country (for numbers without +)</span>
			<select bind:value={defaultCountry}>
				{#each COUNTRIES as country (country.code)}
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
				{result.valid ? 'Valid number' : 'Not a valid number'} · results update as you type.
			{:else}
				Results update as you type.
			{/if}
		</p>
		<p class="note">
			Carrier and owner cannot be determined offline, and numbers can be ported to another operator:
			the type and country come from the numbering plan, not from the current line.
		</p>
	</section>

	<section class="panel" aria-labelledby="phone-results-heading">
		<h2 id="phone-results-heading">Results</h2>
		{#if result}
			<KeyValueTable {rows} />
			<h3>Formats</h3>
			<PhoneFormats formats={result.formats} />
			<h3>Pivot</h3>
			<PhoneLinks
				links={result.links}
				number={result.formats.find((f) => f.id === 'international')?.value ?? input}
			/>
			<p class="hint">
				Messaging links only open a chat: they do not prove that an account exists. Use the Dork
				Generator's Phone target for deeper searches.
			</p>
		{:else}
			<p class="hint">Enter a phone number to analyze it.</p>
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
