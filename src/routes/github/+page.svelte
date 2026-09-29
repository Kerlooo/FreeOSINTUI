<script>
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import GithubSection from '$lib/components/GithubSection.svelte';
	import GithubRateLimit from '$lib/components/GithubRateLimit.svelte';
	import GithubProfile from '$lib/components/GithubProfile.svelte';
	import GithubRepos from '$lib/components/GithubRepos.svelte';
	import GithubOrgs from '$lib/components/GithubOrgs.svelte';
	import GithubEmails from '$lib/components/GithubEmails.svelte';
	import GithubKeys from '$lib/components/GithubKeys.svelte';
	import { normalizeUsername } from '$lib/github/api.js';
	import { t } from '$lib/i18n/i18n.svelte.js';
	import {
		COMMITS_PER_REPO,
		MAX_REQUESTS,
		fetchCommitEmails,
		fetchKeys,
		fetchOrgs,
		fetchProfile,
		fetchRepos
	} from '$lib/github/lookup.js';

	/** @typedef {'idle' | 'loading' | 'done' | 'error'} Status */

	/** Creates the state of one section. */
	const section = () => ({
		status: /** @type {Status} */ ('idle'),
		error: '',
		data: /** @type {any} */ (null)
	});

	let input = $state('');
	let inputError = $state('');
	let searched = $state('');
	/** @type {import('$lib/github/api.js').RateLimit | null} */
	let rate = $state(null);

	let profile = $state(section());
	let repos = $state(section());
	let orgs = $state(section());
	let emails = $state(section());
	let keys = $state(section());

	/** @type {AbortController | null} */
	let controller = null;

	/** @param {import('$lib/github/api.js').RateLimit} next */
	function updateRate(next) {
		// Responses arrive out of order: keep the lowest remaining count within the same window.
		const sameWindow = rate?.reset?.getTime() === next.reset?.getTime();
		if (!rate || !sameWindow || next.remaining < rate.remaining) rate = next;
	}

	/**
	 * Runs one section's request and stores its result or error.
	 * @param {{ status: Status, error: string, data: any }} target
	 * @param {() => Promise<any>} task
	 * @param {AbortSignal} signal
	 */
	async function load(target, task, signal) {
		target.status = 'loading';
		target.error = '';
		target.data = null;
		try {
			const data = await task();
			if (signal.aborted) return null;
			target.data = data;
			target.status = 'done';
			return data;
		} catch (error) {
			if (signal.aborted) return null;
			target.error = error instanceof Error ? error.message : String(error);
			target.status = 'error';
			return null;
		}
	}

	/** @param {string} value */
	async function lookup(value) {
		const { value: username, error } = normalizeUsername(value);
		inputError = error ?? '';
		if (!username) return;

		controller?.abort();
		const current = new AbortController();
		controller = current;
		const { signal } = current;
		const options = { signal, onRate: updateRate };

		searched = username;
		for (const target of [repos, orgs, emails, keys]) {
			target.status = 'idle';
			target.data = null;
		}

		const user = await load(profile, () => fetchProfile(username, options), signal);
		if (signal.aborted || profile.status !== 'done') return;
		if (!user) {
			profile.status = 'error';
			profile.error = t('github.noAccount', { username });
			return;
		}
		const login = user.login;

		load(orgs, () => fetchOrgs(login, options), signal);
		load(keys, () => fetchKeys(login, options), signal);
		emails.status = 'loading';
		const repoList = await load(repos, () => fetchRepos(login, options), signal);
		if (signal.aborted) return;
		if (repos.status === 'error') {
			emails.status = 'error';
			emails.error = t('github.reposFailed');
			return;
		}
		load(emails, () => fetchCommitEmails(login, repoList ?? [], options), signal);
	}

	let busy = $derived(
		profile.status === 'loading' || repos.status === 'loading' || emails.status === 'loading'
	);
</script>

<svelte:head>
	<title>{t('tools.github.name')} — FreeOSINT-UI</title>
	<meta name="description" content={t('github.metaDescription')} />
</svelte:head>

<ToolHeader title={t('tools.github.name')} description={t('github.intro')} />

<section class="panel" aria-labelledby="search-heading">
	<h2 id="search-heading">{t('github.usernameHeading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('github.inputLabel')}
		placeholder={t('github.placeholder')}
		{busy}
		onsubmit={lookup}
	/>
	{#if inputError}
		<p class="error" role="alert">{inputError}</p>
	{/if}
	<p class="hint">{t('github.requestsHint', { max: MAX_REQUESTS })}</p>
	{#if rate}
		<GithubRateLimit {rate} />
	{/if}
</section>

{#if searched}
	<div class="sections">
		<GithubSection
			id="profile"
			title={t('github.section.profile')}
			status={profile.status}
			error={profile.error}
		>
			<GithubProfile user={profile.data} />
		</GithubSection>

		{#if profile.status === 'done'}
			<GithubSection
				id="repos"
				title={t('github.section.repos')}
				status={repos.status}
				error={repos.error}
			>
				<GithubRepos repos={repos.data} publicCount={profile.data.public_repos} />
			</GithubSection>

			<div class="columns">
				<GithubSection
					id="emails"
					title={t('github.section.emails')}
					status={emails.status}
					error={emails.error}
				>
					<GithubEmails
						emails={emails.data?.emails ?? []}
						scanned={emails.data?.scanned ?? []}
						commitsPerRepo={COMMITS_PER_REPO}
					/>
				</GithubSection>

				<div class="stack">
					<GithubSection
						id="orgs"
						title={t('github.section.orgs')}
						status={orgs.status}
						error={orgs.error}
					>
						<GithubOrgs orgs={orgs.data} />
					</GithubSection>

					<GithubSection
						id="keys"
						title={t('github.section.keys')}
						status={keys.status}
						error={keys.error}
					>
						<GithubKeys ssh={keys.data.ssh} gpg={keys.data.gpg} />
					</GithubSection>
				</div>
			</div>
		{/if}
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

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.error {
		margin: 0;
		color: var(--color-danger);
	}

	.sections,
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
	}

	.sections {
		margin-top: 1.5rem;
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
	}

	@media (min-width: 64rem) {
		.columns {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
			align-items: start;
		}
	}
</style>
