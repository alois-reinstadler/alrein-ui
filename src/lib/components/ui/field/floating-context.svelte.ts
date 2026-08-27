import { getContext, hasContext, setContext } from 'svelte';

const KEY = Symbol('alrein-field-floating');

/**
 * The id a floating field's label points at.
 *
 * The label lives in `FieldFloating` and the control is passed in as a snippet,
 * so the two cannot see each other. Publishing the id downward means a consumer
 * writes `<Field.Floating label="E-Mail"><Input /></Field.Floating>` and gets a
 * correctly associated label with no `for`/`id` ceremony — while an explicit
 * `id` on the control still wins.
 *
 * A15: the vuesax source labels with a bare `aria-label`, which is not a label
 * association and leaves clicking the text doing nothing. This is the reason
 * that defect is not inherited.
 */
export function setFloatingFieldId(get: () => string): void {
	setContext(KEY, get);
}

/**
 * `undefined` outside a floating field, which is the signal to do nothing
 * special. A getter rather than a value, so a field whose `for` prop changes
 * does not leave its control pointing at a stale id.
 */
export function getFloatingFieldId(): (() => string) | undefined {
	return hasContext(KEY) ? getContext<() => string>(KEY) : undefined;
}
