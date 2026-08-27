<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';

	export type MorphOrientation = 'horizontal' | 'vertical' | 'both';

	export type MorphIndicatorProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The element the indicator should sit under. Pass `null` while nothing is
		 * active and the indicator hides without animating.
		 */
		target?: HTMLElement | null;
		/**
		 * Which axes follow the target. A tab strip is `horizontal`, a sidebar is
		 * `vertical`, a segmented control that changes size is `both`.
		 */
		orientation?: MorphOrientation;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { duration } from './easing.js';

	/**
	 * One shared morphing indicator, built once (SPEC.md §4.9).
	 *
	 * Tabs (`chrome` and `gooey`), Steps, Sidebar and any future segmented control
	 * consume this rather than each growing its own. Building four of these is how
	 * you end up with four subtly different easings.
	 *
	 * ## FLIP, and why there is no rAF here
	 *
	 * The naive implementation transitions `left` / `top` / `width` / `height`,
	 * which animates the layout box and is banned outright (SPEC.md §1). This does
	 * the standard FLIP instead: place the indicator at its new box instantly, then
	 * animate `transform` from the inverted old box to identity. Only `transform`
	 * ever animates.
	 *
	 * The play step goes through `Element.animate()` rather than a class toggle
	 * across a frame boundary, so this file needs neither `requestAnimationFrame`
	 * (reserved for the singleton pointer engine) nor a `setTimeout` to clean up.
	 *
	 * Duration and easing are read from the same tokens as everything else, so
	 * `prefers-reduced-motion: reduce` collapses the morph to 1ms — the indicator
	 * still moves, it just stops travelling.
	 */
	let {
		ref = $bindable(null),
		target = null,
		orientation = 'horizontal',
		class: className,
		...restProps
	}: MorphIndicatorProps = $props();

	/** The box we last placed the indicator at, in offset-parent coordinates. */
	let previous: { x: number; y: number; width: number; height: number } | null = null;

	/*
	 * An `$effect` rather than a `$derived` because this is genuinely imperative:
	 * it measures live layout and drives an animation. §1 asks for `$effect` to be
	 * a last resort, and measurement is one of the few honest cases.
	 */
	$effect(() => {
		const node = ref;
		const active = target;
		if (!node) return;

		if (!active) {
			previous = null;
			node.style.setProperty('--morph-opacity', '0');
			return;
		}

		const parent = node.offsetParent as HTMLElement | null;
		if (!parent) return;

		const parentBox = parent.getBoundingClientRect();
		const targetBox = active.getBoundingClientRect();
		const next = {
			x: targetBox.left - parentBox.left,
			y: targetBox.top - parentBox.top,
			width: targetBox.width,
			height: targetBox.height
		};

		// F(irst) is `previous`; L(ast) is `next`. Place at Last synchronously.
		node.style.setProperty('--morph-x', `${next.x}px`);
		node.style.setProperty('--morph-y', `${next.y}px`);
		node.style.setProperty('--morph-width', `${next.width}px`);
		node.style.setProperty('--morph-height', `${next.height}px`);
		node.style.setProperty('--morph-opacity', '1');

		const from = previous;
		previous = next;
		// Nothing to invert on the first placement: appear, do not fly in from 0,0.
		if (!from) return;

		// I(nvert): the transform that puts the indicator back where it just was.
		const followX = orientation !== 'vertical';
		const followY = orientation !== 'horizontal';
		const translateX = followX ? from.x - next.x : 0;
		const translateY = followY ? from.y - next.y : 0;
		const scaleX = followX && next.width > 0 ? from.width / next.width : 1;
		const scaleY = followY && next.height > 0 ? from.height / next.height : 1;

		// P(lay).
		node.animate(
			[
				{
					transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
					transformOrigin: 'top left'
				},
				{ transform: 'none', transformOrigin: 'top left' }
			],
			{
				duration: duration('base'),
				easing: getComputedStyle(node).getPropertyValue('--ease-fx-out').trim() || 'ease-out'
			}
		);
	});
</script>

<!--
	`aria-hidden` is not optional. The indicator is a visual echo of a state that
	is already announced by the control it follows — a tab's `aria-selected`, a
	step's `aria-current`. Exposing it would make a screen reader say it twice,
	and SPEC.md §3.5 forbids any effect being the sole carrier of state, which
	cuts both ways: it must not be a second carrier either.
-->
<div
	bind:this={ref}
	data-slot="morph-indicator"
	aria-hidden="true"
	class={cn(
		'pointer-events-none absolute top-0 left-0 h-(--morph-height) w-(--morph-width) translate-x-(--morph-x) translate-y-(--morph-y) rounded-md bg-primary/10 opacity-(--morph-opacity)',
		className
	)}
	{...restProps}
></div>
