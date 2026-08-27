<script lang="ts">
	/**
	 * alrein-ui Sidebar.Provider — upstream's file, unchanged apart from this
	 * comment, which exists because A24 asks a question this file already answers.
	 *
	 * ## A24: does anything persist the collapsed state?
	 *
	 * **Yes, and it is upstream's, so it is kept as-is.** `setOpen` writes
	 * `sidebar_state=<bool>` to `document.cookie` with a seven-day `max-age`
	 * (`constants.ts`). The digest records that *nothing* in the vuesax source
	 * persists — no `localStorage`, no cookie, in any of the seven Phase 3
	 * components — so a collapsed rail there flashes open on the first paint after
	 * a reload. That gap is not inherited, and nothing new was invented either.
	 *
	 * **The read side is deliberately the consumer's**, and it has to be, because
	 * only the consumer's server sees the request. shadcn's documented pattern is
	 * a `+layout.server.ts` that does `cookies.get("sidebar_state") !== "false"`
	 * and passes the result to `<Sidebar.Provider open={data.sidebarOpen}>`. That
	 * is what makes it flash-free: the first HTML the browser receives already has
	 * the rail in the right state, with no JavaScript involved.
	 *
	 * A library-side read would have to happen in the browser, after hydration,
	 * which is exactly the flash it is supposed to prevent. So: mechanism present,
	 * wiring documented, nothing invented.
	 *
	 * (This docs site itself runs on `adapter-static`, so it has no server to read
	 * a cookie in. The demo page therefore shows the composition rather than the
	 * persistence, and says so.)
	 */
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import {
		SIDEBAR_COOKIE_MAX_AGE,
		SIDEBAR_COOKIE_NAME,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_ICON,
	} from "./constants.js";
	import { setSidebar } from "./context.svelte.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		open = $bindable(true),
		onOpenChange = () => {},
		class: className,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	const sidebar = setSidebar({
		open: () => open,
		setOpen: (value: boolean) => {
			open = value;
			onOpenChange(value);

			// This sets the cookie to keep the sidebar state.
			document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
	});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
	<div
		data-slot="sidebar-wrapper"
		style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn(
			"group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
