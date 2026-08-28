import type { Attachment } from 'svelte/attachments';
import type { Reactive } from './pointer.svelte.js';

export interface PressOptions {
	/**
	 * Live veto. Press is on by default and is not an opt-in effect (SPEC.md
	 * §3.1) — this exists for the disabled state, not for the effect policy.
	 * `data-fx="off"` degrades press to colour and opacity in CSS, it does not
	 * unregister the attachment.
	 */
	enabled?: Reactive<boolean>;
	/** Set false to suppress the pointer-positioned tint and keep only the scale. */
	ripple?: Reactive<boolean>;
}

function read<T>(option: Reactive<T> | undefined, fallback: T): T {
	if (option === undefined) return fallback;
	return typeof option === 'function' ? (option as () => T)() : option;
}

/**
 * "I registered your click." (SPEC.md §3.1) Always on, never opt-in.
 *
 * Writes `--fx-press` (0 or 1) plus `--fx-press-x` / `--fx-press-y` at the press
 * coordinates. The `fx-press` CSS utility turns `--fx-press` into the `scale`
 * property and into the opacity of a pointer-positioned radial tint.
 *
 * ## Why there is no ripple element, and no timer
 *
 * The obvious implementation spawns a `<span>` per press, animates it, and
 * removes it on a `setTimeout` matching the CSS duration. That is three bans at
 * once — `document.createElement` in a component, `setTimeout` as an animation
 * sequencer, and a hardcoded duration duplicated from the stylesheet that
 * desyncs the moment either side changes (SPEC.md §8, `F12`/`F13`).
 *
 * Instead the tint is a pseudo-element that is always present and always at
 * opacity 0, and pressing transitions it. A transition interrupts and resumes
 * from wherever it currently is, so there is no restart problem, no cleanup, and
 * the ripple count is capped at one by construction rather than by a counter.
 *
 * The scale uses `--ease-fx-spring`. This and toggle thumbs are the only two
 * places in the library permitted to overshoot (SPEC.md §2); `pnpm bans:check`
 * allowlists exactly this file.
 */
export function press(options: PressOptions = {}): Attachment<HTMLElement> {
	return (node) => {
		const previousPress = node.style.getPropertyValue('--fx-press');

		const release = () => node.style.setProperty('--fx-press', '0');

		/*
		 * The press point, twice: once as a percentage for the radial tint, once as
		 * a signed -1..1 vector for the 3D press tilt (A10a). Unitless, so how far
		 * the element tips stays a token rather than a number compiled into here —
		 * this reports *where*, `press.css` decides *how far*.
		 */
		const onPointerDown = (event: PointerEvent) => {
			if (!read(options.enabled, true)) return;
			if (read(options.ripple, true)) {
				// A single measurement per press, on an event that already forces the
				// browser to have layout available. Not a per-frame cost.
				const rect = node.getBoundingClientRect();
				const horizontal = (event.clientX - rect.left) / rect.width;
				const vertical = (event.clientY - rect.top) / rect.height;
				node.style.setProperty('--fx-press-x', `${horizontal * 100}%`);
				node.style.setProperty('--fx-press-y', `${vertical * 100}%`);
				node.style.setProperty('--fx-press-nx', `${(horizontal - 0.5) * 2}`);
				node.style.setProperty('--fx-press-ny', `${(vertical - 0.5) * 2}`);
			}
			node.style.setProperty('--fx-press', '1');
		};

		// Keyboard activation gets the same acknowledgement, centred, so the
		// effect is not sighted-mouse-only. `keydown` repeats while held, which is
		// harmless: writing '1' twice is idempotent.
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			if (!read(options.enabled, true)) return;
			node.style.setProperty('--fx-press-x', '50%');
			node.style.setProperty('--fx-press-y', '50%');
			// Centred, so a keyboard press scales and tints but does not tip: there
			// is no press point to tip toward, and inventing one would be a lie.
			node.style.setProperty('--fx-press-nx', '0');
			node.style.setProperty('--fx-press-ny', '0');
			node.style.setProperty('--fx-press', '1');
		};

		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('pointerup', release);
		node.addEventListener('pointercancel', release);
		node.addEventListener('pointerleave', release);
		node.addEventListener('keydown', onKeyDown);
		node.addEventListener('keyup', release);
		node.addEventListener('blur', release);

		return () => {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointerup', release);
			node.removeEventListener('pointercancel', release);
			node.removeEventListener('pointerleave', release);
			node.removeEventListener('keydown', onKeyDown);
			node.removeEventListener('keyup', release);
			node.removeEventListener('blur', release);
			if (previousPress) node.style.setProperty('--fx-press', previousPress);
			else node.style.removeProperty('--fx-press');
		};
	};
}
