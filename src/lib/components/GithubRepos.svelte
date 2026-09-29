<script>
	import { formatDate, summarizeRepos } from '$lib/github/analyze.js';
	import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ repos: any[], publicCount?: number }} */
	let { repos, publicCount } = $props();

	let summary = $derived(summarizeRepos(repos));
</script>

{#if repos.length === 0}
	<p class="hint">{t('github.repos.none')}</p>
{:else}
	<ul class="stats">
		<li>
			<strong>{formatNumber(summary.total)}</strong>
			{t('github.repos.total', { count: summary.total })}
		</li>
		<li>
			<strong>{formatNumber(summary.sources)}</strong>
			{t('github.repos.sources', { count: summary.sources })}
		</li>
		<li>
			<strong>{formatNumber(summary.forks)}</strong>
			{t('github.repos.forks', { count: summary.forks })}
		</li>
		<li>
			<strong>{formatNumber(summary.archived)}</strong>
			{t('github.repos.archived', { count: summary.archived })}
		</li>
		<li>
			<strong>{formatNumber(summary.stars)}</strong>
			{t('github.repos.stars', { count: summary.stars })}
		</li>
	</ul>
	{#if publicCount && publicCount > repos.length}
		<p class="hint">
			{t('github.repos.partial', { shown: repos.length, total: formatNumber(publicCount) })}
		</p>
	{/if}

	{#if summary.languages.length}
		<h3>
			{t('github.repos.languages')} <span class="hint">{t('github.repos.languagesHint')}</span>
		</h3>
		<ul class="bars">
			{#each summary.languages.slice(0, 8) as language (language.name)}
				<li>
					<span class="name">{language.name}</span>
					<span class="track"><span class="bar" style:width={`${language.percent}%`}></span></span>
					<span class="value">{language.count} · {language.percent}%</span>
				</li>
			{/each}
		</ul>
	{/if}

	{#if summary.topics.length}
		<h3>{t('github.repos.topics')}</h3>
		<p class="topics">
			{#each summary.topics as topic (topic.name)}
				<span>{topic.name} ({topic.count})</span>
			{/each}
		</p>
	{/if}

	<!-- External links only, so resolve() does not apply. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	{#if summary.mostStarred.length}
		<h3>{t('github.repos.mostStarred')}</h3>
		<ul class="starred">
			{#each summary.mostStarred as repo (repo.id)}
				<li>
					<a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
					<span class="hint">★ {formatNumber(repo.stargazers_count)}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<h3>{t('github.repos.recent')}</h3>
	<div class="table">
		<table>
			<thead>
				<tr>
					<th>{t('github.repos.colRepo')}</th>
					<th>{t('github.repos.colLanguage')}</th>
					<th>★</th>
					<th>{t('github.repos.colPush')}</th>
				</tr>
			</thead>
			<tbody>
				{#each summary.recent as repo (repo.id)}
					<tr>
						<td>
							<a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
							{#if repo.fork}<span class="tag">{t('github.repos.fork')}</span>{/if}
							{#if repo.archived}<span class="tag">{t('github.repos.archivedTag')}</span>{/if}
							{#if repo.description}<span class="desc">{repo.description}</span>{/if}
						</td>
						<td>{repo.language ?? '—'}</td>
						<td>{formatNumber(repo.stargazers_count)}</td>
						<td class="date">{formatDate(repo.pushed_at).slice(0, 10)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/if}

<style>
	h3 {
		margin: 0.5rem 0 0;
		font-size: 0.95rem;
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		font-weight: 400;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--color-text-dim);
	}

	.stats strong {
		color: var(--color-text);
	}

	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
	}

	.bars li {
		display: grid;
		grid-template-columns: minmax(5rem, 9rem) minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.75rem;
	}

	.name {
		overflow-wrap: anywhere;
	}

	.track {
		height: 0.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.bar {
		display: block;
		height: 100%;
		background: var(--color-text);
	}

	.value {
		color: var(--color-text-dim);
		white-space: nowrap;
	}

	.topics {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		font-size: 0.8rem;
	}

	.topics span,
	.tag {
		padding: 0.1rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
	}

	.tag {
		margin-left: 0.4rem;
		font-size: 0.75rem;
	}

	.starred {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		overflow-wrap: anywhere;
	}

	.table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	th,
	td {
		padding: 0.45rem 0.6rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	th {
		color: var(--color-text-dim);
		font-weight: 400;
	}

	td:first-child {
		overflow-wrap: anywhere;
	}

	.desc {
		display: block;
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.date {
		white-space: nowrap;
	}

	@media (max-width: 36rem) {
		th:nth-child(2),
		td:nth-child(2) {
			display: none;
		}
	}
</style>
