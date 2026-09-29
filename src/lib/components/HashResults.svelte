<script>
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { ALGORITHMS } from '$lib/hash/algorithms.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ digests: Record<string, string>, matches?: string[] }} */
	let { digests, matches = [] } = $props();
</script>

<table>
	<thead>
		<tr>
			<th scope="col">{t('hash.results.algorithm')}</th>
			<th scope="col">{t('hash.results.digest')}</th>
			<th scope="col"><span class="visually-hidden">{t('hash.results.actions')}</span></th>
		</tr>
	</thead>
	<tbody>
		{#each ALGORITHMS as algorithm (algorithm.id)}
			<tr class:match={matches.includes(algorithm.id)}>
				<th scope="row">{algorithm.label}</th>
				<td><code>{digests[algorithm.id]}</code></td>
				<td class="action"><CopyButton value={digests[algorithm.id]} label={algorithm.label} /></td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	thead th {
		color: var(--color-text-muted);
		font-weight: 400;
	}

	tbody th {
		white-space: nowrap;
	}

	code {
		font-family: var(--font-mono);
		color: var(--color-text-dim);
		word-break: break-all;
	}

	.action {
		width: 1%;
	}

	tr.match {
		background: var(--color-surface);
	}

	tr.match th::after {
		content: ' ✔';
	}

	tr.match code {
		color: var(--color-text);
	}

	@media (max-width: 36rem) {
		thead {
			display: none;
		}

		tr {
			display: grid;
			grid-template-columns: 1fr auto;
			border-bottom: 1px solid var(--color-border);
		}

		th,
		td {
			border: none;
		}

		td:not(.action) {
			grid-column: 1 / -1;
			grid-row: 2;
			padding-top: 0;
		}

		.action {
			width: auto;
		}
	}
</style>
