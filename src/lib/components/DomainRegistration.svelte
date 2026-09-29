<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { formatDate } from '$lib/domain/normalize.js';

	/** @type {{ rdap: ReturnType<typeof import('$lib/rdap.js').summarizeRdap> | null, domain: string }} */
	let { rdap, domain } = $props();

	let rows = $derived(
		rdap
			? [
					{ label: 'Domain', value: rdap.name },
					{ label: 'Registrar', value: rdap.registrar },
					{ label: 'Registered', value: formatDate(rdap.registered) },
					{ label: 'Expires', value: formatDate(rdap.expires) },
					{ label: 'Last changed', value: formatDate(rdap.updated) },
					{ label: 'Status', value: rdap.status.join(', ') },
					{ label: 'Nameservers', value: rdap.nameservers.join(', ') },
					{
						label: 'DNSSEC',
						value: rdap.dnssec === null ? null : rdap.dnssec ? 'signed' : 'not signed'
					}
				]
			: []
	);

	let contactRows = $derived(
		(rdap?.contacts ?? []).map((contact, index) => ({
			label: contact.roles.join(', ') || `contact ${index + 1}`,
			value: [contact.name, contact.email && `<${contact.email}>`].filter(Boolean).join(' ')
		}))
	);
</script>

{#if rdap}
	<KeyValueTable {rows} />
	{#if contactRows.length}
		<h3>Contacts</h3>
		<KeyValueTable rows={contactRows} />
		<p class="note">Most registries redact personal contact data (GDPR).</p>
	{/if}
{:else}
	<p class="note">
		No RDAP record found for <strong>{domain}</strong>. Its TLD may not offer RDAP (many country
		codes, e.g. .it, don't), the domain may be unregistered, or it is a subdomain: try the parent
		domain.
	</p>
{/if}

<style>
	h3 {
		margin: 0.5rem 0 0;
		font-size: 0.95rem;
		text-shadow: none;
	}

	.note {
		margin: 0;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	strong {
		color: var(--color-text);
	}
</style>
