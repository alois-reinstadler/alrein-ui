import { getContext, hasContext, setContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';
import { prefersReducedMotion } from 'svelte/motion';
import { POINTER_TRACKED, type FxEffect } from './capabilities.js';

export type FxLevel = 'off' | 'calm' | 'expressive';
export type FxDensity = 'default' | 'list' | 'table';

const KEY = Symbol('alrein-fx');

/**
 * Live environment queries, created once for the page rather than once per
 * component. `MediaQuery` and `prefersReducedMotion` are reactive, so toggling
 * either in devtools updates every effect without a reload — which is how
 * acceptance criteria §7.8 and §7.9 get verified in practice.
 *
 * The prior attempt re-evaluated `matchMedia(...)` inside the render loop, once
 * per element per frame (SPEC.md §8, `F10`).
 */
const pointerFineQuery = new MediaQuery('pointer: fine');

/**
 * The effect policy for a subtree. One instance per `<FxScope>`, plus one root
 * instance, held in Svelte context.
 *
 * This class is the *only* place SPEC.md §3.2's resolution order is written down
 * in code. Components never test `prefers-reduced-motion` themselves; the prior
 * attempt copy-pasted that check into 124 places and still missed glow.
 */
export class FxContext {
	#parent: FxContext | undefined = undefined;
	#level: FxLevel | undefined = $state(undefined);
	#density: FxDensity | undefined = $state(undefined);

	constructor(parent?: FxContext) {
		this.#parent = parent;
	}

	/** Called by `<FxScope>` when its props change. */
	configure(level: FxLevel | undefined, density: FxDensity | undefined): void {
		this.#level = level;
		this.#density = density;
	}

	/**
	 * §3.2 step 1: `data-fx="off"` anywhere in the ancestor chain is **dead, no
	 * override possible**. So `off` is sticky — a nested scope asking for
	 * `expressive` inside an `off` scope stays `off`. Every other level is a
	 * plain nearest-wins lookup.
	 *
	 * These are getters rather than `$derived` fields so they can read `#parent`,
	 * which the constructor assigns after field initialisers have run. Reads of
	 * `$state` inside a getter are tracked at access time, so they stay reactive.
	 */
	get level(): FxLevel {
		const inherited = this.#parent?.level ?? 'calm';
		if (inherited === 'off') return 'off';
		return this.#level ?? inherited;
	}

	/** Density has no sticky value; the nearest scope wins. */
	get density(): FxDensity {
		return this.#density ?? this.#parent?.density ?? 'default';
	}

	get reducedMotion(): boolean {
		return prefersReducedMotion.current;
	}

	get pointerFine(): boolean {
		return pointerFineQuery.current;
	}

	/**
	 * SPEC.md §3.2, in order, first veto wins.
	 *
	 * @param effect     which effect is being resolved
	 * @param requested  the per-instance prop, or `undefined` if the caller did
	 *                   not pass one. `false` is a real answer and vetoes.
	 * @param options.available
	 *                   the `◐` condition from §3.4 — the component evaluates it
	 *                   ("is this the primary variant?", "is size ≥ md?") because
	 *                   only the component knows. Defaults to `true` for `●` cells.
	 * @param options.fxDefault
	 *                   whether this component lights this effect up on its own at
	 *                   `expressive` (§3.3). Defaults to `false`: calm by default,
	 *                   nothing glows unless asked.
	 */
	resolve(
		effect: FxEffect,
		requested: boolean | undefined,
		options: { available?: boolean; fxDefault?: boolean } = {}
	): boolean {
		const { available = true, fxDefault = false } = options;

		// 1 — data-fx="off" in the ancestor chain. No override possible.
		if (this.level === 'off') return false;

		if (POINTER_TRACKED.has(effect)) {
			// 2 — reduced motion kills pointer-tracked effects outright.
			if (this.reducedMotion) return false;
			// 3 — coarse pointer has nothing to track.
			if (!this.pointerFine) return false;
			// 5 — density scope. gradient and shimmer survive; these do not.
			if (this.density !== 'default') return false;
			// §3.5: magnet is isolated-CTA only, and only at `expressive`.
			if (effect === 'magnet' && this.level !== 'expressive') return false;
		}

		// 4 — the capability matrix, including the `◐` condition.
		if (!available) return false;

		// 6 — the per-instance prop beats the preset in both directions.
		if (requested !== undefined) return requested;

		// 7 — the preset default. `calm` never lights anything up on its own.
		return this.level === 'expressive' && fxDefault;
	}
}

/**
 * Create a scope and publish it. Called by `<FxScope>` and, implicitly, by the
 * first component to ask for a context when no scope exists.
 */
export function setFxContext(parent?: FxContext): FxContext {
	const context = new FxContext(parent);
	setContext(KEY, context);
	return context;
}

/**
 * The context a component resolves its effects against.
 *
 * Falls back to a detached root scope when no `<FxScope>` is present, so a
 * component dropped into a plain shadcn app still resolves correctly — at
 * `calm`, which means nothing decorative happens. That is the intended default
 * (§3.3), not a degraded mode.
 */
export function getFxContext(): FxContext {
	if (hasContext(KEY)) return getContext<FxContext>(KEY);
	return new FxContext();
}
