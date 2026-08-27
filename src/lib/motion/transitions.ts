/**
 * alrein-ui motion layer — Svelte transition functions.
 *
 * The counterpart of `../styles/alrein/motion.css`. SPEC.md §4 / A4 require both
 * forms, with this division of labour:
 *
 *   - `motion.css` (`data-[state=open|closed]`) is the **default**. No
 *     `forceMount`, no `child` snippet, works on anything bits-ui mounts.
 *   - These functions are for motion that needs a measured or JS-computed value
 *     — `collapse` (natural height), `crossfade` (from/to rects) — and for
 *     elements you mount yourself with `{#if}`.
 *
 * Both halves read the same `--transition-duration-*` / `--ease-fx-*` /
 * `--fx-*` custom properties through `./easing.ts`, so they cannot drift and
 * reduced motion collapses both at once. There are no numeric durations and no
 * easing curves in this file.
 *
 * Layout policy: everything here animates `opacity`, `filter`, `translate` and
 * `scale` only — with the single, deliberate exception of `collapse`, which is
 * documented where it is defined. `translate` and `scale` are used as
 * *individual* transform properties rather than as a `transform` shorthand so a
 * transition composes with a press-scale or a tilt instead of clobbering it
 * (failure `F9`).
 */

import type { TransitionConfig } from 'svelte/transition';
import {
	blurAmount,
	duration,
	easeFxIn,
	easeFxOut,
	fadeDuration,
	scaleFrom,
	slideDistance,
	type DurationName,
	type EasingFunction
} from './easing.js';

/* -------------------------------------------------------------------------- */
/* Shared types                                                               */
/* -------------------------------------------------------------------------- */

/** The direction a transition has resolved to once Svelte knows which way it is running. */
export type TransitionDirection = 'in' | 'out';

/** Third argument Svelte passes to a transition function. `both` for `transition:`, otherwise the directive's direction. */
export interface TransitionOptions {
	direction?: TransitionDirection | 'both';
}

/**
 * What every transition here returns.
 *
 * Svelte hands a bidirectional `transition:` directive `direction: 'both'` and
 * then *reverses* the intro to build the outro, which would make "exit is faster
 * than enter" (SPEC.md §2) impossible to express. Returning a function instead
 * opts into Svelte's deferred-transition path: it is called again once the DOM
 * is up to date, with the direction actually being run. The extra hop is a
 * microtask, so it still lands before the first paint.
 */
export type DeferredTransition = (options?: { direction?: TransitionDirection }) => TransitionConfig;

/** Timing controls shared by every primitive. */
export interface MotionParams {
	/** Extra delay before the transition starts, in milliseconds. */
	delay?: number;
	/** Hard duration override in milliseconds. Prefer `enterDuration` / `exitDuration` so the token scale still applies. */
	duration?: number;
	/** Which step of the motion scale to use when entering. */
	enterDuration?: DurationName;
	/** Which step of the motion scale to use when leaving. */
	exitDuration?: DurationName;
	/** Curve override. Defaults to `--ease-fx-out` entering, `--ease-fx-in` leaving. */
	easing?: EasingFunction;
}

/** A transition function in the shape this module exports. */
export type MotionTransition<P extends MotionParams = MotionParams> = (
	node: Element,
	params?: P,
	options?: TransitionOptions
) => DeferredTransition;

interface DurationPair {
	enter: DurationName;
	exit: DurationName;
}

/**
 * SPEC.md §2: exit is one step faster than enter. Users never wait to dismiss.
 * Overridable per call through `enterDuration` / `exitDuration`.
 */
const DEFAULT_STEPS: DurationPair = { enter: 'base', exit: 'fast' };

/** `collapse` is the slow one — it is a real layout change, and 240ms is what §2 reserves for it. */
const COLLAPSE_STEPS: DurationPair = { enter: 'slow', exit: 'base' };

interface Timing {
	delay: number;
	duration: number;
	easing: EasingFunction;
}

