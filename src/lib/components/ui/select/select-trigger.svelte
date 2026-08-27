<script lang="ts" module>
	import { Select as SelectPrimitive } from "bits-ui";
	import { tv } from "tailwind-variants";
	import type { WithoutChild } from "$lib/utils.js";
	import type { FieldState } from "../field/field.svelte";

	/**
	 * `base` is the upstream shadcn-svelte trigger class list, unchanged except
	 * for `duration-fast ease-fx-out` on the transition it already had — upstream
	 * leaves that on Tailwind's default 150ms, and every other alrein control
	 * (Switch, Checkbox, RadioGroupItem) already reads the motion scale here.
	 *
	 * The `state` axis is the vuesax tone set (`danger` / `warn` / `success`),
	 * expressed as Tailwind utilities per A2 — not a bespoke prop, not a CSS
	 * custom property. `danger` resolves to shadcn's own `--destructive`;
	 * `warn`/`success` to the `--warning`/`--success` colours registered in
	 * `tokens.css`. There is no `--danger` alias, for the reason field.svelte
	 * gives: inventing a synonym for a token that already exists is the
	 * parallel-universe mistake (`F15`).
	 *
	 * `inherit` is the default and is the *only* value that emits the
	 * `group-data-[state=*]/field:` selectors, so an explicit `state` on the
	 * trigger and an inherited one from `<Field state="…">` can never both paint
	 * the border and leave the winner to stylesheet order.
	 */
	export const selectTriggerVariants = tv({
		base: "gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm shadow-xs transition-[color,box-shadow] duration-fast ease-fx-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:flex *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			state: {
				inherit:
					"group-data-[state=danger]/field:border-destructive group-data-[state=danger]/field:focus-visible:border-destructive group-data-[state=danger]/field:focus-visible:ring-destructive/40 group-data-[state=warn]/field:border-warning group-data-[state=warn]/field:focus-visible:border-warning group-data-[state=warn]/field:focus-visible:ring-warning/40 group-data-[state=success]/field:border-success group-data-[state=success]/field:focus-visible:border-success group-data-[state=success]/field:focus-visible:ring-success/40",
				default: "",
				danger:
					"border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40",
				warn: "border-warning focus-visible:border-warning focus-visible:ring-warning/40",
				success: "border-success focus-visible:border-success focus-visible:ring-success/40",
			},
			/**
			 * Inside `<Field.Floating>` the fieldset owns the border, the background
			 * and the focus ring — it is the element the notch is cut out of — so the
			 * trigger drops all three rather than drawing a second box inside the
			 * first. The border stays present but transparent so the control's
			 * metrics do not change between the two placements.
			 */
			floating: {
				true: "w-full border-transparent bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent",
				false: "",
			},
			/** Not `disabled`: full opacity, still focusable. Only the cursor says so. */
			loading: {
				true: "cursor-progress",
				false: "",
			},
		},
		defaultVariants: {
			state: "inherit",
			floating: false,
			loading: false,
		},
	});

	/**
	 * `state="danger"` deliberately does **not** set `aria-invalid`. A warning and
	 * a success are not invalid values, and `danger` is the same severity word for
	 * all three — conflating tone with validity would lie to a screen reader. Pass
	 * `aria-invalid` yourself when the value really is invalid; upstream's
	 * `aria-invalid:*` classes are still in the base string and still fire.
	 *
	 * No `glow`, no `tilt`: §3.4 gives Select no decorative effects at all. §3.5
	 * and A14 forbid glow on a form field because a glow on focus competes with
	 * the focus ring and reads as an error state, and A13/§3.5 forbid tilt on
	 * anything hosting floating UI because a `transform` on an ancestor makes the
	 * portal anchor to it.
	 */
	export type SelectTriggerProps = WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: "sm" | "default";
		/** Tone. Inherited from a surrounding `<Field state="…">` when omitted. */
		state?: FieldState;
		/** Blocks interaction without disabling: full opacity, keeps focus, `aria-busy`. */
		loading?: boolean;
	};
</script>

<!--
	alrein-ui SelectTrigger — a strict superset of the shadcn-svelte trigger.

	Every upstream class, prop and behaviour survives; what is added is the tone
	set, a `loading` state and floating-label adoption.

	**A13 — the trigger→menu morph is not ported.** It animates `height` over
	560ms and drives itself with inline styles plus a `transitionend` listener and
	a timeout fallback; §1 bans all three. The menu animates off `data-state` with
	the `motion.css` utilities like every other bits-ui surface. The close handoff
	(the trigger reappearing under a clearing blur) is not ported either, and the
	reason is structural rather than a ban: our trigger is never hidden, so there
	is no swap to conceal. See the note in `select-content.svelte`.
