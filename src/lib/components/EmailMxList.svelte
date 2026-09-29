<script>
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ mx: { priority: number, host: string }[] }} */
	let { mx } = $props();
</script>

<table>
	<thead>
		<tr>
			<th scope="col">{t('email.mail.priority')}</th>
			<th scope="col">{t('email.mail.server')}</th>
		</tr>
	</thead>
	<tbody>
		{#each mx as record (record.priority + record.host)}
			<tr>
				<td>{record.priority}</td>
				<td>{record.host || t('email.mail.nullMx')}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		table-layout: fixed;
	}

	th {
		color: var(--color-text-dim);
		font-weight: 400;
		text-align: left;
	}

	th:first-child {
		width: 6rem;
	}

	th,
	td {
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		overflow-wrap: anywhere;
	}
</style>
