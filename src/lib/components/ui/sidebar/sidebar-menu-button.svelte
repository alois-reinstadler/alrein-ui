<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	/**
	 * alrein-ui Sidebar.MenuButton — upstream's file plus press, and minus one
	 * animated layout property.
	 *
	 * Two edits to the upstream `base:` string, both deliberate:
	 *
	 * 1. **`padding` is dropped from `transition-[width,height,padding]`.** Layout
	 *    inventory rows 22 and 23 decline the source's animated `padding-left` on
	 *    the active item and `margin-right` on its badge outright — "indent by
	 *    `translateX` on the content, or not at all". Upstream does not indent an
	 *    active item, so there is nothing to re-express; what is left is a padding
	 *    step that happens once, at the moment the rail collapses, and does not
	 *    need to be interpolated. `width` and `height` stay: those are the rail
	 *    collapse, which is the A16 carve-out documented in `sidebar.svelte`.
	 * 2. **`fx-press` is appended**, plus `duration-slow ease-fx-out` so the
	 *    remaining size transition runs on the same token as the rail it belongs
	 *    to rather than on Tailwind's 150ms default.
	 *
	 * §3.4 gives Sidebar `ghost` and nothing else, so there are no effect props
	 * here. Press is not an effect in that sense — §3.1 makes it always-on and
	 * never opt-in — and the source agrees: its menu items sink on `:active` too.
	 * The flat scale is A10's; the source's 3D press is declined library-wide.
	 */
	export const sidebarMenuButtonVariants = tv({
		base: "gap-2 rounded-md p-2 text-left text-sm ring-sidebar-ring transition-[width,height] duration-slow ease-fx-out fx-press group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground peer/menu-button group/menu-button flex w-full items-center overflow-hidden outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
		variants: {
			variant: {
				default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				outline: "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
			},
			size: {
				default: "h-8 text-sm",
				sm: "h-7 text-xs",
				lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type SidebarMenuButtonVariant = VariantProps<typeof sidebarMenuButtonVariants>["variant"];
	export type SidebarMenuButtonSize = VariantProps<typeof sidebarMenuButtonVariants>["size"];
</script>

<script lang="ts">
	import { mergeProps } from "bits-ui";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn, type WithElementRef, type WithoutChildrenOrChild } from "$lib/utils.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { useSidebar } from "./context.svelte.js";
	import { getSidebarIndicator } from "./sidebar-indicator.svelte.js";
	import type { ComponentProps, Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		variant = "default",
		size = "default",
		isActive = false,
		tooltipContent,
		tooltipContentProps,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
		isActive?: boolean;
		variant?: SidebarMenuButtonVariant;
		size?: SidebarMenuButtonSize;
		tooltipContent?: Snippet | string;
		tooltipContentProps?: WithoutChildrenOrChild<ComponentProps<typeof Tooltip.Content>>;
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const sidebar = useSidebar();

	/*
	 * `null` unless an ancestor `Sidebar.Menu` asked for an indicator, in which
	 * case the active button publishes its node so the shared MorphIndicator has
	 * something to measure. Registering from an `$effect` rather than inline
	 * because it is a DOM node and a lifetime — the cleanup is the whole point,
	 * or an unmounted button leaves the indicator pointed at a detached element.
	 */
	const indicator = getSidebarIndicator();

	$effect(() => {
		if (!indicator || !isActive || !ref) return;
		indicator.activeItem = ref;
		return () => {
			if (indicator.activeItem === ref) indicator.activeItem = null;
		};
	});

	const buttonProps = $derived({
		class: cn(sidebarMenuButtonVariants({ variant, size }), className),
		"data-slot": "sidebar-menu-button",
		"data-sidebar": "menu-button",
		"data-size": size,
		"data-active": isActive,
		...restProps,
	});
</script>

<!--
	`data-slot` is re-asserted *after* the merge, and that is a fix rather than a
	flourish.

	Upstream writes `mergeProps(buttonProps, props)`, and when the button is
	wrapped in a tooltip — which is exactly what happens whenever `tooltipContent`
	is passed, i.e. on every button in a collapsible sidebar — bits-ui's
	`data-slot="tooltip-trigger"` wins the merge and
	`data-slot="sidebar-menu-button"` disappears from the DOM. Verified in the
	rendered markup: five of seven menu buttons on the demo page had lost it.

	That silently breaks every `data-[slot=sidebar-menu-button]` selector,
	including upstream's own, on precisely the buttons a consumer is most likely
	to be styling. §1 calls `data-slot` non-negotiable and `F7` is the failure it
	names. The tooltip's own identity survives on `data-tooltip-trigger`, which
	bits-ui also emits, so nothing is lost by putting this one back on top.
-->
{#snippet Button({ props }: { props?: Record<string, unknown> })}
	{@const mergedProps = { ...mergeProps(buttonProps, props), "data-slot": "sidebar-menu-button" }}
	{#if child}
		{@render child({ props: mergedProps })}
	{:else}
		<!--
			The `child` branch above gets the classes but not the attachment: an
			attachment belongs to an element this component renders, and in that
			branch the consumer renders the element. `fx-press` is inert without the
			attachment driving `--fx-press`, so nothing looks half-applied.
		-->
		<button bind:this={ref} {...mergedProps} {@attach pressEffect()}>
			{@render children?.()}
		</button>
	{/if}
{/snippet}

{#if !tooltipContent}
	{@render Button({})}
{:else}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render Button({ props })}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content
			side="right"
			align="center"
			hidden={sidebar.state !== "collapsed" || sidebar.isMobile}
			{...tooltipContentProps}
		>
			{#if typeof tooltipContent === "string"}
				{tooltipContent}
			{:else if tooltipContent}
				{@render tooltipContent()}
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
