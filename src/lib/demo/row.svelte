<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<div class="grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-6">
	<p class="pt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
	<div class="flex flex-wrap items-center gap-3">
		{@render children()}
	</div>
</div>
