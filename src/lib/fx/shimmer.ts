import type { Attachment } from 'svelte/attachments';
import type { Reactive } from './pointer.svelte.js';

export interface ShimmerOptions {
	/** Live veto, normally `() => fx.resolve('shimmer', props.shimmer, …)`. */
	enabled?: Reactive<boolean>;
	/** `hover` sweeps on pointer entry; `mount` sweeps once when the element appears. */
	trigger?: 'hover' | 'mount';
}

function read<T>(option: Reactive<T> | undefined, fallback: T): T {
	if (option === undefined) return fallback;
	return typeof option === 'function' ? (option as () => T)() : option;
}

/**
 * Shimmer has two distinct modes and conflating them is how you get a migraine
 * (SPEC.md §3.5).
 *
 * **Loading** is an idle loop and is pure CSS — put `fx-shimmer-loading` on the
 * element and there is no JavaScript at all. That is the Skeleton case, the
 * Avatar-loading case, the UploadArea-uploading case. It runs forever because
 * the thing it describes is still happening.
 *
 * **Attention** is a finite, triggered sweep, and that is this attachment. It
 * runs once per trigger and stops. Twelve badges shimmering forever is not a
 * design system.
 *
 * The sweep is driven through the Web Animations API rather than a CSS animation
 * because a triggered animation has to *restart*, and restarting a CSS animation
 * means either toggling a class across a frame boundary (a `requestAnimationFrame`
 * this file is not allowed to make) or a `setTimeout` cleanup (banned as an
 * animation sequencer). `Element.animate()` restarts cleanly, cancels cleanly on
 * teardown, and needs neither.
 */
export function shimmer(options: ShimmerOptions = {}): Attachment<HTMLElement> {
	return (node) => {
		let animation: Animation | undefined;

		const sweep = () => {
			if (!read(options.enabled, true)) return;

			// Both the duration and the reduced-motion veto come from one token.
			// Under `prefers-reduced-motion: reduce` the stylesheet sets it to 0ms,
			// so there is no second code path here to keep in sync (SPEC.md §3.2).
			//
			// Note *which* token: the sweep reads `--fx-shimmer-sweep-duration`, not
			// `--fx-shimmer-duration`. The loop's token slows under reduced motion
			// rather than stopping, because a frozen skeleton claims the loading has
			// finished (A17). The sweep is decoration and does stop, so the two
			// cannot share a token.
			const raw = getComputedStyle(node).getPropertyValue('--fx-shimmer-sweep-duration').trim();
			const seconds = raw.endsWith('ms') ? Number.parseFloat(raw) : Number.parseFloat(raw) * 1000;
			const duration = Number.isFinite(seconds) ? seconds : 0;
			if (duration <= 0) return;

			animation?.cancel();
			// `--fx-shimmer-position` drives a gradient offset in CSS, so this
			// animates a custom property rather than a layout box.
			animation = node.animate([{ '--fx-shimmer-position': '0%' }, { '--fx-shimmer-position': '100%' }], {
				duration,
				easing: getComputedStyle(node).getPropertyValue('--ease-fx-out').trim() || 'ease-out'
			});
		};

		const trigger = options.trigger ?? 'hover';
		if (trigger === 'mount') {
			sweep();
		} else {
			node.addEventListener('pointerenter', sweep);
			node.addEventListener('focusin', sweep);
		}

		return () => {
			animation?.cancel();
			node.removeEventListener('pointerenter', sweep);
			node.removeEventListener('focusin', sweep);
		};
	};
}
