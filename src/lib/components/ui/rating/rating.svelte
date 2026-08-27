<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { RatingGroup as RatingGroupPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
	import type { FieldState } from "$lib/components/ui/field/field.svelte";

	/**
	 * alrein-ui Rating — a new component. shadcn-svelte has no Rating at all.
	 *
	 * **SPEC.md §3.4 has no Rating row, which per the matrix's own note means no
	 * decorative effects whatsoever.** Nothing here imports `$lib/fx`. The
	 * extension is entirely structure and behaviour, and the accessibility is the
	 * whole job.
	 *
	 * ## Where the behaviour comes from
	 *
	 * `bits-ui@2.19.0` ships `RatingGroup`, and it is exactly right, so this file
	 * hand-rolls nothing (`F14`). From bits-ui, for free:
	 *
	 *   - `role="slider"` on the wrapper with a **single tab stop**, plus
	 *     `aria-valuenow` / `valuemin` / `valuemax` / `valuetext` / `aria-orientation`
	 *     / `aria-readonly` / `aria-disabled`. Not five buttons in a row, which is
	 *     the classic mistake and makes the control unusable.
	 *   - Arrow keys (Left/Down decrement, Right/Up increment, RTL-aware),
	 *     **Home → min (0, not 1)**, End → max, PageUp/PageDown by whole steps,
	 *     and direct numeric entry including `3` `.` `5`.
	 *   - Half values by geometry: the hit test is which side of the item the
	 *     pointer is on, and the keyboard step follows `allowHalf` automatically.
	 *   - A hover preview that moves the fill but **never touches
	 *     `aria-valuenow`** — bits-ui renders items from `hoverValue ?? value`
	 *     while reporting `value` to assistive technology.
	 *   - Clearing: clicking the first item while it is the current value sets 0,
	 *     as does Home. "Rated 3" and "not rated" stay distinguishable.
	 *   - A hidden input when `name` is set, so the control is part of a form.
	 *   - Items are `role="presentation"`. A `role="slider"` has presentational
	 *     children by ARIA, so the source's `<button aria-label="3 of 5">` per star
	 *     — a slider containing buttons — is both invalid and pointless; it is not
	 *     reproduced.
	 *
	 * What is added on top is the German accessible name and value text (§1.2),
	 * the fill geometry, the `emoji` variant (§5), sizes, and `state`.
	 *
	 * ## The fill is `clip-path`, everywhere, and never a height
	 *
	 * `VUESAX-INTENT-2.md` §16 row 6: the source's `bars` skin animates the fill's
	 * `height` while every other skin uses `clip-path`, and the verdict is
	 * "re-express as `scaleY` from the bottom, or `clip-path` like every other
	 * rating skin does. Standardise."
	 *
	 * Standardised, and the re-expression is structural rather than per-skin:
	 * `bars` is not a variant here at all (§5 lists Rating with `variant="emoji"`
	 * only, and `F16` is scope inflation), and the **one** fill mechanism every
	 * variant shares is `clip-path: inset(0 var(--rating-inset) 0 0)`. `clip-path`
	 * is paint, not layout, so the transition below cannot reflow and the §1 ban
	 * on animating the layout box holds by construction rather than by review.
	 *
	 * ## What is declined, on the record
	 *
	 * - **The per-star ripple** and the **90px proximity glow** (A20, A23): both
	 *   are effects §3.4 does not grant Rating. There is also no `fx-press`: the
	 *   items are `role="presentation"` and the pressable control is the slider
	 *   root, so a press would scale the whole row. The acknowledgement here is the
	 *   fill committing to the pressed position, on the same event.
	 * - **The `glow` skin's 2.4s halo pulse on lit stars** — an idle loop on a
	 *   resting state, which §3.5 allows only for loading.
	 * - **The hover lift** (`translateY(-2px)` / `scale(1.08)`): a sixth transform
	 *   that is not the mark, on a component with no effects budget at all.
	 * - **The mark pop.** `VUESAX-INTENT-2.md` argues one overshoot is defensible
	 *   here under the toggle-mark allowance. §2 names that allowance for press
	 *   feedback and toggle thumbs, a rating is neither, and `A11` is explicit that
	 *   extending it from two mechanics to three is the creep that ended in 124
	 *   spring uses across 30 components (`F6`). The fill sweep is the feedback.
	 * - **`filter: grayscale` on unselected emoji.** The fill geometry is the state
	 *   carrier in both variants; the emoji variant expresses "unfilled" as the
	 *   same muted track the star variant uses, so there is one mechanism to
	 *   understand instead of two.
	 */
	export const ratingVariants = tv({
		slots: {
			root: "group/rating inline-flex w-fit items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50",
			item: "relative inline-flex shrink-0 items-center justify-center",
			/** The unfilled layer. In flow, so it is what gives the item its size. */
			track: "inline-flex size-full items-center justify-center",
			/**
			 * The filled layer, clipped to `--rating-inset`. Out of flow, so nothing
			 * it does can move a sibling — the §1 guarantee, structurally.
			 */
			fill: "pointer-events-none absolute inset-0 inline-flex items-center justify-center transition-[clip-path] duration-base ease-fx-out [clip-path:inset(0_var(--rating-inset)_0_0)]",
			glyph: "leading-none",
			value: "tabular-nums text-muted-foreground",
		},
		variants: {
			variant: {
				default: { track: "text-muted-foreground/45" },
				/* No filter. "Unfilled" is the same muted track the stars use. */
				emoji: { track: "opacity-30" },
			},
			size: {
				sm: { root: "gap-0.5", item: "size-4", glyph: "text-sm", value: "ms-1.5 text-xs" },
				default: { root: "gap-1", item: "size-5", glyph: "text-lg", value: "ms-2 text-sm" },
				lg: { root: "gap-1.5", item: "size-7", glyph: "text-2xl", value: "ms-2.5 text-base" },
			},
			/*
			 * Matches `Field`'s own `state`. `danger` maps to shadcn's `--destructive`;
			 * `warn` and `success` use the `--warning` / `--success` values, which are
			 * registered in the `--color-*` namespace and so behave like any other
			 * shadcn colour (A9). Setting `state="danger"` deliberately does not set
			 * `aria-invalid` — a warning is not an invalid value.
			 */
			state: {
				default: { fill: "text-primary" },
				danger: { fill: "text-destructive" },
				warn: { fill: "text-warning" },
				success: { fill: "text-success" },
			},
			/** Only a control that can take a value gets a pointer cursor. */
			interactive: {
				true: { item: "cursor-pointer" },
				false: { item: "cursor-default" },
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			state: "default",
			interactive: true,
		},
	});

	export type RatingVariant = NonNullable<VariantProps<typeof ratingVariants>["variant"]>;
	export type RatingSize = NonNullable<VariantProps<typeof ratingVariants>["size"]>;

	/**
	 * bits-ui's per-item state. Declared rather than imported: the package exports
	 * `RootProps` and `ItemProps` from its namespace but not this union, and a deep
	 * import into `bits-ui/dist/…` would break on any internal reshuffle.
	 */
	type RatingItemState = "active" | "partial" | "inactive";

	/**
	 * The emoji scale, low to high, mapped onto `max` by proportion so a 3-, 5- or
	 * 10-point scale all read correctly. Language-neutral, so §1.2 does not apply.
	 */
	const EMOJI_SCALE = ["😠", "🙁", "😐", "🙂", "😍"] as const;

	/** de-AT throughout (§1.2), so a half star announces and prints as "3,5". */
	const VALUE_FORMAT = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 1 });

	interface RatingExtensions {
		/** §5: Rating plus `variant="emoji"`. `default` is the star scale. */
		variant?: RatingVariant;
		/** `sm` is shadcn's icon size (`size-4`); `default` is one step up. */
		size?: RatingSize;
		/** Per-control state colour on the filled layer. Matches `Field`'s `state`. */
		state?: FieldState;
		/**
		 * Print the value next to the scale. Marked `aria-hidden`: a `role="slider"`
		 * has presentational children, and `aria-valuetext` already announces it —
		 * without the attribute nothing changes for assistive tech, but the intent
		 * is worth stating where a reader can see it.
		 */
		showValue?: boolean;
	}

	export type RatingProps = WithoutChildrenOrChild<RatingGroupPrimitive.RootProps> &
		RatingExtensions;
