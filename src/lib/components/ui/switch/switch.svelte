<script lang="ts" module>
	import type { Snippet } from "svelte";
	import { Switch as SwitchPrimitive } from "bits-ui";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";

	/**
	 * §5 collapses vuesax's `switch-dot` and `switch-label` into `Switch` plus a
	 * `label` snippet. `switch-dot`'s shadow CSS was never extracted — only a
	 * 28-byte stub survives — so there is nothing to be faithful *to* and nothing
	 * is guessed at; what ships is the one collapse §5 actually names.
	 *
	 * No `glow`, `tilt`, `shimmer`, `gradient` or `magnet`: §3.4 gives form
	 * controls no decorative effects, so those props do not exist here at all.
	 */
	export type SwitchProps = WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		size?: "sm" | "default";
		/**
		 * Rendered beside the track, inside the same `<label>`, so the text is part
		 * of the control's hit area. A 32px track cannot hold text; see the note in
		 * the markup for why nothing is rendered *inside* it.
		 */
		label?: Snippet;
	};
</script>

<!--
	alrein-ui Switch — a strict superset of the shadcn-svelte Switch.

	The thumb is a **toggle thumb**, which with press feedback is one of exactly
	two things SPEC.md §2 permits `--ease-fx-spring` on. The overshoot is what
	makes a switch feel like it latches rather than slides. `pnpm bans:check`
	allowlists this file for that reason and no other. A11: there is no third
	overshoot anywhere in here — the label does not spring.

	The track colour runs on `ease-fx-out` over the same duration, so it arrives
	fractionally behind the thumb instead of alongside it.

	## What is *not* here

	- **No in-track ON/OFF text.** The track is 32×18.4px (24×14px at `sm`) with a
	  16px thumb, so the clear space beside the thumb is ~14px. Nothing legible
	  fits, and widening the track to make it fit is an effect that changes the
	  layout box (§1). Skipped deliberately rather than shipped illegible.
	- **No drag-to-toggle.** A15 defers it: it is not in §5's collapse list and it
	  means hand-rolling pointer handling on a control bits-ui owns (`F14`).
	- **No arrow-key handling.** bits-ui's Switch acts on Enter and Space; the
	  absolute ArrowRight = on / ArrowLeft = off that the vuesax source has is not
	  implemented there. A15 leaves that behaviour to bits-ui rather than
	  re-implementing it here, so it is deliberately absent rather than forgotten.
	  If it is wanted it belongs upstream, in bits-ui, not in a fork of its
	  keyboard handling.
-->
<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = "default",
		label,
		...restProps
	}: SwitchProps = $props();

	/*
	 * A `<label>` wrapping a `<button role="switch">` gives the whole thing one
	 * hit target for free — a button is a labelable element, so the browser
	 * forwards a click on the text to it, and it does *not* forward a click that
	 * started on the button itself, so there is no double toggle and no click
	 * handler of ours anywhere.
	 *
	 * The accessible name is a separate problem: HTML-AAM computes a button's name
	 * from its own subtree, never from an associated `<label>`, so the wrapper
	 * alone would leave the switch nameless. `aria-labelledby` is what actually
	 * names it. It is written before `{...restProps}` so a consumer's own
	 * `aria-label`/`aria-labelledby` still wins.
	 */
	const labelId = $props.id();
</script>

{#snippet control()}
	<SwitchPrimitive.Root
		bind:ref
		bind:checked
		data-slot="switch"
		data-size={size}
		aria-labelledby={label ? labelId : undefined}
		class={cn(
			"shrink-0 rounded-full border border-transparent shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 peer group/switch relative inline-flex items-center transition-all duration-fast ease-fx-out outline-none after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50",
			className
		)}
		{...restProps}
	>
		<SwitchPrimitive.Thumb
			data-slot="switch-thumb"
			class="rounded-full bg-background group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground pointer-events-none block ring-0 transition-transform duration-fast ease-fx-spring rtl:data-[state=checked]:translate-x-[calc(-100%)]"
		/>
	</SwitchPrimitive.Root>
{/snippet}

{#if label}
	<label
		data-slot="switch-field"
		class="group/switch-field inline-flex cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed"
	>
		{@render control()}
		<span
			data-slot="switch-label"
			id={labelId}
			class="text-sm leading-none font-medium select-none group-has-disabled/switch-field:opacity-50"
		>
			{@render label()}
		</span>
	</label>
{:else}
	{@render control()}
{/if}
