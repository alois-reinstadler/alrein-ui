<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef, WithoutChildren } from "$lib/utils.js";

	/**
	 * alrein-ui Skeleton — a strict superset of the shadcn-svelte Skeleton.
	 *
	 * Upstream is one div: `rounded-md bg-muted animate-pulse`. All three classes
	 * are still here and still the default, so `<Skeleton class="h-4 w-32" />`
	 * renders exactly what it renders today.
	 *
	 * §3.4 gives Skeleton **shimmer, and nothing else** — no gradient, no glow, no
	 * tilt, no magnet — and this is the one component in Phase 2 whose source
	 * needs no decline at all: vuesax applies nothing beyond the matrix either.
	 *
	 * ## This is the one place the idle loop belongs
	 *
	 * §3.5 splits shimmer in two. The looping form is **loading only**, and it is
	 * `fx-shimmer-loading`: a pure-CSS utility with **no JavaScript whatsoever**,
	 * not the `shimmer.ts` attachment. Nothing imports `$lib/fx` here except the
	 * policy context. A skeleton is the loading state, so the loop is honest here
	 * and a migraine anywhere else.
	 *
	 * ## A17 — reduced motion slows the loop, it does not stop it
	 *
	 * A motionless skeleton asserts that the work has finished. Under
	 * `prefers-reduced-motion: reduce`, `tokens.css` takes `--fx-shimmer-duration`
	 * to 3s rather than to zero — deliberately unlike `--fx-shimmer-sweep-duration`,
	 * the decorative sweep's token, which does go to zero. There is no
	 * reduced-motion branch in this file and there must not be one: the exception
	 * lives in exactly one place, in the token, and every loading indicator in the
	 * library inherits it.
	 *
	 * ## Two loops on one bone
	 *
	 * `pulse` therefore defaults to *not* running when `shimmer` does — one loop
	 * per element unless the consumer explicitly asks for both (the source ships
	 * `animation="both"`, so the combination is legitimate; it just is not a
	 * default anybody should get by accident). With no props at all, `shimmer` is
	 * off and `pulse` is on, which is upstream.
	 *
	 * Inside `<Skeleton.Group>` the group's single sweep replaces the bone's own
	 * animation, so `pulse` has no effect there — see `skeleton-group.svelte`.
	 */
	export const skeletonVariants = tv({
		base: "rounded-md bg-muted",
		variants: {
			pulse: { true: "animate-pulse" },
			/*
			 * `data-shimmer` is what `<Skeleton.Group>` selects on to upgrade a bone
			 * from its own private light to the group's shared one. The class is what
			 * makes it shimmer on its own when there is no group.
			 */
			shimmer: { true: "fx-shimmer-loading" },
		},
	});

	export type SkeletonVariants = VariantProps<typeof skeletonVariants>;

	export type SkeletonProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
		/**
		 * The loading sweep. Pure CSS, and the only idle loop the library permits
		 * outside a spinner.
		 *
		 * On its own, each bone runs its own light. Inside `<Skeleton.Group>` one
		 * light crosses every bone as a single pass.
		 */
		shimmer?: boolean;
		/**
		 * Upstream's opacity beat. Defaults to on, and to off when `shimmer` takes
		 * over — pass it explicitly to run both.
		 */
		pulse?: boolean;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		shimmer,
		pulse,
		...restProps
	}: SkeletonProps = $props();

	const fx = getFxContext();

	/*
	 * §3.2, through the one function that implements it. `data-fx="off"` kills the
	 * sweep here and, independently, in `fx.css` — the CSS half matters because a
	 * skeleton is the first thing on a page and may well render before, or
	 * without, any JavaScript at all.
	 *
	 * Shimmer is not pointer-tracked, so neither a coarse pointer nor a density
	 * scope touches it, and reduced motion slows it rather than vetoing it (A17).
	 */
	const useShimmer = $derived(fx.resolve("shimmer", shimmer));
	const usePulse = $derived(pulse ?? !useShimmer);
</script>

<div
	bind:this={ref}
	data-slot="skeleton"
	data-shimmer={useShimmer ? "" : undefined}
	class={cn(skeletonVariants({ shimmer: useShimmer, pulse: usePulse }), className)}
	{...restProps}
></div>
