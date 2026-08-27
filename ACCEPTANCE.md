# Acceptance record

One section per phase, against SPEC.md §7. Anything not verified is marked
**NOT VERIFIED** with the reason, not glossed.

---

# Phase 0 — foundation, Button, Card, Badge

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

---

# Phase 1 — form controls

Input · Textarea · Checkbox · RadioGroup · Switch · Select · Field. Plus Spinner, built early
because two Phase 1 components had `TODO(phase-2)` inline copies of it.

| # | Criterion | Status |
|---|---|---|
| 1 | `svelte-check` strict, zero errors, zero `any` | **PASS** |
| 2 | Zero §1 hard-ban items in the diff | **PASS** |
| 3 | Registry item builds and installs cleanly | **PASS (build + validate); install re-proof pending** |
| 4 | Effect props only where §3.4 allows; forbidden combos are type errors | **PASS** |
| 5 | Keyboard-complete and screen-reader-correct | **PASS** |
| 6 | Focus ring intact and unobscured at every `data-fx` level | **PARTIAL** |
| 7 | Correct in light and dark, and at off / calm / expressive | **PARTIAL — levels verified, light/dark not** |
| 8 | `prefers-reduced-motion: reduce` | **PASS** |
| 9 | `(pointer: coarse)` | **PASS** |
| 10 | No layout shift from any effect | **PASS (proven statically)** |
| 11 | Demo page with every variant and every allowed effect | **PASS** |
| 12 | Side-by-side visual check against the vuesax source | **DONE DIFFERENTLY — see below** |

**1 — Types.** 944 files, 0 errors, 0 warnings. Still no `any` outside the verbatim upstream
`utils.ts`.

