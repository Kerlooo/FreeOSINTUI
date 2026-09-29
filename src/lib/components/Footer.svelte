<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	const GITHUB_URL = 'https://github.com/Kerlooo';
	const LINKEDIN_URL = 'https://www.linkedin.com/in/carlo-scaglione/';
</script>

<footer>
	<div class="inner">
		<p>{t('nav.footerAbout')}</p>
		<p class="credits">
			{t('nav.inspiredBy')}
			<a href="https://osint-ui.com/" target="_blank" rel="noopener noreferrer">OSINT-UI</a>.
		</p>
		<ul>
			<li><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a></li>
			<li><a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
		</ul>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--color-border);
		color: var(--color-text-dim);
		font-size: 0.875rem;
	}

	.inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		max-width: var(--content-width);
		margin: 0 auto;
		padding: 1.25rem 1rem;
	}

	p {
		margin: 0;
	}

	.credits a {
		color: var(--color-text-dim);
	}

	ul {
		display: flex;
		gap: 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a:hover {
		color: var(--color-text);
	}
</style>
