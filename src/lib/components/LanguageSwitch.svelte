<script>
	import { LOCALES } from '$lib/i18n/catalog.js';
	import { getLocale, setLocale, t } from '$lib/i18n/i18n.svelte.js';
</script>

<label>
	<span class="visually-hidden">{t('nav.language')}</span>
	<select value={getLocale()} onchange={(event) => setLocale(event.currentTarget.value)}>
		{#each LOCALES as locale (locale.code)}
			<option value={locale.code} lang={locale.code}>{locale.short} — {locale.label}</option>
		{/each}
	</select>
</label>

<style>
	select {
		padding: 0.15rem 0.4rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	select:hover,
	select:focus {
		border-color: var(--color-text);
		color: var(--color-text);
		outline: none;
	}
</style>
