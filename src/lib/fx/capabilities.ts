/**
 * The capability matrix from SPEC.md §3.4, as a checkable contract.
 *
 * The matrix is enforced in two places and it is worth being clear about which
 * does what, because the prior attempt (SPEC.md §8, `F8`) had neither:
 *
 *  - **Types.** A component only declares the props §3.4 allows it. There is no
 *    `magnet` prop on Card, so `<Card magnet />` is a compile error rather than a
 *    silently ignored attribute. Forbidden *combinations* (`ghost + gradient`,
 *    `ghost + glow`) are expressed as discriminated unions in the component's own
 *    props type. Nothing here can express that for you.
 *
 *  - **This module.** The `◐` cells carry a *condition* ("primary only",
 *    "size ≥ md", "expressive only") that types cannot check, plus the §3.5
 *    budget, which is a per-surface count rather than a per-prop rule. Those are
 *    runtime, dev-only, and live here.
 */

/**
 * `ghost` and `press` are deliberately absent.
 *
 * `ghost` is a *variant*, not an effect (§3.1) — it lives in the component's
 * variant enum, and upstream shadcn-svelte already ships it on Button and Badge.
 * `press` is always on and never opt-in, so it has nothing to resolve.
 */
export type FxEffect = 'gradient' | 'glow' | 'shimmer' | 'tilt' | 'magnet';

/**
 * Pointer-tracked effects are the ones the singleton engine drives, and the ones
 * that §3.2 steps 2, 3 and 5 kill outright. Everything else is a static surface
 * treatment or a self-contained CSS animation.
 */
export const POINTER_TRACKED: ReadonlySet<FxEffect> = new Set<FxEffect>(['glow', 'tilt', 'magnet']);

/** `true` = allowed (`●`); a string = allowed with that condition (`◐`); absent = forbidden (`—`). */
export type Capability = true | string;

export type CapabilityRow = Partial<Record<FxEffect, Capability>>;

/**
 * SPEC.md §3.4, transcribed. Keys are the component names used by the registry.
 *
 * This is the source the docs page renders from, so the published matrix and the
 * enforced matrix are the same object. Components not listed here are allowed no
 * decorative effects at all — which covers Input, Textarea, Select, Tooltip,
 * Popover and Dialog by design, not by omission.
 */
export const CAPABILITIES = {
	button: {
		gradient: 'primary only',
		glow: 'primary/accent',
		shimmer: 'triggered',
		tilt: 'size ≥ md, standalone',
		magnet: 'expressive only'
	},
	'button-group': { gradient: true },
	card: { gradient: 'hero variant', glow: 'interactive only', tilt: true },
	badge: { gradient: true, glow: 'status-critical', shimmer: 'triggered' },
	chip: { gradient: true },
	alert: { gradient: true, glow: 'danger/warn', shimmer: 'once on mount' },
	accordion: { gradient: 'header only', glow: 'trigger' },
	avatar: { gradient: 'fallback bg', glow: 'presence state', shimmer: true, tilt: 'size ≥ lg' },
	'avatar-group': { gradient: true, shimmer: true },
	'checkbox-card': { gradient: 'selected', glow: 'selected', tilt: true },
	'radio-card': { gradient: 'selected', glow: 'selected', tilt: true },
	steps: { gradient: 'active step' },
	'upload-area': { glow: 'drag-over', shimmer: true, tilt: true },
	skeleton: { shimmer: true },
	'table-row': { gradient: true }
} as const satisfies Record<string, CapabilityRow>;

export type FxComponent = keyof typeof CAPABILITIES;

/** Whether §3.4 permits `effect` on `component` at all, ignoring any `◐` condition. */
export function allows(component: FxComponent, effect: FxEffect): boolean {
	return (CAPABILITIES[component] as CapabilityRow)[effect] !== undefined;
}

/**
 * §3.5 budget: max 2 decorative effects on one element, max 1 glowing and 1
 * tilting element per visible surface.
 *
 * "This is the single rule that keeps the library from looking like a 2011
 * Dribbble shot." It only fires in dev — in production it compiles to nothing,
 * because counting live instances is not worth a byte of a consumer's bundle.
 */
const MAX_EFFECTS_PER_ELEMENT = 2;

export function warnIfOverBudget(component: string, active: readonly FxEffect[]): void {
	if (!import.meta.env.DEV) return;
	if (active.length <= MAX_EFFECTS_PER_ELEMENT) return;
	console.warn(
		`[alrein-ui] <${component}> has ${active.length} decorative effects (${active.join(', ')}). ` +
			`SPEC.md §3.5 caps one element at ${MAX_EFFECTS_PER_ELEMENT}. Pick the one that carries the signal.`
	);
}
