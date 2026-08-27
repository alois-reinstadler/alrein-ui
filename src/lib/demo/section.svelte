<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		note,
		children
	}: { title: string; note?: string; children: Snippet } = $props();
</script>

<section class="border-b px-6 py-10">
	<header class="mb-6">
		<h2 class="cn-font-heading text-lg font-medium">{title}</h2>
		{#if note}
			<p class="mt-1 max-w-3xl text-sm text-muted-foreground">{note}</p>
		{/if}
	</header>
	<div class="flex flex-col gap-8">
		{@render children()}
	</div>
</section>
