<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * alrein-ui AvatarGroupCount — the shadcn-svelte AvatarGroupCount plus one class.
	 *
	 * Layout inventory row 3: the source animates this chip's `width` over 460ms
	 * on a spring when the digit count changes. **Declined.** §1 forbids animating
	 * the layout box, and the animation exists to hide a jump that mostly is not
	 * there — `tabular-nums` gives every digit the same advance, so `+9 → +10` is
	 * the only width change left in the common range and it happens once. It
	 * snaps, which is the correct amount of ceremony for a count.
	 *
	 * That is the whole diff against upstream.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="avatar-group-count"
	class={cn(
		"size-8 rounded-full bg-muted text-sm text-muted-foreground group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 relative flex shrink-0 items-center justify-center ring-2 ring-background",
		"tabular-nums",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
