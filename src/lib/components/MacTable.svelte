<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ rows: { input: string, mac: string | null, vendor: string, flags: string[] }[] }} */
	let { rows } = $props();
</script>

<div class="scroll">
	<table>
		<thead>
			<tr>
				<th scope="col">{t('mac.table.mac')}</th>
				<th scope="col">{t('mac.table.vendor')}</th>
				<th scope="col">{t('mac.table.flags')}</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row, index (index)}
				<tr class:invalid={!row.mac}>
					<td><code>{row.mac ?? row.input}</code></td>
					<td>{row.vendor}</td>
					<td>{row.flags.join(', ')}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.scroll {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: 0.45rem 0.6rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
		overflow-wrap: anywhere;
	}

	th {
		color: var(--color-text-dim);
		font-weight: normal;
	}

	code {
		font-family: var(--font-mono);
	}

	.invalid td {
		color: var(--color-danger);
	}
</style>
