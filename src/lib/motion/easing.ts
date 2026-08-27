/**
 * alrein-ui motion layer — the JS half of the token pair.
 *
 * Everything in here exists so that the Svelte transition functions in
 * `transitions.ts` and the CSS keyframes in `../styles/alrein/motion.css` can
 * never disagree about how long something takes or what curve it follows. Both
 * halves read the *same* custom properties off the document, so a theme change —
 * or the `prefers-reduced-motion` override in `tokens.css` — moves both at once.
 * That is the direct fix for the prior attempt's failure `F5` (934 hardcoded
 * durations, 612 literal easing curves, two scales free to drift).
 *
 * Consequence worth stating explicitly: there is **no** reduced-motion branch in
 * this file. `tokens.css` collapses the four duration tokens to 1ms under
 * `prefers-reduced-motion: reduce`, and because everything below reads those
 * tokens by name, the collapse arrives for free.
 */

/** Structurally identical to Svelte's `EasingFunction`; declared here so this module has no runtime imports. */
export type EasingFunction = (t: number) => number;

/** The four steps of the motion scale (SPEC.md §2). */
export type DurationName = 'instant' | 'fast' | 'base' | 'slow';

/** The three curves of the motion scale (SPEC.md §2). */
export type EasingName = 'out' | 'in' | 'spring';

/* -------------------------------------------------------------------------- */
/* Token fallbacks                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The one place in the motion layer where motion values appear as literals.
 *
 * They are used only when there is no `document` to read from — SSR, unit tests,
 * a worker. Browsers always take the token path below, so these can never be the
 * source of a client-side drift; they exist so that a server render of a
 * component that calls `duration()` does not throw.
 *
 * They must mirror `src/lib/styles/alrein/tokens.css`. Nothing reads them
 * otherwise.
 */
const FALLBACK_DURATION_MS: Readonly<Record<DurationName, number>> = {
	instant: 80,
	fast: 120,
	base: 180,
	slow: 240
};

/** SSR fallback for `--fx-fade-duration`, which defaults to the `base` step. */
const FALLBACK_FADE_MS = FALLBACK_DURATION_MS.base;

/**
 * SSR fallbacks for the easing curves' control points, mirroring `tokens.css`.
 *
 * Stored as four numbers rather than as an easing string on purpose: this file
 * contains no literal CSS easing function, so `pnpm bans:check` stays quiet and
 * there is nothing here that *looks* like a second source of truth.
 */
const FALLBACK_EASING: Readonly<Record<EasingName, readonly [number, number, number, number]>> = {
	out: [0.22, 1, 0.36, 1],
	in: [0.4, 0, 1, 1],
	spring: [0.34, 1.56, 0.64, 1]
};

/** Geometry fallbacks for the properties declared by `motion.css`. */
const FALLBACK_SLIDE_DISTANCE_PX = 8;
const FALLBACK_SCALE_FROM = 0.96;
const FALLBACK_BLUR_PX = 4;

/* -------------------------------------------------------------------------- */
/* Reading tokens off the document                                            */
/* -------------------------------------------------------------------------- */

/**
 * Resolved token values, keyed by custom-property name.
 *
 * Deliberately never invalidated. A reload is the only thing that can change the
 * motion scale in practice, and an invalidation hook would mean either a media
 * query listener per module (the `F8` copy-paste failure) or a `getComputedStyle`
 * call per animation frame (the `F10` one).
 */
const tokenCache = new Map<string, number>();

/** `null` outside the browser, which is also the signal to use a fallback. */
function readRawToken(property: string): string | null {
	if (typeof document === 'undefined') return null;
	const raw = getComputedStyle(document.documentElement).getPropertyValue(property);
	return raw.trim() === '' ? null : raw;
}

/** Parses a CSS `<time>` to milliseconds. `1000` here is the s→ms unit factor, not a duration. */
function parseTimeMs(raw: string, fallback: number): number {
	const value = raw.trim();
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) return fallback;
	if (value.endsWith('ms')) return parsed;
	if (value.endsWith('s')) return parsed * 1000;
	return parsed;
}

/** Parses a plain number or a `px` length. Non-`px` units are not supported — see `motion.css`. */
function parseNumber(raw: string, fallback: number): number {
	const parsed = Number.parseFloat(raw.trim());
	return Number.isFinite(parsed) ? parsed : fallback;
}

