<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/github/analyze.js';

	/** @type {{ emails: import('$lib/github/analyze.js').EmailSummary[], scanned: string[], commitsPerRepo: number }} */
	let { emails, scanned, commitsPerRepo } = $props();
</script>

{#if scanned.length === 0}
	<p class="hint">No non-fork repositories with commits to scan.</p>
{:else}
	<p class="hint">
		Scanned the last {commitsPerRepo} commits of: {scanned.join(', ')}.
	</p>
	{#if emails.length === 0}
		<p class="hint">No commit emails found for this user in these repositories.</p>
	{:else}
		<!-- External links only, so resolve() does not apply. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<ul>
			{#each emails as entry (entry.email)}
				<li>
					<div class="head">
						<code>{entry.email}</code>
						<CopyButton value={entry.email} label="Copy email" />
					</div>
					<div class="tags">
						{#if entry.noreply}
							<span class="tag">noreply (hidden address)</span>
						{/if}
						{#if entry.linked}
							<span class="tag strong">linked to this account</span>
						{:else}
							<span class="tag">not linked to any account</span>
						{/if}
					</div>
					<p class="meta">
						{#if entry.names.length}Names: {entry.names.join(', ')} ·
						{/if}
						{entry.commits}
						{entry.commits === 1 ? 'occurrence' : 'occurrences'} in {entry.repos.join(', ')}
						{#if entry.lastSeen}· last {formatDate(entry.lastSeen)}{/if}
						{#if entry.url}
							· <a href={entry.url} target="_blank" rel="noopener noreferrer">commit ↗</a>
						{/if}
					</p>
				</li>
			{/each}
		</ul>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
{/if}
<p class="hint">
	Commit emails are personal data: use them only for legitimate purposes. Emails "not linked to any
	account" appear in this user's repositories but GitHub could not attribute them, so they may
	belong to someone else.
</p>

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
