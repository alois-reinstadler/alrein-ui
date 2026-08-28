<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { getFxContext, setFxContext, type FxDensity, type FxLevel } from './context.svelte.js';

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * `off` — nothing decorative; press degrades to colour and opacity only.
		 * `calm` — the default. Effects only where explicitly asked for per instance.
		 * `expressive` — components with a declared `fxDefault` light up on their
		 * own, and magnet becomes available at all.
		 *
		 * Omit to inherit. `off` is sticky: a nested scope cannot re-enable effects
		 * inside one (SPEC.md §3.2 step 1).
		 */
		level?: FxLevel;
		/**
		 * `list` and `table` downgrade glow, tilt and magnet off while leaving
		 * gradient and shimmer alone (§3.2 step 5). A pointer-tracked effect on
		 * every row of a table is noise, not signal.
		 */
		density?: FxDensity;
		children?: Snippet;
	};

	let {
		ref = $bindable(null),
		level,
		density,
		class: className,
		children,
		...restProps
	}: Props = $props();

	const context = setFxContext(getFxContext());
	// Synchronous, not an effect: effects do not run during SSR, and the literal
	// `data-fx` attribute has to be correct on the server or the CSS-only effects
	// it exists for resolve wrong on first paint.
	context.configure(
		() => level,
		() => density
	);
</script>

<!--
	Two halves, both required (SPEC.md §3.3). The context drives the JavaScript
	effects; the literal `data-fx` attribute lets the CSS-only ones — shimmer's
	loading loop, gradient, the press degradation — resolve without JavaScript,
	before hydration and even if the bundle never arrives.

	`display: contents` by default so a scope adds no box and cannot cause the
	reflow acceptance criterion §7.10 forbids.

	To make it a real box, pass a **display utility** — `block`, `flex`, `grid`.
	Passing spacing or sizing utilities alone does *not*: `cn()` is tailwind-merge,
	which only drops a class when a later one is in the same group, and `contents`
	is in the display group while `flex-1`, `min-w-0` and `py-8` are in three other
	ones. `cn('contents', 'min-w-0 flex-1 py-8')` therefore keeps all four, the
	element generates no box, and the three layout classes silently do nothing.

	That is not hypothetical. The docs layout wrapped its whole body in
	`<FxScope class="min-w-0 flex-1 py-8">` inside a `flex` row, so every `<section>`
	on every page became a flex item of *that* row: the pages rendered as columns
	side by side, clipped, with a horizontal scrollbar, on the published site.

	**One trap, and it is easy to walk into.** `display: contents` removes an
	element from the *box tree* but **not** from the *selector tree*. So wrapping
	children in an `<FxScope>` still breaks any `>` selector that was reaching
	them — `[&>[data-slot]]:rounded-r-none` on a parent stops matching, because
	the children are now grandchildren. If the surrounding component styles its
	children with `>`, do not wrap: call `setFxContext()` in that component and
	render `data-fx` / `data-fx-density` on its own element instead.
	`components/ui/button-group/button-group.svelte` does exactly that, and had to.
-->
<div
	bind:this={ref}
	data-slot="fx-scope"
	data-fx={context.level}
	data-fx-density={context.density}
	class={cn('contents', className)}
	{...restProps}
>
	{@render children?.()}
</div>
