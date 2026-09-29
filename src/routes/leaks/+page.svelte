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

	const MODES = [
		{ value: 'email', label: 'Email' },
		{ value: 'password', label: 'Password' }
	];

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

	/**
	 * @param {number} count
	 * @param {string} one
	 * @param {string} many
	 */
	const plural = (count, one, many) =>
		`${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;

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
				emailError = error instanceof Error ? error.message : 'Unexpected error.';
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
				passwordError = error instanceof Error ? error.message : 'Unexpected error.';
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
	<title>Leak Check — FreeOSINT-UI</title>
	<meta
		name="description"
		content="Check whether an email address appears in known data breaches and whether a password has been exposed, using k-anonymity so the password never leaves your browser."
	/>
</svelte:head>

<ToolHeader
	title="Leak Check"
	description="Find out which known data breaches include an email address, or whether a password appears in breached password lists."
/>

<section class="panel" aria-labelledby="leak-input-heading">
	<h2 id="leak-input-heading">What to check</h2>
	<ModeSwitch bind:value={mode} options={MODES} label="Check type" />

	{#if mode === 'email'}
		<LookupForm
			bind:value={emailInput}
			label="Email address"
			placeholder="e.g. john.doe@example.com"
			buttonLabel="Check"
			busy={emailLoading}
			onsubmit={checkEmail}
		/>
		<p class="note">
			The address is sent to XposedOrNot. Only breach metadata (name, date, data types) is shown,
			never the leaked data itself.
		</p>
	{:else}
		<form class="password-form" onsubmit={checkPassword}>
			<LeakPasswordInput bind:value={password} id="leak-password" label="Password" />
			<button type="submit" disabled={passwordLoading || !password}>
				{passwordLoading ? 'working…' : 'Check'}
			</button>
		</form>
		<p class="note">
			Your password never leaves the browser: it is hashed locally with SHA-1 and only the first 5
			characters of the hash are sent (k-anonymity). The API returns hundreds of matching hashes and
			the comparison happens here. Even so, avoid typing passwords you still use anywhere they are
			not needed.
		</p>
	{/if}
</section>

{#if mode === 'email'}
	<section class="panel results" aria-labelledby="leak-email-results" aria-busy={emailLoading}>
		<h2 id="leak-email-results">Breaches</h2>
		{#if emailLoading}
			<p class="status">Checking known breaches…</p>
		{:else if emailError}
			<p class="status error" role="alert">{emailError}</p>
		{:else if emailResult}
			{#if emailResult.breaches.length}
				<p class="lead danger">
					<strong>{emailResult.email}</strong> appears in {plural(
						emailResult.breaches.length,
						'known breach',
						'known breaches'
					)}.
				</p>
				<ul class="breaches">
					{#each emailResult.breaches as breach (breach.id)}
						<LeakBreachCard {breach} />
					{/each}
				</ul>
				<p class="note">
					Change the password on these services and anywhere it was reused, and enable two-factor
					authentication.
				</p>
			{:else}
				<p class="lead">
					<strong>{emailResult.email}</strong> was not found in XposedOrNot's breach database.
				</p>
				<p class="note">
					This does not prove it was never leaked: only publicly known breaches are indexed.
				</p>
			{/if}
		{:else}
			<p class="status">Enter an email address to see the breaches that include it.</p>
		{/if}
	</section>
{:else}
	<section
		class="panel results"
		aria-labelledby="leak-password-results"
		aria-busy={passwordLoading}
	>
		<h2 id="leak-password-results">Result</h2>
		{#if passwordLoading}
			<p class="status">Checking…</p>
		{:else if passwordError}
			<p class="status error" role="alert">{passwordError}</p>
		{:else if passwordResult}
			{#if passwordStale}
				<p class="status">The password changed: press Check again.</p>
			{:else if passwordResult.count > 0}
				<p class="lead danger">
					Exposed: this password appeared {plural(passwordResult.count, 'time', 'times')} in data breaches.
					Do not use it.
				</p>
			{:else}
				<p class="lead">Not found in known breaches.</p>
				<p class="note">
					That does not make it strong: use a long, unique password for every account (a password
					manager helps).
				</p>
			{/if}
			<p class="note">
				Sent to the API: only the hash prefix <code>{passwordResult.prefix}</code>.
			</p>
			<button type="button" class="clear" onclick={clearPassword}>clear password</button>
		{:else}
			<p class="status">Enter a password to check it against Have I Been Pwned.</p>
		{/if}
	</section>
{/if}

<p class="credits">
	Sources:
	<a href="https://xposedornot.com" target="_blank" rel="noopener noreferrer">XposedOrNot</a>
	(email breaches) and
	<a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener noreferrer"
		>Have I Been Pwned — Pwned Passwords</a
	> (passwords). Thanks to both projects for their free public APIs.
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
