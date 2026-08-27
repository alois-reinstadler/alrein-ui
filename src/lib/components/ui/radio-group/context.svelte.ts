import { getContext, hasContext, setContext } from 'svelte';

const KEY = Symbol('alrein-radio-group');

/**
 * The group's current value, shared with its items.
 *
 * An item needs to know whether it is selected *outside* its own render snippet,
 * because the `card` variant resolves gradient and glow on the `◐ selected`
 * condition from §3.4 before it renders anything. bits-ui exposes `checked`
 * inside the children snippet only, and it does not publish its own context.
 *
 * Reading it back out of the DOM, or mirroring it into a second `$state`, would
 * both create a copy that can drift. This keeps one source of truth: the group
 * owns the value, and the item compares.
 */
export function setRadioGroupValue(get: () => string | undefined): void {
	setContext(KEY, get);
}

export function getRadioGroupValue(): () => string | undefined {
	if (!hasContext(KEY)) return () => undefined;
	return getContext<() => string | undefined>(KEY);
}
