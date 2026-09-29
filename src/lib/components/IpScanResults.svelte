<script>
	/**
	 * Shodan InternetDB data: open ports, hostnames, CPEs, tags and CVEs.
	 * @type {{ data: { ports: { port: number, service: string | null }[], hostnames: string[], cpes: string[], tags: string[], vulns: string[] } }}
	 */
	let { data } = $props();
</script>

<div class="scan">
	<div class="group">
		<h3>Open ports ({data.ports.length})</h3>
		{#if data.ports.length}
			<ul class="chips">
				{#each data.ports as { port, service } (port)}
					<li>
						<strong>{port}</strong>
						{#if service}<span class="dim">{service}</span>{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p>None seen.</p>
		{/if}
	</div>

	<div class="group">
		<h3>Vulnerabilities ({data.vulns.length})</h3>
		{#if data.vulns.length}
			<p class="hint">Matched from software versions, not confirmed: the service may be patched.</p>
			<ul class="chips">
				{#each data.vulns as cve (cve)}
					<li>
						<!-- External NVD link, so resolve() does not apply. -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cve)}`}
							target="_blank"
							rel="noopener noreferrer">{cve}</a
						>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
		{:else}
			<p>None listed.</p>
		{/if}
	</div>

	{#if data.hostnames.length}
		<div class="group">
			<h3>Hostnames ({data.hostnames.length})</h3>
			<ul class="list">
				{#each data.hostnames as hostname (hostname)}
					<li>{hostname}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.cpes.length}
		<div class="group">
			<h3>Software (CPE)</h3>
			<ul class="list">
				{#each data.cpes as cpe (cpe)}
					<li><code>{cpe}</code></li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.tags.length}
		<div class="group">
			<h3>Tags</h3>
			<ul class="chips">
				{#each data.tags as tag (tag)}
					<li>{tag}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.scan {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.95rem;
		color: var(--color-text-dim);
		text-shadow: none;
	}

	p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-dim);
	}

	.hint {
		margin-bottom: 0.5rem;
		font-size: 0.8rem;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chips li {
		padding: 0.2rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.dim {
		color: var(--color-text-dim);
	}

	.list li {
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	code {
		font-family: var(--font-mono);
		color: var(--color-text-dim);
	}
</style>
