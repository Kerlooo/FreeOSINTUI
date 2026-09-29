<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';

	/**
	 * @type {{ auth: { spf: any, dmarc: any }, findings: { level: 'good' | 'warn' | 'bad' | 'info', text: string }[] }}
	 */
	let { auth, findings } = $props();

	const LABELS = { good: 'OK', warn: 'WEAK', bad: 'RISK', info: 'NOTE' };
	const SPF_ALL = {
		fail: '-all (fail)',
		softfail: '~all (softfail)',
		neutral: '?all (neutral)',
		pass: '+all (pass)'
	};

	let spfRows = $derived(
		auth.spf
			? [
					{ label: 'Record', value: auth.spf.record },
					{ label: '"all" policy', value: SPF_ALL[auth.spf.allPolicy] ?? 'none' },
					{ label: 'Includes', value: auth.spf.includes.join(', ') }
				]
			: []
	);

	let dmarcRows = $derived(
		auth.dmarc
			? [
					{ label: 'Record', value: auth.dmarc.record },
					{ label: 'Policy (p)', value: auth.dmarc.policy ?? 'missing' },
					{ label: 'Subdomain policy (sp)', value: auth.dmarc.subdomainPolicy },
					{ label: 'Percent (pct)', value: `${auth.dmarc.percent}%` },
					{ label: 'Reports (rua)', value: auth.dmarc.reports.join(', ') }
				]
			: []
	);
</script>

<ul class="findings">
	{#each findings as finding (finding.text)}
		<li class={finding.level}>
			<span class="badge">{LABELS[finding.level]}</span>
			<span>{finding.text}</span>
		</li>
	{/each}
</ul>

<div class="records">
	<div>
		<h3>SPF</h3>
		{#if auth.spf}
			<KeyValueTable rows={spfRows} />
		{:else}
			<p>No SPF record (TXT "v=spf1").</p>
		{/if}
	</div>
	<div>
		<h3>DMARC</h3>
		{#if auth.dmarc}
			<KeyValueTable rows={dmarcRows} />
		{:else}
			<p>No DMARC record (TXT at _dmarc).</p>
		{/if}
	</div>
</div>

<style>
	.findings {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.875rem;
	}

	li {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		overflow-wrap: anywhere;
	}

	.badge {
		flex-shrink: 0;
		min-width: 3.5rem;
		padding: 0 0.4rem;
		border: 1px solid currentColor;
		border-radius: var(--radius);
		font-size: 0.75rem;
		font-weight: 700;
		text-align: center;
	}

	.good .badge {
		color: var(--color-text);
	}

	.warn .badge,
	.info .badge {
		color: var(--color-text-dim);
	}

	.bad .badge {
		color: var(--color-danger);
	}

	.records {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: 1rem;
	}

	.records > div {
		min-width: 0;
	}

	h3 {
		margin: 0 0 0.35rem;
		font-size: 0.95rem;
		text-shadow: none;
	}

	p {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
	}
</style>
