/**
 * Type-level contract for Select, checked by `svelte-check`.
 *
 * SPEC.md §7.4 makes "effect props exist only where §3.4 allows them" an
 * acceptance criterion, and §3.5 requires that to be a *type error*, not a doc
 * comment. `@ts-expect-error` inverts the check: if one of the forbidden props
 * ever becomes legal, this file stops compiling and the regression is caught
 * here rather than in a review six components later.
 *
 * The other half of the file is the strict-superset promise (§1): every
 * upstream shadcn-svelte call site must still type-check against the extended
 * component. Nothing imports this at runtime; it exists to be type-checked.
 */
import type { ComponentProps } from 'svelte';
import type { SelectTriggerProps } from './select-trigger.svelte';
import * as Select from './index.js';

type SelectRootProps = ComponentProps<typeof Select.Root>;
type SelectContentProps = ComponentProps<typeof Select.Content>;
type SelectItemProps = ComponentProps<typeof Select.Item>;
type SelectGroupProps = ComponentProps<typeof Select.Group>;
type SelectSeparatorProps = ComponentProps<typeof Select.Separator>;

/* ------------------------------------------------------------------ */
/* Upstream call sites must keep compiling unchanged (§1, §7).         */
/* ------------------------------------------------------------------ */

const upstreamTrigger: SelectTriggerProps = {};
const upstreamTriggerSm: SelectTriggerProps = { size: 'sm' };
const upstreamTriggerDisabled: SelectTriggerProps = { size: 'default', disabled: true };
const upstreamTriggerInvalid: SelectTriggerProps = { 'aria-invalid': true, class: 'w-56' };

const upstreamRoot: SelectRootProps = { type: 'single', value: 'a', onValueChange: () => {} };
const upstreamRootMultiple: SelectRootProps = { type: 'multiple', value: ['a'], open: false };
const upstreamContent: SelectContentProps = { sideOffset: 4, side: 'bottom', align: 'start' };
const upstreamItem: SelectItemProps = { value: 'a', label: 'A', disabled: false };
const upstreamGroup: SelectGroupProps = { class: 'p-1' };
const upstreamSeparator: SelectSeparatorProps = { orientation: 'horizontal' };

/* ------------------------------------------------------------------ */
/* What the superset adds.                                             */
/* ------------------------------------------------------------------ */

/**
 * The tone set, matching `FieldState`. Explicit here; omitted, the trigger
 * inherits whatever a surrounding `<Field state="…">` publishes, which is a
 * CSS-level fallback and so has no type to assert.
 *
 * `state="danger"` sets no `aria-invalid` — a warning is not an invalid value —
 * which is a runtime fact the markup carries, not something a type can hold.
 */
const dangerTrigger: SelectTriggerProps = { state: 'danger' };
const warnTrigger: SelectTriggerProps = { state: 'warn' };
const successTrigger: SelectTriggerProps = { state: 'success' };
const neutralTrigger: SelectTriggerProps = { state: 'default' };
const loadingTrigger: SelectTriggerProps = { loading: true, state: 'warn', size: 'sm' };

/* `state` is `FieldState`, not a free string — it is imported from Field, not
 * redeclared, so the two can never drift apart. */
// @ts-expect-error `error` is not one of default | danger | warn | success
const wrongState: SelectTriggerProps = { state: 'error' };
// @ts-expect-error the tone set is shared with Field; `info` is not in it
const unknownState: SelectTriggerProps = { state: 'info' };

/* ------------------------------------------------------------------ */
/* Effects §3.4 does not give Select must not exist as props at all.   */
/* ------------------------------------------------------------------ */

/*
 * §3.4 gives Input / Textarea / Select no decorative effects whatsoever. Two of
 * these are load-bearing rather than merely absent:
 *
 *  - `glow` — A14. The vuesax source has it *on by default* on Select. §3.5
 *    forbids glow on form fields outright, because a glow on a focused field
 *    competes with the focus ring and users read it as an error state.
 *  - `tilt` — §3.5. Select hosts floating UI, and a `transform` on an ancestor
 *    creates a containing block for `position: fixed`, so the portalled menu
 *    would anchor to the trigger's transform and land in the wrong place.
 */
// @ts-expect-error Select has no glow (§3.4, §3.5, A14)
const glowingTrigger: SelectTriggerProps = { glow: true };
// @ts-expect-error Select hosts floating UI and may not tilt (§3.5)
const tiltingTrigger: SelectTriggerProps = { tilt: true };
// @ts-expect-error Select has no shimmer (§3.4)
const shimmeringTrigger: SelectTriggerProps = { shimmer: true };
// @ts-expect-error Select has no gradient (§3.4)
const gradientTrigger: SelectTriggerProps = { gradient: true };
// @ts-expect-error magnet is never on a form control (§3.5)
const magneticTrigger: SelectTriggerProps = { magnet: true };
// @ts-expect-error the menu is a form surface too, and gets no effects either
const glowingContent: SelectContentProps = { glow: true };

export type {};
export {
	upstreamTrigger,
	upstreamTriggerSm,
	upstreamTriggerDisabled,
	upstreamTriggerInvalid,
	upstreamRoot,
	upstreamRootMultiple,
	upstreamContent,
	upstreamItem,
	upstreamGroup,
	upstreamSeparator,
	dangerTrigger,
	warnTrigger,
	successTrigger,
	neutralTrigger,
	loadingTrigger,
	wrongState,
	unknownState,
	glowingTrigger,
	tiltingTrigger,
	shimmeringTrigger,
	gradientTrigger,
	magneticTrigger,
	glowingContent
};