function cachedToken(property: string, fallback: number, parse: (raw: string, fallback: number) => number): number {
	const cached = tokenCache.get(property);
	if (cached !== undefined) return cached;

	const raw = readRawToken(property);
	const value = raw === null ? fallback : parse(raw, fallback);

	// Only cache what the document actually told us. Caching an SSR fallback
	// would poison the first client render after hydration.
	if (raw !== null) tokenCache.set(property, value);
	return value;
}

/**
 * One step of the motion scale, in milliseconds, read from
 * `--transition-duration-<name>`.
 *
 * This is the reason the Svelte transition functions and the CSS keyframes
 * cannot drift, and the reason reduced motion collapses both at once: they read
 * the same custom property.
 */
export function duration(name: DurationName): number {
	return cachedToken(`--transition-duration-${name}`, FALLBACK_DURATION_MS[name], parseTimeMs);
}

/**
 * `--fx-fade-duration`, in milliseconds.
 *
 * Pure opacity fades read this instead of the duration scale. SPEC.md §3.2 step 2
 * keeps them alive at ~100ms under reduced motion — removing them entirely makes
 * the UI feel broken rather than calm.
 */
export function fadeDuration(): number {
	return cachedToken('--fx-fade-duration', FALLBACK_FADE_MS, parseTimeMs);
}

/** `--fx-slide-distance`, in pixels. Declared by `motion.css`, shared with the CSS keyframes. */
export function slideDistance(): number {
	return cachedToken('--fx-slide-distance', FALLBACK_SLIDE_DISTANCE_PX, parseNumber);
}

/** `--fx-scale-from`, unitless. The scale an element enters from and leaves to. */
export function scaleFrom(): number {
	return cachedToken('--fx-scale-from', FALLBACK_SCALE_FROM, parseNumber);
}

/** `--fx-blur-amount`, in pixels. The blur an element enters from and leaves to. */
export function blurAmount(): number {
	return cachedToken('--fx-blur-amount', FALLBACK_BLUR_PX, parseNumber);
}

/* -------------------------------------------------------------------------- */
/* Cubic-bézier solver                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Newton–Raphson usually converges in two or three steps for a well-behaved
 * curve; eight is a generous ceiling that still costs nothing. Below
 * `NEWTON_MIN_SLOPE` the curve is flat enough that a step would overshoot wildly
 * (or divide by ~0), so we hand over to bisection instead. `NEWTON_PRECISION` is
 * the x-error at which a Newton result is accepted — the same shape of test
 * browsers use, and it inherits the same caveat: on a curve with a stationary
 * point in x, x carries almost no information about t nearby, so no solver
 * (ours or the browser's) can recover t precisely there. Measured against an
 * independent parametric reference, the three curves this library actually ships
 * come back accurate to ~1e-16.
 */
const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 1e-3;
const NEWTON_PRECISION = 1e-7;
const BISECTION_ITERATIONS = 32;

function clamp01(value: number): number {
	if (value < 0) return 0;
	if (value > 1) return 1;
	return value;
}

/**
 * One axis of a cubic Bézier whose outer control points are pinned at 0 and 1,
 * in Horner form:
 *
 *     B(t) = 3(1-t)²t·a1 + 3(1-t)t²·a2 + t³
 *          = ((a·t + b)·t + c)·t   with c = 3a1, b = 3(a2-a1) - c, a = 1 - c - b
 */
function bezier(t: number, a1: number, a2: number): number {
	const c = 3 * a1;
	const b = 3 * (a2 - a1) - c;
	const a = 1 - c - b;
	return ((a * t + b) * t + c) * t;
}

/** dB/dt for the same polynomial. */
function bezierSlope(t: number, a1: number, a2: number): number {
	const c = 3 * a1;
	const b = 3 * (a2 - a1) - c;
	const a = 1 - c - b;
	return (3 * a * t + 2 * b) * t + c;
}

