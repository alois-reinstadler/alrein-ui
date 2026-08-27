/**
 * Type-level contract for Input, checked by `svelte-check`.
 *
 * Two things have to hold and neither is visible from a doc comment, so they are
 * asserted here instead:
 *
 *  1. every upstream shadcn-svelte call site still compiles unchanged (SPEC.md
 *     §1 "extend in place", §7);
 *  2. the effects §3.4 withholds from form fields are **not props**. `@ts-expect-error`
 *     inverts the check — the day one of them stops being an error, this file
 *     fails to compile and the regression is caught here rather than in review.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { InputProps } from './input.svelte';

/* Upstream call sites must keep compiling unchanged. */
const upstreamBare: InputProps = {};
const upstreamText: InputProps = { type: 'text', placeholder: 'Name', value: '' };
const upstreamEmail: InputProps = { type: 'email', required: true, 'aria-invalid': true };
const upstreamDisabled: InputProps = { disabled: true, class: 'w-64', id: 'name' };
const upstreamFile: InputProps = { type: 'file', files: undefined };
const upstreamDataAttr: InputProps = { 'data-testid': 'name' };

/* The alrein additions. */
const stateDanger: InputProps = { state: 'danger' };
const stateWarn: InputProps = { state: 'warn' };
const stateSuccess: InputProps = { state: 'success', type: 'email' };
const stateDefault: InputProps = { state: 'default' };
const busy: InputProps = { loading: true, value: 'kept, and still submitted' };
const busyFile: InputProps = { type: 'file', loading: true };

/*
 * `danger` is a presentation, not an assertion about the value. It does not set
 * `aria-invalid`, and the two are independent — a field can be both.
 */
const dangerAndInvalid: InputProps = { state: 'danger', 'aria-invalid': true };

/* The state set is closed; it is the same one `Field` publishes. */
// @ts-expect-error `error` is not a state — the vocabulary is default|danger|warn|success
const bogusState: InputProps = { state: 'error' };

/*
 * §3.4 gives Input no decorative effects at all, and §3.5 is explicit about glow:
 * on a form field it competes with the focus ring and reads as an error state.
 * None of these may exist as props.
 */
// @ts-expect-error §3.4: Input has no glow
const glowing: InputProps = { glow: true };
// @ts-expect-error §3.4: Input has no tilt
const tilting: InputProps = { tilt: true };
// @ts-expect-error §3.4: Input has no shimmer
const shimmering: InputProps = { shimmer: true };
// @ts-expect-error §3.4: Input has no gradient
const gradient: InputProps = { gradient: true };
// @ts-expect-error §3.5: magnet is never in a form
const magnetic: InputProps = { magnet: true };

/* `files` belongs to the file branch only — upstream's own discrimination. */
// @ts-expect-error a text input has no FileList
const filesOnText: InputProps = { type: 'text', files: null as unknown as FileList };

export {
	upstreamBare,
	upstreamText,
	upstreamEmail,
	upstreamDisabled,
	upstreamFile,
	upstreamDataAttr,
	stateDanger,
	stateWarn,
	stateSuccess,
	stateDefault,
	busy,
	busyFile,
	dangerAndInvalid,
	bogusState,
	glowing,
	tilting,
	shimmering,
	gradient,
	magnetic,
	filesOnText
};
