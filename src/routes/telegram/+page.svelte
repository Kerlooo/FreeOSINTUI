<script>
	import PageMeta from '$lib/components/PageMeta.svelte';
	import ToolHeader from '$lib/components/ToolHeader.svelte';
	import LookupForm from '$lib/components/LookupForm.svelte';
	import TelegramProfileCard from '$lib/components/TelegramProfileCard.svelte';
	import TelegramPostList from '$lib/components/TelegramPostList.svelte';
	import { ApiError, BACKEND_START_COMMAND, apiGet } from '$lib/api.js';
	import { normalizeTelegramUsername } from '$lib/telegram/validate.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	let input = $state('');
	let busy = $state(false);
	let error = $state('');
	let backendDown = $state(false);
	/** @type {any} */
	let profile = $state(null);
	/** @type {AbortController | null} */
	let controller = null;

	/** @param {string} value */
	async function lookup(value) {
		const { value: username, error: invalid } = normalizeTelegramUsername(value);
		error = invalid ?? '';
		backendDown = false;
		profile = null;
		if (invalid) return;

		controller?.abort();
		const current = new AbortController();
		controller = current;
		busy = true;
		try {
			profile = await apiGet(`/api/telegram/${encodeURIComponent(username)}`, {
				signal: current.signal
			});
		} catch (e) {
			if (current.signal.aborted) return;
			if (e instanceof ApiError && e.unreachable) backendDown = true;
			else error = e instanceof Error ? e.message : String(e);
		} finally {
			if (controller === current) {
				busy = false;
				controller = null;
			}
		}
	}
</script>

<PageMeta
	title="{t('tools.telegram.name')} — FreeOSINT-UI"
	description={t('telegram.metaDescription')}
/>

<ToolHeader title={t('tools.telegram.name')} description={t('telegram.description')} />

<section class="panel" aria-labelledby="telegram-heading">
	<h2 id="telegram-heading">{t('telegram.heading')}</h2>
	<LookupForm
		bind:value={input}
		label={t('telegram.inputLabel')}
		placeholder={t('telegram.placeholder')}
		{busy}
		onsubmit={lookup}
	/>
	{#if backendDown}
		<div class="notice" role="alert">
			<p>
				<strong>{t('backend.down')}</strong>
				{t('backend.needed')}
			</p>
			<code>{BACKEND_START_COMMAND}</code>
		</div>
	{:else if error}
		<p class="error" role="alert">{error}</p>
	{:else}
		<p>{t('telegram.intro')}</p>
	{/if}
</section>

{#if profile}
	<div class="result" aria-live="polite">
		{#if profile.exists}
			<TelegramProfileCard {profile} />
			{#if profile.posts.length}
				<TelegramPostList posts={profile.posts} />
			{:else if profile.type === 'channel'}
				<p class="muted">{t('telegram.noPosts')}</p>
			{/if}
		{:else}
			<div class="panel">
				<p>
					<strong>@{profile.username}</strong>
					{t('telegram.notFound')}
				</p>
				<!-- External t.me URL, so resolve() does not apply. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a href={profile.url} target="_blank" rel="noopener noreferrer"
					>{t('telegram.open', { url: profile.url })}</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
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

	.panel a {
		overflow-wrap: anywhere;
		font-size: 0.9rem;
	}

	.notice {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
	}

	.notice p {
		color: var(--color-text);
	}

	.notice p strong {
		color: var(--color-danger);
	}

	code {
		max-width: 100%;
		padding: 0.4rem 0.6rem;
		background: var(--color-surface);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.result {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.muted {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}
</style>
