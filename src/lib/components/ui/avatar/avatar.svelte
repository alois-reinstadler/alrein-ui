<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { Avatar as AvatarPrimitive } from "bits-ui";

	/**
	 * alrein-ui Avatar — a strict superset of the shadcn-svelte Avatar.
	 *
	 * The `base` string below is the upstream class list, verbatim, and all six
	 * upstream files survive untouched in shape: `Avatar.Root`, `Avatar.Image`,
	 * `Avatar.Fallback`, `Avatar.Badge`, `Avatar.Group`, `Avatar.GroupCount`.
	 * `avatar.types.ts` asserts that, because collapsing a family into one
	 * monolith and silently deleting its sub-components is the prior attempt's
	 * worst failure (SPEC.md §8, `F1`).
	 *
	 * Upstream already has `size`, so the `◐ size ≥ lg` condition on tilt has
	 * something real to test — no new sizing prop was needed (A9 would have
	 * forbidden inventing one anyway).
	 *
	 * §3.4 permits Avatar: gradient (**fallback background only**), glow
	 * (**presence state**), shimmer (**loading**), tilt (**size ≥ lg**). No ghost
	 * — an avatar is a face, not a surface with a secondary state — and no magnet.
	 *
	 * ## Where the effects land, and why not on the root
	 *
	 * `gradient` and `shimmer` paint the **fallback**, never the root, so they can
	 * never cover a loaded photograph. That is not a runtime check: the classes
	 * are emitted as descendant variants scoped to `[data-slot=avatar-fallback]`,
	 * so "fallback background only" is enforced by the selector rather than by a
	 * doc comment. It also keeps `avatar-fallback.svelte` byte-identical to
	 * upstream.
	 *
	 * `glow` is the **bloom** half only (`fx-glow-bloom`), not the inner layer.
	 * `fx-glow` paints a `z-index: -1` pseudo-element, and an avatar's own image
	 * is opaque and fills the whole circle — the inner glow would be invisible
	 * behind it. A halo around the face is also what "presence" should look like.
	 *
	 * ## A23 — the radius is 160px, not the 180px token
	 *
	 * `--fx-glow-radius: 180px` is a Button-sized number. The source scales its
	 * proximity radius to the element and uses **160px** for Avatar. The override
	 * is set as a custom property on the element rather than passed as a JS
	 * option, because `pointer.svelte.ts` resolves the magnitude by reading
	 * `--fx-glow-radius` off the node — so one declaration drives both the
	 * proximity maths and the size of the painted halo, and they cannot drift.
	 *
	 * ## A20 — the source's 3D press is declined
	 *
	 * vuesax presses its avatar with `perspective(320px) rotateX(…) rotateY(…)
	 * scale(0.94)`. Declined: `perspective()` creates a containing block for
	 * `position: fixed`, and avatars routinely host a tooltip or a menu, whose
	 * portal would then anchor to the transformed avatar and land in the wrong
	 * place. Flat scale only — which is what `fx-press` already does.
	 *
	 * There is deliberately **no `interactive` prop** here to carry that press. An
	 * avatar that is a click target belongs inside a `<Button variant="ghost"
	 * size="icon">`, which already presses, already focuses and already announces
	 * itself. Inventing a second interactive element that has to re-earn all of
	 * that is scope inflation (`F16`).
	 */
	export const avatarVariants = tv({
		base: "size-8 rounded-full after:rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6 group/avatar relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
		variants: {
			/*
			 * The presence colour becomes the avatar's local tint, so a glowing
			 * online avatar haloes in `--success` rather than in the generic accent.
			 * Every value is a token; nothing here names a colour.
			 */
			presence: {
				online: "[--fx-tint:var(--color-success)]",
				idle: "[--fx-tint:var(--color-warning)]",
				dnd: "[--fx-tint:var(--destructive)]",
				offline: "[--fx-tint:var(--muted-foreground)]",
			},
			/*
			 * `◐ fallback bg`. The tint is reset to `--primary` on the fallback so a
			 * gradient stays the promotional accent even on an avatar whose presence
			 * has retinted the root for its glow — the two effects mean different
			 * things and must not borrow each other's colour.
			 */
			gradient: {
				true: "[&_[data-slot=avatar-fallback]]:fx-gradient [&_[data-slot=avatar-fallback]]:[--fx-tint:var(--primary)] [&_[data-slot=avatar-fallback]]:text-primary-foreground",
			},
			glow: {
				true: "fx-glow-bloom [--fx-glow-radius:160px]",
			},
			/*
			 * The loading loop, and it is pure CSS — `fx-shimmer-loading` runs from
			 * the stylesheet with no JavaScript at all. Under reduced motion its
			 * token slows to 3s instead of stopping (A17): a motionless avatar
			 * asserts the image has arrived.
			 */
			shimmer: {
				true: "[&_[data-slot=avatar-fallback]]:fx-shimmer-loading",
			},
		},
	});

	export type AvatarVariants = VariantProps<typeof avatarVariants>;

	/** Sizes are upstream's, unchanged. `lg` is the `◐ size ≥ lg` threshold for tilt. */
	export type AvatarSize = "default" | "sm" | "lg";

	/**
	 * Presence, in the source's four states.
	 *
	 * Activity (`typing`) is a **separate** prop rather than a fifth presence
	 * value, because in the source presence and activity share one corner slot:
	 * typing *replaces* the dot, it does not sit beside it. Two badges renders a
	 * state the design never has.
	 */
	export type AvatarPresence = "online" | "idle" | "dnd" | "offline";

	export type AvatarProps = AvatarPrimitive.RootProps & {
		size?: AvatarSize;
		/**
		 * The person's availability. Renders a coloured dot with a screen-reader
		 * label, and is the `◐ presence state` condition on glow.
		 *
		 * §3.5's accessibility floor applies hard here: **the glow may never be the
		 * only signal.** The dot carries the state and the sr-only text names it;
		 * the glow only emphasises it, and it is gone entirely under reduced
		 * motion, on a coarse pointer and at `data-fx="off"`.
		 *
		 * Occupies the same corner as `<Avatar.Badge>`. Use one or the other.
		 */
		presence?: AvatarPresence;
		/** Overrides the German default label for the presence state. */
		presenceLabel?: string;
		/**
		 * Activity: the person is typing. Cross-fades the dot out and a capsule in.
		 *
		 * The source morphs one node between the two shapes by animating `width`
		 * and `height` over 560ms on a spring peaking at 1.117 (layout inventory
		 * row 2). **Declined** — §1 forbids animating the layout box. Presence and
		 * typing are different *shapes*, so this cross-fades two absolutely
		 * positioned elements instead: opacity and scale only, no reflow, and the
		 * pair still occupies one slot.
		 *
		 * Pass `typing={false}` rather than omitting it to arm the cross-fade;
		 * omitting it renders only the dot, since an element that is never going to
		 * appear should not be in the DOM.
		 */
		typing?: boolean;
		/** Promotional emphasis on the **fallback** background. Never covers a loaded image. */
		gradient?: boolean;
		/**
		 * Pointer-tracked halo in the presence colour. Requires `presence`, and
		 * carries a 160px radius rather than the Button-sized token default (A23).
		 */
		glow?: boolean;
		/**
		 * The loading loop, on the fallback, for as long as the image has not
		 * loaded. Resolves to nothing once `loadingStatus` reaches `loaded` — a
		 * shimmer that outlives its load is decoration, and §3.5 gives the idle
		 * loop to loading only.
		 */
		shimmer?: boolean;
	};

	/**
	 * The German defaults. Overridable per instance with `presenceLabel`, because
	 * a component that hardcodes a language is a component nobody can localise.
	 */
	const PRESENCE_LABELS: Record<AvatarPresence, string> = {
		online: "Online",
		idle: "Abwesend",
		dnd: "Bitte nicht stören",
		offline: "Offline",
	};

	const TYPING_LABEL = "tippt gerade";
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";

	let {
		ref = $bindable(null),
		loadingStatus = $bindable("loading"),
		size = "default",
		class: className,
		children,
		presence,
		presenceLabel,
		typing,
		gradient,
		glow,
		shimmer,
		...restProps
	}: AvatarProps = $props();

	const fx = getFxContext();

	/*
	 * The `◐` conditions from §3.4. Only the component can evaluate these, so it
	 * hands them to `resolve` rather than the context guessing (§3.2 step 4).
	 *
	 * Nothing here tests `prefers-reduced-motion` or `pointer: coarse`. That
	 * happens once, in the engine — the prior attempt copy-pasted the check into
	 * 124 places and still missed glow (`F8`/`F10`).
	 */
	const useGradient = $derived(fx.resolve("gradient", gradient));
	const useGlow = $derived(fx.resolve("glow", glow, { available: presence !== undefined }));
	const useShimmer = $derived(fx.resolve("shimmer", shimmer, { available: loadingStatus !== "loaded" }));

	const label = $derived(
		typing ? TYPING_LABEL : presence ? (presenceLabel ?? PRESENCE_LABELS[presence]) : undefined
	);

	/*
	 * Both shapes are rendered only once `typing` has been passed at all. An
	 * `{#if}` around the capsule would destroy it rather than fade it, and there
	 * would be nothing to cross-fade to; rendering it unconditionally would put a
	 * hidden capsule under every presence dot in a list for no reason.
	 */
	const crossfading = $derived(typing !== undefined);

	/** Both corner shapes sit in the same slot, out of flow, so neither can reflow the other. */
	const cornerBase =
		"pointer-events-none absolute right-0 bottom-0 z-10 transition-[opacity,scale] duration-base ease-fx-out";