-->
<script lang="ts">
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn } from "$lib/utils.js";
	import { getFloatingFieldId } from "../field/floating-context.svelte.js";
	import type { HTMLButtonAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		state,
		loading = false,
		id,
		onclick,
		onpointerdown,
		onpointerup,
		onkeydown,
		...restProps
	}: SelectTriggerProps = $props();

	/*
	 * `undefined` outside a floating field, which is the signal to change nothing.
	 * An explicit `id` always wins, so a consumer who wires the association by
	 * hand keeps it.
	 */
	const floatingFieldId = getFloatingFieldId();
	const insideFloatingField = floatingFieldId !== undefined;
	const triggerId = $derived(id ?? floatingFieldId?.());

	type ClickHandler = NonNullable<HTMLButtonAttributes["onclick"]>;
	type PointerHandler = NonNullable<HTMLButtonAttributes["onpointerdown"]>;
	type KeyboardHandler = NonNullable<HTMLButtonAttributes["onkeydown"]>;

	/*
	 * How `loading` blocks interaction without `disabled`.
	 *
	 * bits-ui merges a trigger's incoming props with its own via `mergeProps`,
	 * which composes event handlers and skips the rest of the chain once one of
	 * them calls `preventDefault()`. Ours run first, so a `preventDefault()` here
	 * stops bits-ui's open/close handler without touching `disabled` — the button
	 * keeps full opacity, keeps focus and keeps its place in the tab order, which
	 * is exactly the distinction the vuesax source draws between `loading` and
	 * `disabled`.
	 */
	function blockedWhileLoading(event: Event): boolean {
		if (!loading) return false;
		event.preventDefault();
		return true;
	}

	const handleClick: ClickHandler = (event) => {
		if (blockedWhileLoading(event)) return;
		onclick?.(event);
	};

	const handlePointerDown: PointerHandler = (event) => {
		if (loading) {
			/*
			 * `preventDefault()` is the only lever that stops bits-ui's handler, and
			 * on a pointerdown it also suppresses the click's default focus. Focus is
			 * put back explicitly, or a loading field would become unfocusable by
			 * mouse — which is the `disabled` behaviour this state exists not to be.
			 */
			event.preventDefault();
			event.currentTarget.focus();
			return;
		}
		onpointerdown?.(event);
	};

	const handlePointerUp: PointerHandler = (event) => {
		if (blockedWhileLoading(event)) return;
		onpointerup?.(event);
	};

	/*
	 * Only the keys bits-ui acts on are swallowed: Enter, Space and the arrows
	 * open the menu, and any single printable character drives its typeahead.
	 * Tab, Shift+Tab and Escape stay live — a loading field that cannot be left
	 * is a focus trap, which is a worse bug than the one being prevented.
	 */
	const handleKeydown: KeyboardHandler = (event) => {
		const opens = event.key === "Enter" || event.key === "ArrowDown" || event.key === "ArrowUp";
		if (loading && (opens || event.key.length === 1)) {
			event.preventDefault();
			return;
		}
		onkeydown?.(event);
	};
</script>

<SelectPrimitive.Trigger
	bind:ref
	id={triggerId}
	data-slot="select-trigger"
	data-size={size}
	data-field-state={state}
	data-loading={loading ? "" : undefined}
	aria-busy={loading ? "true" : undefined}
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onkeydown={handleKeydown}
	class={cn(
		selectTriggerVariants({ state: state ?? "inherit", floating: insideFloatingField, loading }),
		className
	)}
	{...restProps}
>
	{@render children?.()}
	{#if loading}
		<!--
			Spinner owns the loading-indicator wiring, including A17's rule that the
			loop *slows* under reduced motion rather than stopping — a parked ring
			claims the request has finished. It is `aria-hidden` here because the
			trigger already carries `aria-busy`, and announcing the same fact twice
			is worse than announcing it once.
		-->
		<Spinner
			data-slot="select-trigger-spinner"
			aria-hidden="true"
			size="sm"
			class="pointer-events-none shrink-0"
		/>
	{:else}
		<ChevronDownIcon class="size-4 text-muted-foreground pointer-events-none" />
	{/if}
</SelectPrimitive.Trigger>