</script>

<script lang="ts">
	import StarIcon from "@lucide/svelte/icons/star";

	let {
		ref = $bindable(null),
		value = $bindable(0),
		class: className,
		variant = "default",
		size = "default",
		state = "default",
		showValue = false,
		max = 5,
		allowHalf = false,
		readonly = false,
		disabled = false,
		"aria-label": ariaLabel = "Bewertung",
		"aria-valuetext": ariaValuetext = (current: number, total: number) =>
			`${VALUE_FORMAT.format(current)} von ${total}`,
		...restProps
	}: RatingProps = $props();

	const interactive = $derived(!readonly && !disabled);

	const styles = $derived(ratingVariants({ variant, size, state, interactive }));

	/**
	 * How much of one item is filled, as a fraction.
	 *
	 * Two sources, and which one is right depends on whether the control can be
	 * pointed at:
	 *
	 *  - **Interactive** — read bits-ui's item state, because that is what follows
	 *    the hover preview. An interactive rating's value is always on the step
	 *    grid (1, or 0.5 with `allowHalf`), so `active | partial | inactive` is a
	 *    lossless description of it.
	 *  - **`readonly` / `disabled`** — read the value directly, because there is no
	 *    hover preview to follow and the value is free to be a fraction. This is
	 *    what makes a 3.7 average render as 3.7 rather than snapping to 3.5, and it
	 *    is the reason the fill is a geometry rather than a set of half-glyphs.
	 */
	function fillOf(index: number, itemState: RatingItemState): number {
		if (!interactive) return Math.min(1, Math.max(0, value - index));
		if (itemState === "active") return 1;
		return itemState === "partial" ? 0.5 : 0;
	}

	/** `inset()` clips from the *end*, so an item filled 0.3 is inset 70%. */
	function insetOf(index: number, itemState: RatingItemState): string {
		return `${(1 - fillOf(index, itemState)) * 100}%`;
	}

	function emojiFor(index: number): string {
		if (max <= 1) return EMOJI_SCALE[EMOJI_SCALE.length - 1];
		const position = (index / (max - 1)) * (EMOJI_SCALE.length - 1);
		return EMOJI_SCALE[Math.round(position)];
	}
