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
