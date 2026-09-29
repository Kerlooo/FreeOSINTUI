<script>
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
						error: error instanceof Error ? error.message : 'Lookup failed.'
					};
				});
		}
	}
</script>

<svelte:head>
	<title>Domain Analyzer — FreeOSINT-UI</title>
	<meta
		name="description"
		content="Analyze a domain: DNS records, SPF and DMARC email security, RDAP registration data, subdomains from certificate transparency and Wayback Machine snapshots."
	/>
</svelte:head>

<ToolHeader
	title="Domain Analyzer"
	description="Enter a domain to get its DNS records, email security (SPF/DMARC), registration data, subdomains from certificate transparency logs and its history in the Wayback Machine. Every lookup runs in your browser against public sources."
/>

<section class="panel" aria-labelledby="domain-heading">
	<h2 id="domain-heading">Domain</h2>
	<LookupForm
		bind:value={input}
		label="Domain"
		placeholder="example.com or https://www.example.com/page"
		buttonLabel="Analyze"
		{busy}
		onsubmit={analyze}
	/>
	<p class:error={inputError} aria-live="polite">
		{#if inputError}
			{inputError}
		{:else if domain}
			Results for <strong>{domain}</strong>
		{:else}
			Scheme, path and "www." are stripped automatically.
		{/if}
	</p>
	<p class="note">
		Passive lookups only: the domain's servers are never contacted directly. Queries go to Google
		DNS, rdap.org, crt.sh / Cert Spotter and archive.org. Data may be cached or out of date.
	</p>
</section>

{#if domain}
	<div class="sections">
		<DomainSection
			id="domain-dns"
			title="DNS records"
			subtitle="via Google DNS-over-HTTPS"
			section={sections.dns}
			loadingText="Resolving A, AAAA, MX, NS, TXT, CAA and SOA…"
		>
			<DomainDnsRecords groups={sections.dns.data} />
		</DomainSection>

		<DomainSection
			id="domain-email"
			title="Email security"
			subtitle="SPF and DMARC"
			section={sections.email}
			loadingText="Checking SPF and DMARC records…"
		>
			<DomainEmailSecurity
				auth={sections.email.data.auth}
				findings={sections.email.data.findings}
			/>
		</DomainSection>

		<DomainSection
			id="domain-rdap"
			title="Registration"
			subtitle="via RDAP (rdap.org)"
			section={sections.rdap}
			loadingText="Querying the registry…"
		>
			<DomainRegistration rdap={sections.rdap.data} {domain} />
		</DomainSection>

		<DomainSection
			id="domain-subdomains"
			title="Subdomains"
			subtitle="certificate transparency"
			section={sections.subdomains}
			loadingText="Searching certificate transparency logs (crt.sh can take up to 30 seconds)…"
		>
			<DomainSubdomains result={sections.subdomains.data} />
		</DomainSection>

		<DomainSection
			id="domain-archive"
			title="Web archive"
			subtitle="Wayback Machine"
			section={sections.archive}
			loadingText="Looking for archived snapshots…"
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
