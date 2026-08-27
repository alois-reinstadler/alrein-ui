/**
 * Type-level contract for Pagination (SPEC.md §3.5, §7.4).
 *
 * `@ts-expect-error` inverts the check: if a forbidden prop ever *starts*
 * compiling, this file stops compiling. Nothing imports it at runtime; it exists
 * to be type-checked.
 *
 * §3.4's row is shared with Tabs and reads `ghost ● · gradient — · glow — ·
 * shimmer — · tilt — · magnet —`. Ghost is not a prop here either: §3.1 puts it
 * in the variant enum, and for Pagination it is already there — every
 * non-current page renders `buttonVariants({ variant: "ghost" })`.
 */
import type { PaginationLinkProps, PaginationProps, PaginationStatusProps } from './index.js';
import * as Pagination from './index.js';

/*
 * Every upstream piece is still here, under both export names, including the two
 * `PrevButton`/`NextButton` aliases upstream keeps for older call sites. The
 * prior attempt deleted sub-components while claiming to extend a component
 * (SPEC.md §8, `F1`); this is the regression test for that, in the shape
 * `card.types.ts` uses.
 */
const parts = [
	Pagination.Root,
	Pagination.Content,
	Pagination.Item,
	Pagination.Link,
	Pagination.Ellipsis,
	Pagination.Previous,
	Pagination.Next,
	Pagination.PrevButton,
	Pagination.NextButton
] as const;

const aliases = [
	Pagination.Pagination,
	Pagination.PaginationContent,
	Pagination.PaginationItem,
	Pagination.PaginationLink,
	Pagination.PaginationEllipsis,
	Pagination.PaginationPrevious,
	Pagination.PaginationNext,
	Pagination.PaginationPrevButton,
	Pagination.PaginationNextButton
] as const;

/** The one addition, and the reason §5 collapses `pagination-compact` into here. */
const added = [Pagination.Status] as const;

/* Upstream call sites must keep compiling unchanged (SPEC.md §1, §7). */
const upstreamRoot: PaginationProps = { count: 100, perPage: 10 };
const upstreamSiblings: PaginationProps = { count: 40, perPage: 10, siblingCount: 2 };
const upstreamLink: PaginationLinkProps = { page: { type: 'page', value: 3 }, isActive: true };
const upstreamLinkSized: PaginationLinkProps = {
	page: { type: 'page', value: 3 },
	isActive: false,
	size: 'icon-sm'
};

/* The §5 collapse, and the keyboard props bits-ui already owns (A24, `F14`). */
const compact: PaginationProps = { count: 100, perPage: 10, variant: 'compact' };
const looping: PaginationProps = { count: 100, perPage: 10, loop: true, orientation: 'vertical' };
const status: PaginationStatusProps = {};

/*
 * The five effects §3.4 withholds. Pagination is application chrome and a run of
 * peers: a glow means "the highest-intent target on this surface" (§3.1), and
 * page 4 is not more intent-bearing than page 5. The source's `--lit` light on
 * the arrows, its cursor light on the digits and its gooey SVG filter are all
 * this row, three times (A20, references/VUESAX-INTENT-2.md §17).
 */
// @ts-expect-error §3.4 gives Pagination no gradient
const gradientRoot: PaginationProps = { count: 10, gradient: true };
// @ts-expect-error §3.4 gives Pagination no glow; the arrows' --lit light is one (A20)
const glowRoot: PaginationProps = { count: 10, glow: true };
// @ts-expect-error §3.4 gives Pagination no shimmer; an idle loop is loading, or it is a migraine
const shimmerRoot: PaginationProps = { count: 10, shimmer: true };
// @ts-expect-error §3.4 gives Pagination no tilt; the source's 3D press is declined by A10 too
const tiltRoot: PaginationProps = { count: 10, tilt: true };
// @ts-expect-error §3.4 gives Pagination no magnet; magnet is never in application chrome (§3.5)
const magnetRoot: PaginationProps = { count: 10, magnet: true };

/* And the same at the part that would most plausibly grow one. */
// @ts-expect-error a page button is one of a run of peers; none of them is the intent target
const glowLink: PaginationLinkProps = { page: { type: 'page', value: 1 }, isActive: true, glow: true };

/* Variants that do not exist must not be reachable through the enum. */
// @ts-expect-error `dots`, `ink`, `segments` and `gooey` are vuesax skins we did not port (§5)
const inkRoot: PaginationProps = { count: 10, variant: 'ink' };

export {
	parts,
	aliases,
	added,
	upstreamRoot,
	upstreamSiblings,
	upstreamLink,
	upstreamLinkSized,
	compact,
	looping,
	status,
	gradientRoot,
	glowRoot,
	shimmerRoot,
	tiltRoot,
	magnetRoot,
	glowLink,
	inkRoot
};
