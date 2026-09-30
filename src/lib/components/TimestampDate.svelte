<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { isoFromNs, nsToMs, relativeParts } from '$lib/timestamp/time.js';
	import { formatDate, getLocale, t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ ns: bigint, now: number }} */
	let { ns, now } = $props();

	let iso = $derived(isoFromNs(ns));
	let ms = $derived(nsToMs(ns));
	let relative = $derived.by(() => {
		const { value, unit } = relativeParts(ms, now);
		return new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' }).format(value, unit);
	});
	let rows = $derived([
		{
			label: t('timestamp.row.local'),
			value: formatDate(ms, { dateStyle: 'full', timeStyle: 'long' })
		},
		{ label: t('timestamp.row.relative'), value: relative }
	]);
</script>

<div class="iso">
	<span class="label">{t('timestamp.row.utc')}</span>
	<code>{iso}</code>
	<CopyButton value={iso} label={t('timestamp.copyValue', { format: t('timestamp.row.utc') })} />
</div>
<KeyValueTable {rows} />

<style>
	.iso {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		padding: 0.45rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.875rem;
	}

	.label {
		color: var(--color-text-dim);
	}

	code {
		flex: 1;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 1rem;
		overflow-wrap: anywhere;
	}
</style>
