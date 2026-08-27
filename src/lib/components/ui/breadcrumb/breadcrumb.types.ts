/**
 * Type-level contract for Breadcrumb (SPEC.md §3.5, §7.4).
 *
 * §3.4's Breadcrumb row is `ghost ●` and five dashes, so almost all of this file
 * is `@ts-expect-error`: the effects the matrix withholds must not exist as
 * props at all, rather than existing and being ignored. If one of them ever
 * stops being an error, this file fails to compile.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { ComponentProps } from 'svelte';
import type { BreadcrumbProps } from './breadcrumb.svelte';
import * as Breadcrumb from './index.js';

/*
 * All seven upstream pieces are still here under their upstream names. `F1` was
 * a multi-part component losing its sub-components silently, so this is the
 * regression test for it — `Breadcrumb.Ellipsis` in particular, because the
 * source's answer to overflow is a different component entirely and it would be
 * easy to ship that one instead of this one.
 */
const parts = [
	Breadcrumb.Root,
	Breadcrumb.List,
	Breadcrumb.Item,
	Breadcrumb.Link,
	Breadcrumb.Page,
	Breadcrumb.Separator,
	Breadcrumb.Ellipsis
] as const;

type BreadcrumbLinkProps = ComponentProps<typeof Breadcrumb.Link>;
type BreadcrumbPageProps = ComponentProps<typeof Breadcrumb.Page>;

/* Upstream call sites must keep compiling unchanged (SPEC.md §1, §7). */
const upstreamRoot: BreadcrumbProps = {};
const upstreamLink: BreadcrumbLinkProps = { href: '/projekte' };
const upstreamPage: BreadcrumbPageProps = {};
/* Upstream's own markup on the current crumb still type-checks; see the file. */
const upstreamPageRole: BreadcrumbPageProps = { role: 'link', 'aria-disabled': 'true' };

/* The only thing §3.4 grants Breadcrumb. */
const ghostTrail: BreadcrumbProps = { variant: 'ghost' };

/*
 * Everything else in the row is a dash. The source applies four decorative
 * effects to its crumbs — a glow on the letters, a glow on the separators, an
 * 1820ms text reveal and a 1600ms flicker — and the matrix grants none of them,
 * so none of them has a prop to be passed through.
 */
// @ts-expect-error §3.4 gives Breadcrumb no gradient
const gradientTrail: BreadcrumbProps = { gradient: true };
// @ts-expect-error the cursor light on the crumbs is a glow, and Breadcrumb has none (A20)
const glowingTrail: BreadcrumbProps = { glow: true };
// @ts-expect-error §3.4 gives Breadcrumb no shimmer
const shimmeringTrail: BreadcrumbProps = { shimmer: true };
// @ts-expect-error a crumb is not an object you can pick up
const tiltedTrail: BreadcrumbProps = { tilt: true };
// @ts-expect-error magnet is for isolated CTAs only, never in navigation chrome
const magneticTrail: BreadcrumbProps = { magnet: true };

/* And they are not per-crumb props either — the row is the component's, not the part's. */
// @ts-expect-error the crumb has no glow to inherit
const glowingCrumb: BreadcrumbLinkProps = { href: '/x', glow: true };
// @ts-expect-error ghost is a root variant, so the trail cannot disagree with itself
const ghostCrumb: BreadcrumbLinkProps = { href: '/x', variant: 'ghost' };

export {
	parts,
	upstreamRoot,
	upstreamLink,
	upstreamPage,
	upstreamPageRole,
	ghostTrail,
	gradientTrail,
	glowingTrail,
	shimmeringTrail,
	tiltedTrail,
	magneticTrail,
	glowingCrumb,
	ghostCrumb
};
