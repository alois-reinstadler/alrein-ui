<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';

	export type MorphOrientation = 'horizontal' | 'vertical' | 'both';

	/**
	 * `children` are rendered inside the indicator, which is what makes A25b
	 * possible: any of them carrying `data-morph-counter-scale` is given the
	 * inverse of the indicator's own scale, so a fixed-size part — Tabs `chrome`'s
	 * two shoulders — keeps its size while the sled stretches. Anchor each one
	 * with its own `transform-origin`. Most consumers pass nothing.
	 */
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
		children,
		...restProps
	}: MorphIndicatorProps = $props();

	/** The box we last placed the indicator at, in offset-parent coordinates. */
	let previous: { x: number; y: number; width: number; height: number } | null = null;

	/**
	 * Bumped to force a re-measure without the target changing.
	 *
	 * Two things move an indicator without anyone selecting anything, and both
	 * would otherwise leave it stale under the wrong tab:
	 *
	 * - **The container resizes.** A `ResizeObserver` on the offset parent catches
	 *   it. Not a `window` resize listener: the container can change size without
	 *   the window doing so, and `pointer.svelte.ts` owns window-level listeners.
	 * - **A web font arrives late.** Text reflows after first paint, so a tab
	 *   measured against the fallback font is measured wrong. `document.fonts.ready`
	 *   is the signal, and a `ResizeObserver` on the *track* does not see it,
	 *   because the track's own box often does not change — only the tab inside it.
	 */
	let remeasure = $state(0);

	/*
	 * An `$effect` rather than a `$derived` because this is genuinely imperative:
	 * it measures live layout and drives an animation. §1 asks for `$effect` to be
	 * a last resort, and measurement is one of the few honest cases.
	 */
	$effect(() => {
		const node = ref;
		if (!node) return;
		const parent = node.offsetParent;
		if (!(parent instanceof HTMLElement)) return;

		const observer = new ResizeObserver(() => (remeasure += 1));
		observer.observe(parent);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (typeof document === 'undefined' || !document.fonts) return;
		let live = true;
		void document.fonts.ready.then(() => {
			if (live) remeasure += 1;
		});
		return () => {
			live = false;
		};
	});

	$effect(() => {
		const node = ref;
		const active = target;
		// Read so a resize or a late font re-runs this placement.
		remeasure;
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

		const computed = getComputedStyle(node);
		const easing = computed.getPropertyValue('--ease-fx-out').trim() || 'ease-out';

		/*
		 * A19's radius compensation, and it is not optional decoration.
		 *
		 * A `scaleX` of 2.5 on a pill whose radius is half its height turns it into
		 * a lozenge for the length of the travel — the corners stretch with
		 * everything else. Pre-dividing the radius by the scale on the *inverted*
		 * keyframe means it renders at its intended size throughout, and CSS
		 * interpolates it back to the real value as the scale unwinds.
		 *
		 * `border-radius: Xpx / Ypx` sets the horizontal and vertical radii
		 * independently, which is exactly what a non-uniform scale needs. This is
		 * paint, not layout, so §1 permits animating it — and `check-layout-safety`
		 * agrees, because `border-radius` is not in its layout set.
		 *
		 * Skipped entirely when both scales are 1, which is the common case for a
		 * uniform row (Pagination's buttons are all `size-9`), so nothing pays for
		 * a track it does not need.
		 */
		const stretches = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;
		const radius = Number.parseFloat(computed.borderTopLeftRadius) || 0;
		const distorts = radius > 0 && stretches;

		// P(lay).
		node.animate(
			distorts
				? [
						{
							transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
							transformOrigin: 'top left',
							borderRadius: `${radius / scaleX}px / ${radius / scaleY}px`
						},
						{
							transform: 'none',
							transformOrigin: 'top left',
							borderRadius: `${radius}px`
						}
					]
				: [
						{
							transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
							transformOrigin: 'top left'
						},
						{ transform: 'none', transformOrigin: 'top left' }
					],
			{ duration: duration('base'), easing }
		);

		/*
		 * A25b's counter-scaled child, and the reason `chrome` can have its
		 * shoulders back.
		 *
		 * The radius track above fixes the *corners* of a stretching box, but
		 * anything drawn at a fixed size inside it — Tabs' two quarter-disc
		 * shoulders — still squashes with everything else, because `scaleX` scales
		 * paint uniformly. The digest called this out as the one thing FLIP cannot
		 * reproduce with a pseudo-element, and the fix it named is this: make the
		 * fixed-size part a real child and give it the inverse scale, so the two
		 * transforms cancel and it renders at its intended size for the whole
		 * travel.
		 *
		 * Opt-in per element via `data-morph-counter-scale`, because most consumers
		 * have nothing to counter-scale and should not pay for a second animation.
		 * The child's anchor is its own `transform-origin`, set in CSS next to the
		 * geometry it belongs to: a shoulder on the left edge pins to `right`, the
		 * one on the right edge pins to `left`, and each stays flush against the
		 * sled's rendered edge rather than drifting toward the middle.
		 *
		 * Same duration and easing as the parent, started in the same task, so the
		 * two stay in lockstep without either one sampling the other.
		 *
		 * That last point costs a known, bounded residual, and it is worth being
		 * exact about it rather than claiming the cancellation is perfect. Both
		 * animations interpolate under the same easing `e(t)`, so the composite
		 * scale is `lerp(s, 1, e) × lerp(1/s, 1, e)`, which is 1 at both ends but
		 * not in between. Measured on Tabs `chrome` over its widest travel — an
		 * 83px sled to 141px, s ≈ 1.7 — an 8px shoulder peaks at 8.55px and is back
		 * under 8.1px within four frames. Half a pixel for a tenth of a second.
		 *
		 * Cancelling exactly would mean sampling the easing curve and emitting a
		 * keyframe per step, which is the shape of the very thing §8.1 `F5` is
		 * about, for an error nobody can see. If a consumer ever counter-scales
		 * something large enough for 7% to matter, that is the point to revisit it.
		 */
		if (!stretches) return;
		const counterScaled = node.querySelectorAll<HTMLElement>('[data-morph-counter-scale]');
		for (const child of counterScaled) {
			child.animate(
				[{ transform: `scale(${1 / scaleX}, ${1 / scaleY})` }, { transform: 'none' }],
				{ duration: duration('base'), easing }
			);
		}
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
>{@render children?.()}</div>
