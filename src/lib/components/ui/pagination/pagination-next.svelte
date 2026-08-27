<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import { press as pressEffect } from "$lib/fx/press.js";

	/**
	 * alrein-ui — upstream shadcn-svelte, plus press.
	 *
	 * `buttonVariants` already puts `fx-press` on this button, but the utility is
	 * inert on its own: `--fx-press` stays at 0 until the attachment writes it.
	 * §3.1 makes press always-on rather than opt-in, so the arrows acknowledge a
	 * click the same way every other button in the library does.
	 *
	 * The source's 3D press tilt on these arrows — `perspective(420px)
	 * rotateX(<=9deg) rotateY(<=7deg) scale(0.9)` — is declined by A10 and A20:
	 * `perspective()` creates a containing block for `position: fixed`, and a
	 * pagination arrow routinely hosts a tooltip.
	 *
	 * Keyboard navigation between the arrows and the page buttons is bits-ui's
	 * (see `pagination.svelte`), not ours to write (`F14`).
	 */

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PaginationPrimitive.NextButtonProps = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	aria-label="Go to next page"
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "pr-2!", className)}
	{...restProps}
	{@attach pressEffect()}
>
	<span class="cn-pagination-next-text hidden sm:block">Next</span>
	<ChevronRightIcon data-icon="inline-end" />
</PaginationPrimitive.NextButton>
