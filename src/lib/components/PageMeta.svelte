<script>
	import { page } from '$app/state';
	import { t, getLocale } from '$lib/i18n/i18n.svelte.js';
	import { SITE_NAME, absoluteUrl } from '$lib/site.js';

	/** @type {{ title: string, description: string }} */
	let { title, description } = $props();

	const OG_LOCALES = { en: 'en_US', it: 'it_IT', fr: 'fr_FR' };

	// Only the path: query strings (prefilled lookups) must not become separate pages.
	const url = $derived(absoluteUrl(page.url.pathname));
	const image = absoluteUrl('/og-image.png');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content={OG_LOCALES[getLocale()] ?? OG_LOCALES.en} />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={t('common.ogImageAlt')} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
