/**
 * Type-level contract for Textarea, checked by `svelte-check`.
 *
 * Same two obligations as `input.types.ts`: every upstream call site keeps
 * compiling, and the effects §3.4 withholds from form fields are not props.
 * `@ts-expect-error` inverts the check, so a forbidden combination that stops
 * being an error breaks the build here instead of shipping.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { TextareaProps } from './textarea.svelte';

/* Upstream call sites must keep compiling unchanged. */
const upstreamBare: TextareaProps = {};
const upstreamValue: TextareaProps = { value: 'Hallo', placeholder: 'Nachricht', rows: 4 };
const upstreamDisabled: TextareaProps = { disabled: true, class: 'min-h-32', id: 'note' };
const upstreamInvalid: TextareaProps = { 'aria-invalid': true, required: true };
const upstreamDataAttr: TextareaProps = { 'data-testid': 'note' };

/* The alrein additions. */
const stateDanger: TextareaProps = { state: 'danger' };
const stateWarn: TextareaProps = { state: 'warn' };
const stateSuccess: TextareaProps = { state: 'success' };
const stateDefault: TextareaProps = { state: 'default' };
const busy: TextareaProps = { loading: true, value: 'kept, and still submitted' };
const counted: TextareaProps = { counter: true, maxlength: 500 };

/*
 * A counter with no limit is decoration, so this renders nothing at runtime. It
 * is deliberately *not* a type error: `maxlength` is frequently bound from a
 * schema, and making the pair a compile-time requirement would force a cast
 * every time the limit is optional.
 */
const counterWithoutLimit: TextareaProps = { counter: true };

/* `danger` is a presentation; `aria-invalid` is an assertion. Independent. */
const dangerAndInvalid: TextareaProps = { state: 'danger', 'aria-invalid': true };

/* The state set is closed; it is the same one `Field` publishes. */
// @ts-expect-error `error` is not a state — the vocabulary is default|danger|warn|success
const bogusState: TextareaProps = { state: 'error' };

/*
 * §3.4 gives Textarea no decorative effects at all, and §3.5 forbids glow on a
 * form field outright. None of these may exist as props.
 */
// @ts-expect-error §3.4: Textarea has no glow
const glowing: TextareaProps = { glow: true };
// @ts-expect-error §3.4: Textarea has no tilt
const tilting: TextareaProps = { tilt: true };
// @ts-expect-error §3.4: Textarea has no shimmer
const shimmering: TextareaProps = { shimmer: true };
// @ts-expect-error §3.4: Textarea has no gradient
const gradient: TextareaProps = { gradient: true };
// @ts-expect-error §3.5: magnet is never in a form
const magnetic: TextareaProps = { magnet: true };

/* The counter is a Textarea affordance; Input has no `maxlength` row. */
// @ts-expect-error `counter` is not a boolean-ish string
const counterString: TextareaProps = { counter: 'yes' };

export {
	upstreamBare,
	upstreamValue,
	upstreamDisabled,
	upstreamInvalid,
	upstreamDataAttr,
	stateDanger,
	stateWarn,
	stateSuccess,
	stateDefault,
	busy,
	counted,
	counterWithoutLimit,
	dangerAndInvalid,
	bogusState,
	glowing,
	tilting,
	shimmering,
	gradient,
	magnetic,
	counterString
};
