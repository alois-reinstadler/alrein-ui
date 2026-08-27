/**
 * The singleton pointer engine (SPEC.md §4.1).
 *
 * Every glow, tilt and magnet instance on the page registers here. There is
 * exactly **one** `pointermove` listener, **one** `requestAnimationFrame`, one
 * `IntersectionObserver` and one `visibilitychange` listener for the whole
 * document, no matter how many elements are lit.
 *
 * This file is the only place in `src/lib` allowed to call
 * `requestAnimationFrame` or to attach a `pointermove` / `scroll` / `resize`
 * listener; `pnpm bans:check` enforces that. The prior attempt ran a rAF and a
 * full listener set per element for three of its four pointer effects, and wrote
 * `style.transform` synchronously inside every `pointermove` for the fourth —
 * a forced layout on every pointer sample (SPEC.md §8, `F9`).
 *
 * ## Two decisions worth stating
 *
 * **No time integration, so no `dt` to clamp.** §4.1 suggests clamping `dt`, which
 * matters when you smooth toward a target in JS and a stalled tab would otherwise
 * produce one huge jump. This engine writes raw *target* values and delegates all
 * smoothing to CSS transitions on the consuming element. The compositor runs
 * those, they pause correctly when the tab is hidden, and there is no integration
 * state to corrupt. Simpler, and strictly better behaved.
 *
 * **Each effect owns a different CSS property, so they compose without fighting.**
 *   - magnet → the `translate` property
 *   - press  → the `scale` property (written by `press.ts`, not here)
 *   - tilt   → the `transform` property, which is where `perspective()` has to go
 *   - glow   → custom properties consumed by a background layer
 *
 * The individual `translate` / `rotate` / `scale` properties are applied before
 * `transform`, so magnet and press never clobber tilt and none of them clobber a
 * consumer's own `transform`. The prior attempt overwrote `style.transform`
 * wholesale and could not compose two effects on one element at all.
 */

import type { Attachment } from 'svelte/attachments';

export type PointerEffect = 'glow' | 'tilt' | 'magnet';

/**
 * A7: attachments must not read `$state` or `$derived` directly, or the
 * attachment tears down and re-registers on every `data-fx` change. Options are
 * either a plain value or a getter the engine calls inside its own loop.
 */
export type Reactive<T> = T | (() => T);

export interface EntryOptions {
	/** Live veto from `FxContext.resolve(...)`. When false the entry writes its rest value and idles. */
	enabled?: Reactive<boolean>;
	/** Overrides the token default. Pixels for glow radius and magnet, degrees for tilt. */
	magnitude?: Reactive<number>;
}

interface Entry {
	node: HTMLElement;
	effect: PointerEffect;
	options: EntryOptions;
	/** The `[data-fx]` element this entry sits under, for the §3.5 dev budget warning. */
	scope: Element;
	rect: DOMRect | null;
	visible: boolean;
	/** Token default resolved once at registration; `magnitude` overrides it. */
	fallbackMagnitude: number;
	/** Inline values present before we touched the element, restored on teardown. */
	restore: Map<string, string>;
	/** Skips redundant writes when an entry is already at rest. */
	atRest: boolean;
}

const entries = new Set<Entry>();
/**
 * Node → entry, so the IntersectionObserver callback is a lookup rather than a
 * scan of every registered element for every change. With one glow on a page the
 * difference is nothing; with a table of them it is quadratic.
 */
const byNode = new WeakMap<Element, Entry>();

let pointerX = 0;
let pointerY = 0;
let pointerKnown = false;
let frame = 0;
let running = false;
let observer: IntersectionObserver | undefined;

/** Custom properties this engine writes, per effect, so teardown can restore exactly these. */
const WRITES: Record<PointerEffect, readonly string[]> = {
	glow: ['--fx-glow', '--fx-glow-x', '--fx-glow-y'],
	tilt: ['--fx-tilt-x', '--fx-tilt-y'],
	magnet: ['--fx-magnet-x', '--fx-magnet-y']
};

/** The token each effect reads its magnitude from when no explicit option is given. */
const MAGNITUDE_TOKEN: Record<PointerEffect, string> = {
	glow: '--fx-glow-radius',
	tilt: '--fx-tilt-max',
	magnet: '--fx-magnet-max'
};

const FALLBACK_MAGNITUDE: Record<PointerEffect, number> = { glow: 180, tilt: 6, magnet: 8 };

function read<T>(option: Reactive<T> | undefined, fallback: T): T {
	if (option === undefined) return fallback;
	return typeof option === 'function' ? (option as () => T)() : option;
}

/**
 * Resolve a token to a number once, at registration. These are design constants,
 * not per-frame inputs — the prior attempt re-read media queries and magnitudes
 * inside the render loop, once per entry per frame (`F10`).
 */
