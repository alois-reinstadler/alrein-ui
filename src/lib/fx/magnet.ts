import type { Attachment } from 'svelte/attachments';
import { track, type Reactive } from './pointer.svelte.js';

export interface MagnetOptions {
	/** Live veto, normally `() => fx.resolve('magnet', props.magnet, …)`. */
	enabled?: Reactive<boolean>;
	/** Maximum displacement in pixels. Defaults to the `--fx-magnet-max` token (8px). */
	max?: Reactive<number>;
}

/**
 * "This is the unmissable single CTA." (SPEC.md §3.1) The most expensive effect
 * in the library and the most easily overused.
 *
 * Writes `--fx-magnet-x` and `--fx-magnet-y`; the `fx-magnet` CSS utility feeds
 * them to the `translate` property, which composes with press's `scale` and
 * tilt's `transform` instead of fighting them.
 *
 * §3.5: isolated CTAs, FABs and the nav logo only — **never in application
 * chrome, never in a form, never in a list** — and `FxContext.resolve` refuses it
 * outside `data-fx="expressive"` regardless of what the prop says.
 */
export function magnet(options: MagnetOptions = {}): Attachment<HTMLElement> {
	return track('magnet', { enabled: options.enabled, magnitude: options.max });
}