**2 — Hard bans.** 14 rules now, 0 violations. Two were added or retuned during the phase, both
because they fired on something legitimate: `F4-minified`'s raw backstop was catching verbatim
upstream Tailwind strings (select-trigger's is 862 characters), so it moved to 1200 with the
measurement recorded, and a separate 400-character rule was split out for `.css`, which has no
string literals to collapse. Test files are excluded from the *motion* rules only — a test that pins
`[0.34, 1.56, 0.64, 1]` to assert the spring overshoots is verification, not use — and remain subject
to every structural rule.

**3 — Registry.** `registry:gen` now generates `registry.json` from `registry.config.mjs`, reading
each item's file list off disk; `registry:check` validates 14 items against disk, the built output
and `package.json`. The full `consumer:smoke` install has not been re-run since Phase 0's 62
assertions — it scaffolds an entire SvelteKit app and the tree has been under concurrent edit. It is
the one criterion here carrying an asterisk.

**4 — Capability matrix.** §3.4 gives Input, Textarea and Select **no decorative effects at all**,
so the strongest assertion for those three is that the props do not exist — pinned in
`input.types.ts`, `textarea.types.ts` and `select.types.ts`. Checkbox and RadioGroup carry
card-only effects: `<Checkbox tilt />` is a compile error, `<Checkbox variant="card" tilt />` is not.

Button and Badge moved from a discriminated union to a conditional type on a variant generic during
this phase, and the reason is worth recording: `Omit<ComponentProps<typeof Button>, "href">` — which
is exactly what shadcn's own `InputGroupButton` does — collapses a union to the intersection of its
keys, and intersecting both branches with the full HTML attribute surface produced "union type too
complex to represent". **Not breaking an existing shadcn call site is the stronger rule.** Both
directions are now checked: `*.call-sites.svelte` proves the valid markup compiles, and removing an
`@ts-expect-error` proves the invalid markup still does not.

**5 — Keyboard and screen reader.** This is the phase where the criterion bites, and the answer is
mostly "bits-ui". Verified by reading `bits-ui@2.19.0` sources rather than assuming: Select's trigger
already owns Enter/Space/arrow open, arrow highlight, DOM and data typeahead, Tab/Escape close and
the full `aria-haspopup`/`expanded`/`activedescendant` set. No keyboard handling was written.

Two findings changed the work. **A15 was wrong** and is corrected in the spec: bits-ui's
`SwitchRootState.onkeydown` handles Enter and Space only, not the absolute arrow keys the digest
described. Not implementing them is still right — the ARIA practices make arrow keys optional for a
switch — but for a different reason than recorded. And **Select's `loading` had to block *through*
bits-ui rather than around it**: our handlers run first and `preventDefault()` stops its open
handler, with Tab and Escape deliberately left live, because a loading field that swallows Tab is a
focus trap.

The vuesax accessibility defects are not inherited (A15): real `<label>` elements, real focusable
buttons, a real `aria-describedby` chain.

**6 — Focus ring.** Same position as Phase 0: structurally sound, not observed. No form control
declares `outline` in its effect layer, and the fields have no effect layer at all.

**7 — Light/dark × three levels.** The **three effect levels are now verified**, which is new:
`pnpm ssr:check` server-renders 13 pages at each level and asserts what may and may not appear —
39 renders per run. It found a real bug on its first run (see below). **Light/dark is still not
verified**, for the same reason as Phase 0: no browser automation host.

**8 — Reduced motion.** Strengthened during this phase, and a real bug was fixed. The token layer
was setting `--fx-shimmer-duration: 0ms` under reduced motion, which *stops* the loading loop — and
a motionless skeleton or spinner asserts that the work has finished. A17 now slows the loop to 3s
(spinner to 2.4s) instead, and splits out `--fx-shimmer-sweep-duration` for the triggered attention
sweep, which *is* decoration and does still stop. The vuesax source reaches the same conclusion
independently.

Separately: the motion layer's token cache never invalidated, so toggling reduced motion at runtime
collapsed the CSS half while the Svelte transitions kept their pre-change numbers. One module-level
listener now clears it — one listener, not the 124 copy-pasted checks the prior attempt had.

**9 — Coarse pointer.** Unchanged and now continuously checked: `ssr:check` asserts no
glow/tilt/magnet class reaches server markup on any page at any level, and a server is a machine with
no pointer.

**10 — No layout shift.** 30 effect rules checked, 0 violations. The floating label animates
`max-width` and is an **A16 carve-out** — the layout change *is* the animation, as with `collapse` —
and says so in the file, because `check-layout-safety` scopes to the effect layer and would
otherwise leave a reviewer to guess.

**11 — Demo pages.** Seven new pages plus an effect-system page. The docs site was restructured
during this phase: a single page does not survive 28 components, and the effect level now lives in
the layout so it persists across navigation, which is what makes comparing two components at
`expressive` possible at all.

**12 — Visual fidelity.** Done differently, and deliberately. A9 moved size, spacing and colour to
shadcn, which removed most of what a side-by-side comparison was for. What remained — motion
character and state semantics — was extracted by reading the vuesax web-component and shadow-CSS
sources directly into `references/VUESAX-INTENT.md` and `VUESAX-INTENT-2.md`, and turned into
amendments A10–A25. **Sixteen source behaviours are declined on the record rather than by
omission**, each with its reason: the 3D press (nine of nineteen components — it creates a containing
block for `position: fixed`, and press is always on, so every dropdown trigger would anchor its
portal wrong), a third overshoot site, three overshoots on layout properties, Select's
height-animating menu morph, Select's default glow, the 1820ms water-drop text reveal, the
pointer-tracked cursor light on text, and the undocumented "neighbour light" second proximity engine.

This is a better artefact than a screenshot comparison would have been, and it is what the criterion
was actually for. It is not a substitute for looking at the result, which still has not happened.

## Bugs this phase's checks caught

Recorded because a check that has never caught anything is not evidence of anything.

1. **`FxScope` configured its context in `$effect.pre`**, which does not run during SSR — so every
   scope rendered its *parent's* level server-side and corrected only on hydration, defeating the
   reason §3.3 puts a literal `data-fx` attribute in the DOM. Found by `ssr:check` on its first run.
2. **The floating label's "filled" selector was always true.**
   `:has(:not(:placeholder-shown))` reads as "contains something not showing a placeholder", which
   is true of the `<legend>` and the `<label>` itself. Found by review, not by a check.
3. **Fixing that exposed a second bug**: as scoped CSS the corrected selector was pruned as unused,
   because Svelte scopes to elements it can see and the control arrives through a snippet.
4. **The pointer engine left everything stuck on window exit** — glow lit, card tilted, cursor gone
   — because decay is driven by `pointermove` and there are no more of those once the pointer
   leaves. Found by review.
5. **`shadcn-svelte add field input-group` reverted the entire alrein Button to stock**, having
   pulled it in as a registry dependency. `svelte-check` only noticed because the demo page used
   props that had vanished. `pnpm supersets:check` exists because of this.
6. **The reduced-motion loading loop stopped instead of slowing** (A17, above).

## Still blocked

Browser verification, unchanged from Phase 0. `mcp__t3-code__preview_*` reports no automation host
and CDP on `127.0.0.1:9222` is refused. Criteria 6 and 7 are waiting on it. Everything that *can* be
verified without one has been, and three checks were built specifically to close the gap:
`layout:check`, `ssr:check` and `supersets:check`.

---

# Phase 2 — feedback and display

Alert · Avatar (+ AvatarGroup) · Chip · Spinner · Tooltip · Rating · Skeleton. Plus ButtonGroup,
which belongs to Phase 0's Button family and had been missing from the inventory.

| # | Criterion | Status |
|---|---|---|
| 1 | `svelte-check` strict, zero errors, zero `any` | **PASS** |
| 2 | Zero §1 hard-ban items in the diff | **PASS** |
| 3 | Registry item builds and installs cleanly | **PASS** |
| 4 | Effect props only where §3.4 allows; forbidden combos are type errors | **PASS** |
| 5 | Keyboard-complete and screen-reader-correct | **PASS** |
| 6 | Focus ring intact at every `data-fx` level | **PARTIAL** — structural, unobserved |
| 7 | Correct in light and dark, and at off / calm / expressive | **PARTIAL** — levels verified, light/dark not |
| 8 | `prefers-reduced-motion: reduce` | **PASS** |
| 9 | `(pointer: coarse)` | **PASS** |
| 10 | No layout shift from any effect | **PASS (proven statically)** |
| 11 | Demo page with every variant and every allowed effect | **PASS** |
| 12 | Side-by-side visual check against the vuesax source | **DONE DIFFERENTLY** — see Phase 1 |

**3 — Registry.** `pnpm consumer:smoke` was re-run in full against all 21 items of the time: it
scaffolds a real SvelteKit consumer, installs the **upstream** button, card and badge, asserts they
really are upstream, then installs every alrein item over them and asserts by name that all five
upstream Button variants, all three extra icon sizes and all six Card sub-components survived. All
assertions passed and the consumer built. That is the criterion met rather than argued.

**5 — Keyboard.** Rating is the one that mattered, and the answer came from reading `bits-ui`
rather than assuming: it has a `RatingGroup` primitive, so arrow keys, form association and
announcement are inherited rather than written. A24 records what the source does instead —
`role="slider"` on a wrapper while keeping N focusable `<button>` stars, which is invalid — and that
is not inherited.

**8 — Reduced motion.** This phase is where A17 was found and fixed, and Skeleton is where it
matters most: the token layer was stopping the loading loop, and a motionless skeleton asserts the
content has arrived. The loop now slows; the *triggered* sweep, which is decoration, still stops,
which is why the two need separate tokens.

**§3.4 in practice.** Skeleton is the only component in the phase whose source needed no decline —
vuesax applies nothing beyond the matrix there either. Everything else needed at least one, and
they are recorded in A20 rather than left implicit.

## Bugs this phase's checks caught

1. **`shadcn-svelte add field input-group` reverted the entire alrein Button to stock**, having
   pulled it in as a registry dependency. `pnpm supersets:check` exists because of this, and it
   caught the same failure again in Phase 3 — where `add sidebar` reverted **four** supersets at
   once — this time automatically and by name.
2. **`layout:check` was passing because it had nothing to look at.** It reads the built stylesheet,
   and Tailwind tree-shakes a utility nothing uses, so a newly added `fx-collapse` was reported as
   "32 rules, 0 violations" while the rule under review was not in the file. `@source inline()` now
   forces every effect utility into the build; coverage went from 30 rules to 45.
3. **`ssr:check`'s class matcher used a word boundary**, so `\bfx-shimmer\b` matched inside
   `[animation-duration:var(--fx-shimmer-duration)]` — a token the loading spinner legitimately
   reads. It compares whole class tokens now.

---

# Phase 4 — complex

ColorPicker · Code · CodeWindow · UploadArea.

| # | Criterion | Status |
|---|---|---|
| 1 | `svelte-check` strict, zero errors, zero `any` | **PASS** |
| 2 | Zero §1 hard-ban items in the diff | **PASS** |
| 3 | Registry item builds and validates | **PASS** — 26 items, 114 files |
| 4 | Effect props only where §3.4 allows | **PASS** |
| 5 | Keyboard-complete and screen-reader-correct | **PASS** |
| 6 | Focus ring intact at every `data-fx` level | **PARTIAL** |
| 7 | Correct in light and dark, and at off / calm / expressive | **PARTIAL** |
| 8 | `prefers-reduced-motion: reduce` | **PASS** |
| 9 | `(pointer: coarse)` | **PASS** |
| 10 | No layout shift from any effect | **PASS** |
| 11 | Demo page with every variant | **PASS** |
| 12 | Visual fidelity | **DONE DIFFERENTLY** |

**The dependency decisions (A26–A28) were made before any code was written**, as §5 requires.
ColorPicker uses an internal OKLCH converter rather than `culori`, on the argument that a registry
ships source into a consumer's repository so a dependency here is one every consumer inherits.
Shiki ships, but lazily, from the web bundle, with a fourteen-language allowlist, and declared on
the `code` item alone — installing Button does not pull a syntax highlighter.

**4 — Three of the four components are granted nothing at all**, and in each case the reason is
sharper than "the matrix says so": a glow over a colour picker misreports the value it exists to
show; a gradient behind code fights the syntax colours; a decorated spinner competes with what it is
saying. UploadArea is the exception, and each of its three effects carries a distinct signal — glow
answers "will letting go here do anything?" and is available only while a file is over the zone.

**5 — Accessibility is most of the work in this phase.** ColorPicker's sliders are the control and
the 2D area is an `aria-hidden` pointer affordance, because a two-axis colour field has no honest
ARIA shape — the source puts `role="slider"` on one, which is invalid for the same reason A24 flags
on Rating. UploadArea is a real `<input type="file">` with drag-and-drop layered on top; a dropzone
that is only a dropzone excludes every keyboard user. Code's un-highlighted render is readable,
selectable and copyable from first paint and stays so if Shiki never loads.

**Tests.** 145 total, up from 57 at the end of Phase 1. The new ones earn the two decisions that
were argued rather than obvious: 43 for the colour converter — checked against Ottosson's published
values, not only against its own inverse — and 22 for the upload state, including the case that
motivates validating in one place (a browser will drop a `.exe` onto a zone whose input says
`accept="image/*"`, because the drop path never goes through the input).

## Bugs this phase's checks caught

1. **The Code fallback used `{@html escapeHtml(code)}`** — routing a string through `@html` to
   un-escape what had just been escaped, strictly more dangerous for identical output. It renders
   plain `{code}` now, which Svelte escapes. `F13-dom` was extended to ban `{@html}` outright, with
   Code as the single allowlisted use, and verified by planting one in `card.svelte`.
2. **Two bugs in my own colour tests**, both of which would have made the suite lie: one demanded
   5e-7 precision that two cube roots and two gamma curves cannot give, and one asserted round-trip
   stability while holding a channel at `0.5` — and `0.5 × 255` is exactly `127.5`, a rounding tie
   that any perturbation flips. A test built on a tie measures the tie.
3. **The UploadArea demo tripped `F9-raf`** with a fake transport. Rather than allowlist the demo,
   the progress is now advanced by a button — which demonstrates the actual design point better,
   since the caller owns transport and reports progress in.

---

# Phase 3 — navigation and structure

Tabs · Steps · Accordion · Breadcrumb · Pagination · Sidebar · Timeline.

| # | Criterion | Status |
|---|---|---|
| 1 | `svelte-check` strict, zero errors, zero `any` | **PASS** |
| 2 | Zero §1 hard-ban items in the diff | **PASS** |
| 3 | Registry item builds and installs cleanly | **PASS** — re-proven at 31 items |
| 4 | Effect props only where §3.4 allows | **PASS** |
| 5 | Keyboard-complete and screen-reader-correct | **PASS**, with one upstream bug fixed |
| 6 | Focus ring intact at every `data-fx` level | **PARTIAL** |
| 7 | Correct in light and dark, and at off / calm / expressive | **PARTIAL** — levels verified, light/dark not |
| 8 | `prefers-reduced-motion: reduce` | **PASS** |
| 9 | `(pointer: coarse)` | **PASS** |
| 10 | No layout shift from any effect | **PASS** |
| 11 | Demo page with every variant | **PASS** |
| 12 | Visual fidelity | **DONE DIFFERENTLY**, with one known shortfall — see below |

**The indicator was the phase's real work.** Every Tabs and Pagination indicator variant in the
source animates `width` on a spring — a layout overshoot, eleven times over. All of them are
re-expressed as FLIP on the shared `MorphIndicator`: `translateX` plus `scaleX`, transform only.

A18 corrected §4.9 in the process: MorphIndicator's consumers are Tabs, **Pagination** and Sidebar,
not Steps. Steps has no sliding indicator anywhere in the source — its progress is a per-segment
`scaleX` plus a `stroke-dashoffset` ring, already transform-only.

**5 — Keyboard.** bits-ui had more than A24 credited it with, and checking rather than assuming
found it: it already implements Pagination's arrow keys, direction-aware next/prev, `Home`/`End`
and an optional loop. Nothing was hand-rolled. A24's Pagination claim is corrected in the spec,
which makes it the *second* amendment to have named a gap that bits-ui had already filled — the
first being A15 on the switch. The lesson is recorded rather than the correction alone: **read the
primitive before believing a digest about it.**

Two genuine defects in **shadcn-svelte itself** were fixed rather than inherited (A24b), plus one
in bits-ui (A24a):
- **Upstream `pagination-ellipsis` sets `aria-hidden="true"` on its wrapper**, which prunes the
  `<span class="sr-only">More pages</span>` inside it — so the gap in the page run is silent. The
  attribute moved to the icon. Visually identical, audibly not.
- **Upstream Pagination's press was dead.** `buttonVariants` ships `fx-press`, but the class is
  inert without the attachment, so the prev/next buttons had the styling and none of the behaviour.
- **Upstream Sidebar loses `data-slot="sidebar-menu-button"` whenever a tooltip is attached**,
  because `mergeProps` lets bits-ui's `tooltip-trigger` slot win — so upstream's own
  `data-[slot=…]` selectors stop matching on exactly the buttons a collapsible sidebar always has.
  Five of seven on the demo page. `F7` occurring upstream.
- **bits-ui's Accordion emits `aria-expanded` and no `aria-controls`** — the identical gap A24 names
  in the vuesax source. Inheriting a defect from a different upstream is the same outcome for the
  same user, so `Accordion.Item` mints one id and both ends use it; verified 9 of 9 in rendered
  markup.

That §1's "never break an existing shadcn call site" is about **API and appearance**, not a
commitment to reproduce a bug, is now stated as A24b — with every such fix recorded rather than
made quietly.

**12 — One known shortfall, stated plainly.** Tabs `chrome` ships **without its shoulders**. The
source's sled has two quarter-disc pseudo-elements that would squash under `scaleX`; reproducing
them needs a counter-scaled *child*, which `MorphIndicator` does not render. The digest predicted
this as the one thing FLIP cannot reproduce. What ships reads as a browser tab but is not the
source's silhouette. Recorded as A25a rather than left to be discovered.

The related radius distortion **was** fixed: A19 claimed it "is handled" and it was not, until the
inverted keyframe learned to pre-divide the radius by the scale (A25a).

## Bugs this phase's checks caught

1. **`shadcn-svelte add sidebar` reverted four supersets at once** — button, input, skeleton and
   tooltip — having pulled each in as a registry dependency. `pnpm supersets:check` named all four.
   That is the second occurrence of this failure and the first caught automatically.
2. **`{#snippet children(...)}` shadows the `children` prop.** Wrapping bits-ui's Root snippet to
   inject the indicator recursed until the stack overflowed. `svelte-check` did not catch it; only
   rendering the page did — which is the argument for `ssr:check` existing at all.
3. **A documented claim about Tailwind v4's `data-active:` was wrong**, and grepping the built
   stylesheet disproved it before it shipped. `data-active:` is a *named* variant compiling to
   `:where([data-state=active]), :where([data-active]:not([data-active=false]))`, not a bare
   attribute test.

---

# Library-wide status

**29 of 29 components. 31 registry items, 172 files.**

| Check | Result |
|---|---|
| `pnpm check` | 1135 files, 0 errors, 0 warnings |
| `pnpm test` | 145 tests |
| `pnpm bans:check` | 14 rules, 0 violations |
| `pnpm supersets:check` | 48 extended files still marked |
| `pnpm registry:gen --check` | 31 items, regenerates identically |
| `pnpm registry:check` | 31 items validated against disk and build output |
| `pnpm layout:check` | 45 effect rules, none touch the layout box |
| `pnpm ssr:check` | 31 pages × 3 effect levels = 93 renders |
| `pnpm consumer:smoke` | every item installs over real upstream files; consumer builds |

**Still blocked, unchanged since Phase 0:** browser verification. No automation host exists in this
environment (`preview_status` reports none; CDP on `127.0.0.1:9222` is refused), and per the
operating rules no browser was started as a workaround. Criteria 6 and 7 remain partial for every
phase. Everything that can be verified without one has been, and four checks were built specifically
to narrow the gap — `layout:check`, `ssr:check`, `supersets:check` and `consumer:smoke` — three of
which caught real bugs that would otherwise have shipped.