</script>

<AvatarPrimitive.Root
	bind:ref
	bind:loadingStatus
	data-slot="avatar"
	data-size={size}
	data-presence={presence}
	data-typing={typing ? "" : undefined}
	class={cn(
		avatarVariants({
			presence,
			gradient: useGradient,
			glow: useGlow,
			shimmer: useShimmer,
		}),
		className
	)}
	{...restProps}
	{@attach useGlow ? glowEffect() : undefined}
>
	{@render children?.()}

	{#if presence}
		<!--
			The dot. `ring-background` punches it out of the avatar the way the
			source's `box-shadow: 0 0 0 2px var(--bg-card)` does, but as a token, so
			it keeps working on a non-default surface — the source's version breaks
			there, which its own skins demonstrate.
		-->
		<span
			data-slot="avatar-presence"
			data-presence={presence}
			aria-hidden="true"
			class={cn(
				cornerBase,
				"size-2.5 rounded-full ring-2 ring-background group-data-[size=lg]/avatar:size-3 group-data-[size=sm]/avatar:size-2",
				"data-[presence=online]:bg-success data-[presence=idle]:bg-warning data-[presence=dnd]:bg-destructive data-[presence=offline]:bg-muted-foreground",
				typing && "scale-75 opacity-0"
			)}
		></span>

		{#if crossfading}
			<!--
				The typing capsule. Three dots on the loading-loop token rather than a
				literal duration, staggered by thirds of the same token — so reduced
				motion slows them to 3s with everything else instead of freezing a
				live activity indicator into a lie (A17).
			-->
			<span
				data-slot="avatar-typing"
				aria-hidden="true"
				class={cn(
					cornerBase,
					"flex items-center gap-0.5 rounded-full bg-primary px-1 py-0.5 ring-2 ring-background",
					!typing && "scale-75 opacity-0"
				)}
			>
				<span class="size-1 animate-pulse rounded-full bg-primary-foreground [animation-duration:var(--fx-shimmer-duration)]"></span>
				<span
					class="size-1 animate-pulse rounded-full bg-primary-foreground [animation-delay:calc(var(--fx-shimmer-duration)/3)] [animation-duration:var(--fx-shimmer-duration)]"
				></span>
				<span
					class="size-1 animate-pulse rounded-full bg-primary-foreground [animation-delay:calc(var(--fx-shimmer-duration)/1.5)] [animation-duration:var(--fx-shimmer-duration)]"
				></span>
			</span>
		{/if}

		<!-- The state in words. Without this the colour is the only signal, which §3.5 forbids. -->
		<span class="sr-only" data-slot="avatar-presence-label">{label}</span>
	{/if}
</AvatarPrimitive.Root>
