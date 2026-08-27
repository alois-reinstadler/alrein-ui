/**
 * Type-level contract for Sidebar (SPEC.md §3.5, §7.4).
 *
 * Sidebar has more sub-components than anything else in the library — twenty-three
 * exports plus `useSidebar` — which makes it the component with the most to lose
 * to `F1`, "a multi-part component quietly shipping fewer parts than upstream".
 * The `parts` assertion below is the direct regression test for that, and it is
 * the one this file exists for.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { ComponentProps } from 'svelte';
import * as Sidebar from './index.js';

/*
 * Every upstream sub-component, by its upstream name. If an upstream
 * `shadcn-svelte add` or a careless edit removes one, this line stops compiling.
 */
const parts = [
	Sidebar.Root,
	Sidebar.Provider,
	Sidebar.Trigger,
	Sidebar.Rail,
	Sidebar.Inset,
	Sidebar.Input,
	Sidebar.Header,
	Sidebar.Footer,
	Sidebar.Separator,
	Sidebar.Content,
	Sidebar.Group,
	Sidebar.GroupLabel,
	Sidebar.GroupAction,
	Sidebar.GroupContent,
	Sidebar.Menu,
	Sidebar.MenuItem,
	Sidebar.MenuButton,
	Sidebar.MenuAction,
	Sidebar.MenuBadge,
	Sidebar.MenuSkeleton,
	Sidebar.MenuSub,
	Sidebar.MenuSubItem,
	Sidebar.MenuSubButton
] as const;

/* The aliased namespace exports upstream also ships, and the state hook. */
const aliases = [
	Sidebar.Sidebar,
	Sidebar.SidebarProvider,
	Sidebar.SidebarTrigger,
	Sidebar.SidebarMenuSubButton,
	Sidebar.useSidebar
] as const;

type SidebarProps = ComponentProps<typeof Sidebar.Root>;
type SidebarMenuProps = ComponentProps<typeof Sidebar.Menu>;
type SidebarMenuSubProps = ComponentProps<typeof Sidebar.MenuSub>;
type SidebarMenuButtonProps = ComponentProps<typeof Sidebar.MenuButton>;
type SidebarProviderProps = ComponentProps<typeof Sidebar.Provider>;

/* Upstream call sites must keep compiling unchanged (SPEC.md §1, §7). */
const upstreamDefault: SidebarProps = {};
const upstreamFloating: SidebarProps = { variant: 'floating', collapsible: 'icon' };
const upstreamInset: SidebarProps = { variant: 'inset', side: 'right' };
const upstreamNone: SidebarProps = { collapsible: 'none' };
const upstreamMenu: SidebarMenuProps = {};
const upstreamMenuSub: SidebarMenuSubProps = {};
const upstreamMenuButton: SidebarMenuButtonProps = { isActive: true, size: 'lg', variant: 'outline' };
/* The cookie-backed open state is upstream's and is still bindable (A24). */
const upstreamProvider: SidebarProviderProps = { open: false, onOpenChange: () => {} };

/* The one cell §3.4 gives Sidebar, added to upstream's variant enum. */
const ghostShell: SidebarProps = { variant: 'ghost' };

/* The two alrein additions that are structure rather than effect. */
const withIndicator: SidebarMenuProps = { indicator: true };
const collapsibleSub: SidebarMenuSubProps = { open: false };

/*
 * §3.4's Sidebar row is `ghost ●` and five dashes. The source applies a border
 * proximity glow, the neighbour-light lamp, a 2.6s scanline and a 12s gradient
 * drift; none of them has a prop here, so none of them can be asked for.
 */
// @ts-expect-error §3.4 gives Sidebar no gradient
const gradientShell: SidebarProps = { gradient: true };
// @ts-expect-error the border proximity glow is declined (A20); Sidebar has no glow
const glowingShell: SidebarProps = { glow: true };
// @ts-expect-error §3.4 gives Sidebar no shimmer
const shimmeringShell: SidebarProps = { shimmer: true };
// @ts-expect-error application chrome does not tilt
const tiltedShell: SidebarProps = { tilt: true };
// @ts-expect-error magnet is never in application chrome (§3.5)
const magneticShell: SidebarProps = { magnet: true };

/* And not on the individual menu button either. */
// @ts-expect-error a menu item is a peer in a list, and glow claims primacy
const glowingItem: SidebarMenuButtonProps = { glow: true };

export {
	parts,
	aliases,
	upstreamDefault,
	upstreamFloating,
	upstreamInset,
	upstreamNone,
	upstreamMenu,
	upstreamMenuSub,
	upstreamMenuButton,
	upstreamProvider,
	ghostShell,
	withIndicator,
	collapsibleSub,
	gradientShell,
	glowingShell,
	shimmeringShell,
	tiltedShell,
	magneticShell,
	glowingItem
};
