<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { Snippet } from "svelte";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * alrein-ui Chip — a new component. shadcn-svelte has no equivalent, so there
	 * is nothing to superset; `F1` does not apply and neither does the
	 * byte-identical-base rule. Everything else does.
	 *
	 * A Chip is a Badge that can be **selected** and can be **removed**. Both are
	 * structure, not decoration: SPEC.md §3.4 grants Chip `ghost ●` and
	 * `gradient ●` and nothing else — no glow, no shimmer, no tilt, no magnet.
	 * Those props do not exist below, so `<Chip glow />` is a compile error rather
	 * than a silently ignored attribute.
	 *
	 * ## Why the variant enum is not Badge's
	 *
	 * Badge's `default` is a solid `bg-primary`. A chip's resting state has to be
	 * low-emphasis, because **selection is an orthogonal axis that has to be able
	 * to raise it** — the vuesax source is explicit that `is-selected` overrides
	 * the variant with a full-strength fill, and that mapping selection onto the
	 * variant makes "an outline chip that is selected" inexpressible. So the enum
	 * is the source's own `soft | solid | outline`, plus the `ghost` that §3.4
	 * grants, with `soft` as the default. Every colour still resolves to shadcn's
	 * token set (`--primary`, `--muted`, `--border`) per A9; no palette is
	 * invented, and a consumer wanting a danger chip passes
	 * `class="bg-destructive/10 text-destructive"`, which wins because `cn()`
	 * merges the class prop last.
	 *
	 * ## Three defects of the source that are deliberately not inherited
	 *
	 * 1. The source's root is a `<button>` **in every case** — a decorative chip
	 *    is a `<button tabindex="-1">`, an interactive element pushed out of the
	 *    tab order. Here a non-selectable chip is a plain `<span>` (A15).
	 * 2. The source's close buttons are mouse-only (`tabIndex = -1`). Here the
	 *    remove affordance is a real `<button>` with a real accessible name, in
	 *    the tab order, next to the toggle rather than inside it — nesting a
	 *    button in a button is invalid HTML and is what forces everyone else into
	 *    the `tabindex="-1"` hack in the first place.
	 * 3. Hover styling is gated on interactivity. A decorative chip must not light
	 *    up on hover; shadcn's Badge has no such gate and people paste `hover:`
	 *    classes onto static badges.
	 *
	 * The source's `glow` (1.9s pulse while selected), `outline` (2.4s conic spin)
	 * and animated `gradient` pan (5s) skins are all declined: two of the three are
	 * effects the matrix withholds, and all three are idle loops on a *resting*
	 * state, which §3.5 forbids outright — an idle loop means loading.
	 */
	export const chipVariants = tv({
		slots: {
			root: "group/chip relative inline-flex w-fit shrink-0 items-center rounded-full border border-transparent font-medium whitespace-nowrap transition-colors duration-fast ease-fx-out data-disabled:pointer-events-none data-disabled:opacity-50",
			content:
				"inline-flex h-full min-w-0 items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
			label: "truncate",
			dot: "shrink-0 rounded-full bg-current opacity-60 transition-opacity duration-fast ease-fx-out group-data-[selected]/chip:opacity-100",
			avatar: "grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground [&>*]:size-full [&>*]:object-cover",
			remove:
				"inline-flex shrink-0 items-center justify-center rounded-full opacity-70 outline-none transition-opacity duration-fast ease-fx-out hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
		},
		variants: {
			variant: {
				soft: { root: "bg-primary/10 text-primary" },
				solid: { root: "bg-primary text-primary-foreground" },
				outline: { root: "border-border text-foreground" },
				ghost: { root: "text-muted-foreground" },
			},
			size: {
				sm: {
					root: "h-6 text-xs",
					content: "gap-1 ps-2 pe-2 [&_svg]:size-3",
					dot: "size-1.5",
					avatar: "-ms-1 size-4 text-[0.5rem]",
					remove: "me-1 size-4 [&_svg]:size-3",
				},
				default: {
					root: "h-8 text-sm",
					content: "gap-1.5 ps-2.5 pe-2.5 [&_svg]:size-3.5",
					dot: "size-2",
					avatar: "-ms-1 size-5 text-[0.625rem]",
					remove: "me-1.5 size-5 [&_svg]:size-3.5",
				},
			},
			/*
			 * A9: gradient is the one painted-surface effect §3.4 grants Chip. It
			 * resolves to the shared `fx-gradient` utility, whose stops are
			 * `color-mix` against `--fx-tint` — never a hardcoded pair, so a
			 * consumer retheming `--primary` retints this for free (§3.5).
			 */
			gradient: {
				true: { root: "fx-gradient border-transparent text-primary-foreground" },
			},
			/*
			 * Hover response exists only where there is something to click. The
			 * per-variant tints live in `compoundVariants` below.
			 */
			interactive: {
				true: { root: "cursor-pointer", content: "cursor-pointer" },
				false: {},
			},
			/*
			 * Selection is a *state*, and §3.5's accessibility floor says no effect
			 * may be the sole carrier of one. It is carried three ways here: the
			 * surface colour, the leading check mark, and `aria-pressed` on the
			 * toggle. Remove any two and the state is still legible.
			 */
			selected: {
				true: {},
				false: {},
			},
			removable: {
				true: { content: "pe-1" },
				false: {},
			},
		},
		compoundVariants: [
			{ variant: "soft", interactive: true, class: { root: "hover:bg-primary/20" } },
			{ variant: "solid", interactive: true, class: { root: "hover:bg-primary/80" } },
			{ variant: "outline", interactive: true, class: { root: "hover:bg-muted hover:text-foreground" } },
			{ variant: "ghost", interactive: true, class: { root: "hover:bg-muted hover:text-foreground" } },
			/*
			 * The full-strength fill, applied after the variants so it wins whatever
			 * the resting surface was.
			 */
			{
				selected: true,
				class: { root: "border-transparent bg-primary text-primary-foreground" },
			},
			/*
			 * The source ships an explicit rule keeping the selected fill on hover,
			 * with a comment explaining that without it the soft-variant hover rule
			 * reverts the background to a translucent tint while the foreground
			 * stays at full strength — which kills the contrast. It is exactly the
			 * kind of interaction a naive port loses, so it is written down here.
			 */
			{ selected: true, interactive: true, class: { root: "hover:bg-primary" } },
		],
		defaultVariants: {
			variant: "soft",
			size: "default",
			interactive: false,
			selected: false,
			removable: false,
		},
	});

	export type ChipVariant = NonNullable<VariantProps<typeof chipVariants>["variant"]>;
	export type ChipSize = NonNullable<VariantProps<typeof chipVariants>["size"]>;

	/** Variants that paint a surface, and therefore have something to gradient. */
	export type ChipSurfaceVariant = Exclude<ChipVariant, "ghost" | "outline">;

	/**
	 * The effect props Chip is allowed, conditioned on whether its variant paints
	 * a surface.
	 *
	 * A conditional type keyed on a variant generic, not a discriminated union —
	 * the same choice Badge and Button make, and for the same reason: a union
	 * collapses under `Omit<ComponentProps<typeof Chip>, …>`, which is exactly
	 * what a wrapper component does, and not breaking a wrapper is the stronger
	 * rule. See `button.svelte` for the long form of the argument.
	 *
	 * `ghost + gradient` is a contradiction (a transparent surface and a painted
	 * one), and a gradient on `outline` erases the border the variant exists for.
	 * §3.5 requires both to be type errors rather than doc comments.
	 */
	export type ChipEffects<V extends ChipVariant> = V extends "ghost" | "outline"
		? { gradient?: never }
		: {
				/** Promotional emphasis. Accent-derived stops, never a hardcoded pair. */
				gradient?: boolean;
			};

	interface ChipStructure {
		/** Height and type scale. `sm` is Button `xs`'s h-6, `default` is Button `sm`'s h-8 (A9). */
		size?: ChipSize;
		/**
		 * Makes the chip a toggle. The label area becomes a real `<button>` with
		 * `aria-pressed`; without it the chip is a plain `<span>` and stays out of
		 * the tab order the honest way, by not being interactive.
		 */
		selectable?: boolean;
		/** Bindable. Selection is orthogonal to the variant — an outline chip can be selected. */
		selected?: boolean;
		/** Callback form of `bind:selected`. Never `createEventDispatcher` (§1). */
		onSelectedChange?: (selected: boolean) => void;
		/** Adds the trailing remove button. Works on selectable and static chips alike. */
		removable?: boolean;
		/** Fired by the remove button. The chip does not remove itself — the list owner does. */
		onremove?: () => void;
		/** Accessible name of the remove button. German by default (§1.2). */
		removeLabel?: string;
		/**
		 * A leading status dot. Suppressed while the check mark or an avatar
		 * occupies the leading slot — the source has the same three mutually
		 * exclusive occupants, and it detects the avatar with a light-DOM
		 * `querySelector` plus a `slotchange` listener. A snippet prop is the
		 * Svelte 5 answer and needs neither.
		 */
		dot?: boolean;
		/** Leading avatar. Takes the leading slot ahead of the check mark and the dot. */
		avatar?: Snippet;
		/** Blocks toggling and removal, and dims the whole chip. */
		disabled?: boolean;
	}

	export type ChipProps<V extends ChipVariant = "soft"> = WithElementRef<
		HTMLAttributes<HTMLSpanElement>
	> & { variant?: V } & ChipStructure &
		ChipEffects<V>;
