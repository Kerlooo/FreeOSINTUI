<script>
	import { onMount } from 'svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import ModeSwitch from '$lib/components/ModeSwitch.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import LeakBreachCard from '$lib/components/LeakBreachCard.svelte';
	import LeakPasswordInput from '$lib/components/LeakPasswordInput.svelte';
	import { parseEmail } from '$lib/email/address.js';
	import { checkEmailBreaches } from '$lib/leaks/xposedornot.js';
	import { checkPwnedPassword } from '$lib/leaks/pwned-passwords.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	const MODES = $derived([
		{ value: 'email', label: t('leaks.mode.email') },
		{ value: 'password', label: t('leaks.mode.password') }
	]);

	let mode = $state('email');

	// Email mode
	let emailInput = $state('');
	let emailError = $state('');
	let emailLoading = $state(false);
	/** @type {{ email: string, breaches: import('$lib/leaks/xposedornot.js').Breach[] } | null} */
	let emailResult = $state(null);
	/** @type {AbortController | null} */
	let emailController = null;

	// Password mode
	let password = $state('');
	let passwordError = $state('');
	let passwordLoading = $state(false);
	/** @type {{ count: number, prefix: string } | null} */
	let passwordResult = $state(null);
	let checkedPassword = $state('');
	/** @type {AbortController | null} */
	let passwordController = null;

	let passwordStale = $derived(passwordResult !== null && password !== checkedPassword);

	/** @param {string} value */
	async function checkEmail(value) {
		const parsed = parseEmail(value);
		emailResult = null;
		if (parsed.error !== undefined) {
			emailError = parsed.error;
			return;
		}
		emailController?.abort();
		emailController = new AbortController();
		const { signal } = emailController;
		emailError = '';
		emailLoading = true;
		try {
			const breaches = await checkEmailBreaches(parsed.email, { signal });
			if (!signal.aborted) emailResult = { email: parsed.email, breaches };
		} catch (error) {
			if (!signal.aborted)
				emailError = error instanceof Error ? error.message : t('leaks.unexpectedError');
		} finally {
			if (!signal.aborted) emailLoading = false;
		}
	}

	/** @param {SubmitEvent} event */
	async function checkPassword(event) {
		event.preventDefault();
		if (!password || passwordLoading) return;
		passwordController?.abort();
		passwordController = new AbortController();
		const { signal } = passwordController;
		const value = password;
		passwordError = '';
		passwordResult = null;
		passwordLoading = true;
		try {
			const result = await checkPwnedPassword(value, { signal });
			if (!signal.aborted) {
				passwordResult = result;
				checkedPassword = value;
			}
		} catch (error) {
			if (!signal.aborted)
				passwordError = error instanceof Error ? error.message : t('leaks.unexpectedError');
		} finally {
			if (!signal.aborted) passwordLoading = false;
		}
	}

	function clearPassword() {
		password = '';
		checkedPassword = '';
		passwordResult = null;
	}

	// The Email Analyzer links here with ?email=...; the static page reads it in the browser.
	onMount(() => {
		const email = new URLSearchParams(window.location.search).get('email');
		if (email) {
			emailInput = email;
			checkEmail(email);
		}
	});
</script>

