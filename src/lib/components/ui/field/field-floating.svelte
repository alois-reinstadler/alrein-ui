<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";
	import type { FieldState } from "./field.svelte";

	export type FieldFloatingProps = WithElementRef<HTMLAttributes<HTMLFieldSetElement>> & {
		/** The label text. Rendered twice — see the note in the markup. */
		label: string;
		/** Matches `Field`'s state so a floating field can be tinted the same way. */
		state?: FieldState;
		/**
		 * Associates the label with the control. Omit it and the field generates
		 * one, publishing it through context so Input, Textarea and Select pick it
		 * up automatically.
		 */
		for?: string;
		/** The control. It must carry `placeholder=" "` — see below. */
		children: Snippet;
	};
</script>

<!--
	alrein-ui FieldFloating — the notched floating label (SPEC.md §5, A16).

	This is the one structural feature the vuesax form controls have that
	shadcn-svelte has no equivalent for, and it is built once here rather than
	three times inside Input, Textarea and Select.

	## How it works, and why this shape

	It is a real `<fieldset>` with a real `<legend>`. The legend is `height: 0` and
	its `max-width` animates from nothing to its content width, which cuts a
	genuine gap in the top border as the label rises. The alternative — a label
	with an opaque background painted over the border — breaks the moment the
	field sits on anything but a flat surface, and breaks completely on a
	gradient. The zero height is the load-bearing detail: without it the legend
	participates in the fieldset's block layout and the border jumps.

	**A16:** yes, this animates `max-width`, a layout property. It gets the same
	carve-out as the `collapse` transition — the layout change *is* the thing being
	animated, not a decoration draped over one. `check-layout-safety` polices the
	effect layer, which this is not part of, so it is out of scope by construction
	rather than by exemption.

	## Why there is no JavaScript

	"Is the field filled?" is `:not(:placeholder-shown)`, and "is it focused?" is
	`:focus-within`. Both are CSS, so the label floats before hydration and keeps
	working if the bundle never arrives. **The control must carry
	`placeholder=" "`** — a single space — or `:placeholder-shown` never matches
	and the label stays down over the user's text. Input and Textarea set that for
	you when they are inside a floating field.

	## Why the label appears twice

	The legend copy is `invisible` and exists only to reserve the notch width, so
	the gap in the border is exactly as wide as the text. The visible copy is the
	one that moves. Only one is exposed: the legend copy is `aria-hidden`, and the
	visible one is a real `<label>` that the control points at.
-->
<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { setFloatingFieldId } from "./floating-context.svelte.js";

	let {
		ref = $bindable(null),
		label,
		state = "default",
		for: htmlFor,
		class: className,
		children,
		...restProps
	}: FieldFloatingProps = $props();

	const generated = $props.id();
	const controlId = $derived(htmlFor ?? generated);

	// Published so the control inside the snippet can adopt it without the
	// consumer wiring an id by hand.
	setFloatingFieldId(() => controlId);
</script>

<fieldset
	bind:this={ref}
	data-slot="field-floating"
	data-state={state}
	class={cn(
		"relative min-w-0 rounded-md border border-input bg-transparent px-2.5 pb-1 transition-colors duration-fast ease-fx-out",
		"has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
		"has-disabled:cursor-not-allowed has-disabled:opacity-50",
		"data-[state=danger]:border-destructive data-[state=warn]:border-warning data-[state=success]:border-success",
		"dark:bg-input/30",
		className
	)}
	{...restProps}
>
	<!--
		The notch. `max-width` is what animates; `width: auto` on the content keeps
		the gap sized to the text rather than to a guess.
	-->
	<legend
		data-slot="field-floating-notch"
		aria-hidden="true"
		class={cn(
			"invisible ms-1 h-0 max-w-[0.01px] overflow-hidden whitespace-nowrap p-0 text-xs transition-[max-width] duration-fast ease-fx-out"
		)}
	>
		<span class="px-1">{label}</span>
	</legend>

	<label
		data-slot="field-floating-label"
		for={controlId}
		class={cn(
			"pointer-events-none absolute start-2.5 top-1/2 z-10 origin-[0_50%] -translate-y-1/2 px-1 text-base text-muted-foreground transition-[transform,color] duration-fast ease-fx-out md:text-sm",
			// Raised when focused or filled. `--float-y` lands the label on the top
			// border; `scale` shrinks it to the notch's text size.
			"[fieldset:focus-within_&]:-translate-y-[calc(50%+var(--field-floating-rise))] [fieldset:focus-within_&]:scale-[0.8]",
			"[fieldset:has(:not(:placeholder-shown))_&]:-translate-y-[calc(50%+var(--field-floating-rise))] [fieldset:has(:not(:placeholder-shown))_&]:scale-[0.8]",
			"[fieldset:focus-within_&]:text-ring",
			"[fieldset[data-state=danger]_&]:text-destructive [fieldset[data-state=warn]_&]:text-warning [fieldset[data-state=success]_&]:text-success"
		)}
	>
		{label}
	</label>

	{@render children()}
</fieldset>

<style>
	/*
	 * One value, not a duration or an easing, so it is not part of the motion
	 * scale. It is the distance from the field's vertical centre to its top
	 * border, which depends on the control's height and so belongs here rather
	 * than in the token layer.
	 */
	fieldset {
		--field-floating-rise: 0.85rem;
	}

	/*
	 * `group-focus-within` on the legend needs the fieldset to be the group, and
	 * Tailwind's `group` marker cannot sit on the same element as the variant that
	 * reads it. Scoped CSS is the smaller of the two evils here; the alternative
	 * is a wrapper div that would break the fieldset/legend relationship the
	 * notch depends on.
	 */
	fieldset:focus-within legend,
	fieldset:has(:not(:placeholder-shown)) legend {
		max-width: 100%;
	}
</style>
