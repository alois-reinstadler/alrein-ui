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
	reflow acceptance criterion §7.10 forbids. Pass a `class` to make it a real
	element when you want one.
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
