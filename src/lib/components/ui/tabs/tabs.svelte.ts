/**
 * alrein-ui Tabs — the state the three parts share.
 *
 * SPEC.md §1: "Shared stateful logic goes in a rune class, exported from
 * `<component>.svelte.ts`." There are exactly two facts that have to travel
 * between Root, List and Trigger, and neither of them belongs in a prop:
 *
 * 1. **Which value is active**, so a List knows which element its indicator
 *    should sit under. bits-ui keeps this in a context of its own but does not
 *    export it, so Root re-publishes it — deriving it back out of the DOM would
 *    be a measurement standing in for something we were already told.
 * 2. **Which DOM node each Trigger is**, so `MorphIndicator` has something to
 *    measure. The registry lives on the *List* rather than on the Root, because
 *    a Root may legitimately contain more than one List and each one needs its
 *    own indicator pointing at its own trigger.
 *
 * No `svelte/store` anywhere; `SvelteMap` is `svelte/reactivity`, which is the
 * reactive collection, not the Svelte 4 store contract §1 bans.
 */
import { getContext, setContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

/** Mirrors bits-ui's `Orientation` without importing it for one string union. */
export type TabsOrientation = 'horizontal' | 'vertical';

const ROOT_KEY = Symbol('alrein-tabs-root');
const LIST_KEY = Symbol('alrein-tabs-list');

/**
 * What Root publishes. Getters rather than values, so the object is created once
 * and still tracks — the same shape `FxContext.configure` uses, and for the same
 * reason: pushing new values in through an `$effect` would run a frame late and
 * the indicator would trail the selection by one paint.
 */
export interface TabsRootSignals {
	readonly value: string;
	readonly orientation: TabsOrientation;
}

export function setTabsRoot(signals: TabsRootSignals): void {
	setContext(ROOT_KEY, signals);
}

function getTabsRoot(): TabsRootSignals | undefined {
	return getContext<TabsRootSignals | undefined>(ROOT_KEY);
}

/**
 * One List's view of the tab strip: which triggers exist, and which one is
 * currently active.
 *
 * Constructed during a component's initialisation, so reading the Root context
 * in a field initialiser is legal — `getContext` is only callable there.
 */
export class TabsListState {
	#root = getTabsRoot();
	#triggers = new SvelteMap<string, HTMLElement>();

	get orientation(): TabsOrientation {
		return this.#root?.orientation ?? 'horizontal';
	}

	/** The value bits-ui considers selected, `''` when nothing is. */
	get value(): string {
		return this.#root?.value ?? '';
	}

	/**
	 * The element `MorphIndicator` should follow, or `null` while nothing is
	 * selected — which is the case it already handles by hiding rather than
	 * flying to `0,0`.
	 */
	get active(): HTMLElement | null {
		const value = this.value;
		if (!value) return null;
		return this.#triggers.get(value) ?? null;
	}

	register(value: string, node: HTMLElement | null): void {
		if (node) this.#triggers.set(value, node);
		else this.#triggers.delete(value);
	}

	/**
	 * Only drops the entry if it is still the node that registered it. A trigger
	 * whose `value` prop changes registers under the new key before the old
	 * cleanup runs, and an unconditional delete would remove the live one.
	 */
	unregister(value: string, node: HTMLElement | null): void {
		if (this.#triggers.get(value) === node) this.#triggers.delete(value);
	}
}

export function setTabsList(): TabsListState {
	const state = new TabsListState();
	setContext(LIST_KEY, state);
	return state;
}

/**
 * `undefined` when a Trigger is used outside an alrein List — a legal shadcn
 * composition, and one that simply gets no indicator rather than an error.
 */
export function getTabsList(): TabsListState | undefined {
	return getContext<TabsListState | undefined>(LIST_KEY);
}
