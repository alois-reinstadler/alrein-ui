<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";
	import type { AvatarProps } from "./avatar.svelte";

	/**
	 * alrein-ui AvatarGroup — a strict superset of the shadcn-svelte AvatarGroup.
	 *
	 * The upstream class string is byte-identical. Two things are added: the fan,
	 * and the policy scope that enforces the group's row of the capability matrix.
	 *
	 * ## §3.4 row "AvatarGroup (children)": gradient ● · shimmer ● loading, nothing else
	 *
	 * That row is about the *children*, so it cannot be a prop on this component
	 * and it cannot be a type on `<Avatar>` either — the same `<Avatar>` is legal
	 * with a glow outside a group and illegal inside one. It is enforced instead
	 * through the mechanism §3.2 already has for exactly this shape: the group
	 * publishes a **density scope**. Step 5 of the resolution chain downgrades
	 * glow, tilt and magnet off inside `list` or `table` density and leaves
	 * gradient and shimmer alone — which is the matrix row, exactly, with no new
	 * mechanism invented for it.
	 *
	 * A group of faces *is* a list. Nothing is special-cased.
	 *
	 * `AvatarGroupItemProps` below is the compile-time half of the same statement,
	 * asserted in `avatar.types.ts`.
	 *
	 * ## Layout inventory row 4 — the `grid` skin is declined, the fan is re-expressed
	 *
	 * The source's `grid` skin animates the container's `gap` and the items'
	 * `margin` over 420ms with a 22ms stagger. §1 forbids both. It is also
	 * redundant: the base skin already performs the identical fan with
	 * `translateX`, so `spread` reuses that and the skin does not ship.
	 *
	 * Two further pieces of the source's spread are dropped deliberately. The
	 * hovered item's `translateZ(38px)` through a container `perspective: 620px`
	 * would make the whole group a 3D context, so any tooltip or popover anchored
	 * to an avatar inside it mis-positions — the A10/A20 hazard again. And the 2px
	 * lift is left off because it buys nothing once the items have separated.
	 *
	 * Even the flat fan puts a `translate` on each item, and a transform creates a
	 * containing block for `position: fixed`. **Do not anchor floating UI to an
	 * avatar inside a spreading group.**
	 */
	export const avatarGroupVariants = tv({
		base: "cn-avatar-group group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
		variants: {
			/*
			 * The fan, as transform only. Each item is pushed right by its index
			 * times one overlap step, so item 2 exactly cancels `-space-x-2`, item 3
			 * doubles it, and so on. `translate` is its own property, so this stacks
			 * with a child's press `scale` instead of fighting it over `transform`.
			 *
			 * Capped at eight because the rules are enumerated: beyond that, use
			 * `max` and let `<Avatar.GroupCount>` carry the remainder, which is what
			 * it is for.
			 */
			spread: {
				true: [
					"[&>*]:transition-[translate] [&>*]:duration-base [&>*]:ease-fx-out",
					"[&:is(:hover,:focus-within)>*:nth-child(2)]:translate-x-2",
					"[&:is(:hover,:focus-within)>*:nth-child(3)]:translate-x-4",
					"[&:is(:hover,:focus-within)>*:nth-child(4)]:translate-x-6",
					"[&:is(:hover,:focus-within)>*:nth-child(5)]:translate-x-8",
					"[&:is(:hover,:focus-within)>*:nth-child(6)]:translate-x-10",
					"[&:is(:hover,:focus-within)>*:nth-child(7)]:translate-x-12",
					"[&:is(:hover,:focus-within)>*:nth-child(8)]:translate-x-14",
				],
			},
		},
	});

	export type AvatarGroupVariants = VariantProps<typeof avatarGroupVariants>;

	export type AvatarGroupProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Fan the stack apart on hover or keyboard focus, so an overlapped face can
		 * be read. Transform only — the layout never moves.
		 */
		spread?: boolean;
	};

	/**
	 * The capability matrix's "AvatarGroup (children)" row as a type.
	 *
	 * Nothing forces a call site to use it — the runtime enforcement is the
	 * density scope above, which needs no cooperation from the consumer. This
	 * exists so `avatar.types.ts` can assert the row rather than describe it, and
	 * so a wrapper component that renders group items can adopt the narrower
	 * contract and get the error at its own boundary.
	 */
	export type AvatarGroupItemProps = Omit<AvatarProps, "glow" | "tilt">;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getFxContext, setFxContext } from "$lib/fx/context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		spread,
		...restProps
	}: AvatarGroupProps = $props();

	/*
	 * Synchronous, not an effect, and for the same reason `<FxScope>` is: effects
	 * do not run during SSR, so a scope configured in one renders its parent's
	 * policy on the server and only corrects on hydration.
	 *
	 * The level is left to inherit — a group changes *density*, not the preset.
	 */
	const scope = setFxContext(getFxContext());
	scope.configure(
		() => undefined,
		() => "list"
	);
</script>

<div
	bind:this={ref}
	data-slot="avatar-group"
	data-spread={spread ? "" : undefined}
	data-fx-density="list"
	class={cn(avatarGroupVariants({ spread }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