function magnitudeFromToken(node: HTMLElement, effect: PointerEffect): number {
	const raw = getComputedStyle(node).getPropertyValue(MAGNITUDE_TOKEN[effect]).trim();
	const parsed = Number.parseFloat(raw);
	return Number.isFinite(parsed) ? parsed : FALLBACK_MAGNITUDE[effect];
}

function write(entry: Entry, property: string, value: string): void {
	entry.node.style.setProperty(property, value);
}

/** Write the effect's identity value: no glow, no rotation, no displacement. */
function rest(entry: Entry): void {
	if (entry.atRest) return;
	entry.atRest = true;
	switch (entry.effect) {
		case 'glow':
			write(entry, '--fx-glow', '0');
			break;
		case 'tilt':
			write(entry, '--fx-tilt-x', '0deg');
			write(entry, '--fx-tilt-y', '0deg');
			break;
		case 'magnet':
			write(entry, '--fx-magnet-x', '0px');
			write(entry, '--fx-magnet-y', '0px');
			break;
	}
}

function renderGlow(entry: Entry, rect: DOMRect): void {
	const radius = Math.max(1, read(entry.options.magnitude, entry.fallbackMagnitude));
	// Distance to the nearest point on the box, so a large element lights up as
	// soon as the pointer is near any edge rather than only near its centre.
	const nearestX = Math.min(Math.max(pointerX, rect.left), rect.right);
	const nearestY = Math.min(Math.max(pointerY, rect.top), rect.bottom);
	const distance = Math.hypot(pointerX - nearestX, pointerY - nearestY);
	const intensity = Math.max(0, 1 - distance / radius);

	if (intensity === 0) {
		rest(entry);
		return;
	}
	entry.atRest = false;
	// Percentages, so the gradient keeps tracking correctly if the element
	// resizes between rect invalidations.
	write(entry, '--fx-glow-x', `${((pointerX - rect.left) / rect.width) * 100}%`);
	write(entry, '--fx-glow-y', `${((pointerY - rect.top) / rect.height) * 100}%`);
	write(entry, '--fx-glow', intensity.toFixed(3));
}

function renderTilt(entry: Entry, rect: DOMRect): void {
	const inside =
		pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom;
	if (!inside) {
		rest(entry);
		return;
	}
	entry.atRest = false;
	const max = read(entry.options.magnitude, entry.fallbackMagnitude);
	const horizontal = (pointerX - rect.left) / rect.width - 0.5;
	const vertical = (pointerY - rect.top) / rect.height - 0.5;
	// rotateY follows horizontal travel, rotateX opposes vertical travel, so the
	// card leans toward the pointer rather than away from it.
	write(entry, '--fx-tilt-y', `${(horizontal * 2 * max).toFixed(2)}deg`);
	write(entry, '--fx-tilt-x', `${(-vertical * 2 * max).toFixed(2)}deg`);
}

function renderMagnet(entry: Entry, rect: DOMRect): void {
	const max = read(entry.options.magnitude, entry.fallbackMagnitude);
	const centreX = rect.left + rect.width / 2;
	const centreY = rect.top + rect.height / 2;
	const offsetX = pointerX - centreX;
	const offsetY = pointerY - centreY;
	// Activation reaches roughly one element-width beyond the box. Outside that
	// the button sits still, which is what makes the pull feel deliberate.
	const reach = Math.hypot(rect.width, rect.height);
	const distance = Math.hypot(offsetX, offsetY);
	if (distance === 0 || distance > reach) {
		rest(entry);
		return;
	}
	entry.atRest = false;
	const pull = (1 - distance / reach) * max;
	write(entry, '--fx-magnet-x', `${((offsetX / distance) * pull).toFixed(2)}px`);
	write(entry, '--fx-magnet-y', `${((offsetY / distance) * pull).toFixed(2)}px`);
}

/** Scopes already warned about, so the §3.5 budget message fires once, not every frame. */
const warnedScopes = new WeakSet<Element>();

function render(): void {
	frame = 0;
	// §4.1: a hidden tab does no work. `visibilitychange` also cancels the frame,
	// but a frame already in flight can still land here.
	if (document.hidden || !pointerKnown) return;

	// §3.5 budget, dev only: one glowing and one tilting element per surface.
	let active: Map<Element, { glow: number; tilt: number }> | undefined;
	if (import.meta.env.DEV) active = new Map();

	for (const entry of entries) {
		if (!entry.visible) continue;
		if (!read(entry.options.enabled, true)) {
			rest(entry);
			continue;
		}
		entry.rect ??= entry.node.getBoundingClientRect();
		const rect = entry.rect;
		if (!rect.width || !rect.height) continue;

		switch (entry.effect) {
			case 'glow':
				renderGlow(entry, rect);
				break;
			case 'tilt':
				renderTilt(entry, rect);
				break;
			case 'magnet':
				renderMagnet(entry, rect);
				break;
		}

		if (active && !entry.atRest && entry.effect !== 'magnet') {
			const counts = active.get(entry.scope) ?? { glow: 0, tilt: 0 };
			counts[entry.effect] += 1;
			active.set(entry.scope, counts);
		}
	}

	if (active) {
		for (const [scope, counts] of active) {
			const over = (['glow', 'tilt'] as const).filter((effect) => counts[effect] > 1);
			if (over.length === 0 || warnedScopes.has(scope)) continue;
			warnedScopes.add(scope);
			for (const effect of over) {
				console.warn(
					`[alrein-ui] ${counts[effect]} elements are ${effect === 'glow' ? 'glowing' : 'tilting'} ` +
						`at once inside this FxScope. SPEC.md §3.5 allows one per visible surface. ` +
						(effect === 'glow'
							? 'Glow means "highest-intent target here", and it stops meaning anything at two.'
							: 'Tilt reads as physical objects; a whole grid of them reads as a broken page. ' +
								'At data-fx="expressive" Card tilts by default — pass tilt={false} on the rest, ' +
								'or wrap the grid in <FxScope density="list">.'),
					scope
				);
			}
		}
	}
}