function resolveTiming(params: MotionParams, direction: TransitionDirection, steps: DurationPair): Timing {
	const leaving = direction === 'out';
	const step = leaving ? (params.exitDuration ?? steps.exit) : (params.enterDuration ?? steps.enter);

	return {
		delay: params.delay ?? 0,
		duration: params.duration ?? duration(step),
		easing: params.easing ?? (leaving ? easeFxIn : easeFxOut)
	};
}

/**
 * Wraps a config builder in the deferred shape described on `DeferredTransition`.
 *
 * `options.direction` is `'both'` for a `transition:` directive, in which case we
 * cannot know the direction yet — Svelte tells us when it calls the returned
 * function. The fallback only matters if something calls it with no argument.
 */
function defer(options: TransitionOptions | undefined, build: (direction: TransitionDirection) => TransitionConfig): DeferredTransition {
	const assumed: TransitionDirection = options?.direction === 'out' ? 'out' : 'in';
	return (resolved) => build(resolved?.direction ?? assumed);
}

/** An element's own opacity is the value a fade returns *to*; anything unreadable is treated as fully opaque. */
function targetOpacity(node: Element): number {
	const parsed = Number.parseFloat(getComputedStyle(node).opacity);
	return Number.isFinite(parsed) ? parsed : 1;
}

/* -------------------------------------------------------------------------- */
/* fade                                                                       */
/* -------------------------------------------------------------------------- */

export interface FadeParams extends MotionParams {
	/** Opacity to start from (entering) or end at (leaving). */
	opacity?: number;
}

/**
 * Opacity only.
 *
 * The one primitive whose duration comes from `--fx-fade-duration` rather than
 * from the enter/exit pair. SPEC.md §3.2 step 2 keeps opacity fades alive at
 * ~100ms under reduced motion while transform-driven motion collapses to 1ms,
 * and that floor is what the token encodes. The cost is that `fade` runs at one
 * speed in both directions — imperceptible on a pure opacity ramp, and the same
 * choice the `fx-fade` utility makes, so the two halves stay identical.
 */
export function fade(node: Element, params: FadeParams = {}, options?: TransitionOptions): DeferredTransition {
	return defer(options, (direction) => {
		const timing = resolveTiming(params, direction, DEFAULT_STEPS);
		const from = params.opacity ?? 0;
		const to = targetOpacity(node);

		return {
			delay: timing.delay,
			duration: params.duration ?? fadeDuration(),
			easing: timing.easing,
			css: (t) => `opacity: ${from + (to - from) * t}`
		};
	});
}

/* -------------------------------------------------------------------------- */
/* blurFade                                                                   */
/* -------------------------------------------------------------------------- */

export interface BlurFadeParams extends MotionParams {
	/** Blur radius in pixels to start from. Defaults to `--fx-blur-amount`. */
	amount?: number;
	/** Opacity to start from. */
	opacity?: number;
}

/**
 * Opacity plus a short defocus. Reads as "this surface is arriving from
 * somewhere" without moving anything, so it is safe on elements that must not
 * shift — inline validation, table cell content.
 */
export function blurFade(node: Element, params: BlurFadeParams = {}, options?: TransitionOptions): DeferredTransition {
	return defer(options, (direction) => {
		const timing = resolveTiming(params, direction, DEFAULT_STEPS);
		const amount = params.amount ?? blurAmount();
		const from = params.opacity ?? 0;
		const to = targetOpacity(node);

		return {
			...timing,
			css: (t, u) => `opacity: ${from + (to - from) * t}; filter: blur(${u * amount}px)`
		};
	});
}

/* -------------------------------------------------------------------------- */
/* slide                                                                      */
/* -------------------------------------------------------------------------- */

/** The direction of travel while *entering*. Leaving reverses it, so an element returns the way it came. */
export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export interface SlideParams extends MotionParams {
	/** Direction of travel on enter. Defaults to `up`. */
	direction?: SlideDirection;
	/** Distance in pixels. Defaults to `--fx-slide-distance`. */
	distance?: number;
	/** Opacity to start from. Set to `1` for a pure translation. */
	opacity?: number;
}

