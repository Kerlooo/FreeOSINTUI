<script>
	import { ALGORITHMS } from '$lib/hash/algorithms.js';
	import { findMatches, identifyHash } from '$lib/hash/identify.js';

	/** @type {{ value: string, digests: Record<string, string> | null }} */
	let { value = $bindable(), digests } = $props();

	let candidates = $derived(identifyHash(value));
	let matches = $derived(digests ? findMatches(value, digests) : []);
	let matchLabels = $derived(
		ALGORITHMS.filter((algorithm) => matches.includes(algorithm.id)).map((a) => a.label)
	);
	let computable = $derived(
		candidates.some((name) => ALGORITHMS.some((algorithm) => algorithm.label === name))
	);
</script>

<div class="verifier">
	<label for="expected-hash"
		>Hash to verify or identify <span class="optional">(optional)</span></label
	>
	<input
		id="expected-hash"
		type="text"
		bind:value
		placeholder="Paste a hash, e.g. 5d41402abc4b2a76b9719d911017c592"
		autocomplete="off"
		spellcheck="false"
	/>

	{#if value.trim()}
		<div class="report" aria-live="polite">
			<p>
				<span class="key">Possible type:</span>
				{#if candidates.length}
					{candidates.join(', ')}
				{:else}
					<span class="warning">unknown format</span>
				{/if}
			</p>

			{#if digests}
				{#if matches.length}
					<p class="match">✔ Match: {matchLabels.join(', ')}</p>
				{:else if candidates.length && !computable}
					<p class="neutral">
						This hash type is not computed here (salted or password hashes cannot be verified by
						recomputing the input).
					</p>
				{:else}
					<p class="mismatch">✘ No match: the input does not produce this hash.</p>
				{/if}
			{:else}
				<p class="neutral">Enter text or choose a file to verify it against this hash.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.verifier {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 700;
	}

	.optional,
	.key {
		color: var(--color-text-dim);
		font-weight: 400;
	}

	.report {
		padding: 0.75rem 1rem;
		border-left: 2px solid var(--color-border);
		overflow-wrap: anywhere;
	}

	.report p {
		margin: 0.2rem 0;
	}

	.match {
		font-weight: 700;
		text-shadow: 0 0 8px var(--color-text-muted);
	}

	.mismatch,
	.warning {
		color: var(--color-danger);
	}

	.neutral {
		color: var(--color-text-dim);
	}
</style>
