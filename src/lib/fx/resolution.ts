import { POINTER_TRACKED, type FxEffect } from './capabilities.js';

export type FxLevel = 'off' | 'calm' | 'expressive';
export type FxDensity = 'default' | 'list' | 'table';

/** Everything the §3.2 chain needs, with no DOM and no runes involved. */
export interface FxEnvironment {
	level: FxLevel;
	density: FxDensity;
	reducedMotion: boolean;
	pointerFine: boolean;
}

export interface FxRequest {
	/** The `◐` condition from §3.4, evaluated by the component — only it knows. */
	available?: boolean;
	/** Whether this component lights this effect up on its own at `expressive` (§3.3). */
	fxDefault?: boolean;
}

/**
 * SPEC.md §3.2, in order, first veto wins.
 *
 * This is a pure function on purpose. It is the single most consequential piece
 * of logic in the library — the prior attempt had no policy layer at all and
 * instead copy-pasted `prefers-reduced-motion` checks into 124 places, still
 * missing glow (SPEC.md §8, `F8`/`F10`). Keeping it free of DOM reads and runes
 * means it can be exhaustively unit-tested, which `resolution.test.ts` does.
 *
 * `FxContext` supplies the environment; nothing else should call this directly.
 *
 * @param requested the per-instance prop, or `undefined` if none was passed.
 *                  `false` is a real answer and vetoes.
 */
export function resolveEffect(
	effect: FxEffect,
	requested: boolean | undefined,
	environment: FxEnvironment,
	request: FxRequest = {}
): boolean {
	const { available = true, fxDefault = false } = request;

	// 1 — `data-fx="off"` in the ancestor chain. Dead, no override possible.
	if (environment.level === 'off') return false;

	/*
	 * §3.2 step 5, applied before the pointer vetoes because it catches one more
	 * effect than they do.
	 *
	 * §3.2's wording names glow, tilt and magnet, and leaves shimmer unstated.
	 * §3.4 settles it: the two dense rows in the matrix — `ButtonGroup (children)`
	 * and `Table rows / any list item` — grant **only** gradient (and ghost, which
	 * is a variant rather than an effect). Shimmer is a dash in both. So the
	 * consistent reading is that a dense scope leaves *static surface treatments*
	 * alone and downgrades everything that moves.
	 *
	 * That is also the right answer on its own terms: one shimmering row in a
	 * table of forty is not attention, it is a fault indicator nobody asked for.
	 *
	 * The loading shimmer is unaffected, because it is a CSS class rather than a
	 * resolved effect — a skeleton row inside a table still animates.
	 */
	if (environment.density !== 'default' && effect !== 'gradient') return false;

	if (POINTER_TRACKED.has(effect)) {
		// 2 — reduced motion kills pointer-tracked effects outright.
		if (environment.reducedMotion) return false;
		// 3 — a coarse pointer has nothing to track.
		if (!environment.pointerFine) return false;
		// §3.5: magnet is the isolated-CTA effect, and `expressive` only.
		if (effect === 'magnet' && environment.level !== 'expressive') return false;
	}

	// 4 — the capability matrix, including the `◐` condition.
	if (!available) return false;

	// 6 — the per-instance prop beats the preset, in both directions.
	if (requested !== undefined) return requested;

	// 7 — the preset default. `calm` never lights anything up on its own.
	return environment.level === 'expressive' && fxDefault;
}

/**
 * §3.2 step 1 in its own right: `off` is sticky, so a nested scope asking for
 * `expressive` inside an `off` scope stays `off`. Every other level is
 * nearest-wins.
 */
export function inheritLevel(parent: FxLevel, own: FxLevel | undefined): FxLevel {
	if (parent === 'off') return 'off';
	return own ?? parent;
}
