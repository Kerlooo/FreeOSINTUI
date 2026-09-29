<script>
	import { buildReverseSearchLinks, REVERSE_ENGINES } from '$lib/metadata/reverse.js';

	let imageUrl = $state('');
	let result = $derived(buildReverseSearchLinks(imageUrl));
</script>

<div class="reverse">
	<p class="hint">
		Search engines need the image itself: either upload the file on the engine's page, or give them
		a public URL of the image. Nothing is sent from this page.
	</p>

	<h3>Upload the file on the engine's page</h3>
	<!-- External links only, so resolve() does not apply. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<ul class="links">
		{#each REVERSE_ENGINES as engine (engine.id)}
			<li>
				<a href={engine.uploadUrl} target="_blank" rel="noopener noreferrer">{engine.name} ↗</a>
			</li>
		{/each}
	</ul>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->

	<h3>Search by image URL</h3>
	<label class="visually-hidden" for="reverse-url">Public image URL</label>
	<input
		id="reverse-url"
		type="text"
		bind:value={imageUrl}
		placeholder="https://example.com/photo.jpg"
		autocomplete="off"
		spellcheck="false"
		aria-invalid={result.error ? 'true' : undefined}
	/>
	{#if result.error}
		<p class="error" role="alert">{result.error}</p>
	{:else if result.links.length}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<ul class="links">
			{#each result.links as link (link.id)}
				<li><a href={link.url} target="_blank" rel="noopener noreferrer">{link.name} ↗</a></li>
			{/each}
		</ul>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
</div>

<style>
	.reverse {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	h3 {
		margin: 0.5rem 0 0;
		font-size: 0.95rem;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		display: inline-block;
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--color-text-muted);
		border-radius: var(--radius);
		font-size: 0.85rem;
		text-decoration: none;
	}

	a:hover {
		background: var(--color-text);
		color: var(--color-bg);
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: 0.85rem;
	}
</style>
