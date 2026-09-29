<script>
	import KeyValueTable from '$lib/components/KeyValueTable.svelte';
	import { profileRows } from '$lib/github/analyze.js';
	import { t } from '$lib/i18n/i18n.svelte.js';

	/** @type {{ user: any }} */
	let { user } = $props();

	let rows = $derived(profileRows(user));
</script>

<div class="profile">
	{#if user.avatar_url}
		<img
			src={user.avatar_url}
			alt={t('github.profile.avatarAlt', { login: user.login })}
			width="120"
			height="120"
		/>
	{/if}
	<div class="table">
		<KeyValueTable {rows} />
	</div>
</div>

<style>
	.profile {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
		align-items: flex-start;
	}

	img {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.table {
		flex: 1 1 20rem;
		min-width: 0;
	}
</style>