</script>

{#snippet glyph(index: number, filled: boolean)}
	{#if variant === "emoji"}
		<span class={styles.glyph()}>{emojiFor(index)}</span>
	{:else}
		<StarIcon class={filled ? "size-full fill-current" : "size-full fill-transparent"} />
	{/if}
{/snippet}

<RatingGroupPrimitive.Root
	bind:ref
	bind:value
	data-slot="rating"
	class={cn(styles.root(), className)}
	aria-label={ariaLabel}
	aria-valuetext={ariaValuetext}
	{max}
	{allowHalf}
	{readonly}
	{disabled}
	{...restProps}
>
	{#snippet children({ items })}
		{#each items as item (item.index)}
			<RatingGroupPrimitive.Item
				index={item.index}
				data-slot="rating-item"
				class={styles.item()}
			>
				<span data-slot="rating-item-track" class={styles.track()} aria-hidden="true">
					{@render glyph(item.index, false)}
				</span>
				<span
					data-slot="rating-item-fill"
					class={styles.fill()}
					style:--rating-inset={insetOf(item.index, item.state)}
					aria-hidden="true"
				>
					{@render glyph(item.index, true)}
				</span>
			</RatingGroupPrimitive.Item>
		{/each}

		{#if showValue}
			<span data-slot="rating-value" class={styles.value()} aria-hidden="true">
				{VALUE_FORMAT.format(value)} von {max}
			</span>
		{/if}
	{/snippet}
</RatingGroupPrimitive.Root>
