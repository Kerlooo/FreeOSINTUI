<script>
	/** @type {{ orgs: any[] }} */
	let { orgs } = $props();
</script>

{#if orgs.length}
	<!-- External links only, so resolve() does not apply. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<ul>
		{#each orgs as org (org.id)}
			<li>
				<img src={org.avatar_url} alt="" width="32" height="32" loading="lazy" />
				<div>
					<a href={`https://github.com/${org.login}`} target="_blank" rel="noopener noreferrer"
						>{org.login}</a
					>
					{#if org.description}<p>{org.description}</p>{/if}
				</div>
			</li>
		{/each}
	</ul>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<p class="hint">No public organization memberships.</p>
{/if}
<p class="hint">Only memberships the user made public are listed.</p>

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		overflow-wrap: anywhere;
	}

	img {
		flex: none;
		border-radius: var(--radius);
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}

	.hint {
		font-size: 0.8rem;
	}
</style>
