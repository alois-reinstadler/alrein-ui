<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	/**
	 * alrein-ui ButtonGroup — a strict superset of the shadcn-svelte ButtonGroup.
	 *
	 * The class strings, both orientations and the two sub-components are
	 * byte-identical to upstream. What is added is not a variant: it is a
	 * **constraint on the children**.
	 *
	 * §3.4's row reads `ghost ● · gradient ● · glow — · shimmer — · tilt — ·
	 * magnet —`. Read as a rule rather than a table, that is: buttons in a group
	 * may be painted, and may not move. Which is exactly what a density scope
	 * does — so this does not need a mechanism of its own, it needs the one that
	 * already exists.
	 *
	 * The reason the rule is right: glow means "the highest-intent target on this
	 * surface" (§3.1), and a group of buttons is a set of peers. Three glowing
	 * peers is not emphasis, and a tilting one in a joined row breaks the seam the
	 * group's whole styling exists to create.
	 */
	export const buttonGroupVariants = tv({
		base: "has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md flex w-fit items-stretch [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
		variants: {
			orientation: {
				horizontal:
					"[&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-md! [&>[data-slot]]:rounded-r-none [&>[data-slot]~[data-slot]]:rounded-l-none [&>[data-slot]~[data-slot]]:border-l-0",
				vertical:
					"[&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-md! flex-col [&>[data-slot]]:rounded-b-none [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0",
			},
		},
		defaultVariants: {
			orientation: "horizontal",
		},
	});

	export type ButtonGroupOrientation = VariantProps<typeof buttonGroupVariants>["orientation"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getFxContext, setFxContext } from "$lib/fx/context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		orientation = "horizontal",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		orientation?: ButtonGroupOrientation;
	} = $props();

	/*
	 * The group *is* the scope, rather than wrapping its children in an `<FxScope>`.
	 *
	 * That is not a micro-optimisation, it is a correctness requirement.
	 * `<FxScope>` renders a `display: contents` div, and `display: contents`
	 * removes an element from the **box tree** but not from the **selector tree** —
	 * so every one of the joined-edge rules above, which are all `> [data-slot]`,
	 * would stop matching and the group would fall apart into separate buttons.
	 *
	 * Setting the context here and publishing `data-fx-density` on the group's own
	 * element gets the same policy with no extra node.
	 */
	const fx = setFxContext(getFxContext());
	fx.configure(
		() => undefined,
		() => "list"
	);
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="button-group"
	data-orientation={orientation}
	data-fx={fx.level}
	data-fx-density={fx.density}
	class={cn(buttonGroupVariants({ orientation }), className)}
	{...restProps}
>
	<!--
		A button inside a group keeps `gradient` and the `ghost` variant and loses
		glow, shimmer, tilt and magnet — resolved by the same §3.2 chain as
		everything else, rather than by a second rule this component invents.
	-->
	{@render children?.()}
</div>
