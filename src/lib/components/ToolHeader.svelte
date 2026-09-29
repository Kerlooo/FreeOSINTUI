<script>
	/** @type {{ title: string, description: string }} */
	let { title, description } = $props();
</script>

<header>
	<h1>{title}</h1>
	<p>{description}</p>
</header>

<style>
	header {
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0 0 0.75rem;
		font-size: clamp(1.8rem, 5vw, 2.5rem);
	}

	p {
		max-width: 44rem;
		margin: 0;
		color: var(--color-text-dim);
	}
</style>
