/**
 * Type-level contract for Alert, checked by `svelte-check`.
 *
 * SPEC.md §3.5 requires the mutual exclusions to be **type errors, not doc
 * comments**, and §7.4 makes "effect props exist only where §3.4 allows them" an
 * acceptance criterion. `@ts-expect-error` inverts the check: if one of the
 * forbidden props or combinations ever becomes legal, this file stops compiling
 * and the regression is caught here rather than in a review six components
 * later.
 *
 * The other half of the file is the strict-superset promise (§1): every upstream
 * shadcn-svelte call site must still type-check against the extended component.
 *
 * Nothing imports this at runtime; it exists to be type-checked. The registry
 * generator excludes `*.types.ts` from every item, so it never reaches a
 * consumer either.
 */
import type { ComponentProps } from 'svelte';
import type { AlertProps } from './alert.svelte';
import * as Alert from './index.js';

type AlertTitleProps = ComponentProps<typeof Alert.Title>;
type AlertDescriptionProps = ComponentProps<typeof Alert.Description>;
type AlertActionProps = ComponentProps<typeof Alert.Action>;

/*
 * `AlertProps` is generic in the variant, so a props *object* has to name it —
 * `AlertProps<'ghost'>`. In markup the generic is inferred from the `variant`
 * attribute and nobody writes it; the demo page covers that path, which is the
 * one that actually has to work.
 */

/* ------------------------------------------------------------------ */
/* Upstream call sites must keep compiling unchanged (§1, §7).         */
/* ------------------------------------------------------------------ */

const upstreamDefault: AlertProps = {};
const upstreamDestructive: AlertProps<'destructive'> = { variant: 'destructive' };
const upstreamClassed: AlertProps = { class: 'mb-4', id: 'save-notice' };
const upstreamTitle: AlertTitleProps = { class: 'font-semibold' };
const upstreamDescription: AlertDescriptionProps = { class: 'text-xs' };
const upstreamAction: AlertActionProps = { class: 'top-3' };

/* ------------------------------------------------------------------ */
/* What the superset adds.                                             */
/* ------------------------------------------------------------------ */

const warningAlert: AlertProps<'warning'> = { variant: 'warning' };
const successAlert: AlertProps<'success'> = { variant: 'success' };
const ghostAlert: AlertProps<'ghost'> = { variant: 'ghost' };
const dismissibleAlert: AlertProps = { dismissible: true, onDismiss: () => {}, dismissLabel: 'Zu' };

/* The three effects §3.4 grants Alert: gradient ●, glow ◐ danger/warn, shimmer ◐ once on mount. */
const gradientAlert: AlertProps = { gradient: true };
const glowingDanger: AlertProps<'destructive'> = { variant: 'destructive', glow: true };
const glowingWarning: AlertProps<'warning'> = { variant: 'warning', glow: true };
const shimmerOnMount: AlertProps<'success'> = { variant: 'success', shimmer: true };
const ghostShimmer: AlertProps<'ghost'> = { variant: 'ghost', shimmer: true };
/*
 * `glow` is offered on every painted variant even though §3.4 only lets it light
 * up on danger/warn. The `◐` condition is a runtime fact about the variant, not
 * something a type can hold, so the component passes it to `fx.resolve` as
 * `available` and this compiles while rendering nothing.
 */
const glowOnDefault: AlertProps = { glow: true };
/* `false` is a real answer and vetoes the preset, in both directions (§3.2 step 6). */
const glowOffAtExpressive: AlertProps<'destructive'> = { variant: 'destructive', glow: false };

/* ------------------------------------------------------------------ */
/* A transparent surface has nothing to paint (§3.5).                  */
/* ------------------------------------------------------------------ */

// @ts-expect-error ghost + gradient is a contradiction (SPEC.md §3.5)
const ghostGradient: AlertProps<'ghost'> = { variant: 'ghost', gradient: true };
// @ts-expect-error ghost + glow has nothing to glow from (SPEC.md §3.5)
const ghostGlow: AlertProps<'ghost'> = { variant: 'ghost', glow: true };

/* ------------------------------------------------------------------ */
/* Effects the matrix withholds must not exist as props at all (§3.4). */
/* ------------------------------------------------------------------ */

// @ts-expect-error §3.4 gives Alert no tilt — and a component this wide has no object-ness to pick up
const tiltingAlert: AlertProps = { tilt: true };
// @ts-expect-error §3.4 gives Alert no magnet — magnet is for isolated CTAs, never in page chrome
const magneticAlert: AlertProps = { magnet: true };
// @ts-expect-error tilt is withheld on every variant, not only the painted ones
const tiltingWarning: AlertProps<'warning'> = { variant: 'warning', tilt: true };
// @ts-expect-error the tone set is closed: default | destructive | warning | success | ghost
const unknownVariant: AlertProps<'danger'> = { variant: 'danger' };

export {
	upstreamDefault,
	upstreamDestructive,
	upstreamClassed,
	upstreamTitle,
	upstreamDescription,
	upstreamAction,
	warningAlert,
	successAlert,
	ghostAlert,
	dismissibleAlert,
	gradientAlert,
	glowingDanger,
	glowingWarning,
	shimmerOnMount,
	ghostShimmer,
	glowOnDefault,
	glowOffAtExpressive,
	ghostGradient,
	ghostGlow,
	tiltingAlert,
	magneticAlert,
	tiltingWarning,
	unknownVariant
};
