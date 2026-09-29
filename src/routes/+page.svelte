<script>
	import ToolCard from '$lib/components/ToolCard.svelte';
	import { TOOLS, toolsByCategory } from '$lib/tools.js';

	const groups = toolsByCategory();
</script>

<svelte:head>
	<title>FreeOSINT-UI — Free OSINT tools</title>
	<meta
		name="description"
		content="Free OSINT tools: Google dorks, username, email, phone, domain and IP analysis, breach check, metadata extractor, hash checker and more."
	/>
</svelte:head>

<section class="hero">
	<h1>
		<span class="prompt" aria-hidden="true">&gt;</span> FreeOSINT-UI<span
			class="cursor"
			aria-hidden="true">_</span
		>
	</h1>
	<p>
		Free OSINT tools, from the simplest to the most advanced. No account, no paywall: everything
		runs in your browser and nothing is sent to a server.
	</p>
</section>

<section aria-labelledby="tools-heading">
	<h2 id="tools-heading">Tools <span class="count">({TOOLS.length})</span></h2>
	{#each groups as group (group.id)}
		<section class="category" aria-labelledby={`category-${group.id}`}>
			<h3 id={`category-${group.id}`}>{group.label}</h3>
			<ul class="grid">
				{#each group.tools as tool (tool.id)}
					<li><ToolCard {tool} /></li>
				{/each}
			</ul>
		</section>
	{/each}
</section>

<style>
	.hero {
		padding: 2rem 0 3rem;
	}

	h1 {
		margin: 0 0 1rem;
		font-size: clamp(2rem, 6vw, 3.5rem);
	}

	.prompt {
		color: var(--color-text-dim);
	}

	.cursor {
		animation: blink 1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cursor {
			animation: none;
		}
	}

	.hero p {
		max-width: 44rem;
		margin: 0;
		color: var(--color-text-dim);
	}

	h2 {
		font-size: 1.3rem;
	}

	.count {
		color: var(--color-text-muted);
	}

	.category + .category {
		margin-top: 2rem;
	}

	h3 {
		margin: 0 0 0.75rem;
		color: var(--color-text-dim);
		font-size: 0.95rem;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-shadow: none;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
