<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import MacFormats from '$lib/components/MacFormats.svelte';
	import { googleSearchUrl } from '$lib/search.js';
	import { getLocale, t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * @type {{
	 *   mac: import('$lib/mac/parse.js').ParsedMac,
	 *   vendor: import('$lib/mac/vendor.js').Vendor | null,
	 *   vendorText: string
	 * }}
	 */
	let { mac, vendor, vendorText } = $props();

	let countryName = $derived.by(() => {
		if (!vendor?.country) return null;
		const name = new Intl.DisplayNames(getLocale(), { type: 'region' }).of(vendor.country);
		return `${name} (${vendor.country})`;
	});

	let rows = $derived([
		{ label: t('mac.row.vendor'), value: vendorText },
		{
			label: t('mac.row.assignment'),
			value: vendor
				? t('mac.assignment', {
						registry: vendor.registry,
						prefix: vendor.prefix,
						bits: vendor.bits
					})
				: null
		},
		{ label: t('mac.row.country'), value: countryName },
		{
			label: t('mac.row.cast'),
			value: mac.broadcast
				? t('mac.broadcast')
				: mac.multicast
					? t('mac.multicast')
					: t('mac.unicast')
		},
		{
			label: t('mac.row.administration'),
			value: mac.local ? t('mac.local') : t('mac.universal')
		}
	]);

	let colon = $derived(mac.formats[0].value);
	let showVendorSearch = $derived(vendor !== null && vendor.organization !== 'Private');
</script>

<KeyValueTable {rows} />

{#if mac.local && !mac.broadcast}
	<p class="note">{t('mac.localNote')}</p>
{/if}
{#if mac.multicast && !mac.broadcast}
	<p class="note">{t('mac.multicastNote')}</p>
{/if}
{#if mac.prefixOnly}
	<p class="note">{t('mac.prefixNote')}</p>
{/if}

<h3>{t('mac.formatsHeading')}</h3>
<MacFormats formats={mac.formats} />
{#if !mac.prefixOnly}
	<p class="hint">{t('mac.eui64Note')}</p>
{/if}

<h3>{t('mac.pivotHeading')}</h3>
<!-- External links only, so resolve() does not apply. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<ul class="links">
	<li>
		<a
			href={googleSearchUrl(`"${colon}" OR "${mac.formats.find((f) => f.id === 'hyphen')?.value}"`)}
			target="_blank"
			rel="noopener noreferrer">{t('mac.googleSearch')}</a
		>
	</li>
	{#if showVendorSearch && vendor}
		<li>
			<a
				href={googleSearchUrl(`"${vendor.organization}"`)}
				target="_blank"
				rel="noopener noreferrer">{t('mac.googleVendor')}</a
			>
		</li>
	{/if}
</ul>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	h3 {
		margin: 0.5rem 0 0;
		font-size: 1rem;
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

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.875rem;
	}
</style>
