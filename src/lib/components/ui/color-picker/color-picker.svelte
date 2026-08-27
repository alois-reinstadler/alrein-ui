<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	/**
	 * alrein-ui ColorPicker. New — shadcn-svelte has no equivalent.
	 *
	 * §5 collapses vuesax's six pickers into one component with a `variant`, all
	 * sharing one `ColorState`. Six separate pickers is how you get six different
	 * answers to "what happens when the user types an invalid hex".
	 *
	 * §3.4 has no row for ColorPicker, so **no decorative effects at all**. A
	 * colour picker's entire job is to show colour accurately; a glow over it is a
	 * lie about the value.
	 *
	 * ## The sliders are the control; the areas are a convenience
	 *
	 * Every variant renders the same three native `<input type="range">` controls
	 * for lightness, chroma and hue (plus alpha when enabled). Native ranges bring
	 * keyboard operation, form association and screen-reader announcement for
	 * free, and they cannot drift out of sync with the visual because both read
	 * the same `ColorState`.
	 *
	 * The 2D area and the hue ring are **pointer affordances layered on top**, and
	 * they are `aria-hidden`. A 2D colour field has no honest ARIA shape — the
	 * source puts `role="slider"` on a two-axis surface, which is invalid for the
	 * same reason A24 flags on Rating. Keyboard users lose nothing, because the
	 * sliders do exactly the same job.
	 *
	 * Dragging uses `setPointerCapture` rather than a document listener, so there
	 * is no global `pointermove` (`F9`) and no cleanup to forget: capture routes
	 * every subsequent move to the element that took it, including moves outside
	 * its box, and releases automatically on pointer-up.
	 */
	export const colorPickerVariants = tv({
		slots: {
			root: "flex w-full max-w-64 flex-col gap-3",
			area: "relative h-32 w-full cursor-crosshair rounded-md border touch-none",
			handle:
				"pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
			swatch: "size-8 shrink-0 rounded-md border",
			sliders: "flex flex-col gap-2",
			field: "flex items-center gap-2",
			readout:
				"h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 font-mono text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
		},
		variants: {
			variant: {
				/** Area, hue, alpha, hex. Everything. */
				default: {},
				/** Just the swatch and a hex field — for a toolbar. */
				compact: { root: "max-w-40 flex-row items-center" },
				/** A fixed palette. No free choice, which is the point. */
				palette: { root: "max-w-none" },
				/** A conic hue wheel with a lightness area inside it. */
				ring: {},
				/** Sliders only, no 2D surface. The most accessible presentation. */
				slider: {},
				/** A palette plus a free picker underneath. */
				swatches: { root: "max-w-none" },
			},
		},
		defaultVariants: { variant: "default" },
	});

	export type ColorPickerVariants = VariantProps<typeof colorPickerVariants>;
	export type ColorPickerVariant = NonNullable<ColorPickerVariants["variant"]>;

	export type ColorPickerProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Bindable. Accepts hex or a CSS `oklch()` string; emits the same form it was given. */
		value?: string;
		variant?: ColorPickerVariant;
		/** Show the alpha slider. Off by default — most pickers do not need it. */
		alpha?: boolean;
		/** Swatches for the `palette` and `swatches` variants. Hex or `oklch()`. */
		palette?: string[];
		onValueChange?: (value: string) => void;
		label?: string;
	};

	/**
	 * A small default palette, evenly spaced around the OKLCH hue circle at
	 * constant lightness and chroma — so the swatches read as equally bright,
	 * which is the whole reason for working in OKLCH.
	 */
	export const DEFAULT_PALETTE: string[] = Array.from(
		{ length: 8 },
		(_, index) => `oklch(62.00% 0.1400 ${(index * 45).toFixed(2)})`
	).concat(["oklch(20.00% 0.0000 0)", "oklch(60.00% 0.0000 0)", "oklch(97.00% 0.0000 0)"]);
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { ColorState } from "./color-state.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable("#4a7c59"),
		variant = "default",
		alpha = false,
		palette = DEFAULT_PALETTE,
		onValueChange,
		label = "Farbe",
		class: className,
		...restProps
	}: ColorPickerProps = $props();

	const colour = new ColorState(value);
	const classes = $derived(colorPickerVariants({ variant }));

	/** Emit in whichever form the consumer handed us, so their storage stays stable. */
	const emits = $derived(value.trim().startsWith("#") ? "hex" : "css");

	function commit() {
		const next = emits === "hex" ? colour.hex : colour.css;
		if (next === value) return;
		value = next;
		onValueChange?.(next);
	}

	function setFromPointer(event: PointerEvent, axis: "area" | "ring") {
		const box = event.currentTarget as HTMLElement;
		const rect = box.getBoundingClientRect();
		if (axis === "area") {
			// x is chroma, y is lightness. 0.37 is roughly the widest chroma sRGB
			// reaches, so the area spans the useful range rather than mostly-empty
			// out-of-gamut space.
			colour.chroma = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * 0.37;
			colour.lightness = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
		} else {
			const dx = event.clientX - (rect.left + rect.width / 2);
			const dy = event.clientY - (rect.top + rect.height / 2);
			colour.hue = (Math.atan2(dy, dx) * 180) / Math.PI;
		}
		commit();
	}

	/*
	 * `setPointerCapture` is why this component needs no document-level
	 * `pointermove` listener: the element that captures receives every subsequent
	 * move, including ones outside its own box, and the capture releases itself on
	 * pointer-up. No global listener, nothing to clean up, and dragging off the
	 * edge behaves correctly for free.
	 */
	function startDrag(event: PointerEvent, axis: "area" | "ring") {
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		setFromPointer(event, axis);
	}

	function drag(event: PointerEvent, axis: "area" | "ring") {
		if (event.buttons === 0) return;
		setFromPointer(event, axis);
	}

	const showArea = $derived(variant === "default" || variant === "swatches");
	const showRing = $derived(variant === "ring");
	const showSliders = $derived(variant !== "compact" && variant !== "palette");
	const showPalette = $derived(variant === "palette" || variant === "swatches");
	const showHex = $derived(variant !== "palette");
