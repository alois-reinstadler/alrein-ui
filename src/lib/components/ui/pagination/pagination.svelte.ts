/**
 * alrein-ui Pagination — the state the parts share.
 *
 * SPEC.md §1: shared stateful logic is a rune class in `<component>.svelte.ts`.
 * Two facts travel between Root and its children, and neither belongs in a prop
 * threaded through the consumer's own markup:
 *
 * 1. **Which page is current, and how many there are.** bits-ui derives both and
 *    hands them to its `children` snippet, but `Pagination.Status` is rendered by
 *    the consumer somewhere inside that snippet and would otherwise have to be
 *    passed them by hand at every call site.
 * 2. **Which DOM node the current page's link is**, so `MorphIndicator` has
 *    something to measure.
 *
 * `SvelteMap` is `svelte/reactivity`, not the Svelte 4 store contract §1 bans.
 */
import { getContext, setContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

/**
 * §5 collapses `pagination` and `pagination-compact` into one component.
 *
 * `full` is the upstream composition: a windowed run of page buttons with
 * ellipses. `compact` is prev / current-page / next, which is what the vuesax
 * `compact` skin is once its digit reel is declined (layout inventory row 20 —
 * `tabular-nums` plus a fixed `ch` width removes the need for the reel, and the
 * reel is the only place in Phase 2/3 that needed a `transitionend` listener
 * with a timeout fallback).
 */
export type PaginationVariant = 'full' | 'compact';

const ROOT_KEY = Symbol('alrein-pagination-root');
const TRACK_KEY = Symbol('alrein-pagination-track');

/** Getters, not values, so the object is created once and still tracks. */
export interface PaginationRootSignals {
	readonly page: number;
	readonly totalPages: number;
	readonly variant: PaginationVariant;
}

export function setPaginationRoot(signals: PaginationRootSignals): void {
	setContext(ROOT_KEY, signals);
}

/** `undefined` when a part is used outside an alrein Root — a legal composition. */
export function getPaginationRoot(): PaginationRootSignals | undefined {
	return getContext<PaginationRootSignals | undefined>(ROOT_KEY);
}

/**
 * The run of page links, keyed by page number.
 *
 * Keyed rather than "whichever one last said it was active" because the link
 * set is rebuilt whenever the window slides: a link can be removed while it is
 * still the active one, and a single mutable slot would then point at a detached
 * node that `getBoundingClientRect` reports as a zero box at the origin.
 */
export class PaginationTrackState {
	#root = getPaginationRoot();
	#links = new SvelteMap<number, HTMLElement>();

	get active(): HTMLElement | null {
		const page = this.#root?.page;
		if (page === undefined) return null;
		return this.#links.get(page) ?? null;
	}

	register(page: number, node: HTMLElement | null): void {
		if (node) this.#links.set(page, node);
		else this.#links.delete(page);
	}

	unregister(page: number, node: HTMLElement | null): void {
		if (this.#links.get(page) === node) this.#links.delete(page);
	}
}

export function setPaginationTrack(): PaginationTrackState {
	const state = new PaginationTrackState();
	setContext(TRACK_KEY, state);
	return state;
}

export function getPaginationTrack(): PaginationTrackState | undefined {
	return getContext<PaginationTrackState | undefined>(TRACK_KEY);
}
