import { getContext, hasContext, setContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';
import { prefersReducedMotion } from 'svelte/motion';
import type { FxEffect } from './capabilities.js';
import { inheritLevel, resolveEffect, type FxDensity, type FxLevel } from './resolution.js';

export type { FxDensity, FxLevel };

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
	#level: () => FxLevel | undefined = () => undefined;
	#density: () => FxDensity | undefined = () => undefined;

	constructor(parent?: FxContext) {
		this.#parent = parent;
	}

	/**
	 * Called by `<FxScope>` during render, with getters rather than values.
	 *
	 * This has to be synchronous, not an effect. `$effect.pre` does not run on the
	 * server, so configuring there left every scope rendering its *parent's* level
	 * server-side and only correcting on hydration — which defeats the entire
	 * reason §3.3 puts a literal `data-fx` attribute in the DOM. CSS-only effects
	 * are supposed to resolve on first paint, before and without JavaScript.
	 *
	 * Getters rather than values so a scope whose props change still tracks,
	 * without needing an effect to push the new value in.
	 */
	configure(level: () => FxLevel | undefined, density: () => FxDensity | undefined): void {
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
		return inheritLevel(this.#parent?.level ?? 'calm', this.#level());
	}

	/** Density has no sticky value; the nearest scope wins. */
	get density(): FxDensity {
		return this.#density() ?? this.#parent?.density ?? 'default';
	}

	get reducedMotion(): boolean {
		return prefersReducedMotion.current;
	}

	get pointerFine(): boolean {
		return pointerFineQuery.current;
	}

	/**
	 * Resolve one effect through SPEC.md §3.2. The chain itself lives in
	 * `resolution.ts` as a pure function so it can be unit-tested without a DOM;
	 * this method only supplies the live environment.
	 *
	 * @param requested the per-instance prop, or `undefined` if none was passed
	 * @param request.available the `◐` condition from §3.4, evaluated by the
	 *        component ("is this the primary variant?", "is size >= md?")
	 * @param request.fxDefault whether this component lights up on its own at
	 *        `expressive`. Defaults to false: calm by default, nothing glows
	 *        unless asked.
	 */
	resolve(
		effect: FxEffect,
		requested: boolean | undefined,
		request: { available?: boolean; fxDefault?: boolean } = {}
	): boolean {
		return resolveEffect(
			effect,
			requested,
			{
				level: this.level,
				density: this.density,
				reducedMotion: this.reducedMotion,
				pointerFine: this.pointerFine
			},
			request
		);
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
