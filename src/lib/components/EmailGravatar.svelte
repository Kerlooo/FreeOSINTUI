<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * @type {{ gravatar: { hash: string, avatarUrl: string, profile: ReturnType<typeof import('$lib/email/gravatar.js').summarizeGravatarProfile> | null } }}
	 */
	let { gravatar } = $props();

	// The parent re-creates this component for each address, which resets this state.
	/** @type {'loading' | 'loaded' | 'missing'} */
	let avatar = $state('loading');

	let profile = $derived(gravatar.profile);
</script>

<div class="gravatar">
	<div class="avatar">
		<img
			src={gravatar.avatarUrl}
			alt={t('email.gravatar.avatarAlt')}
			width="120"
			height="120"
			class:hidden={avatar !== 'loaded'}
			onload={() => (avatar = 'loaded')}
			onerror={() => (avatar = 'missing')}
		/>
		{#if avatar === 'missing'}
			<p>{t('email.gravatar.noAvatar')}</p>
		{:else if avatar === 'loading'}
			<p>{t('email.gravatar.loadingAvatar')}</p>
		{/if}
	</div>

	<div class="details">
		<KeyValueTable
			rows={[
				{ label: 'SHA-256', value: gravatar.hash },
				{ label: t('email.gravatar.name'), value: profile?.displayName },
				{
					label: t('email.gravatar.profile'),
					value: profile?.profileUrl,
					href: profile?.profileUrl ?? undefined
				},
				{ label: t('email.gravatar.location'), value: profile?.location },
				{ label: t('email.gravatar.jobTitle'), value: profile?.jobTitle },
				{ label: t('email.gravatar.company'), value: profile?.company },
				{ label: t('email.gravatar.pronouns'), value: profile?.pronouns },
				{ label: t('email.gravatar.about'), value: profile?.description }
			]}
		/>
		{#if profile?.accounts.length}
			<h3>{t('email.gravatar.accounts')}</h3>
			<ul>
				{#each profile.accounts as account (account.url)}
					<li>
						{account.label}:
						<!-- External profile URL, so resolve() does not apply. -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a href={account.url} target="_blank" rel="noopener noreferrer">{account.url}</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
		{/if}
		{#if !profile}
			<p>{t('email.gravatar.noProfile')}</p>
		{/if}
	</div>
</div>

<style>
	.gravatar {
		display: grid;
		grid-template-columns: 8rem minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}

	img {
		display: block;
		width: 120px;
		height: 120px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	img.hidden {
		display: none;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}

	h3 {
		margin: 0;
		font-size: 0.95rem;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.875rem;
	}

	li,
	p {
		overflow-wrap: anywhere;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.875rem;
	}

	@media (max-width: 36rem) {
		.gravatar {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
