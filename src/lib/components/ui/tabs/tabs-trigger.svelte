<script lang="ts" module>
	import { Tabs as TabsPrimitive } from "bits-ui";

	export type TabsTriggerProps = TabsPrimitive.TriggerProps;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getTabsList } from "./tabs.svelte.js";

	/**
	 * alrein-ui TabsTrigger — a strict superset of the shadcn-svelte TabsTrigger.
	 *
	 * The upstream class string is reproduced byte-identically; everything added
	 * is appended after it, so `cn()` keeps merging and a consumer's `class` still
	 * wins.
	 *
	 * ## Why the handoff is keyed on `data-active`
	 *
	 * Upstream's class string is built entirely on `data-active:`, and bits-ui
	 * 2.19 publishes `data-state="active" | "inactive"` rather than `data-active`
	 * (`dist/bits/tabs/tabs.svelte.js`). Those do line up, but only because
	 * Tailwind v4's `data-active` variant is a *named* one rather than a bare
	 * attribute test: it compiles to
	 * `:where([data-state=active]), :where([data-active]:not([data-active=false]))`.
	 * Verified in the built stylesheet, not assumed — the bare-attribute reading
	 * would have meant upstream's Tabs had no visible active state at all, and it
	 * is worth knowing which of those two is true before layering anything on top.
	 *
	 * So the added handoff rules below use the same variant upstream does, and
	 * they match on exactly the tab bits-ui has marked active.
	 *
	 * ## What is *not* here
	 *
	 * - **No `fx-press`.** Press is always-on (§3.1) and this is the one place it
	 *   cannot go: `fx-press` owns `::after` for its pointer-positioned tint, and
	 *   upstream's trigger already owns `::after` for the `line` variant's
	 *   underline. Two claims on one pseudo-element means the underline becomes
	 *   the press tint or vice versa. The tab still recolours and the indicator
	 *   still moves on click, so the "I registered it" signal is carried.
	 * - **No cursor light on the letters, no water-drop reveal.** Both are in the
	 *   vuesax source, both are `background-clip: text` radials, and both are a
	 *   pointer-tracked glow under another name on a component §3.4 gives no glow
	 *   (A20). A19 settles the related question: the active label is *recoloured*,
	 *   as upstream does, not revealed through a counter-translated copy of the
	 *   label strip.
	 */
	let {
		ref = $bindable(null),
		value,
		class: className,
		...restProps
	}: TabsTriggerProps = $props();

	const list = getTabsList();

	/*
	 * Hand the element to the List so `MorphIndicator` has something to measure.
	 * An `$effect` because it is a DOM registration, not a derivation — and it is
	 * keyed on `ref` and `value` so a trigger that is re-keyed or removed takes
	 * its entry with it.
	 */
	$effect(() => {
		const node = ref;
		const key = value;
		if (!list) return;
		list.register(key, node);
		return () => list.unregister(key, node);
	});
</script>

<TabsPrimitive.Trigger
	bind:ref
	{value}
	data-slot="tabs-trigger"
	class={cn(
		"gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg:not([class*='size-'])]:size-4 relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
		"group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
		"data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
		"after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
		/*
		 * Motion from the scale rather than from Tailwind's 150ms default. §2's
		 * `base` step is the one it names for "tab indicator", and the label
		 * recolour should arrive with the indicator, not before it.
		 */
		"duration-base ease-fx-out",
		/*
		 * The handoff. Once the List has a live `MorphIndicator` it owns the pill,
		 * the underline and the chrome sled, so the trigger stops drawing its own
		 * — otherwise the active tab carries two identical pills, one of which
		 * teleports. The *text* colour is deliberately not handed off: A19 makes
		 * recolouring the active label the whole of Tabs' active treatment, and
		 * §3.5 forbids a decorative layer being the sole carrier of state.
		 *
		 * Keyed on an attribute rather than on a prop so that a trigger used
		 * outside an alrein List — a legal shadcn composition — keeps upstream's
		 * appearance untouched.
		 */
		"group-data-[indicator=on]/tabs-list:data-active:border-transparent group-data-[indicator=on]/tabs-list:data-active:bg-transparent group-data-[indicator=on]/tabs-list:data-active:shadow-none group-data-[indicator=on]/tabs-list:data-active:after:opacity-0 dark:group-data-[indicator=on]/tabs-list:data-active:border-transparent dark:group-data-[indicator=on]/tabs-list:data-active:bg-transparent",
		/* The two added variants' tab shapes. The indicator matches them. */
		"group-data-[variant=chrome]/tabs-list:rounded-b-none group-data-[variant=chrome]/tabs-list:px-3.5",
		"group-data-[variant=gooey]/tabs-list:rounded-full group-data-[variant=gooey]/tabs-list:px-3.5",
		className
	)}
	{...restProps}
/>