function schedule(): void {
	if (!frame && pointerKnown) frame = requestAnimationFrame(render);
}

function onPointerMove(event: PointerEvent): void {
	pointerX = event.clientX;
	pointerY = event.clientY;
	pointerKnown = true;
	schedule();
}

function invalidateRects(): void {
	for (const entry of entries) entry.rect = null;
	schedule();
}

function onVisibilityChange(): void {
	if (!document.hidden) return;
	if (frame) cancelAnimationFrame(frame);
	frame = 0;
	// A tab switched away with the pointer mid-hover would otherwise come back
	// still lit, because no further pointermove will arrive to decay it.
	restAll();
}

/**
 * The pointer left the window.
 *
 * Without this, the last frame's values stick: glow stays lit, a tilted card
 * stays tilted and a magnet stays pulled, with the cursor nowhere near. Nothing
 * decays them, because decay is driven by `pointermove` and there are no more
 * of those. `pointerout` with a null `relatedTarget` is the reliable signal —
 * `mouseleave` on `document` does not fire in every browser.
 */
function onPointerOut(event: PointerEvent): void {
	if (event.relatedTarget !== null) return;
	pointerKnown = false;
	restAll();
}

function restAll(): void {
	for (const entry of entries) rest(entry);
}

function start(): void {
	if (running || typeof document === 'undefined') return;
	running = true;
	document.addEventListener('pointermove', onPointerMove, { passive: true });
	document.addEventListener('pointerout', onPointerOut, { passive: true });
	document.addEventListener('visibilitychange', onVisibilityChange);
	// Capture, so a scroll in any nested scroller invalidates too.
	window.addEventListener('scroll', invalidateRects, { passive: true, capture: true });
	window.addEventListener('resize', invalidateRects, { passive: true });
	observer = new IntersectionObserver((changes) => {
		for (const change of changes) {
			const entry = byNode.get(change.target);
			if (!entry) continue;
			entry.visible = change.isIntersecting;
			// A rect measured while off-screen is stale by the time it matters.
			if (change.isIntersecting) entry.rect = null;
			else rest(entry);
		}
	});
}

function stopIfIdle(): void {
	if (!running || entries.size > 0) return;
	running = false;
	document.removeEventListener('pointermove', onPointerMove);
	document.removeEventListener('pointerout', onPointerOut);
	document.removeEventListener('visibilitychange', onVisibilityChange);
	window.removeEventListener('scroll', invalidateRects, { capture: true });
	window.removeEventListener('resize', invalidateRects);
	observer?.disconnect();
	observer = undefined;
	if (frame) cancelAnimationFrame(frame);
	frame = 0;
	pointerKnown = false;
}

/**
 * Register an element with the engine. Returns the attachment cleanup.
 *
 * Exported for `glow.ts`, `tilt.ts` and `magnet.ts`; components use those, not
 * this. Every custom property this engine wrote is restored to whatever was
 * inline before, so an element that loses its effect does not keep a stale value.
 */
export function track(effect: PointerEffect, options: EntryOptions = {}): Attachment<HTMLElement> {
	return (node) => {
		const restore = new Map<string, string>();
		for (const property of WRITES[effect]) {
			restore.set(property, node.style.getPropertyValue(property));
		}

		const entry: Entry = {
			node,
			effect,
			options,
			scope: node.closest('[data-fx]') ?? node.ownerDocument.documentElement,
			rect: null,
			visible: true,
			fallbackMagnitude: magnitudeFromToken(node, effect),
			restore,
			atRest: false
		};

		entries.add(entry);
		byNode.set(node, entry);
		start();
		observer?.observe(node);
		rest(entry);
		schedule();

		return () => {
			entries.delete(entry);
			byNode.delete(node);
			observer?.unobserve(node);
			for (const [property, previous] of restore) {
				if (previous) node.style.setProperty(property, previous);
				else node.style.removeProperty(property);
			}
			stopIfIdle();
		};
	};
}
