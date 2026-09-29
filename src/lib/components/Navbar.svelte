<script>
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { toolsByCategory } from '$lib/tools.js';
	import { t } from '$lib/i18n/i18n.svelte.js';
	import LanguageSwitch from './LanguageSwitch.svelte';
	import NavbarClock from './NavbarClock.svelte';

	const groups = toolsByCategory();

	let menuOpen = $state(false);
	/** @type {HTMLDetailsElement | undefined} */
	let menu = $state();

	afterNavigate(() => (menuOpen = false));

	/** Closes the menu on outside click or Escape. */
	function handleWindowClick(/** @type {MouseEvent} */ event) {
		if (menuOpen && menu && !menu.contains(/** @type {Node} */ (event.target))) menuOpen = false;
	}
</script>

<svelte:window
	onclick={handleWindowClick}
	onkeydown={(event) => event.key === 'Escape' && (menuOpen = false)}
/>

<header>
	<nav aria-label={t('nav.main')}>
		<a class="brand" href={resolve('/')}>
			<span aria-hidden="true">&gt;_</span> FreeOSINT-UI
		</a>
		<ul class="top">
			<li>
				<NavbarClock />
			</li>
			<li>
				<a href={resolve('/')} aria-current={page.url.pathname === '/' ? 'page' : undefined}
					>{t('nav.home')}</a
				>
			</li>
			<li>
				<details bind:this={menu} bind:open={menuOpen}>
					<summary>{t('nav.tools')}</summary>
					<div class="menu">
						{#each groups as group (group.id)}
							<div class="group">
								<span class="group-label">{group.label}</span>
								<ul>
									{#each group.tools as tool (tool.id)}
										<li>
											<a
												href={resolve(tool.route)}
												aria-current={page.url.pathname.startsWith(tool.route) ? 'page' : undefined}
											>
												{tool.name}
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				</details>
			</li>
			<li>
				<LanguageSwitch />
			</li>
		</ul>
	</nav>
</header>

<style>
	header {
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	nav {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		max-width: var(--content-width);
		margin: 0 auto;
		padding: 0.9rem 1rem;
	}

	.brand {
		font-weight: 700;
		font-size: 1.15rem;
		text-decoration: none;
		text-shadow: 0 0 8px var(--color-text-muted);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.top {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	a,
	summary {
		color: var(--color-text-dim);
		text-decoration: none;
		cursor: pointer;
	}

	a:hover,
	summary:hover,
	a[aria-current='page'],
	details[open] summary {
		color: var(--color-text);
	}

	a[aria-current='page']::before {
		content: '> ';
	}

	summary {
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary::after {
		content: ' ▾';
	}

	details[open] summary::after {
		content: ' ▴';
	}

	.menu {
		position: absolute;
		top: 100%;
		right: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
		gap: 1.25rem 2rem;
		width: min(44rem, calc(100vw - 2rem));
		max-height: calc(100vh - 5rem);
		overflow-y: auto;
		padding: 1.25rem;
		background: var(--color-bg);
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		box-shadow: 0 0 16px var(--color-text-muted);
	}

	.group-label {
		display: block;
		margin-bottom: 0.4rem;
		color: var(--color-text-muted);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.group li + li {
		margin-top: 0.25rem;
	}
</style>
