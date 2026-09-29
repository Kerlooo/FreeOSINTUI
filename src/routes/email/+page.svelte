<script>
	import { resolve } from '$app/paths';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import EmailSection from '$lib/components/EmailSection.svelte';
	import EmailVerdict from '$lib/components/EmailVerdict.svelte';
	import EmailMxList from '$lib/components/EmailMxList.svelte';
	import EmailGravatar from '$lib/components/EmailGravatar.svelte';
	import { analyzeAddress, parseEmail } from '$lib/email/address.js';
	import { checkDisposable, DISPOSABLE_LIST_SOURCE } from '$lib/email/disposable.js';
	import { lookupMailServer } from '$lib/email/mail-server.js';
	import { gravatarAvatarUrl, gravatarHash, lookupGravatarProfile } from '$lib/email/gravatar.js';

	/**
	 * @template T
	 * @typedef {{ loading: boolean, error: string, data: T | null }} Task
	 */

	let input = $state('');
	let inputError = $state('');
	/** @type {{ email: string, local: string, domain: string } | null} */
	let target = $state(null);

	/** @type {Task<Awaited<ReturnType<typeof checkDisposable>>>} */
	let disposable = $state({ loading: false, error: '', data: null });
	/** @type {Task<Awaited<ReturnType<typeof lookupMailServer>>>} */
	let mail = $state({ loading: false, error: '', data: null });
	/** @type {Task<{ hash: string, avatarUrl: string, profile: Awaited<ReturnType<typeof lookupGravatarProfile>> }>} */
	let gravatar = $state({ loading: false, error: '', data: null });

	let address = $derived(target ? analyzeAddress(target.local, target.domain) : null);
	let busy = $derived(disposable.loading || mail.loading || gravatar.loading);

	/** @type {AbortController | null} */
	let controller = null;

	/**
	 * Runs one lookup and stores its result, ignoring results of a stale lookup.
	 * @template T
	 * @param {(task: Task<T>) => void} set
	 * @param {() => Promise<T>} load
	 * @param {AbortSignal} signal
	 */
	async function run(set, load, signal) {
		set({ loading: true, error: '', data: null });
		try {
			const data = await load();
			if (!signal.aborted) set({ loading: false, error: '', data });
		} catch (error) {
			if (signal.aborted) return;
			set({
				loading: false,
				error: error instanceof Error ? error.message : 'Unexpected error.',
				data: null
			});
		}
	}

	/** @param {string} value */
	function analyze(value) {
		const parsed = parseEmail(value);
		if (parsed.error !== undefined) {
			inputError = parsed.error;
			return;
		}
		inputError = '';
		target = parsed;

		controller?.abort();
		controller = new AbortController();
		const { signal } = controller;
		const { email, domain } = parsed;

		run(
			(task) => (disposable = task),
			() => checkDisposable(domain, { signal }),
			signal
		);
		run(
			(task) => (mail = task),
			() => lookupMailServer(domain, { signal }),
			signal
		);
		run(
			(task) => (gravatar = task),
			async () => {
				const hash = await gravatarHash(email);
				const profile = await lookupGravatarProfile(hash, { signal });
				return { hash, avatarUrl: gravatarAvatarUrl(hash), profile };
			},
			signal
		);
	}
</script>

<svelte:head>
	<title>Email Analyzer — FreeOSINT-UI</title>
	<meta
		name="description"
		content="Analyze an email address: syntax, free or disposable provider, role address, MX mail servers, SPF and DMARC, and public Gravatar profile."
	/>
</svelte:head>

<ToolHeader
	title="Email Analyzer"
	description="Enter an email address to check its syntax, provider type, disposable domain, mail servers, SPF/DMARC protection and public Gravatar profile."
/>