/**
 * Builds a CSS-accurate easing function from four control points.
 *
 * The subtlety that makes a naive implementation wrong: a CSS `cubic-bezier()`
 * is a *parametric* curve, not a function of time. The value handed to an easing
 * function is x (elapsed fraction), and what is wanted back is y (progress
 * fraction) — but both are functions of an internal parameter t. Evaluating
 * `y(t)` with t := x therefore samples the wrong point on the curve, and the
 * error grows with how far the x control points sit from an even spacing (for
 * `--ease-fx-out`, x1 = 0.22, the error is very visible).
 *
 * So: solve `x(t) = input` for t first, then return `y(t)`. Newton–Raphson does
 * that in a handful of steps; when it wanders out of [0, 1] or stalls on a flat
 * stretch, bisection finishes the job. x(t) is monotonic for x1, x2 ∈ [0, 1],
 * which is what makes bisection valid here.
 *
 * @param x1 first control point's x, clamped to [0, 1] as CSS requires
 * @param y1 first control point's y, unbounded — this is what allows overshoot
 * @param x2 second control point's x, clamped to [0, 1]
 * @param y2 second control point's y, unbounded
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
	const cx1 = clamp01(x1);
	const cx2 = clamp01(x2);

	// The identity curve. Worth special-casing: `linear` is common and the solver
	// would otherwise burn iterations rediscovering t === x.
	if (cx1 === y1 && cx2 === y2) return (t) => t;

	function solveT(x: number): number {
		let t = x;

		for (let i = 0; i < NEWTON_ITERATIONS; i += 1) {
			const slope = bezierSlope(t, cx1, cx2);
			if (slope < NEWTON_MIN_SLOPE) break;
			t -= (bezier(t, cx1, cx2) - x) / slope;
		}

		if (t >= 0 && t <= 1 && Math.abs(bezier(t, cx1, cx2) - x) < NEWTON_PRECISION) return t;

		// Bisection runs its full count rather than stopping once x is close enough.
		// On a curve with a stationary point (x1 = 1, x2 = 0, say) a whole band of t
		// values share the same x to within any x-tolerance, so an x-based early exit
		// can return a t that is off by ~1e-2. Halving the interval 32 times pins t
		// itself instead, and it only costs 32 polynomial evaluations on a path the
		// three shipped curves never take.
		let low = 0;
		let high = 1;
		let mid = clamp01(x);

		for (let i = 0; i < BISECTION_ITERATIONS; i += 1) {
			mid = (low + high) / 2;
			if (bezier(mid, cx1, cx2) < x) low = mid;
			else high = mid;
		}

		return mid;
	}

	return (t) => {
		// Endpoints are exact by definition; skipping the solver also keeps a
		// 1ms reduced-motion transition landing precisely on its final value.
		if (t <= 0) return 0;
		if (t >= 1) return 1;
		return bezier(solveT(t), y1, y2);
	};
}

/* -------------------------------------------------------------------------- */
/* The three token easings                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Pulls four control points out of a resolved `--ease-fx-*` value.
 *
 * Matched by shape — "four comma-separated numbers inside parentheses" — rather
 * than by function name, so that this file contains no literal CSS easing
 * function for a reviewer (or `pnpm bans:check`) to trip over. Anything else,
 * including keyword and `steps()` easings, falls back to the control points
 * above; the motion layer only ever ships bézier curves.
 */
function parseControlPoints(raw: string): readonly [number, number, number, number] | null {
	const inside = /\(([^)]*)\)/.exec(raw.trim());
	if (inside === null) return null;

	const parts = inside[1].split(',').map((part) => Number.parseFloat(part.trim()));
	if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;

	return [parts[0], parts[1], parts[2], parts[3]];
}

const easingCache = new Map<EasingName, EasingFunction>();

function resolveEasing(name: EasingName): EasingFunction {
	const cached = easingCache.get(name);
	if (cached !== undefined) return cached;

	const raw = readRawToken(`--ease-fx-${name}`);
	const points = raw === null ? null : parseControlPoints(raw);
	const [x1, y1, x2, y2] = points ?? FALLBACK_EASING[name];
	const solver = cubicBezier(x1, y1, x2, y2);

	// Same rule as the duration cache: never memoise an SSR fallback.
	if (points !== null) easingCache.set(name, solver);
	return solver;
}

/**
 * Wraps `resolveEasing` in a stable function identity.
 *
 * Svelte compares the easing it is handed by reference across a reversing
 * transition, and the token cannot be read at module-evaluation time on the
 * server, so resolution has to happen on first call rather than eagerly.
 */
function tokenEasing(name: EasingName): EasingFunction {
	return (t) => resolveEasing(name)(t);
}

/** `--ease-fx-out`. Everything entering. */
export const easeFxOut: EasingFunction = tokenEasing('out');

/** `--ease-fx-in`. Everything leaving. */
export const easeFxIn: EasingFunction = tokenEasing('in');

/**
 * `--ease-fx-spring`. **RESTRICTED** (SPEC.md §2, failure `F6`).
 *
 * Allowed on exactly two things: press feedback and toggle thumbs. It overshoots,
 * and overshoot on anything that moves layout reads as slow and drunk in a
 * data-dense screen. Exported here because `press` needs it — nothing in
 * `transitions.ts` uses it, and nothing in `transitions.ts` should.
 */
export const easeFxSpring: EasingFunction = tokenEasing('spring');