</script>

<script lang="ts" generics="V extends ChipVariant = 'soft'">
	import CheckIcon from "@lucide/svelte/icons/check";
	import XIcon from "@lucide/svelte/icons/x";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { press as pressEffect } from "$lib/fx/press.js";

	let {
		ref = $bindable(null),
		selected = $bindable(false),
		class: className,
		variant = "soft" as V,
		size = "default",
		selectable = false,
		onSelectedChange,
		removable = false,
		onremove,
		removeLabel = "Entfernen",
		dot = false,
		avatar,
		disabled = false,
		gradient,
		children,
		...restProps
	}: ChipProps<V> = $props();

	const fx = getFxContext();

	/* §3.4's `gradient ●`, narrowed by the same rule Badge uses: a transparent
	   surface has nothing to paint over. */
	const paintedSurface = $derived(variant !== "ghost" && variant !== "outline");
	const useGradient = $derived(fx.resolve("gradient", gradient, { available: paintedSurface }));

	const interactive = $derived(selectable || removable);
	const isSelected = $derived(selectable && selected === true);

	const styles = $derived(
		chipVariants({
			variant,
			size,
			gradient: useGradient,
			interactive,
			selected: isSelected,
			removable,
		})
	);

	function toggle() {
		if (disabled) return;
		selected = !selected;
		onSelectedChange?.(selected);
	}

	/*
	 * The remove button is a sibling of the toggle, not a descendant, so removing
	 * cannot toggle by bubbling. `stopPropagation` is still correct: a consumer is
	 * free to hang an `onclick` on the chip root, and "remove" must not also mean
	 * "activate the thing I just removed".
	 */
	function handleRemove(event: MouseEvent) {
		event.stopPropagation();
		if (disabled) return;
		onremove?.();
	}
