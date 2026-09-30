<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { formatTimestamp } from '$lib/headers/format.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ auth: NonNullable<ReturnType<typeof import('$lib/headers/analyze.js').analyzeHeaders>>['auth'] }} */
	let { auth } = $props();

	// Protocol names, shown as they appear in the headers.
	let verdicts = $derived([
		{ method: 'SPF', result: auth.verdict.spf, domain: auth.verdict.spfDomain },
		{ method: 'DKIM', result: auth.verdict.dkim, domain: auth.verdict.dkimDomain },
		{ method: 'DMARC', result: auth.verdict.dmarc, domain: auth.verdict.dmarcDomain },
		{ method: 'ARC', result: auth.verdict.arc, domain: null }
	]);

	let hasAny = $derived(
		auth.authResults.length +
			auth.arcAuthResults.length +
			auth.receivedSpf.length +
			auth.dkimSignatures.length +
			auth.arcSeals.length >
			0
	);

	/** @param {string | null} result */
	function tone(result) {
		if (result === 'pass') return 'pass';
		if (result && ['fail', 'softfail', 'permerror', 'policy'].includes(result)) return 'fail';
		return 'neutral';
	}

	/** @param {import('$lib/headers/auth.js').AuthResult} result */
	function propsText(result) {
		return Object.entries(result.props)
			.map(([key, value]) => `${key}=${value}`)
			.join(' ');
	}
</script>

<ul class="verdicts">
	{#each verdicts as verdict (verdict.method)}
		<li class={tone(verdict.result)}>
			<span class="method">{verdict.method}</span>
			<span class="result">{verdict.result ?? t('headers.authNotReported')}</span>
			{#if verdict.domain}<span class="domain">{verdict.domain}</span>{/if}
		</li>
	{/each}
</ul>
<p class="hint">{t('headers.authVerdictNote')}</p>

{#if !hasAny}
	<p class="hint">{t('headers.authNone')}</p>
{/if}

{#each [{ list: auth.authResults, arc: false }, { list: auth.arcAuthResults, arc: true }] as group (group.arc)}
	{#if group.list.length}
		<h4>{group.arc ? t('headers.authArcResultsHeading') : t('headers.authResultsHeading')}</h4>
		{#each group.list as header, index (index)}
			<div class="block">
				<p class="server">
					{header.authservId
						? t('headers.authServer', { server: header.authservId })
						: t('headers.authServerUnknown')}
					{#if header.instance !== null}· {t('headers.authInstance', {
							number: header.instance
						})}{/if}
					{#if !group.arc}
						· {index === 0 ? t('headers.authTopmost') : t('headers.authLower')}
					{/if}
				</p>
				<ul class="results">
					{#each header.results as result, i (i)}
						<li>
							<span class={['pill', tone(result.result)]}>{result.method}={result.result}</span>
							<span class="props">{propsText(result)}</span>
							{#if result.comment}<span class="comment">({result.comment})</span>{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	{/if}
{/each}

{#if auth.receivedSpf.length}
	<h4>{t('headers.receivedSpfHeading')}</h4>
	{#each auth.receivedSpf as spf, index (index)}
		<div class="block">
			<p>
				<span class={['pill', tone(spf.result)]}>{spf.result}</span>
				{#if spf.comment}<span class="comment">{spf.comment}</span>{/if}
			</p>
			{#if Object.keys(spf.props).length}
				<KeyValueTable
					rows={Object.entries(spf.props).map(([label, value]) => ({ label, value }))}
				/>
			{/if}
		</div>
	{/each}
{/if}

{#if auth.dkimSignatures.length}
	<h4>{t('headers.dkimHeading')}</h4>
	{#each auth.dkimSignatures as signature, index (index)}
		<div class="block">
			<KeyValueTable
				rows={[
					{ label: t('headers.dkim.domain'), value: signature.domain },
					{ label: t('headers.dkim.selector'), value: signature.selector },
					{ label: t('headers.dkim.algorithm'), value: signature.algorithm },
					{ label: t('headers.dkim.canonicalization'), value: signature.canonicalization },
					{ label: t('headers.dkim.identity'), value: signature.identity },
					{ label: t('headers.dkim.headers'), value: signature.headers.join(', ') },
					{
						label: t('headers.dkim.timestamp'),
						value: signature.timestamp !== null ? formatTimestamp(signature.timestamp) : null
					},
					{
						label: t('headers.dkim.expiration'),
						value: signature.expiration !== null ? formatTimestamp(signature.expiration) : null
					}
				]}
			/>
		</div>
	{/each}
{/if}

{#if auth.arcSeals.length || auth.arcMessageSignatures.length}
	<h4>{t('headers.arcHeading')}</h4>
	{#each [{ name: 'ARC-Seal', list: auth.arcSeals }, { name: 'ARC-Message-Signature', list: auth.arcMessageSignatures }] as group (group.name)}
		{#each group.list as tags, index (index)}
			<div class="block">
				<p class="server">{group.name}</p>
				<KeyValueTable
					rows={[
						{ label: t('headers.arc.instance'), value: tags.instance },
						{ label: t('headers.arc.domain'), value: tags.domain },
						{ label: t('headers.arc.selector'), value: tags.selector },
						{ label: t('headers.dkim.algorithm'), value: tags.algorithm },
						{ label: t('headers.arc.cv'), value: tags.chainValidation }
					]}
				/>
			</div>
		{/each}
	{/each}
{/if}

<style>
	.verdicts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.verdicts li {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow-wrap: anywhere;
	}

	.verdicts li.pass {
		border-color: var(--color-text);
	}

	.verdicts li.fail {
		border-color: var(--color-danger);
	}

	.method {
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	.result {
		font-weight: 700;
	}

	.fail .result,
	.pill.fail {
		color: var(--color-danger);
	}

	.neutral .result,
	.pill.neutral {
		color: var(--color-text-dim);
	}

	.domain {
		color: var(--color-text-dim);
		font-size: 0.8rem;
	}

	h4 {
		margin: 0.5rem 0 0;
		font-size: 0.95rem;
	}

	.block {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.block p {
		margin: 0 0 0.3rem;
	}

	.server,
	.hint,
	.comment,
	.props {
		color: var(--color-text-dim);
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.pill {
		margin-right: 0.4rem;
		font-weight: 700;
	}

	.comment {
		margin-left: 0.3rem;
	}
</style>
