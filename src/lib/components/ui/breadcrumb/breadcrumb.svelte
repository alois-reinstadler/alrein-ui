<script lang="ts" module>
	import { getContext, hasContext, setContext } from "svelte";
	import { tv, type VariantProps } from "tailwind-variants";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * alrein-ui Breadcrumb — a strict superset of the shadcn-svelte Breadcrumb.
	 *
	 * All seven upstream pieces (`Root`, `List`, `Item`, `Link`, `Page`,
	 * `Separator`, `Ellipsis`) are still here under the same names with the same
	 * props and the same `data-slot` values. Diff against
	 * `git show ff42eae:src/lib/components/ui/breadcrumb/`.
	 *
	 * §3.4 grants Breadcrumb **`ghost ●` and nothing else** — no gradient, no
	 * glow, no shimmer, no tilt, no magnet. So this is the shortest row in the
	 * matrix and the longest list of declines in the digest, and the declines are
	 * the interesting part of the file.
	 *
	 * What is added:
	 *   - `variant="ghost"`, which gives each crumb the transparent-at-rest,
	 *     tinted-on-hover surface §3.1 means by ghost. The default trail stays
	 *     byte-identical.
	 *   - press feedback on the crumbs (§3.1: always on, never opt-in), as the
	 *     flat scale A10 chose rather than the source's 3D tilt.
	 *   - the source's touch-target correction, which is worth stealing verbatim.
	 *     See `breadcrumb-link.svelte`.
	 *
	 * ## Declined from the source — all four of its signatures, on the record
	 *
	 * The crumb *is* its press in the source, and the press is both mechanics the
	 * amendments already rejected, applied at once:
	 *
	 * - **The 3D press** — `perspective(420px) rotateX(≤12°) rotateY(≤9°)
	 *   scale(0.93)`. A10/A20. `perspective()` creates a containing block for
	 *   `position: fixed`, and press is always on, so every crumb that ever hosts
	 *   a dropdown or a tooltip would anchor its portal to a transformed ancestor.
	 *   Nine of nineteen components in the source do this; declining it is one
	 *   decision, not nine.
	 * - **The 620ms `linear()` damped spring peaking at 1.15 on release.** A11.
	 *   This is the *third* occurrence of the exact mechanic A11 declined
	 *   (checkbox label, radio label, breadcrumb crumb), and §2 permits overshoot
	 *   on press feedback and toggle thumbs only — at our scale, not at 620ms.
	 * - **The 1820ms "water-drop" text reveal.** A20. It clones the element's text
	 *   and expands a radial through `background-clip: text`; it reads
	 *   `textContent`, so it silently breaks for any rich label, and §3.4 grants
	 *   it to none of the three components that carry it.
	 * - **The cursor light on the letters** (120px radius, and on the separators
	 *   too). A20: that is a pointer-tracked **glow**, on a component the matrix
	 *   gives no glow. Also the `glow` skin's 1600ms infinite flicker on hover —
	 *   §3.5, an idle loop means loading or it is a migraine.
	 *
	 * Also declined: the **`collapse` skin's in-place expansion**. It is a real
	 * piece of structure shadcn lacks, and it is count-based rather than measured
	 * (no `ResizeObserver`, no width test), one-way and latched with no route
	 * back, and it overflows the instant it expands unless the last-crumb
	 * truncation rule comes with it. shadcn's own answer — `Breadcrumb.Ellipsis`
	 * opening a menu — is the composable one, it is already in this file's
	 * exports, and §5 does not list an overflow strategy for Breadcrumb (`F16`).
	 */
	export const breadcrumbVariants = tv({
		base: "cn-breadcrumb",
		variants: {
			variant: {
				default: "",
				ghost: "",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BreadcrumbVariant = NonNullable<VariantProps<typeof breadcrumbVariants>["variant"]>;

	export interface BreadcrumbContext {
		readonly variant: BreadcrumbVariant;
	}

	const KEY = Symbol("alrein-breadcrumb");

	export function setBreadcrumbContext(context: BreadcrumbContext): void {
		setContext(KEY, context);
	}

	/**
	 * Falls back to `default` outside a root, because upstream's pieces all work
	 * standalone and a consumer composing their own wrapper relies on that.
	 *
	 * The variant travels in context rather than as a prop on every crumb for the
	 * same reason Accordion's does: a trail whose crumbs disagree about their own
	 * surface is not a trail, and making the consumer repeat `variant="ghost"`
	 * five times is how they end up disagreeing.
	 */
	export function getBreadcrumbContext(): BreadcrumbContext {
		if (hasContext(KEY)) return getContext<BreadcrumbContext>(KEY);
		return { variant: "default" };
	}

	export type BreadcrumbProps = WithElementRef<HTMLAttributes<HTMLElement>> & {
		/** `ghost` gives each crumb a transparent surface that tints on hover (§3.1). */
		variant?: BreadcrumbVariant;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: BreadcrumbProps = $props();

	setBreadcrumbContext({
		get variant() {
			return variant;
		},
	});
</script>

<!--
	The `<nav aria-label>` landmark and the `<ol>`/`<li>` structure are upstream's
	and stay upstream's (`F14`). Breadcrumbs are links, so the native tab order is
	already correct — the digest is explicit that a roving tabindex would be
	*wrong* here, not missing.
-->
<nav
	bind:this={ref}
	data-slot="breadcrumb"
	data-variant={variant}
	aria-label="breadcrumb"
	class={cn(breadcrumbVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</nav>
