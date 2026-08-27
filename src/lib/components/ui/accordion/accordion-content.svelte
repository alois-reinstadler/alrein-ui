<script lang="ts">
	/**
	 * alrein-ui Accordion.Content — the A21 collapse, and the reason this file
	 * animates a layout property on purpose.
	 *
	 * ## A16/A21 carve-out — read this before filing an `F11`
	 *
	 * `fx-collapse` animates `grid-template-rows: 0fr ↔ 1fr`. That is a layout
	 * property, and §1 bans animating layout properties. This is the **A16
	 * carve-out**: the layout change *is* the animation, not a decoration draped
	 * over one. A16 asks for that to be said in the file where it appears, and
	 * `scripts/check-layout-safety.mjs` allowlists `.fx-collapse` by name with the
	 * same reason at the other end, so a reviewer grepping for animated layout
	 * properties finds an explanation at both.
	 *
	 * The alternative is upstream's own: keyframe `height: 0 → var(--bits-accordion-content-height)`.
	 * That needs bits-ui to measure the panel on every toggle, and the measured
	 * value goes stale the moment the content resizes while open — an image that
	 * finishes loading inside an open panel leaves the panel the wrong height
	 * until the next toggle. `0fr → 1fr` needs no measurement, no `transitionend`
	 * listener and no timeout guard (A22), because the `1fr` is resolved by layout
	 * on every frame rather than captured once.
	 *
	 * The source's overshoot on it — 1.8 in five skins, 2.2 in `bounce` — is
	 * **declined** (A21). Overshooting `0fr` past `1fr` opens the panel taller
	 * than its own content and settles back.
	 *
	 * ## Why `forceMount` is on by default
	 *
	 * A CSS *transition* needs a before-change style, and bits-ui's presence layer
	 * does not leave one. With `forceMount` off, `AccordionContentState` zeroes
	 * `transitionDuration` inside an `afterTick` in order to measure the panel,
	 * which swallows the very transition we are starting; and on close it drops
	 * the `hidden` attribute back on as soon as `getAnimations()` reports nothing
	 * running — which, after the measurement has eaten the transition, is
	 * immediately. Upstream survives this because a keyframe *animation* restarts
	 * when `animationName` is restored; a transition does not.
	 *
	 * `forceMount` is exactly A4's answer, and it makes the panel's resting state
	 * pure CSS: the closed panel is clipped by `grid-template-rows: 0fr` on first
	 * paint, before and without JavaScript. It stays a normal prop, so a consumer
	 * who wants upstream's mount/unmount can pass `forceMount={false}` — and will
	 * lose the collapse animation, which is why the default is the other way.
	 *
	 * The a11y consequence of a permanently mounted panel is handled below rather
	 * than accepted: a closed panel is `invisible`, which removes it from the
	 * accessibility tree and from the tab order. `visibility` is one of the few
	 * discretely-animated properties that transitions *usefully* — it flips to
	 * `visible` at the start of an opening transition and to `hidden` only at the
	 * end of a closing one — so it costs no timer and no listener.
	 *
	 * ## The body's own entrance
	 *
	 * Decoupled from the collapse, as in the source: the text settles into a box
	 * that has already opened. Opacity, `blur` and `translate` only — nothing here
	 * touches the layout box. The source delays it 60ms; **declined**, because §2
	 * has no delay token and inventing one to buy 60ms is `F5`.
	 *
	 * Everything else stays bits-ui's: `aria-controls`, the panel `id`, the
	 * `data-state` pair, `aria-expanded` on the trigger and the disclosure's
	 * keyboard behaviour (`F14`). The source sets `aria-expanded` and nothing
	 * else — no `aria-controls`, no ids — and two of its own skins wire all three,
	 * which shows it was known and skipped. None of that is inherited (A24).
	 */
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import { getAccordionContext, getAccordionItemIds } from "./accordion.svelte";

	let {
		ref = $bindable(null),
		class: className,
		forceMount = true,
		id,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> = $props();

	const accordion = getAccordionContext();

	/*
	 * The other end of the `aria-controls` link. A consumer-supplied `id` still
	 * wins; bits-ui's own generated id is the fallback when there is no item
	 * context at all.
	 */
	const itemIds = getAccordionItemIds();
	const panelId = $derived(id ?? itemIds?.contentId);
</script>

<AccordionPrimitive.Content
	bind:ref
	{forceMount}
	id={panelId}
	data-slot="accordion-content"
	class="fx-collapse group/accordion-content text-sm"
	{...restProps}
>
	<div
		data-slot="accordion-content-body"
		class={cn(
			"pt-0 pb-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
			"transition-[opacity,filter,translate,visibility] duration-slow ease-fx-out",
			"group-data-[state=closed]/accordion-content:invisible group-data-[state=closed]/accordion-content:-translate-y-2 group-data-[state=closed]/accordion-content:opacity-0 group-data-[state=closed]/accordion-content:blur-xs",
			"group-data-[state=closed]/accordion-content:duration-base group-data-[state=closed]/accordion-content:ease-fx-in",
			accordion.variant === "ghost" && "px-3",
			className
		)}
	>
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