</script>

<div
	bind:this={ref}
	data-slot="color-picker"
	data-variant={variant}
	role="group"
	aria-label={label}
	class={cn(classes.root(), className)}
	{...restProps}
>
	{#if showArea}
		<!--
			aria-hidden, and deliberately. A two-axis colour field has no honest ARIA
			shape; the source puts role="slider" on one, which is invalid for the same
			reason A24 flags on Rating. The three sliders below carry the semantics and
			do exactly the same job from the keyboard.
		-->
		<div
			data-slot="color-picker-area"
			aria-hidden="true"
			class={classes.area()}
			style="background:
				linear-gradient(to top, oklch(0% 0 {colour.hue}), transparent, oklch(100% 0 {colour.hue})),
				linear-gradient(to right, oklch(62% 0 {colour.hue}), oklch(62% 0.37 {colour.hue}))"
			onpointerdown={(event) => startDrag(event, "area")}
			onpointermove={(event) => drag(event, "area")}
		>
			<span
				data-slot="color-picker-handle"
				class={classes.handle()}
				style="left: {(colour.chroma / 0.37) * 100}%; top: {(1 - colour.lightness) * 100}%; background: {colour.css}"
			></span>
		</div>
	{/if}

	{#if showRing}
		<div
			data-slot="color-picker-ring"
			aria-hidden="true"
			class={cn(classes.area(), "aspect-square h-auto rounded-full")}
			style="background: conic-gradient(
				oklch(62% 0.16 0), oklch(62% 0.16 60), oklch(62% 0.16 120),
				oklch(62% 0.16 180), oklch(62% 0.16 240), oklch(62% 0.16 300), oklch(62% 0.16 360))"
			onpointerdown={(event) => startDrag(event, "ring")}
			onpointermove={(event) => drag(event, "ring")}
		>
			<span
				data-slot="color-picker-handle"
				class={classes.handle()}
				style="left: {50 + 42 * Math.cos((colour.hue * Math.PI) / 180)}%; top: {50 + 42 * Math.sin((colour.hue * Math.PI) / 180)}%; background: {colour.css}"
			></span>
		</div>
	{/if}

	{#if showPalette}
		<div data-slot="color-picker-palette" class="flex flex-wrap gap-1.5">
			{#each palette as entry (entry)}
				<button
					type="button"
					data-slot="color-picker-swatch"
					aria-label={entry}
					aria-pressed={colour.css === entry || colour.hex === entry}
					class={cn(
						classes.swatch(),
						"size-6 transition-transform duration-instant ease-fx-out aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-2 aria-pressed:ring-offset-background"
					)}
					style="background: {entry}"
					onclick={() => {
						colour.set(entry);
						commit();
					}}
				></button>
			{/each}
		</div>
	{/if}

	{#if showSliders}
		<div data-slot="color-picker-sliders" class={classes.sliders()}>
			<!--
				Native range inputs. Keyboard operation, form association and
				announcement come free, and because both the slider and the visual read
				the same ColorState there is no second copy to drift.
			-->
			<label class={classes.field()}>
				<span class="w-12 shrink-0 text-xs text-muted-foreground">Hell</span>
				<input
					type="range"
					data-slot="color-picker-lightness"
					min="0"
					max="1"
					step="0.005"
					bind:value={
						() => colour.lightness,
						(next) => {
							colour.lightness = next;
							commit();
						}
					}
					class="h-2 w-full accent-primary"
				/>
			</label>
			<label class={classes.field()}>
				<span class="w-12 shrink-0 text-xs text-muted-foreground">Bunt</span>
				<input
					type="range"
					data-slot="color-picker-chroma"
					min="0"
					max="0.37"
					step="0.002"
					bind:value={
						() => colour.chroma,
						(next) => {
							colour.chroma = next;
							commit();
						}
					}
					class="h-2 w-full accent-primary"
				/>
			</label>
			<label class={classes.field()}>
				<span class="w-12 shrink-0 text-xs text-muted-foreground">Ton</span>
				<input
					type="range"
					data-slot="color-picker-hue"
					min="0"
					max="360"
					step="1"
					bind:value={
						() => colour.hue,
						(next) => {
							colour.hue = next;
							commit();
						}
					}
					class="h-2 w-full accent-primary"
				/>
			</label>
			{#if alpha}
				<label class={classes.field()}>
					<span class="w-12 shrink-0 text-xs text-muted-foreground">Deckung</span>
					<input
						type="range"
						data-slot="color-picker-alpha"
						min="0"
						max="1"
						step="0.01"
						bind:value={
							() => colour.alpha,
							(next) => {
								colour.alpha = next;
								commit();
							}
						}
						class="h-2 w-full accent-primary"
					/>
				</label>
			{/if}
		</div>
	{/if}

	{#if showHex}
		<div data-slot="color-picker-readout" class={classes.field()}>
			<span
				data-slot="color-picker-preview"
				aria-hidden="true"
				class={classes.swatch()}
				style="background: {colour.css}"
			></span>
			<input
				type="text"
				data-slot="color-picker-hex"
				aria-label="Hex-Wert"
				spellcheck="false"
				class={classes.readout()}
				value={colour.hex}
				oninput={(event) => {
					colour.hex = event.currentTarget.value;
					commit();
				}}
			/>
			{#if !colour.inGamut}
				<!--
					OKLCH can name colours sRGB cannot show. Saying so beats clipping
					quietly and leaving the user dragging a handle that has stopped
					changing anything.
				-->
				<span data-slot="color-picker-gamut" class="shrink-0 text-xs text-warning" title="Außerhalb des sRGB-Farbraums">!</span>
			{/if}
		</div>
	{/if}
</div>