<svelte:head>
	<title>{t('tools.leaks.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('leaks.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.leaks.name')} description={t('leaks.intro')} />

<section class="panel" aria-labelledby="leak-input-heading">
	<h2 id="leak-input-heading">{t('leaks.inputHeading')}</h2>
	<ModeSwitch bind:value={mode} options={MODES} label={t('leaks.modeLabel')} />

	{#if mode === 'email'}
		<LookupForm
			bind:value={emailInput}
			label={t('leaks.email.label')}
			placeholder={t('leaks.email.placeholder')}
			buttonLabel={t('leaks.check')}
			busy={emailLoading}
			onsubmit={checkEmail}
		/>
		<p class="note">
			{t('leaks.email.note')}
		</p>
	{:else}
		<form class="password-form" onsubmit={checkPassword}>
			<LeakPasswordInput
				bind:value={password}
				id="leak-password"
				label={t('leaks.password.label')}
			/>
			<button type="submit" disabled={passwordLoading || !password}>
				{passwordLoading ? t('common.working') : t('leaks.check')}
			</button>
		</form>
		<p class="note">
			{t('leaks.password.note')}
		</p>
	{/if}
</section>

{#if mode === 'email'}
	<section class="panel results" aria-labelledby="leak-email-results" aria-busy={emailLoading}>
		<h2 id="leak-email-results">{t('leaks.email.heading')}</h2>
		{#if emailLoading}
			<p class="status">{t('leaks.email.checking')}</p>
		{:else if emailError}
			<p class="status error" role="alert">{emailError}</p>
		{:else if emailResult}
			{#if emailResult.breaches.length}
				<p class="lead danger">
					<strong>{emailResult.email}</strong>
					{t('leaks.email.found', {
						count: emailResult.breaches.length,
						total: formatNumber(emailResult.breaches.length)
					})}
				</p>
				<ul class="breaches">
					{#each emailResult.breaches as breach (breach.id)}
						<LeakBreachCard {breach} />
					{/each}
				</ul>
				<p class="note">
					{t('leaks.email.advice')}
				</p>
			{:else}
				<p class="lead">
					<strong>{emailResult.email}</strong>
					{t('leaks.email.notFound')}
				</p>
				<p class="note">
					{t('leaks.email.notFoundNote')}
				</p>
			{/if}
		{:else}
			<p class="status">{t('leaks.email.empty')}</p>
		{/if}
	</section>
{:else}
	<section
		class="panel results"
		aria-labelledby="leak-password-results"
		aria-busy={passwordLoading}
	>
		<h2 id="leak-password-results">{t('leaks.password.heading')}</h2>
		{#if passwordLoading}
			<p class="status">{t('leaks.password.checking')}</p>
		{:else if passwordError}
			<p class="status error" role="alert">{passwordError}</p>
		{:else if passwordResult}
			{#if passwordStale}
				<p class="status">{t('leaks.password.stale')}</p>
			{:else if passwordResult.count > 0}
				<p class="lead danger">
					{t('leaks.password.exposed', {
						count: passwordResult.count,
						total: formatNumber(passwordResult.count)
					})}
				</p>
			{:else}
				<p class="lead">{t('leaks.password.notFound')}</p>
				<p class="note">
					{t('leaks.password.notFoundNote')}
				</p>
			{/if}
			<p class="note">
				{t('leaks.password.sent')} <code>{passwordResult.prefix}</code>
			</p>
			<button type="button" class="clear" onclick={clearPassword}
				>{t('leaks.password.clear')}</button
			>
		{:else}
			<p class="status">{t('leaks.password.empty')}</p>
		{/if}
	</section>
{/if}

<p class="credits">
	{t('leaks.credits.sources')}
	<a href="https://xposedornot.com" target="_blank" rel="noopener noreferrer">XposedOrNot</a>
	{t('leaks.credits.emailBreaches')}
	<a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener noreferrer"
		>Have I Been Pwned — Pwned Passwords</a
	>
	{t('leaks.credits.passwords')}
</p>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.results {
		margin-top: 1.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		overflow-wrap: anywhere;
	}

	.note,
	.status {
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.error {
		color: var(--color-danger);
	}

	.lead {
		font-weight: 700;
	}

	.lead.danger {
		color: var(--color-danger);
	}

	.lead strong {
		color: var(--color-text);
	}

	.password-form {
		display: flex;
		gap: 0.5rem;
	}

	.password-form button[type='submit'] {
		padding: 0 1.25rem;
		background: var(--color-text);
		border: 1px solid var(--color-text);
		border-radius: var(--radius);
		color: var(--color-bg);
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
	}

	.password-form button[type='submit']:disabled {
		background: transparent;
		color: var(--color-text-muted);
		border-color: var(--color-border);
		cursor: not-allowed;
	}

	.breaches {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	code {
		font-family: var(--font-mono);
		color: var(--color-text);
	}

	.clear {
		align-self: flex-start;
		padding: 0.25rem 0.6rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.clear:hover {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	.credits {
		margin-top: 1.5rem;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
