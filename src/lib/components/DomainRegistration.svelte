<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { formatDate } from '$lib/domain/normalize.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ rdap: ReturnType<typeof import('$lib/rdap.js').summarizeRdap> | null, domain: string }} */
	let { rdap, domain } = $props();

	let rows = $derived(
		rdap
			? [
					{ label: t('domain.rdap.domain'), value: rdap.name },
					{ label: t('domain.rdap.registrar'), value: rdap.registrar },
					{ label: t('domain.rdap.registered'), value: formatDate(rdap.registered) },
					{ label: t('domain.rdap.expires'), value: formatDate(rdap.expires) },
					{ label: t('domain.rdap.updated'), value: formatDate(rdap.updated) },
					{ label: t('domain.rdap.status'), value: rdap.status.join(', ') },
					{ label: t('domain.rdap.nameservers'), value: rdap.nameservers.join(', ') },
					{
						label: t('domain.rdap.dnssec'),
						value:
							rdap.dnssec === null
								? null
								: rdap.dnssec
									? t('domain.rdap.signed')
									: t('domain.rdap.notSigned')
					}
				]
			: []
	);

	let contactRows = $derived(
		(rdap?.contacts ?? []).map((contact, index) => ({
			label: contact.roles.join(', ') || t('domain.rdap.contact', { n: index + 1 }),
			value: [contact.name, contact.email && `<${contact.email}>`].filter(Boolean).join(' ')
		}))
	);
</script>

{#if rdap}
	<KeyValueTable {rows} />
	{#if contactRows.length}
		<h3>{t('domain.rdap.contacts')}</h3>
		<KeyValueTable rows={contactRows} />
		<p class="note">{t('domain.rdap.redacted')}</p>
	{/if}
{:else}
	<p class="note">
		{t('domain.rdap.notFoundBefore')} <strong>{domain}</strong>{t('domain.rdap.notFoundAfter')}
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
