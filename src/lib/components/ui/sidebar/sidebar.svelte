<script lang="ts">
	/**
	 * alrein-ui Sidebar — a strict superset of the shadcn-svelte Sidebar.
	 *
	 * All twenty-three upstream sub-components are still exported under their
	 * upstream names, with their upstream props. Diff against
	 * `git show ff42eae:src/lib/components/ui/sidebar/`. `sidebar.types.ts` asserts
	 * every one of them at compile time, because a multi-part component quietly
	 * losing sub-components is `F1`, and Sidebar has more parts to lose than
	 * anything else in the library.
	 *
	 * What is added here:
	 *   - `variant="ghost"` — the fourth value in upstream's enum, and the only
	 *     thing §3.4 grants Sidebar. A transparent shell with no border and no
	 *     panel fill, for an app that paints its own background.
	 *   - the motion scale on the rail collapse, replacing upstream's
	 *     `duration-200 ease-linear`.
	 *
	 * ## A16 carve-out — the rail width. Read this before filing an `F11`
	 *
	 * `transition-[width]` on the gap and `transition-[left,right,width]` on the
	 * container animate layout properties, and §1 bans animating layout
	 * properties. This is the **second A16 carve-out** (layout inventory row 21):
	 * the collapse *is* the layout change. There is no transform that expresses
	 * "the app shell is now 3rem wide and the page content starts there" — a
	 * `scaleX` on the rail would squash its contents and leave the inset content
	 * where it was.
	 *
	 * `scripts/check-layout-safety.mjs` polices the *effect* layer — selectors
	 * mentioning `fx-` or `data-fx` — so this is outside its reach by
	 * construction rather than by exemption. A16 asks for that to be said in the
	 * file where it appears, and this is the file.
	 *
	 * **The overshoot is declined** (row 21). The source runs the rail at
	 * `cubic-bezier(0.34, 1.4, 0.6, 1)`, and its `gradient` skin at 1.8. A rail
	 * that overshoots its collapsed width shoves the page content twice, and §2
	 * names exactly this as the "slow and drunk" case. `duration-slow ease-fx-out`
	 * — no overshoot, and the same 240ms the sheet and the modal use, because it
	 * is the same kind of motion.
	 *
	 * ## Declined from the source, on the record rather than by omission
	 *
	 * - **The border proximity glow and the "neighbour light" lamp** (A20). §3.4
	 *   gives Sidebar `ghost` and nothing else; the lamp has no §3.1 entry and no
	 *   §3.4 row at all.
	 * - **`glow`'s 2.6s scanline and `gradient`'s 12s background drift.** §3.5: an
	 *   idle loop means loading, or it is a migraine. Twelve seconds of drift in
	 *   the chrome of an app somebody stares at all day is the migraine.
	 * - **`role="menu"` / `role="menuitem"` on the navigation list.** Menu
	 *   semantics promise arrow-key navigation; the source implements `Escape` and
	 *   `Home`. shadcn uses a plain `<nav>` plus a list, which is right, and that
	 *   is what stays (`F14`).
	 * - **The flyout that appends a custom element to `document.body`** and talks
	 *   back through a composed event, with `transitionend` plus 380ms/220ms
	 *   timeout fallbacks. Upstream already solves the collapsed label with a
	 *   `Tooltip` on the menu button — see `sidebar-menu-button.svelte`, which is
	 *   bits-ui's tooltip, which is a dismissable layer that already exists.
	 * - **`flush` and `full`.** Real distinctions in the source, and upstream's
	 *   `variant="inset"` plus `collapsible="offcanvas"` already cover the app-shell
	 *   shapes. Two more values would be `F16`.
	 */
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import { SIDEBAR_WIDTH_MOBILE } from "./constants.js";
	import { useSidebar } from "./context.svelte.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		side = "left",
		variant = "sidebar",
		collapsible = "offcanvas",
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		side?: "left" | "right";
		/**
		 * `ghost` is the alrein addition: no border, no panel fill (§3.1 — a
		 * transparent surface). Upstream's three values are unchanged.
		 */
		variant?: "sidebar" | "floating" | "inset" | "ghost";
		collapsible?: "offcanvas" | "icon" | "none";
	} = $props();

	const sidebar = useSidebar();

	/**
	 * Upstream branches on `floating || inset` twice; `ghost` needs the third
	 * branch — the plain-rail geometry, minus the edge border. Pulling the test
	 * into one `$derived` keeps the two class strings below readable and keeps the
	 * upstream branch byte-identical for the three upstream values.
	 */
	const inset = $derived(variant === "floating" || variant === "inset");
</script>

{#if collapsible === "none"}
	<!--
		`data-slot` and `data-variant` are added to this branch; upstream emits
		neither here, so a non-collapsible sidebar is the one shape a consumer
		cannot target with `[data-slot=sidebar]` at all. §1 calls `data-slot`
		non-negotiable, and a branch that quietly omits it is `F7`.
	-->
	<div
		data-slot="sidebar"
		data-variant={variant}
		data-side={side}
		class={cn(
			"flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
			variant === "ghost" && "bg-transparent",
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
{:else if sidebar.isMobile}
	<Sheet.Root bind:open={() => sidebar.openMobile, (v) => sidebar.setOpenMobile(v)} {...restProps}>
		<Sheet.Content
			bind:ref
			data-sidebar="sidebar"
			data-slot="sidebar"
			data-mobile="true"
			class={cn(
				"w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
				className
			)}
			style="--sidebar-width: {SIDEBAR_WIDTH_MOBILE};"
			{side}
		>
			<Sheet.Header class="sr-only">
				<Sheet.Title>Sidebar</Sheet.Title>
				<Sheet.Description>Displays the mobile sidebar.</Sheet.Description>
			</Sheet.Header>
			<div class="flex h-full w-full flex-col">
				{@render children?.()}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<div
		bind:this={ref}
		class="group peer hidden text-sidebar-foreground md:block"
		data-state={sidebar.state}
		data-collapsible={sidebar.state === "collapsed" ? collapsible : ""}
		data-variant={variant}
		data-side={side}
		data-slot="sidebar"
	>
		<!--
			This is what handles the sidebar gap on desktop.

			A16 carve-out (row 21): the width transition here and on the container
			below is the collapse itself, not a decoration over one. The overshoot
			the source uses is declined; see the file comment.
		-->
		<div
			data-slot="sidebar-gap"
			class={cn(
				"transition-[width] duration-slow ease-fx-out relative w-(--sidebar-width) bg-transparent",
				"group-data-[collapsible=offcanvas]:w-0",
				"group-data-[side=right]:rotate-180",
				inset
					? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
					: "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
			)}
		></div>
		<div
			data-slot="sidebar-container"
			class={cn(
				"fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-slow ease-fx-out md:flex",
				side === "left"
					? "start-0 group-data-[collapsible=offcanvas]:start-[calc(var(--sidebar-width)*-1)]"
					: "end-0 group-data-[collapsible=offcanvas]:end-[calc(var(--sidebar-width)*-1)]",
				// Adjust the padding for floating and inset variants.
				// ghost keeps the plain rail geometry and simply never emits the edge
				// border: `border-e-0` would lose to `group-data-[side=left]:border-e`
				// on specificity, and winning that back would mean `!important` (`F17`).
				inset
					? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
					: variant === "ghost"
						? "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
						: "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-e group-data-[side=right]:border-s",
				className
			)}
			{...restProps}
		>
			<div
				data-sidebar="sidebar"
				data-slot="sidebar-inner"
				class={cn(
					"bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border flex size-full flex-col",
					variant === "ghost" && "bg-transparent"
				)}
			>
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
