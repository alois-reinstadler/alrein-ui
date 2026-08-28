<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	/**
	 * alrein-ui TabsContent — a strict superset of the shadcn-svelte TabsContent.
	 *
	 * The upstream class string is reproduced byte-identically; the only addition
	 * is a focus-visible indicator, appended after it so `cn()` keeps merging and
	 * a consumer's `class` still wins.
	 *
	 * ## Why the addition exists
	 *
	 * bits-ui gives the panel `role="tabpanel"` and `tabindex="0"`, which the ARIA
	 * Authoring Practices require: a panel whose content holds no focusable
	 * element still has to be reachable, or a keyboard user tabbing out of the tab
	 * list skips the content entirely. Upstream then sets `outline-none` and adds
	 * nothing back, so the panel is focusable and paints *no* focus indicator at
	 * all — the caret lands somewhere invisible.
	 *
	 * That is a WCAG 2.4.7 (Focus Visible, AA) failure, and §7.6 is an acceptance
	 * criterion here rather than a nicety. It was found by walking all 31 demo
	 * pages at all three `data-fx` levels in both colour schemes and reading the
	 * resolved ring off every focusable element: the six panels on `/tabs` were
	 * the only focusable nodes in the whole library with no indicator on any side.
	 *
	 * The indicator is the 3px `ring-ring/50` every other focusable in the library
	 * resolves to — Button, Input, Checkbox, Switch, Breadcrumb, Pagination,
	 * Accordion, Chip — rather than the extra 1px outline TabsTrigger also carries,
	 * which is upstream's own flourish and not the house indicator. Upstream's
	 * `outline-none` is kept, so `--tw-outline-style` stays `none` and the ring is
	 * the whole of it. It is `focus-visible` only, so pointer users see nothing new
	 * and the upstream appearance is untouched in every state upstream paints.
	 *
	 * Nothing here is an effect: §3.4 grants Tabs no decorative effects at all, and
	 * a focus ring is not one. It is unconditional and does not consult `FxContext`
	 * — the accessibility floor in §3.5 does not move with `data-fx`, which is also
	 * what makes the ring identical at off, calm and expressive.
	 */
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
	bind:ref
	data-slot="tabs-content"
	class={cn(
		"text-sm flex-1 outline-none",
		"focus-visible:ring-[3px] focus-visible:ring-ring/50",
		className
	)}
	{...restProps}
/>