/** Offset the element sits at when the transition is at its far end (t = 0). */
function slideOffset(direction: SlideDirection, distance: number): readonly [number, number] {
	if (direction === 'up') return [0, distance];
	if (direction === 'down') return [0, -distance];
	if (direction === 'left') return [distance, 0];
	return [-distance, 0];
}

/**
 * A short directional translation, plus a fade so the movement has something to
 * hide behind at its extremes.
 *
 * Uses the individual `translate` property rather than `transform`, so a sliding
 * element can still be scaled or tilted by something else.
 */
export function slide(node: Element, params: SlideParams = {}, options?: TransitionOptions): DeferredTransition {
	return defer(options, (direction) => {
		const timing = resolveTiming(params, direction, DEFAULT_STEPS);
		const [dx, dy] = slideOffset(params.direction ?? 'up', params.distance ?? slideDistance());
		const from = params.opacity ?? 0;
		const to = targetOpacity(node);

		return {
			...timing,
			css: (t, u) => `opacity: ${from + (to - from) * t}; translate: ${u * dx}px ${u * dy}px`
		};
	});
}

/* -------------------------------------------------------------------------- */
/* scale / scaleFade                                                          */
/* -------------------------------------------------------------------------- */

export interface ScaleParams extends MotionParams {
	/** Scale to start from. Defaults to `--fx-scale-from`. */
	start?: number;
	/** Transform origin for the scale. Defaults to `--fx-transform-origin`, which `motion.css` sets to `center`. */
	origin?: string;
}

export interface ScaleFadeParams extends ScaleParams {
	/** Opacity to start from. */
	opacity?: number;
}

/**
 * Scale only.
 *
 * Note the easing: `--ease-fx-spring` is *not* used here and must not be. It is
 * reserved for press feedback and toggle thumbs (SPEC.md §2, failure `F6`);
 * overshoot on a surface that carries layout reads as slow and drunk.
 */
export function scale(node: Element, params: ScaleParams = {}, options?: TransitionOptions): DeferredTransition {
	return defer(options, (direction) => {
		const timing = resolveTiming(params, direction, DEFAULT_STEPS);
		const start = params.start ?? scaleFrom();
		const origin = params.origin ?? 'var(--fx-transform-origin, center)';

		return {
			...timing,
			css: (t) => `transform-origin: ${origin}; scale: ${start + (1 - start) * t}`
		};
	});
}

/** Scale plus opacity — the default for popovers, dropdowns and menus that you mount yourself. */
export function scaleFade(node: Element, params: ScaleFadeParams = {}, options?: TransitionOptions): DeferredTransition {
	return defer(options, (direction) => {
		const timing = resolveTiming(params, direction, DEFAULT_STEPS);
		const start = params.start ?? scaleFrom();
		const origin = params.origin ?? 'var(--fx-transform-origin, center)';
		const from = params.opacity ?? 0;
		const to = targetOpacity(node);

		return {
			...timing,
			css: (t) =>
				`opacity: ${from + (to - from) * t};` +
				` transform-origin: ${origin};` +
				` scale: ${start + (1 - start) * t}`
		};
	});
}

/* -------------------------------------------------------------------------- */
/* collapse                                                                   */
/* -------------------------------------------------------------------------- */

export interface CollapseParams extends MotionParams {
	/** Fade the content out alongside the collapse. On by default; set `false` for a pure height change. */
	fade?: boolean;
}

