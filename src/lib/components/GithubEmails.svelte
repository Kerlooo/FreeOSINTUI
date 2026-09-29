<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/github/analyze.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ emails: import('$lib/github/analyze.js').EmailSummary[], scanned: string[], commitsPerRepo: number }} */
	let { emails, scanned, commitsPerRepo } = $props();
</script>

{#if scanned.length === 0}
	<p class="hint">{t('github.emails.noRepos')}</p>
{:else}
	<p class="hint">
		{t('github.emails.scanned', { count: commitsPerRepo, repos: scanned.join(', ') })}
	</p>
	{#if emails.length === 0}
		<p class="hint">{t('github.emails.none')}</p>
	{:else}
		<!-- External links only, so resolve() does not apply. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<ul>
			{#each emails as entry (entry.email)}
				<li>
					<div class="head">
						<code>{entry.email}</code>
						<CopyButton value={entry.email} label={t('github.emails.copy')} />
					</div>
					<div class="tags">
						{#if entry.noreply}
							<span class="tag">{t('github.emails.noreply')}</span>
						{/if}
						{#if entry.linked}
							<span class="tag strong">{t('github.emails.linked')}</span>
						{:else}
							<span class="tag">{t('github.emails.unlinked')}</span>
						{/if}
					</div>
					<p class="meta">
						{#if entry.names.length}{t('github.emails.names', { names: entry.names.join(', ') })} ·
						{/if}
						{t('github.emails.occurrences', {
							count: entry.commits,
							repos: entry.repos.join(', ')
						})}
						{#if entry.lastSeen}· {t('github.emails.last', {
								date: formatDate(entry.lastSeen)
							})}{/if}
						{#if entry.url}
							· <a href={entry.url} target="_blank" rel="noopener noreferrer"
								>{t('github.emails.commit')} ↗</a
							>
						{/if}
					</p>
				</li>
			{/each}
		</ul>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
{/if}
<p class="hint">{t('github.emails.note')}</p>

<style>
	ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	code {
		font-family: var(--font-mono);
		font-weight: 700;
		overflow-wrap: anywhere;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.tag {
		padding: 0.1rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.75rem;
	}

	.tag.strong {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	.meta,
	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}
</style>
