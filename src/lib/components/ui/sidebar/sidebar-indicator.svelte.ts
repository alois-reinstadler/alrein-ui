import { getContext, hasContext, setContext } from 'svelte';

/**
 * The shared state behind `Sidebar.Menu`'s optional active-item indicator, and
 * behind the submenu's open state.
 *
 * ## Why an indicator at all
 *
 * A18 corrects §4.9: `MorphIndicator`'s real consumers are Tabs, Pagination and
 * Sidebar. The digest's compatibility answer for Sidebar is the easy one —
 * "fully compatible, no caveats" — because the highlight is full-width in a
 * vertical list of uniform-height rows, so `width` and `height` never actually
 * change and only `translateY` does. `orientation="vertical"` on the existing
 * FLIP indicator is exactly right, and the 260ms plain ease-out the source uses
 * is already inside our scale.
 *
 * Two things from the source are deliberately *not* what this drives:
 *
 * - **The cursor-following highlight** (`.sb__hl`). It follows the pointer, not
 *   the selection. Wiring a selection indicator to the pointer would be a
 *   pointer-tracked effect on a component §3.4 gives nothing but `ghost`, and the
 *   digest is explicit that it "produces a different component and orphans the
 *   static active bar's job".
 * - **The animated `padding-left` on the active item and `margin-right` on its
 *   badge** (layout inventory rows 22 and 23, both declined). Upstream shadcn
 *   does not indent an active item at all, so there is nothing to decline in
 *   place — the decline is simply that this indicator is a `transform` under the
 *   row, never an indent inside it.
 *
 * ## The collapsed-target fallback
 *
 * The one detail from the source's `rail` skin worth keeping verbatim: **when
 * the rail is collapsed, the indicator's target falls back from the active
 * *child* to the visible parent**. Sub-buttons are `group-data-[collapsible=icon]:hidden`
 * when collapsed and clipped to zero height when their submenu is closed, and a
 * FLIP indicator pointed at a hidden element measures a zero box at the origin
 * and flies to `0,0`. Any FLIP indicator over a collapsible tree needs this or it
 * has the most visible possible bug.
 */
export class SidebarIndicatorState {
	/** The active top-level menu button, if one is mounted. */
	activeItem = $state<HTMLElement | null>(null);
	/** The active submenu button, but only while its submenu is actually open. */
	activeSubItem = $state<HTMLElement | null>(null);

	/**
	 * `collapsed` is passed in rather than read from the sidebar context here, so
	 * this class stays a plain state holder that a unit test can drive without a
	 * component tree.
	 */
	target(collapsed: boolean): HTMLElement | null {
		if (collapsed) return this.activeItem;
		return this.activeSubItem ?? this.activeItem;
	}
}

const INDICATOR_KEY = Symbol('alrein-sidebar-indicator');

export function setSidebarIndicator(state: SidebarIndicatorState): SidebarIndicatorState {
	setContext(INDICATOR_KEY, state);
	return state;
}

/**
 * Returns `null` when no `Sidebar.Menu` above has asked for an indicator, which
 * is the default and is what every upstream call site gets. A button that finds
 * nothing here registers nothing and costs nothing.
 */
export function getSidebarIndicator(): SidebarIndicatorState | null {
	if (hasContext(INDICATOR_KEY)) return getContext<SidebarIndicatorState>(INDICATOR_KEY);
	return null;
}

export interface SidebarMenuSubContext {
	/** Whether the enclosing submenu is expanded. `true` when it is not collapsible. */
	readonly open: boolean;
}

const SUB_KEY = Symbol('alrein-sidebar-menu-sub');

export function setSidebarMenuSubContext(context: SidebarMenuSubContext): void {
	setContext(SUB_KEY, context);
}

/**
 * Defaults to open, because `Sidebar.MenuSub` without an `open` prop is
 * upstream's always-visible submenu and its buttons are always real targets.
 */
export function getSidebarMenuSubContext(): SidebarMenuSubContext {
	if (hasContext(SUB_KEY)) return getContext<SidebarMenuSubContext>(SUB_KEY);
	return { open: true };
}