/**
 * Height `auto` → 0, for accordions, disclosure panels and expandable rows.
 *
 * **This is the one primitive allowed to animate `height`, and it is not a §1
 * violation.** §1 bans effects that change an element's layout box because a
 * *decoration* must never cause reflow. Here the reflow *is* the interaction:
 * the panel genuinely becomes zero-height, and animating it is the only way to
 * show where the surrounding content is going. There is no transform-only
 * equivalent — `scale-y` would squash the text and leave the gap behind.
 *
 * ## Prefer `fx-collapse` (A21)
 *
 * There is a second collapse in this library, and for most cases it is the right
 * one: the `fx-collapse` utility in `styles/alrein/motion.css`, which animates
 * `grid-template-rows: 0fr ↔ 1fr` on a wrapper. It needs **no measurement**, and
 * therefore no `transitionend` listener and no timeout guard (A22) — and it
 * tracks content resizing for free, because the `1fr` is resolved by layout on
 * every frame rather than captured once when the transition starts. An image
 * that loads inside an open accordion panel leaves this function's captured
 * height stale; it does not affect `fx-collapse` at all.
 *
 * Reach for *this* one only when the element is mounted and unmounted by Svelte
 * (`{#if}`) rather than toggled by a `data-state` attribute, since a CSS
 * transition has nothing to run on an element that no longer exists.
 *
 * Padding, margin and border widths on the collapsing axis are animated with the
 * height so the panel does not keep a residual band of chrome at t = 0.
 */
export function collapse(node: Element, params: CollapseParams = {}, options?: TransitionOptions): DeferredTransition {
	return defer(options, (direction) => {
		const timing = resolveTiming(params, direction, COLLAPSE_STEPS);
		const style = getComputedStyle(node);

		const height = Number.parseFloat(style.height) || 0;
		const paddingTop = Number.parseFloat(style.paddingTop) || 0;
		const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
		const marginTop = Number.parseFloat(style.marginTop) || 0;
		const marginBottom = Number.parseFloat(style.marginBottom) || 0;
		const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
		const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;

		const to = targetOpacity(node);
		// The content fades out over the first fifth of the collapse, so the text
		// is gone well before the box is, instead of being visibly clipped.
		const fadeContent = params.fade !== false;

		return {
			...timing,
			css: (t) =>
				'overflow: hidden;' +
				` opacity: ${fadeContent ? Math.min(t * 5, 1) * to : to};` +
				` height: ${t * height}px;` +
				` min-height: 0;` +
				` padding-top: ${t * paddingTop}px;` +
				` padding-bottom: ${t * paddingBottom}px;` +
				` margin-top: ${t * marginTop}px;` +
				` margin-bottom: ${t * marginBottom}px;` +
				` border-top-width: ${t * borderTop}px;` +
				` border-bottom-width: ${t * borderBottom}px`
		};
	});
}

/* -------------------------------------------------------------------------- */
/* crossfade                                                                  */
/* -------------------------------------------------------------------------- */

export interface CrossfadeParams extends MotionParams {
	/** Pairs a leaving element with an arriving one. Same key on both sides. */
	key: unknown;
}

export interface CrossfadeOptions extends MotionParams {
	/** Used when an element has no counterpart — the first tab shown, the last one removed. Defaults to `scaleFade`. */
	fallback?: MotionTransition;
}

/** One half of a `crossfade` pair. */
export type CrossfadeTransition = (node: Element, params: CrossfadeParams) => DeferredTransition;

/**
 * The pair of transitions behind tab panels and step content: an element that
 * leaves flies to where its counterpart is arriving, and fades out as the
 * counterpart fades in.
 *
 * Svelte-only by necessity (SPEC.md A4) — the geometry between the two elements
 * is measured at run time, so there is no CSS equivalent. The `transform`
 * shorthand is used rather than the individual properties here because the
 * element's existing transform has to be preserved *and* composed with, which
 * only the shorthand can express.
 *
 * The maps below live in the closure returned by each `crossfade()` call, not at
 * module scope, so two independent tab sets cannot see each other's keys and
 * nothing is shared across SSR requests (failure `F13`).
 */
