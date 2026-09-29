<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { counterLabel, typeLabel } from '$lib/telegram/validate.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/**
	 * @type {{ profile: { username: string, url: string, type: string, title: string, verified: boolean, description: string | null, image: string | null, extra: string[], counters: Record<string, string> } }}
	 */
	let { profile } = $props();

	let rows = $derived([
		{ label: t('telegram.row.type'), value: typeLabel(profile.type) },
		{ label: t('telegram.row.username'), value: `@${profile.username}` },
		{ label: t('telegram.row.link'), value: profile.url, href: profile.url },
		...profile.extra.map((value, i) => ({
			label: i ? t('telegram.row.infoN', { n: i + 1 }) : t('telegram.row.info'),
			value
		})),
		...Object.entries(profile.counters).map(([label, value]) => ({
			label: counterLabel(label),
			value
		}))
	]);
</script>

<article class="card">
	<header>
		{#if profile.image}
			<img src={profile.image} alt="" referrerpolicy="no-referrer" width="96" height="96" />
		{/if}
		<div>
			<h2>
				{profile.title}
				{#if profile.verified}<span class="verified" title={t('telegram.verified')}>✔</span>{/if}
			</h2>
			<p class="handle">
				@{profile.username}
				<CopyButton value={profile.username} label={t('telegram.copyUsername')} />
			</p>
		</div>
	</header>

	{#if profile.description}
		<p class="description">{profile.description}</p>
	{/if}

	<KeyValueTable {rows} />
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	header {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 0;
	}

	header div {
		min-width: 0;
	}

	img {
		flex-shrink: 0;
		border-radius: 50%;
		border: 1px solid var(--color-border);
		object-fit: cover;
	}

	h2 {
		margin: 0 0 0.25rem;
		font-size: 1.3rem;
		overflow-wrap: anywhere;
	}

	.verified {
		color: var(--color-text-dim);
		font-size: 1rem;
	}

	.handle {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		color: var(--color-text-dim);
	}

	.description {
		margin: 0;
		white-space: pre-line;
		overflow-wrap: anywhere;
		font-size: 0.9rem;
	}

	@media (max-width: 36rem) {
		img {
			width: 64px;
			height: 64px;
		}
	}
</style>
