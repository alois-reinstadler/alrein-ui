# Phase 0 — acceptance self-check

Against SPEC.md §7. Twelve criteria, for Button, Card and Badge. Anything not verified is marked
**NOT VERIFIED** with the reason, not glossed.

| # | Criterion | Status |
|---|---|---|
| 1 | `svelte-check` strict, zero errors, zero `any` | **PASS** |
| 2 | Zero §1 hard-ban items in the diff | **PASS** |
| 3 | Registry item builds and installs cleanly | **PASS** |
| 4 | Effect props only where §3.4 allows; forbidden combos are type errors | **PASS** |
| 5 | Keyboard-complete and screen-reader-correct | **PASS (narrow)** |
| 6 | Focus ring intact and unobscured at every `data-fx` level | **PARTIAL** |
| 7 | Correct in light and dark, and at off / calm / expressive | **NOT VERIFIED** |
| 8 | `prefers-reduced-motion: reduce` | **PASS (by construction + tests)** |
| 9 | `(pointer: coarse)` | **PASS (by construction + tests)** |
| 10 | No layout shift from any effect | **PASS (proven statically)** |
| 11 | Demo page with every variant and every allowed effect | **PASS** |
| 12 | Side-by-side visual check against the vuesax source | **NOT DONE** |

---

**1 — Types.** `svelte-check`: 372 files, 0 errors, 0 warnings. The only two `any` occurrences in
`src/` are in `src/lib/utils.ts`, which is the verbatim file `shadcn-svelte init` writes, and carry
upstream's own eslint-disable comments. Zero in alrein-authored code.

**2 — Hard bans.** `pnpm bans:check`: 13 rules, 44 files, 0 violations. The rules mechanise §8.3, so
each of `F4`–`F17` has a grep that fires. Two deviations, both deliberate and documented in the
script: `F4-minified` measures line length with quoted string literals collapsed (a verbatim
upstream Tailwind `base:` string is 613 characters and must ship byte-identical), with a raw
backstop at 700; and comments are stripped before matching, so a doc comment explaining *why* rAF is
banned does not itself trip the rAF rule.

One rule fired for real during the build: press's `--ease-fx-spring` lived in `fx.css`, so
allowlisting it would have allowlisted the file containing every effect. Press CSS now has its own
file and the allowlist stays narrow.

**3 — Registry.** `pnpm consumer:smoke` scaffolds a real SvelteKit consumer, adds Tailwind, runs
`shadcn-svelte init`, installs the **upstream** button/card/badge, asserts they really are upstream,
then installs all six alrein items over them from a loopback HTTP server and builds. 62 assertions,
all passing, including that the `@import` lands in the consumer's `app.css` and that every file
matches its source byte for byte.

**4 — Capability matrix.** `button.types.ts`, `badge.types.ts` and `card.types.ts` pin the contract
with `@ts-expect-error`, which fails the build if a forbidden combination ever *stops* being an
error. Confirmed as errors: `ghost`/`link` + `gradient`, `ghost`/`link` + `glow`, `outline` +
`gradient` on Badge, `tilt`/`magnet` on Badge, `ghost`/`shimmer`/`magnet` on Card, and an unknown
effect prop. Confirmed still compiling: every upstream call site, including a dynamically typed
`variant`.

**5 — Keyboard and screen reader.** Narrow claim, honestly scoped: Phase 0 ships no component with
non-trivial keyboard behaviour, so there is nothing here that bits-ui would have owned. What *was*
done: `press` responds to Enter and Space as well as pointer, so the acknowledgement is not
mouse-only; `MorphIndicator` is `aria-hidden` because it echoes state its control already announces,
and §3.5 forbids an effect being a carrier of state; no effect adds or removes a focusable element.
The real test of this criterion arrives in Phase 1 with the form controls.

**6 — Focus ring.** Structurally sound but not observed. The effect layers are `z-index: -1`
pseudo-elements, which paint *after* the host's background and *before* its content, and the focus
ring is an `outline`/`box-shadow` on the host — so nothing in the effect layer can be drawn over it.
`fx-glow-bloom` uses `box-shadow`, which composes with rather than replaces the ring. No effect
declares `outline` or `outline-color`. What is missing is looking at it.

**7 — Light/dark × three fx levels.** **NOT VERIFIED.** No browser automation host is available in
this container (`preview_open` reports none, and CDP on `127.0.0.1:9222` refuses the connection).
Per the operating rules I did not start a browser as a workaround. Every colour resolves through
`color-mix(in oklab, var(--fx-tint) N%, transparent)` where `--fx-tint` defaults to `var(--primary)`,
so dark mode is inherited rather than re-specified — but inheritance is an argument, not a check.
The demo page has a dark toggle and an fx-level switch and is ready for this the moment a browser
is available.

**8 — Reduced motion.** Two independent halves, both verified. In JS, `resolveEffect` vetoes every
pointer-tracked effect at step 2; 5 unit tests cover it, plus 3 asserting that static surface
treatments correctly survive. In CSS, the built stylesheet contains
`@media (prefers-reduced-motion:reduce){:root{--transition-duration-*:1ms; --fx-fade-duration:.1s;
--fx-shimmer-duration:0s; --fx-press-depth:0}}`, and it is emitted *after* the `@theme` block, so it
wins the cascade — confirmed by byte offset in the output. Because Tailwind emits `duration-*` as
`var(--transition-duration-*)` by reference, every utility follows without a second code path.
Not observed in a browser with the setting on.

**9 — Coarse pointer.** `resolveEffect` vetoes glow, tilt and magnet at step 3 (3 unit tests, plus 3
asserting static effects survive), and the built CSS contains a
`@media (pointer:coarse)` block zeroing `--fx-glow`, `--fx-tilt-*` and `--fx-magnet-*` for the
CSS-only path. The engine additionally never registers a vetoed entry. Not observed on a device.

**10 — No layout shift.** **Proven, and more strongly than by observation.**
`scripts/check-layout-safety.mjs` parses the *built* stylesheet, finds every rule whose selector
mentions an `fx-` utility or a `data-fx` scope, and asserts none declares or animates a
layout-affecting property. 27 effect rules, 0 violations. If nothing in the effect layer can reflow,
toggling `data-fx` cannot reflow. Verified non-vacuous by injecting `margin-left: 2px` and
`transition: width …` into `fx-magnet` — both were caught, with the right messages.

**11 — Demo page.** Every Button variant, size and icon size; every Badge variant; all seven Card
sub-components; every effect the matrix allows on each; nested scopes demonstrating that
`data-fx="off"` is sticky; and the capability table rendered directly from `CAPABILITIES`, so the
published matrix and the enforced matrix are the same object.

**12 — Visual fidelity against the vuesax source.** **NOT DONE**, and it needs a decision rather
than more effort. Amendment A9 says size, spacing and colour come from shadcn-svelte, not vuesax,
which removes most of what a side-by-side comparison was for. What remains comparable is the
*character* of the effects — glow falloff, tilt feel, shimmer angle. That comparison needs a
browser, and it needs agreement on what "fidelity" means now that the metrics are explicitly
shadcn's. See the open questions in the handover.

---

## What is blocked

Browser verification. `mcp__t3-code__preview_*` reports no automation host, and CDP on
`127.0.0.1:9222` is refused — consistent with the Xvfb/Chrome stack being listed as pending in the
environment baseline. Criteria 6 (partially), 7 and 12 are waiting on it. The dev server itself runs
fine; the tailnet address `100.64.0.2` is also not bindable from inside this container, which the
baseline notes needs a restart to activate.