export function crossfade(options: CrossfadeOptions = {}): [CrossfadeTransition, CrossfadeTransition] {
	const { fallback = scaleFade, ...defaults } = options;

	const toReceive = new Map<unknown, Element>();
	const toSend = new Map<unknown, Element>();

	function pair(from: Element, node: Element, params: CrossfadeParams, direction: TransitionDirection): TransitionConfig {
		const a = from.getBoundingClientRect();
		const b = node.getBoundingClientRect();
		const dx = a.left - b.left;
		const dy = a.top - b.top;
		const dw = b.width === 0 ? 1 : a.width / b.width;
		const dh = b.height === 0 ? 1 : a.height / b.height;

		const style = getComputedStyle(node);
		const existing = style.transform === 'none' ? '' : `${style.transform} `;
		const to = targetOpacity(node);
		const timing = resolveTiming({ ...defaults, ...params }, direction, DEFAULT_STEPS);

		return {
			...timing,
			css: (t, u) =>
				`opacity: ${t * to};` +
				' transform-origin: top left;' +
				` transform: ${existing}translate(${u * dx}px, ${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh})`
		};
	}

	function half(own: Map<unknown, Element>, other: Map<unknown, Element>, intro: boolean): CrossfadeTransition {
		return (node, params) => {
			own.set(params.key, node);

			// Resolved late on purpose: the counterpart is only registered once the
			// DOM has updated, which is exactly when Svelte calls this back.
			return (resolved) => {
				const direction: TransitionDirection = resolved?.direction ?? (intro ? 'in' : 'out');
				const counterpart = other.get(params.key);

				if (counterpart !== undefined) {
					other.delete(params.key);
					return pair(counterpart, node, params, direction);
				}

				own.delete(params.key);
				return fallback(node, { ...defaults, ...params }, { direction })({ direction });
			};
		};
	}

	return [half(toSend, toReceive, false), half(toReceive, toSend, true)];
}

/* -------------------------------------------------------------------------- */
/* stagger                                                                    */
/* -------------------------------------------------------------------------- */

export interface StaggerDelayParams {
	/** Total number of items, when known. Lets the helper compress instead of clamp. */
	count?: number;
	/** Delay added per item. Defaults to the `instant` step. */
	step?: number;
	/** Cap on the whole stagger window. Defaults to the `slow` step. */
	total?: number;
}

export interface StaggerParams extends MotionParams, StaggerDelayParams {
	/** Zero-based position of this item in the list. */
	index: number;
	/** The transition to stagger. Defaults to `fade`. */
	transition?: MotionTransition;
}

/**
 * Delay for one item of a staggered list, in milliseconds.
 *
 * The cap is the whole point. An uncapped `index * step` means item 40 of a
 * 40-row table starts 3.2s after item 1, which users read as a loading bug
 * rather than as choreography — and it is unbounded, so the worst case is
 * whatever the largest list in the app happens to be. Capping the *window*
 * instead of the step keeps short lists crisp and makes long ones compress:
 * with `count` known the step shrinks until everything fits, and without it the
 * delay simply stops growing.
 *
 * One `slow` step (240ms by default) is the budget, because that is already the
 * longest single duration the scale allows — a list should not take longer to
 * assemble than a drawer takes to open. Under reduced motion the tokens collapse
 * and the whole stagger disappears with them, at no extra cost here.
 */
export function staggerDelay(index: number, params: StaggerDelayParams = {}): number {
	if (index <= 0) return 0;

	const total = params.total ?? duration('slow');
	const step = params.step ?? duration('instant');

	if (params.count !== undefined && params.count > 1) {
		return Math.min(step, total / (params.count - 1)) * index;
	}

	return Math.min(index * step, total);
}

/**
 * Adds a staggered delay to another transition.
 *
 *     {#each rows as row, i}
 *       <tr transition:stagger={{ index: i, count: rows.length, transition: slide }}>…</tr>
 *     {/each}
 *
 * Entering only. Staggering an exit would make dismissal take longer the more
 * there is to dismiss, which is the opposite of what §2 asks for.
 */
export function stagger(node: Element, params: StaggerParams, options?: TransitionOptions): DeferredTransition {
	const { index, count, step, total, transition = fade, ...rest } = params;

	return (resolved) => {
		const direction: TransitionDirection = resolved?.direction ?? (options?.direction === 'out' ? 'out' : 'in');
		const extra = direction === 'out' ? 0 : staggerDelay(index, { count, step, total });
		const delayed = { ...rest, delay: (rest.delay ?? 0) + extra };

		return transition(node, delayed, { direction })({ direction });
	};
}
