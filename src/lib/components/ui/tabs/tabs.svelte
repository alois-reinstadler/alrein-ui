<script lang="ts" module>
	import { Tabs as TabsPrimitive } from "bits-ui";

	/**
	 * alrein-ui Tabs — a strict superset of the shadcn-svelte Tabs.
	 *
	 * The class string, the `data-slot` and the bindable `value` are byte-identical
	 * to the file `shadcn-svelte add tabs` installs. Two props that bits-ui already
	 * accepts through `restProps` are named explicitly, at bits-ui's own defaults,
	 * so nothing changes for an existing call site:
	 *
	 * - `orientation`, because the List has to know it to point `MorphIndicator`
	 *   down the right axis, and reading it off a `data-` attribute would mean
	 *   measuring the DOM to learn something we were told.
	 * - `activationMode`, because it is the one deliberate choice in Tabs'
	 *   keyboard behaviour and it should be visible in this file rather than
	 *   buried in a spread. `automatic` — selection follows focus — is bits-ui's
	 *   default and is correct here: our panels are cheap. The vuesax source does
	 *   the same thing by hand, with a rAF (references/VUESAX-INTENT-2.md §8).
	 *
	 * ## What is added, and what is not
	 *
	 * §3.4 gives Tabs `ghost` and nothing else: no gradient, no glow, no shimmer,
	 * no tilt, no magnet. So the extension is motion, structure and accessibility.
	 * The cursor-light on the letters and the 1820ms water-drop text reveal that
	 * the source paints over every tab are both pointer-tracked glow by another
	 * name, on a component the matrix gives no glow (A20).
	 *
	 * All the ARIA comes from bits-ui: `role="tablist"`, `role="tab"`,
	 * `aria-controls` on the trigger and `aria-labelledby` on the panel, wired to
	 * real ids. The source declares the roles with no panels and no
	 * `aria-controls` at all, which is a tab that controls nothing — A24 names it,
	 * and `F14` is the reason we do not re-declare any of it by hand.
	 */
	export type TabsProps = TabsPrimitive.RootProps;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { setTabsRoot } from "./tabs.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		orientation = "horizontal",
		activationMode = "automatic",
		class: className,
		...restProps
	}: TabsProps = $props();

	/*
	 * Republished for the List and the Trigger. bits-ui keeps the same two facts
	 * in a context it does not export, and re-deriving "am I selected?" from the
	 * DOM would be a measurement standing in for something we already know.
	 */
	setTabsRoot({
		get value() {
			return value;
		},
		get orientation() {
			return orientation;
		}
	});
</script>

<TabsPrimitive.Root
	bind:ref
	bind:value
	{orientation}
	{activationMode}
	data-slot="tabs"
	class={cn("gap-2 group/tabs flex data-[orientation=horizontal]:flex-col", className)}
	{...restProps}
/>