<section class="panel" aria-labelledby="email-input-heading">
	<h2 id="email-input-heading">Email address</h2>
	<LookupForm
		bind:value={input}
		label="Email address"
		placeholder="e.g. john.doe@example.com"
		buttonLabel="Analyze"
		{busy}
		onsubmit={analyze}
	/>
	<p class:error={inputError} aria-live="polite">
		{#if inputError}
			{inputError}
		{:else}
			Only public sources are queried: DNS over HTTPS (Google), a public disposable-domain list and
			Gravatar. Nothing is sent to the address or its mail server.
		{/if}
	</p>
</section>

{#if target && address}
	<div class="results">
		<EmailSection id="email-address-heading" title="Address">
			<KeyValueTable
				rows={[
					{ label: 'Normalized', value: target.email },
					{ label: 'Local part', value: address.local },
					{ label: 'Plus tag', value: address.tag },
					{ label: 'Domain', value: address.domain },
					{ label: 'Syntax', value: 'Valid' },
					{
						label: 'Free provider',
						value: address.freeProvider ? `Yes — ${address.freeProvider}` : 'No (custom domain)'
					},
					{
						label: 'Role address',
						value: address.role
							? 'Yes — likely a shared or team mailbox, not a person'
							: 'No — looks personal'
					}
				]}
			/>
		</EmailSection>

		<EmailSection
			id="email-disposable-heading"
			title="Disposable domain"
			loading={disposable.loading}
			error={disposable.error}
		>
			{#if disposable.data}
				<p class="lead" class:danger={disposable.data.disposable}>
					{#if disposable.data.disposable}
						Disposable: <strong>{disposable.data.match}</strong> is a throwaway email service.
					{:else}
						Not listed as disposable.
					{/if}
				</p>
				<p class="note">
					Checked against {disposable.data.listSize.toLocaleString('en-US')} domains of the
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a href={DISPOSABLE_LIST_SOURCE} target="_blank" rel="noopener noreferrer"
						>disposable-email-domains</a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
					list. New throwaway services may be missing.
				</p>
			{/if}
		</EmailSection>

		<EmailSection
			id="email-mail-heading"
			title="Mail server"
			loading={mail.loading}
			error={mail.error}
		>
			{#if mail.data}
				<EmailVerdict label="Receiving" verdict={mail.data.verdicts.mx} />
				{#if mail.data.mx.length}
					<EmailMxList mx={mail.data.mx} />
				{/if}
				<EmailVerdict label="SPF" verdict={mail.data.verdicts.spf} />
				{#if mail.data.spf}
					<code>{mail.data.spf.record}</code>
				{/if}
				<EmailVerdict label="DMARC" verdict={mail.data.verdicts.dmarc} />
				{#if mail.data.dmarc}
					<code>{mail.data.dmarc.record}</code>
				{/if}
				<p class="note">
					A valid mail server only means the domain accepts mail; it does not prove this specific
					mailbox exists.
				</p>
			{/if}
		</EmailSection>

		<EmailSection
			id="email-gravatar-heading"
			title="Gravatar"
			loading={gravatar.loading}
			error={gravatar.error}
		>
			{#if gravatar.data}
				{#key gravatar.data.hash}
					<EmailGravatar gravatar={gravatar.data} />
				{/key}
				<p class="note">
					Gravatar receives only the SHA-256 hash of the address. Profiles are public and
					self-declared.
				</p>
			{/if}
		</EmailSection>

		<EmailSection id="email-links-heading" title="Next steps">
			<ul class="links">
				<li>
					<a href={resolve(`/leaks?email=${encodeURIComponent(target.email)}`)}>Leak Check</a>
					— see which known data breaches include this address.
				</li>
				<li>
					<a href={resolve(`/dorks?type=email&q=${encodeURIComponent(target.email)}`)}
						>Google Dork Generator</a
					> — ready-made Google searches for this address.
				</li>
			</ul>
		</EmailSection>
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
	}

	.panel p.error {
		color: var(--color-danger);
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.lead {
		margin: 0;
		font-weight: 700;
		overflow-wrap: anywhere;
	}

	.lead.danger {
		color: var(--color-danger);
	}

	.note {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	code {
		display: block;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		overflow-wrap: anywhere;
	}

	.links {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.9rem;
	}
</style>
