<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import DomainSection from '$lib/components/DomainSection.svelte';
	import DomainDnsRecords from '$lib/components/DomainDnsRecords.svelte';
	import DomainEmailSecurity from '$lib/components/DomainEmailSecurity.svelte';
	import DomainRegistration from '$lib/components/DomainRegistration.svelte';
	import DomainSubdomains from '$lib/components/DomainSubdomains.svelte';
	import DomainArchive from '$lib/components/DomainArchive.svelte';
	import { normalizeDomain } from '$lib/domain/normalize.js';
	import { lookupDnsRecords } from '$lib/domain/dns.js';
	import { emailSecurityFindings } from '$lib/domain/email.js';
	import { findSubdomains } from '$lib/domain/subdomains.js';
	import { lookupWayback } from '$lib/domain/archive.js';
	import { lookupEmailAuth } from '$lib/dns/email-auth.js';
	import { lookupRdap } from '$lib/rdap.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @typedef {{ status: 'idle' | 'loading' | 'done' | 'error', data: any, error: string | null }} Section */

	/** @returns {Section} */
	const idle = () => ({ status: 'idle', data: null, error: null });

	/** Each section loads on its own and shows up as soon as its data arrives. */
	const LOADERS = {
		dns: (/** @type {string} */ d, /** @type {AbortSignal} */ signal) =>
			lookupDnsRecords(d, { signal }),
		email: async (/** @type {string} */ d, /** @type {AbortSignal} */ signal) => {
			const auth = await lookupEmailAuth(d, { signal });
			return { auth, findings: emailSecurityFindings(auth) };
		},
		rdap: (/** @type {string} */ d, /** @type {AbortSignal} */ signal) =>
			lookupRdap('domain', d, { signal }),
		subdomains: (/** @type {string} */ d, /** @type {AbortSignal} */ signal) =>
			findSubdomains(d, { signal }),
		archive: (/** @type {string} */ d, /** @type {AbortSignal} */ signal) =>
			lookupWayback(d, { signal })
	};

	let input = $state('');
	let domain = $state('');
	let inputError = $state('');
	/** @type {Record<keyof typeof LOADERS, Section>} */
	let sections = $state({
		dns: idle(),
		email: idle(),
		rdap: idle(),
		subdomains: idle(),
		archive: idle()
	});

	/** @type {AbortController | null} */
	let controller = null;

	let busy = $derived(Object.values(sections).some((s) => s.status === 'loading'));

	/** @param {string} raw */
	function analyze(raw) {
		const result = normalizeDomain(raw);
		if (result.error) {
			inputError = result.error;
			return;
		}
		inputError = '';
		domain = result.value;
		input = result.value;

		controller?.abort();
		const current = new AbortController();
		controller = current;

		for (const key of /** @type {(keyof typeof LOADERS)[]} */ (Object.keys(LOADERS))) {
			sections[key] = { status: 'loading', data: null, error: null };
			LOADERS[key](domain, current.signal)
				.then((data) => {
					if (current.signal.aborted) return;
					sections[key] = { status: 'done', data, error: null };
				})
				.catch((error) => {
					if (current.signal.aborted) return;
					sections[key] = {
						status: 'error',
						data: null,
						error: error instanceof Error ? error.message : t('domain.lookupFailed')
					};
				});
		}
	}

	// Other tools link here with ?q=...; the static page reads it in the browser.
	onMount(() => {
		const q = new URLSearchParams(window.location.search).get('q')?.trim();
		if (q) {
			input = q;
			analyze(q);
		}
	});
</script>

<PageMeta
	title="{t('tools.domain.name')} — FreeOSINT-UI"
	description={t('domain.metaDescription')}
/>

<ToolHeader title={t('tools.domain.name')} description={t('domain.intro')} />

<section class="panel" aria-labelledby="domain-heading">
	<h2 id="domain-heading">{t('domain.domain')}</h2>
	<LookupForm
		bind:value={input}
		label={t('domain.domain')}
		placeholder={t('domain.placeholder')}
		buttonLabel={t('domain.analyze')}
		{busy}
		onsubmit={analyze}
	/>
	<p class:error={inputError} aria-live="polite">
		{#if inputError}
			{inputError}
		{:else if domain}
			{t('domain.resultsFor')} <strong>{domain}</strong>
		{:else}
			{t('domain.inputHint')}
		{/if}
	</p>
	<p class="note">
		{t('domain.passiveNote')}
	</p>
</section>

{#if domain}
	<div class="sections">
		<DomainSection
			id="domain-dns"
			title={t('domain.dns.title')}
			subtitle={t('domain.dns.subtitle')}
			section={sections.dns}
			loadingText={t('domain.dns.loading')}
		>
			<DomainDnsRecords groups={sections.dns.data} />
		</DomainSection>

		<DomainSection
			id="domain-email"
			title={t('domain.email.title')}
			subtitle={t('domain.email.subtitle')}
			section={sections.email}
			loadingText={t('domain.email.loading')}
		>
			<DomainEmailSecurity
				auth={sections.email.data.auth}
				findings={sections.email.data.findings}
			/>
		</DomainSection>

		<DomainSection
			id="domain-rdap"
			title={t('domain.rdap.title')}
			subtitle={t('domain.rdap.subtitle')}
			section={sections.rdap}
			loadingText={t('domain.rdap.loading')}
		>
			<DomainRegistration rdap={sections.rdap.data} {domain} />
		</DomainSection>

		<DomainSection
			id="domain-subdomains"
			title={t('domain.subdomains.title')}
			subtitle={t('domain.subdomains.subtitle')}
			section={sections.subdomains}
			loadingText={t('domain.subdomains.loading')}
		>
			<DomainSubdomains result={sections.subdomains.data} />
		</DomainSection>

		<DomainSection
			id="domain-archive"
			title={t('domain.archive.title')}
			subtitle={t('domain.archive.subtitle')}
			section={sections.archive}
			loadingText={t('domain.archive.loading')}
		>
			<DomainArchive result={sections.archive.data} />
		</DomainSection>
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

	.panel p.note {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}
</style>
