<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	/**
	 * alrein-ui SkeletonGroup — **one light across the whole group, not one per bone.**
	 *
	 * This is new; upstream shadcn-svelte has no equivalent, and it is the single
	 * highest-value borrowing in Phase 2 (`VUESAX-INTENT-2.md` §15, candidate
	 * primitive 2). Six independent shimmers — which is what almost everybody
	 * ships, including this library's own `fx-shimmer-loading` on a bare
	 * `<Skeleton>` — look like six separate lights. One band crossing the avatar
	 * and every line at the same instant reads as one surface being loaded.
	 *
	 * The whole cost is a `container-type` and `cqw` mask sizing.
	 *
	 * ## How it works
	 *
	 * The group establishes an inline-size container query context. Every bone
	 * inside it sizes its mask in `cqw` — a percentage of **the group's** width,
	 * not its own — and animates `mask-position` across exactly one mask tile.
	 * Because all the bones share both the unit and the clock, their bands are the
	 * same band. The sweep is `transform`-free, `layout`-free CSS and there is no
	 * JavaScript in this file at all beyond reading a prop.
	 *
	 * Two details are load-bearing:
	 *
	 * - **`container-type: inline-size` is not optional.** `cqw` without it
	 *   silently resolves against the small viewport, and the group degrades to
	 *   per-bone shimmering that looks *nearly* right. That is why this is a real
	 *   component rather than a `group` prop on a wrapper: something has to own
	 *   the container, and a prop on a `<div>` the consumer supplies cannot.
	 * - **The band is a mask, not a highlight.** The notch is transparent, so what
	 *   shows through is whatever is behind the skeleton. On a tinted surface the
	 *   shine is that tint. There is no hardcoded white gradient to un-theme, and
	 *   `--sk-cut` controls the carve depth as a number rather than as a colour.
	 *
	 * ## Offsetting a bone that does not start at the group's left edge
	 *
	 * `mask-position` is measured from the bone's own box, so two bones at
	 * different x positions would show the band at different moments. Bones in a
	 * stack all start at the same edge and need nothing. A composite layout — an
	 * avatar beside a text column — sets `--sk-offset` on the inset bones to their
	 * distance from the group's left edge:
	 *
	 * ```svelte
	 * <Skeleton.Group class="flex gap-3">
	 *   <Skeleton shimmer class="size-10 rounded-full" />
	 *   <div class="flex-1 space-y-2 [--sk-offset:3.25rem]">
	 *     <Skeleton shimmer class="h-4 w-3/5" />
	 *     <Skeleton shimmer class="h-4 w-4/5" />
	 *   </div>
	 * </Skeleton.Group>
	 * ```
	 *
	 * ## A17
	 *
	 * The sweep runs on `--fx-shimmer-duration`, which slows to 3s under reduced
	 * motion rather than stopping. There is no `motion-reduce:` branch here, and
	 * adding one would put a second opinion next to the token that already holds
	 * the only one.
	 */
	export type SkeletonGroupProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * What a screen reader hears while the group is loading. `role="status"`
		 * with no text announces nothing at all, which is the usual way this gets
		 * shipped broken.
		 */
		label?: string;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		label = "Inhalt wird geladen",
		children,
		...restProps
	}: SkeletonGroupProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="skeleton-group"
	role="status"
	aria-busy="true"
	class={cn("cn-skeleton-group", className)}
	{...restProps}
>
	<span class="sr-only">{label}</span>
	{@render children?.()}
</div>

<style>
	/*
	 * The container. `container-type: inline-size` is a containment declaration,
	 * not an effect: it is on the group unconditionally, at every `data-fx` level,
	 * so toggling the effect layer cannot change it and acceptance criterion §7.10
	 * — zero reflow when `data-fx` changes — is unaffected by it.
	 */
	.cn-skeleton-group {
		container-type: inline-size;

		/* How much of the bone survives at the centre of the notch. Lower carves deeper. */
		--sk-cut: 14%;
		/* A bone's inset from the group's left edge; see the component comment. */
		--sk-offset: 0px;
	}

	/*
	 * The bones arrive through a snippet, so they carry the *page's* scope hash
	 * rather than this component's and a plain scoped selector would be pruned as
	 * unused. `:global()` on the descendant half is what keeps the rule; the
	 * ancestor half stays scoped, so this can only ever reach bones inside a
	 * group.
	 *
	 * `[data-shimmer]` is the bone's own opt-in — a group does not light up
	 * skeletons that did not ask to shimmer.
	 */
	.cn-skeleton-group :global([data-slot='skeleton'][data-shimmer]) {
		/*
		 * Replaces the per-bone light from `fx-shimmer-loading`: same opt-in, same
		 * token, one band instead of N.
		 */
		background-image: none;
		mask-image: linear-gradient(
			100deg,
			black 44%,
			color-mix(in oklab, black var(--sk-cut), transparent) 50%,
			black 56%
		);
		/*
		 * Two group-widths per tile, so at most one notch is over the group at a
		 * time and the other half of the cycle is the dwell between passes. It
		 * repeats rather than sitting on `no-repeat` because an unpainted mask area
		 * is *transparent* — a no-repeat band would erase the bone the moment it
		 * travelled past it.
		 */
		mask-size: 200cqw 100%;
		mask-repeat: repeat;
		animation: skeleton-group-sweep var(--fx-shimmer-duration) linear infinite;
	}

	/*
	 * §3.2 step 1: `data-fx="off"` is dead with no override possible. `fx.css`
	 * already says this for `.fx-shimmer-loading`, but the rule above is more
	 * specific than that one, so it has to be said again here or the group would
	 * out-specify the veto. The component also drops `data-shimmer` at that level;
	 * this is the half that holds without JavaScript.
	 */
	:global([data-fx='off']) .cn-skeleton-group :global([data-slot='skeleton'][data-shimmer]) {
		animation: none;
		mask-image: none;
	}

	/*
	 * One tile of travel, so the loop is seamless. `--sk-offset` shifts a bone's
	 * band back by its own inset, which is what keeps a composite layout on one
	 * clock.
	 */
	@keyframes skeleton-group-sweep {
		from {
			mask-position: calc(var(--sk-offset) * -1) 0;
		}
		to {
			mask-position: calc(200cqw - var(--sk-offset)) 0;
		}
	}
</style>
