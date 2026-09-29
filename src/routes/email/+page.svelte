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
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

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
				error: error instanceof Error ? error.message : t('email.unexpectedError'),
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
	<title>{t('tools.email.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('email.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.email.name')} description={t('email.intro')} />

<section class="panel" aria-labelledby="email-input-heading">
	<h2 id="email-input-heading">{t('email.inputHeading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('email.inputLabel')}
		placeholder={t('email.placeholder')}
		buttonLabel={t('email.analyze')}
		{busy}
		onsubmit={analyze}
	/>
	<p class:error={inputError} aria-live="polite">
		{#if inputError}
			{inputError}
		{:else}
			{t('email.privacyNote')}
		{/if}
	</p>
</section>

{#if target && address}
	<div class="results">
		<EmailSection id="email-address-heading" title={t('email.address.title')}>
			<KeyValueTable
				rows={[
					{ label: t('email.address.normalized'), value: target.email },
					{ label: t('email.address.local'), value: address.local },
					{ label: t('email.address.tag'), value: address.tag },
					{ label: t('email.address.domain'), value: address.domain },
					{ label: t('email.address.syntax'), value: t('email.address.valid') },
					{
						label: t('email.address.freeProvider'),
						value: address.freeProvider
							? t('email.address.freeYes', { provider: address.freeProvider })
							: t('email.address.freeNo')
					},
					{
						label: t('email.address.role'),
						value: address.role ? t('email.address.roleYes') : t('email.address.roleNo')
					}
				]}
			/>
		</EmailSection>

		<EmailSection
			id="email-disposable-heading"
			title={t('email.disposable.title')}
			loading={disposable.loading}
			error={disposable.error}
		>
			{#if disposable.data}
				<p class="lead" class:danger={disposable.data.disposable}>
					{#if disposable.data.disposable}
						{t('email.disposable.yes')} <strong>{disposable.data.match}</strong>
						{t('email.disposable.yesDetail')}
					{:else}
						{t('email.disposable.no')}
					{/if}
				</p>
				<p class="note">
					{t('email.disposable.checkedBefore', {
						count: formatNumber(disposable.data.listSize)
					})}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a href={DISPOSABLE_LIST_SOURCE} target="_blank" rel="noopener noreferrer"
						>disposable-email-domains</a
					>{t('email.disposable.checkedAfter')}
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</p>
			{/if}
		</EmailSection>

		<EmailSection
			id="email-mail-heading"
			title={t('email.mail.title')}
			loading={mail.loading}
			error={mail.error}
		>
			{#if mail.data}
				<EmailVerdict label={t('email.mail.receiving')} verdict={mail.data.verdicts.mx} />
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
					{t('email.mail.note')}
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
					{t('email.gravatar.note')}
				</p>
			{/if}
		</EmailSection>

		<EmailSection id="email-links-heading" title={t('email.links.title')}>
			<ul class="links">
				<li>
					<a href={resolve(`/leaks?email=${encodeURIComponent(target.email)}`)}
						>{t('tools.leaks.name')}</a
					>
					{t('email.links.leaks')}
				</li>
				<li>
					<a href={resolve(`/dorks?type=email&q=${encodeURIComponent(target.email)}`)}
						>{t('tools.dorks.name')}</a
					>
					{t('email.links.dorks')}
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
