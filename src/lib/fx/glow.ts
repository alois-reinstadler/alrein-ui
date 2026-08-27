import type { Attachment } from 'svelte/attachments';
import { track, type Reactive } from './pointer.svelte.js';

export interface GlowOptions {
	/** Live veto, normally `() => fx.resolve('glow', props.glow, …)`. */
	enabled?: Reactive<boolean>;
	/** Proximity radius in pixels. Defaults to the `--fx-glow-radius` token. */
	radius?: Reactive<number>;
}

/**
 * "This is the highest-intent target on this surface." (SPEC.md §3.1)
 *
 * Writes `--fx-glow` (0–1 proximity), `--fx-glow-x` and `--fx-glow-y`. The
 * visible treatment is CSS — see the `fx-glow` utility in `styles/alrein/fx.css`
 * — so this attachment has no opinion about how the glow looks, only where the
 * pointer is relative to the element.
 *
 * §3.5: never on a form field, where users read a glow on focus as an error
 * state, and at most one lit element per surface. The engine warns in dev when a
 * second one lights up.
 */
export function glow(options: GlowOptions = {}): Attachment<HTMLElement> {
	return track('glow', { enabled: options.enabled, magnitude: options.radius });
}
