<script>
	import { formatDate as formatLocalDate, t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ posts: { id: string, url: string | null, date: string | null, views: string | null, text: string, media: boolean }[] }} */
	let { posts } = $props();

	/** @param {string | null} iso */
	function formatDate(iso) {
		if (!iso) return '';
		const date = new Date(iso);
		return Number.isNaN(date.getTime()) ? iso : formatLocalDate(date);
	}
</script>

<section aria-labelledby="telegram-posts-heading">
	<h2 id="telegram-posts-heading">{t('telegram.postsHeading', { count: posts.length })}</h2>
	<ol>
		{#each posts as post (post.id)}
			<li>
				<div class="meta">
					{#if post.date}<time datetime={post.date}>{formatDate(post.date)}</time>{/if}
					{#if post.views}<span>{t('telegram.views', { views: post.views })}</span>{/if}
					{#if post.media}<span>{t('telegram.media')}</span>{/if}
					{#if post.url}
						<!-- External t.me URL, so resolve() does not apply. -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a href={post.url} target="_blank" rel="noopener noreferrer">{t('telegram.openPost')}</a
						>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
				</div>
				{#if post.text}
					<p>{post.text}</p>
				{:else}
					<p class="empty">{t('telegram.mediaOnly')}</p>
				{/if}
			</li>
		{/each}
	</ol>
</section>

<style>
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.15rem;
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.meta a {
		margin-left: auto;
	}

	p {
		margin: 0.5rem 0 0;
		white-space: pre-line;
		overflow-wrap: anywhere;
		font-size: 0.875rem;
	}

	p.empty {
		color: var(--color-text-muted);
	}
</style>