</script>

{#snippet leading()}
	{#if avatar}
		<span data-slot="chip-avatar" class={styles.avatar()}>{@render avatar()}</span>
	{:else if isSelected}
		<CheckIcon data-slot="chip-check" aria-hidden="true" />
	{:else if dot}
		<span data-slot="chip-dot" class={styles.dot()}></span>
	{/if}
{/snippet}

<!--
	The root is a `<span>`, never a `<button>`. Press feedback and the surface live
	here so a press scales and tints the whole chip rather than just its label; the
	source gives the remove button a second, deeper press of its own, which is one
	more magnitude than the token scale has a name for and is not ported.
-->
<span
	bind:this={ref}
	data-slot="chip"
	data-selected={isSelected ? "" : undefined}
	data-disabled={disabled ? "" : undefined}
	class={cn(styles.root(), interactive && "fx-press", className)}
	{...restProps}
	{@attach interactive ? pressEffect({ enabled: () => !disabled }) : undefined}
>
	{#if selectable}
		<button
			type="button"
			data-slot="chip-toggle"
			class={styles.content()}
			aria-pressed={selected === true}
			{disabled}
			onclick={toggle}
		>
			{@render leading()}
			<span data-slot="chip-label" class={styles.label()}>{@render children?.()}</span>
		</button>
	{:else}
		<span data-slot="chip-content" class={styles.content()}>
			{@render leading()}
			<span data-slot="chip-label" class={styles.label()}>{@render children?.()}</span>
		</span>
	{/if}

	{#if removable}
		<button
			type="button"
			data-slot="chip-remove"
			class={styles.remove()}
			aria-label={removeLabel}
			{disabled}
			onclick={handleRemove}
		>
			<XIcon aria-hidden="true" />
		</button>
	{/if}
</span>
