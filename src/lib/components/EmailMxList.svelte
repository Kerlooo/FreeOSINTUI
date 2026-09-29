<script>
	/** @type {{ mx: { priority: number, host: string }[] }} */
	let { mx } = $props();
</script>

<table>
	<thead>
		<tr>
			<th scope="col">Priority</th>
			<th scope="col">Mail server</th>
		</tr>
	</thead>
	<tbody>
		{#each mx as record (record.priority + record.host)}
			<tr>
				<td>{record.priority}</td>
				<td>{record.host || '(null MX)'}</td>
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
