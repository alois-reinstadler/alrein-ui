<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	/**
	 * alrein-ui Field — a strict superset of the shadcn-svelte Field.
	 *
	 * The upstream base and all three orientations are byte-identical. What is
	 * added is `state`, which the vuesax form controls carry as a first-class
	 * concept (`danger`, `warn`, `success`) and which shadcn expresses only as the
	 * binary `data-[invalid=true]`.
	 *
	 * The state is published as `data-state` on the group and colours the label
	 * and description. It deliberately does **not** reach into the control's own
	 * border from here — controls opt in with
	 * `group-data-[state=danger]/field:border-destructive`, which is the shadcn
	 * idiom and keeps each control in charge of its own surface rather than having
	 * the group reach through it with a descendant selector.
	 *
	 * `danger` maps to shadcn's own `--destructive`. There is no `--danger` alias;
	 * inventing a synonym for a token that already exists is exactly the
	 * parallel-universe mistake A9 exists to prevent.
	 */
	export const fieldVariants = tv({
		base: "gap-3 data-[invalid=true]:text-destructive group/field flex w-full",
		variants: {
			state: {
				default: "",
				danger:
					"[&_[data-slot=field-label]]:text-destructive [&_[data-slot=field-description]]:text-destructive/80",
				warn: "[&_[data-slot=field-label]]:text-warning [&_[data-slot=field-description]]:text-warning/80",
				success:
					"[&_[data-slot=field-label]]:text-success [&_[data-slot=field-description]]:text-success/80",
			},
			orientation: {
				vertical: "cn-field-orientation-vertical flex-col [&>*]:w-full [&>.sr-only]:w-auto",
				horizontal:
					"cn-field-orientation-horizontal flex-row items-center has-[>[data-slot=field-content]]:items-start [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
				responsive:
					"cn-field-orientation-responsive flex-col @md/field-group:flex-row @md/field-group:items-center @md/field-group:has-[>[data-slot=field-content]]:items-start [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
			},
		},
		defaultVariants: {
			orientation: "vertical",
			state: "default",
		},
	});

	export type FieldOrientation = VariantProps<typeof fieldVariants>["orientation"];

	/**
	 * `danger` is the same severity as `aria-invalid`; setting it does not set
	 * `aria-invalid` for you, because a warning or a success is not an invalid
	 * value and conflating them would lie to a screen reader. Pass `aria-invalid`
	 * on the control when the value really is invalid.
	 */
	export type FieldState = VariantProps<typeof fieldVariants>["state"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		orientation = "vertical",
		state = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		orientation?: FieldOrientation;
		state?: FieldState;
	} = $props();
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="field"
	data-orientation={orientation}
	data-state={state}
	class={cn(fieldVariants({ orientation, state }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
