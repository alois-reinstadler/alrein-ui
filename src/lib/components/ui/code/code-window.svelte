<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";
	import type { CodeProps } from "./code.svelte";

	/**
	 * alrein-ui CodeWindow. New — shadcn-svelte has no equivalent.
	 *
	 * §5 splits vuesax's `code` and `vs-code` into `Code` and this: the same code
	 * block with window chrome around it. It is deliberately a *wrapper* rather
	 * than a second implementation — the highlighting, the copy button, the
	 * fallback and the line numbers all stay in one place.
	 *
	 * §3.4 has no row for it, so no decorative effects.
	 */
	export type CodeWindowProps = WithElementRef<HTMLAttributes<HTMLDivElement>> &
		Omit<CodeProps, "ref" | "caption" | "variant"> & {
			/** Shown in the title bar. A filename, usually. */
			title?: string;
			/** The three dots. Off makes a plainer window. */
			traffic?: boolean;
		};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import Code from "./code.svelte";

	let {
		ref = $bindable(null),
		title,
		traffic = true,
		class: className,
		code,
		lang,
		copyable,
		lineNumbers,
		...restProps
	}: CodeWindowProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="code-window"
	class={cn("overflow-hidden rounded-xl border bg-card shadow-sm", className)}
	{...restProps}
>
	<div
		data-slot="code-window-bar"
		class="flex items-center gap-2 border-b bg-muted/60 px-3 py-2"
	>
		{#if traffic}
			<!--
				Decorative, and marked so. Three coloured dots carry no information a
				screen reader needs, and announcing them would be noise. The colours are
				the semantic state tokens rather than invented ones, so they retheme
				with everything else (A9).
			-->
			<span data-slot="code-window-traffic" aria-hidden="true" class="flex gap-1.5">
				<span class="size-2.5 rounded-full bg-destructive/70"></span>
				<span class="size-2.5 rounded-full bg-warning/70"></span>
				<span class="size-2.5 rounded-full bg-success/70"></span>
			</span>
		{/if}
		{#if title}
			<span data-slot="code-window-title" class="truncate font-mono text-xs text-muted-foreground">
				{title}
			</span>
		{/if}
	</div>

	<Code
		{code}
		{lang}
		{copyable}
		{lineNumbers}
		variant="minimal"
		class="rounded-none border-0 bg-transparent"
	/>
</div>
