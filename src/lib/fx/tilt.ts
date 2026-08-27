import type { Attachment } from 'svelte/attachments';
import { track, type Reactive } from './pointer.svelte.js';

export interface TiltOptions {
	/** Live veto, normally `() => fx.resolve('tilt', props.tilt, …)`. */
	enabled?: Reactive<boolean>;
	/** Maximum rotation in degrees. Defaults to the `--fx-tilt-max` token (6°). */
	max?: Reactive<number>;
}

/**
 * "This is a discrete object you can pick up." (SPEC.md §3.1)
 *
 * Writes `--fx-tilt-x` and `--fx-tilt-y` in degrees; the `fx-tilt` CSS utility
 * turns them into a `transform`.
 *
 * §3.5, and this one bites: a `transform` creates a containing block for
 * `position: fixed`, so **any component that hosts floating UI — popover,
 * dropdown, tooltip, select — may not tilt**, or the portal anchors to the
 * transformed ancestor and lands in the wrong place. That is why the capability
 * matrix gives tilt to Card and UploadArea but not to anything with a trigger.
 * Also: never on more than about six items in a grid.
 */
export function tilt(options: TiltOptions = {}): Attachment<HTMLElement> {
	return track('tilt', { enabled: options.enabled, magnitude: options.max });
}
