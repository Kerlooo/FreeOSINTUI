<script>
	import { summarizeGpgKeys, summarizeSshKeys } from '$lib/github/analyze.js';

	/** @type {{ ssh: any[], gpg: any[] }} */
	let { ssh, gpg } = $props();

	let sshSummary = $derived(summarizeSshKeys(ssh));
	let gpgKeys = $derived(summarizeGpgKeys(gpg));
</script>

<h3>SSH keys ({sshSummary.count})</h3>
{#if sshSummary.count}
	<p class="hint">
		{sshSummary.types.map((item) => `${item.count} × ${item.type}`).join(', ')}
	</p>
	<ul>
		{#each sshSummary.keys as key (key.id)}
			<li>
				<span>{key.type}</span>
				<code>…{key.tail}</code>
				{#if key.created}<span class="hint">added {key.created}</span>{/if}
			</li>
		{/each}
	</ul>
{:else}
	<p class="hint">No public SSH keys.</p>
{/if}

<h3>GPG keys ({gpgKeys.length})</h3>
{#if gpgKeys.length}
	<ul>
		{#each gpgKeys as key (key.id)}
			<li class="gpg">
				<div>
					<code>{key.keyId}</code>
					{#if key.revoked}<span class="tag">revoked</span>{/if}
					{#if key.canSign}<span class="tag">can sign</span>{/if}
				</div>
				<span class="hint"
					>created {key.created} · expires {key.expires} · {key.subkeys} subkeys</span
				>
				{#each key.emails as item (item.email)}
					<span>
						<code>{item.email}</code>
						<span class="tag">{item.verified ? 'verified' : 'unverified'}</span>
					</span>
				{/each}
			</li>
		{/each}
	</ul>
{:else}
	<p class="hint">No public GPG keys.</p>
{/if}
<p class="hint">
	The same key tail on different accounts or servers can link identities. GPG keys often declare
	real email addresses.
</p>

<style>
	h3 {
		margin: 0;
		font-size: 0.95rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--color-border);
		overflow-wrap: anywhere;
	}

	li.gpg {
		flex-direction: column;
	}

	code {
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}

	.tag {
		margin-left: 0.4rem;
		padding: 0.05rem 0.45rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-dim);
		font-size: 0.75rem;
	}

	.hint {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
