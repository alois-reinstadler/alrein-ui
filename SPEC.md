# alrein-ui — Design & Implementation Spec

> Source of truth for the vuesax → Svelte 5 port. Lives at `repos/alrein-ui/SPEC.md`.
> Claude must read this fully before writing any component.

---

## 0. Decisions already made (do not relitigate)

| Question | Decision |
|---|---|
| What is this | A **shadcn-style registry**, not an npm package. `registry.json` + component source, served from the VPS. Consumers run `npx shadcn-svelte@latest add https://<registry-host>/r/<name>.json`. |
| Relation to shadcn-svelte | **Extend in place.** alrein-ui items overwrite the shadcn-svelte file at the same path with a *superset*. Same import path, same base API, plus alrein variants. Never break an existing shadcn call site. |
| Codex port in `repos/resax` | **Reference only.** Read it to learn structure and to catalogue mistakes. Never copy code from it. Every file in `alrein-ui` is written fresh. |
| Squircles | **`corner-shape` progressive enhancement.** No SVG clip-path fallback. |
| Effect policy | **Preset floor + per-instance override** (`data-fx` scope + component props). |
| Motion | **Business-snappy.** 80 / 120 / 180 / 240 ms. Springs only on press and toggle thumbs. |
| First run | Foundation + Button, Card, Badge. **Hard stop for review.** |

Reference material available: the **vuesax shadow-DOM sources** (compiled web components, each a self-contained `.js` with its template + CSS). These are the ground truth for visual fidelity — exact paddings, gradients, keyframes, easing curves. Read them; port the *intent*, not the implementation.

Located at `/home/node/repos/resax/references/<component>/` — see §8.0 for the layout.

---

## 1. Non-negotiable technical conventions

### Svelte 5 — use the current API, nothing older

- `$state`, `$derived`, `$derived.by`, `$props()`, `$bindable()`. `$state.raw` for large arrays.
- `$effect` is a **last resort**. If you reach for it, first check whether `$derived` or an attachment does the job.
- **Attachments (`{@attach fn}`) — never actions (`use:`).** Every effect (glow, tilt, magnet, shimmer, press) ships as an attachment factory: `{@attach glow({ intensity: 0.6 })}`. Attachments compose, survive spread props, and are the reason this port is not a pile of `use:` directives.
- **Snippets + `{@render}` — never slots.** `children` is a snippet prop.
- **Callback props — never `createEventDispatcher`.** `onValueChange`, `onOpenChange`.
- No `<svelte:component>`. No stores in component internals (context + `$state` classes instead).
- Shared stateful logic goes in a **rune class** (`class ColorState { value = $state(...) }`), exported from `<component>.svelte.ts`.

### shadcn-svelte conventions — match them exactly

- File layout: `src/lib/components/ui/<name>/{<name>.svelte, index.ts}`, namespace re-export (`export * as Button from ...` pattern per current shadcn-svelte).
- **`data-slot="<part>"` on every element that a consumer might want to style.** Non-negotiable — it's how shadcn overrides work.
- Variants with **`tailwind-variants` (`tv`)**, not `cva`. Slots for multi-part components.
- Props typed as `WithElementRef<HTMLButtonAttributes> & { ... }`, `bind:ref` supported.
- `cn()` from `$lib/utils`, class prop merged last so consumers always win.
- Tailwind v4: CSS-first config, `@theme`, OKLCH colors. No `tailwind.config.js` color blocks.
- Behavior/a11y comes from **bits-ui**. Do not hand-roll focus management, roving tabindex, dismissable layers, or ARIA wiring for anything bits-ui already covers.
- Every registry item declares its `dependencies`, `registryDependencies`, and `cssVars`.

### Hard bans

Anything on this list appearing in the diff is a rejected component:

- `use:` actions, slots, `createEventDispatcher`, `svelte/store` in component internals
- `cva`, `clsx` used directly instead of `cn`
- Hardcoded hex/rgb colors, hardcoded ms durations, hardcoded easing curves — **all three come from tokens**
- `setTimeout` for animation sequencing (use transitions / `doubleRaf` helper)
- A per-instance `requestAnimationFrame` loop (see §4 pointer engine)
- Any effect that changes an element's layout box (width/height/margin/padding). Transform, filter, opacity, background only.
- Any decorative effect that touches or obscures the focus ring

---

## 2. Tokens

Extend shadcn-svelte's existing token set. Do not rename its tokens — add these alongside.

### Control scale (from vuesax, kept)

```css
--ctrl-h-sm: 2rem;    /* 32 */   --ctrl-r-sm: 0.625rem;  /* 10 */
--ctrl-h-md: 2.5rem;  /* 40 */   --ctrl-r-md: 0.75rem;   /* 12 */
--ctrl-h-lg: 3rem;    /* 48 */   --ctrl-r-lg: 0.875rem;  /* 14 */

--ctrl-fs-sm: 0.8125rem;  --ctrl-px-sm: 0.75rem;
--ctrl-fs-md: 0.875rem;   --ctrl-px-md: 0.875rem;
--ctrl-fs-lg: 0.9375rem;  --ctrl-px-lg: 1.125rem;
```

### Motion — business-snappy (replaces vuesax's 200/260/320)

```css
--dur-instant: 80ms;   /* press feedback, hover tint */
--dur-fast:    120ms;  /* focus ring, checkbox mark, tooltip in */
--dur-base:    180ms;  /* the default. dropdowns, popovers, tab indicator */
--dur-slow:    240ms;  /* accordion collapse, sheet/drawer, modal */

--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);   /* everything entering */
--ease-in:     cubic-bezier(0.4, 0, 1, 1);        /* everything leaving */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* RESTRICTED — see below */
```

**`--ease-spring` is allowed on exactly two things:** press feedback (scale down/up) and toggle thumbs (switch, checkbox mark). It overshoots, and overshoot on anything that moves layout reads as "slow and drunk" in a data-dense screen. Reviewer should grep for it.

**Exit is faster than enter.** Leaving elements use one step down (`base` in → `fast` out). Users never wait to dismiss.

### Effects

```css
--fx-tint: <accent RGB, space separated>;  /* glow + ripple light color */
--fx-glow-radius: 180px;
--fx-glow-opacity: 0.35;
--fx-tilt-max: 6deg;
--fx-tilt-perspective: 800px;
--fx-magnet-max: 8px;
--fx-shimmer-dur: 900ms;
```

### Squircle

```css
@supports (corner-shape: squircle) {
  .sq { corner-shape: squircle; }
}
```

Ship as a `.sq` utility (Tailwind v4 `@utility sq`). Applied wherever `--ctrl-r-*` is applied. Chromium 139+ gets true superellipse corners; Safari/Firefox get plain rounded corners and nobody notices. **Never** ship an SVG clip-path fallback — it kills box-shadow, breaks glow bleed, and mangles borders, which is exactly the set of things this library depends on.

### Brand defaults (docs site + starter theme only)

Accent `#4A7C59` (sage), ink `#0A0A0A`, paper `#FAFAFA`, DM Serif Display (display) + DM Sans (UI). Every component derives from `--accent` — no component may reference the sage hex directly.

---

## 3. The effect system

### 3.1 The seven effects and what each one *means*

An effect is not decoration; it's a signal. If it doesn't carry meaning, it doesn't ship.

| Effect | Signal | Nature |
|---|---|---|
| **press** | "I registered your click" | Default, always on, not opt-in |
| **ghost** | "secondary action" | A **variant**, not an effect — lives in the variant enum |
| **gradient** | "primary emphasis / promotional surface" | Static surface treatment |
| **glow** | "highest-intent target on this surface" | Pointer-tracked |
| **shimmer** | loading (idle loop) **or** attention (triggered sweep) | Two distinct modes |
| **tilt** | "a discrete object you can pick up" | Pointer-tracked |
| **magnet** | "unmissable single CTA" | Pointer-tracked, most expensive |

### 3.2 Resolution order

Every effect resolves through this chain, first veto wins:

1. `data-fx="off"` anywhere in the ancestor chain → **dead**, no override possible
2. `prefers-reduced-motion: reduce` → pointer-tracked effects dead, loops stop, durations → 1ms for transforms (opacity fades stay at ~100ms; removing them entirely makes the UI feel broken, not calm)
3. `(pointer: coarse)` → glow, tilt, magnet, cursor **dead**
4. **Capability matrix** (§3.4) — the component is not allowed this effect at all → dead
5. **Density scope** — inside a `FxScope density="list|table"` → glow, tilt, magnet downgraded off; gradient and ghost survive
6. **Per-instance prop** — `glow` / `glow={false}` wins over the preset
7. **Preset default** — the component's declared `fxDefault` at the active `data-fx` level

### 3.3 Presets

```
data-fx="off"        nothing decorative. press feedback degrades to color/opacity only.
data-fx="calm"       DEFAULT. effects only where explicitly asked for per-instance.
                     this is what Hubris and every business app runs.
data-fx="expressive" components with a declared fxDefault light up automatically
                     (primary Button → glow, Card → tilt). magnet becomes available.
```

Implemented as a Svelte context holding an `FxContext` rune class (`level`, `density`, `pointerFine`, `reducedMotion`), **plus** the literal `data-fx` attribute on the DOM so CSS-only effects resolve without JS. `<FxScope>` nests and overrides.

### 3.4 Capability matrix

`●` allowed · `◐` allowed with the noted condition · `—` forbidden, do not add the prop

| Component | ghost | gradient | glow | shimmer | tilt | magnet |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Button | ● | ◐ primary only | ◐ primary/accent | ◐ triggered | ◐ size ≥ md, standalone | ◐ expressive only |
| ButtonGroup (children) | ● | ● | — | — | — | — |
| Card | — | ◐ hero variant | ◐ interactive only | — | ● | — |
| Badge | ● | ● | ◐ status-critical | ◐ triggered | — | — |
| Chip | ● | ● | — | — | — | — |
| Alert | ● | ● | ◐ danger/warn | ◐ once on mount | — | — |
| Accordion | ● | ◐ header only | ◐ trigger | — | — | — |
| Avatar | — | ◐ fallback bg | ◐ presence state | ● loading | ◐ size ≥ lg | — |
| AvatarGroup (children) | — | ● | — | ● loading | — | — |
| CheckboxCard / RadioCard | — | ◐ selected | ◐ selected | — | ● | — |
| Steps | — | ◐ active step | — | — | — | — |
| UploadArea | — | — | ◐ drag-over | ● uploading | ● | — |
| Skeleton | — | — | — | ● | — | — |
| Input / Textarea / Select | — | — | — | — | — | — |
| Tabs / Breadcrumb / Pagination / Sidebar | ● | — | — | — | — | — |
| Tooltip / Popover / Dialog | — | — | — | — | — | — |
| Table rows / any list item | — | ● | — | — | — | — |

### 3.5 Rules that don't fit in the table

**Budget.** Max **2** decorative effects on one element. Max **1 glowing** and **1 tilting** element per visible surface. In dev mode, the pointer engine counts active glow instances and `console.warn`s past 1 per `FxScope`. This is the single rule that keeps the library from looking like a 2011 Dribbble shot.

**Glow.** Bleeds outside the element's box — never on anything with a tight parent `overflow: hidden`. Never on form fields: a glow on focus competes with the focus ring and users read it as an error state.

**Tilt.** Creates a containing block for `position: fixed`. **Any component that hosts floating UI (popover, dropdown, tooltip, select) may not tilt** — the portal will anchor to the transformed ancestor and land in the wrong place. Max 6°, `perspective: 800px`, resets on `pointerleave` within `--dur-fast`, never combined with a layout/collapse animation. Never on more than ~6 items in a grid.

**Shimmer.** Idle-looping shimmer is **loading only**. Decorative shine is **triggered** (hover, mount-once) and finite. Twelve badges shimmering forever is a migraine, not a design system.

**Gradient.** Derived from `--accent` via computed lighter/darker stops — **never** a hardcoded two-hex pair, or theming breaks the moment someone changes the accent. Both stops must pass contrast against `--accent-contrast`.

**Magnet.** Isolated CTAs, FABs, nav logo. **Never in application chrome, never in a form, never in a list.** `expressive` only.

**Mutual exclusions.** `ghost + gradient` is a contradiction (transparent surface vs. painted surface) → type error. `ghost + glow` has nothing to glow from → type error. Enforce in the prop types, not in a doc comment.

**Accessibility floor.** No effect may be the sole carrier of state — glow can never be the only "selected" signal. No effect may alter the focus ring. No effect may change layout size.

---

## 4. Foundation primitives (built before any component)

1. **`pointer.svelte.ts`** — one singleton pointer engine. All glow, tilt, magnet and cursor instances register with it; it runs **one** `rAF` loop for the whole page, writes `--gx/--gy/--glow` via `setProperty` (never through reactive state — no re-renders), gates on `IntersectionObserver` + `document.visibilityState`, clamps `dt`, auto-unregisters on destroy. vuesax does exactly this and it is the reason their pages don't melt laptops. Copy the architecture, not the code.
2. **`glow.ts`** — attachment factory
3. **`tilt.ts`** — attachment factory
4. **`magnet.ts`** — attachment factory
5. **`press.ts`** — attachment: spring scale + optional ripple at press coordinates, ripple count capped
6. **`shimmer`** — CSS layer (loading loop) + attachment (triggered sweep)
7. **`fx-scope`** — `FxContext` rune class, `<FxScope>` component, `data-fx` plumbing
8. **`squircle`** — Tailwind v4 `@utility`
9. **`MorphIndicator`** — one shared animated indicator, consumed by Tabs (chrome + gooey), Steps, Sidebar, and any future segmented control. Built once. FLIP-based, token-driven.
10. **Transition primitives** — see below

### Transition primitives — ship in **two** forms

This is the trap Codex almost certainly fell into. bits-ui animates open/close via `data-state` attributes and `forceMount`, **not** Svelte transitions. So each primitive needs:

- a **Svelte transition function** (`svelte/transition`-compatible signature, reading motion tokens) for elements you control directly, and
- a **CSS class/keyframe pair** driven by `data-[state=open]` / `data-[state=closed]` for anything mounted by bits-ui.

Both read the same tokens so they can never drift.

Set: `fade`, `blurFade`, `slide` (4 directions), `scale`, `scaleFade`, `collapse` (height auto), `crossfade` (tabs/steps), `stagger` (list helper, capped delay so item 40 isn't 4 seconds late).

---

## 5. Component inventory

Your 45 URLs collapse to **28 components**. The collapses below are deliberate — building `radio`, `radio-card`, `radio-group` and `radio-group-cards` as four separate components is how you end up with four inconsistent implementations of the same keyboard handling.

### Collapsed

| Your list | Ships as |
|---|---|
| radio, radio-card, radio-group, radio-group-cards | **RadioGroup** + `RadioGroupItem` + `variant="card"` |
| checkbox, checkbox-card | **Checkbox** + `variant="card"` |
| switch-dot, switch-label | **Switch** + `label` snippet prop |
| spinner-grid, spinner-comet | **Spinner** `variant="grid" \| "comet"` |
| pagination, pagination-compact | **Pagination** `variant="full" \| "compact"` |
| steps, steps-arrow | **Steps** `variant="line" \| "arrow"` |
| tabs-gooey, tabs-chrome | **Tabs** `variant="gooey" \| "chrome"` (both on `MorphIndicator`) |
| color-picker × 6 | **ColorPicker** family on one shared `ColorState` rune class + 6 thin skins |
| cursor, cursor-magnet | `pointer` primitive + `magnet` attachment (not components) |
| upload-file, upload button | **UploadArea** + `Button` progress state, both on a shared `useUpload` rune class |
| code-minimal, code | **Code** (`code`) + **CodeWindow** (`vs-code`, window chrome) |
| timeline-compact | **Timeline** `variant="compact"` |

### Extend existing shadcn-svelte components (18)

accordion · alert · avatar (+ AvatarGroup) · badge · breadcrumb · button (+ ButtonGroup) · card · checkbox · input · pagination · radio-group · select · sidebar · switch · tabs · textarea · tooltip · skeleton

For each: `add` the upstream component first, diff against it, and ship an overwrite that is a **strict superset**. Any existing shadcn call site must compile and look the same at `data-fx="calm"` with no new props.

### New components (10)

chip · code · code-window · color-picker (×6 skins) · rating (+ `variant="emoji"`) · spinner · steps · timeline · upload-area · fx-scope

### Dependency flags — decide before Phase 4

- **Code / CodeWindow** need a highlighter. Shiki is the right answer but it's heavy; consider `shiki/bundle/web` with a restricted lang set, loaded lazily, and a plain-`<pre>` SSR fallback.
- **ColorPicker** needs a color model. Use OKLCH as the internal space (matches Tailwind v4), convert at the boundary. `culori` if a dependency is acceptable; otherwise a ~150-line internal converter.
- **Tabs `gooey`** needs an SVG `feGaussianBlur` + `feColorMatrix` filter. It must degrade to `chrome` under reduced-motion and it must not be the default variant.

---

## 6. Phasing

**Phase 0 — foundation + proof. STOP AND WAIT FOR REVIEW.**
All of §4, plus tokens, plus the capability matrix as an enforceable doc, plus registry plumbing (`registry.json`, build script, one working `add` from the VPS), plus **Button, Card, Badge** and a demo page showing every effect at all three `data-fx` levels.

Nothing else. Do not start Phase 1.

- Phase 1 — form controls: input, textarea, checkbox(+card), radio-group(+cards), switch, select
- Phase 2 — feedback/display: alert, avatar(+group), chip, spinner, tooltip, rating, skeleton
- Phase 3 — navigation/structure: tabs, steps, accordion, breadcrumb, pagination, sidebar, timeline
- Phase 4 — complex: color-picker suite, code + code-window, upload-area + upload button

---

## 7. Acceptance criteria — every component, every phase

A component is done when all of these hold. Claude self-checks before claiming completion.

1. Compiles under `svelte-check` strict, zero errors, zero `any`
2. Zero items from the §1 hard-ban list in the diff
3. Registry item builds and installs cleanly via `shadcn-svelte add` from the VPS host
4. Effect props exist **only** where §3.4 allows them; forbidden combos are type errors
5. Keyboard-complete and screen-reader-correct — inherited from bits-ui wherever bits-ui has it
6. Focus-visible ring intact and unobscured at every `data-fx` level
7. Correct in light and dark, and at `data-fx` off / calm / expressive
8. `prefers-reduced-motion: reduce` verified: no pointer-tracked effects, no loops, no transform animation
9. `(pointer: coarse)` verified: no glow/tilt/magnet
10. **No layout shift** from any effect — verified by toggling `data-fx` and observing zero reflow
11. Demo page entry with every variant and every allowed effect
12. Side-by-side visual check against the vuesax shadow-DOM source

---

## 8. What went wrong last time

Audit of `/home/node/repos/resax` (61 commits, 57 component families, 119 component `.svelte`
files, 63 registry items, `svelte-check` clean). Read this list before writing any component.

### 8.0 Where the reference material lives

`/home/node/repos/resax/references/<component>/` — organized, SHA-256-manifested, lossless.
- `web-component/` — extracted vuesax web-component source (**ground truth**)
- `css/shadow/` — extracted shadow-root CSS
- `compiled/vue/`, `css/vue-scoped/` — compiled Vue island output
- `metadata/manifest.json` — variants, original paths, state hints, sizes, hashes
- `_shared/theme/` — source design tokens · `_shared/clean-room/` — clean-room specs
- `AUTHORIZATION.md` — records the 2026-08-25 maintainer authorization to use this material.

### 8.1 Recurring failure patterns

Format: **`ID` — pattern · blast radius · why it's wrong here.**

- **`F1` NOT A SUPERSET — the registry ships a second, incompatible component.** All 3 proof
  components + every "extend" item. `resax/button/index.ts` defines variants
  `default|flat|border|gradient|shadow|relief|transparent|border-draw|chrome|glitch|gooey|invert|liquid|magnetic|plasma|push|shine|v2`
  and **none** of shadcn's `destructive|outline|secondary|ghost|link`; size loses `icon`,
  `icon-sm`, `icon-xs`, `icon-lg`. `<Button variant="destructive">` silently renders a default
  button. Card collapses shadcn's 7 sub-components (`Card.Header/Title/Description/Content/
  Footer/Action`) into one monolith with a `variant` enum — `<Card.Header>` ceases to exist.
  Badge drops `secondary` and `destructive`. Violates decision-table row 2 outright.

- **`F2` THE "EXTENSION" IS A PARALLEL NAMESPACE, AND IT CLOBBERS THE HOST.** Registry targets
  are `resax/button/button.svelte`, not `ui/button/button.svelte` — so alrein components install
  *beside* the consumer's shadcn components, never over them. Worse, each item **also** ships
  `src/lib/components/ui/button/button.svelte` → target `button/button.svelte`, and that file is
  the **verbatim, unmodified upstream shadcn-svelte button**. Installing `button` therefore
  overwrites a consumer's customized shadcn Button with the stock one and adds an unrelated
  second Button. Actively destructive, and the exact opposite of "extend in place."

- **`F3` `tv()` USED AS A BEM CLASS-NAME MAP, NOT A TAILWIND VARIANT SYSTEM.** All 12 files that
  import `tailwind-variants`. Every variant resolves to `rx-button--gradient`, `rx-card--lift`,
  `rx-badge--soft` — no utility classes at all. Real styling lives in hand-written CSS. Consequence:
  `cn()`/`tailwind-merge` cannot deduplicate anything, and a consumer's `class="h-12 bg-blue-500"`
  loses to BEM specificity. The `class`-prop-wins contract in §1 is silently broken everywhere.

- **`F4` MINIFIED SOURCE.** 64 files carry a `<style>` block; average line length reaches
  **700 bytes/line** (`tabs.svelte`), with individual lines up to **2 996 characters**
  (`button.svelte:348`). `button.svelte` is 67 KB in 385 lines; `card.svelte` 28 KB. Script blocks
  are minified too — `tooltip.svelte` has ~2 000-character single-line functions. Nothing in this
  state can be reviewed, diffed, or safely edited, which is how most of the rest of this list
  survived. **Write normal, formatted, readable source.**

- **`F5` ZERO MOTION TOKENS.** **934** hardcoded time values in `<style>` blocks, **612** literal
  `cubic-bezier(...)` across **34 distinct curves**, and **0** uses of `var(--dur-*)` or
  `var(--ease-*)` — the tokens do not exist in `theme.css`. Durations observed: 120/140/160/180/
  200/220/240/260/280/300/320/340/360/380/420/460/480/520/560/620/720 ms, 1.8 s… The JS side has
  its own separate scale in `easing.ts` (`RX_DURATION` = 200/260/320, the vuesax scale this spec
  explicitly replaces) plus a `RX_MECHANIC_DURATION` escape hatch of 12 bespoke per-mechanic
  durations that institutionalizes the hardcoding. CSS and JS scales are free to drift, and did.

- **`F6` `--ease-spring` EVERYWHERE.** `cubic-bezier(.34,1.56,.64,1)` appears **124** times across
  **30 components** — breadcrumb (4), timeline (4), rating (5), color-picker (4), pagination (3),
  steps (3), calendar (3), card (3), sidebar (2), select (2), scrollbar (2)… §2 permits it on press
  feedback and toggle thumbs only. A further 9 unauthorized overshoot curves are in use
  (`.34,1.46,.44,1`, `.34,1.8,.42,1`, `.34,1.7,.5,1`, `.5,-.45,.55,1`, …).

- **`F7` `data-slot` ESSENTIALLY ABSENT.** **6 of 119** component files emit `data-slot`
  (drawer, nav-menu, popup, scrollbar, sidebar, transform). §1 calls this non-negotiable; it is the
  only mechanism by which a consumer restyles an internal part. Combined with `F3`, consumers have
  **no** override path at all.

- **`F8` NO EFFECT POLICY LAYER — THE ENTIRE §3 SYSTEM IS MISSING.** **0** occurrences of
  `data-fx`, `FxScope`, or `fxDefault` in the whole repo. No presets, no density scope, no
  capability matrix, no per-instance override, no effect budget, no dev-mode glow counter. Instead
  each component decides for itself, and 124 ad-hoc `prefers-reduced-motion` checks are copy-pasted
  across files. Effects are therefore on-by-default and unbounded — the "2011 Dribbble shot"
  failure §3.5 exists to prevent.

- **`F9` NO SINGLETON POINTER ENGINE — 3 OF 4 POINTER EFFECTS RUN PER-INSTANCE.**
  `proximity-glow.ts` *does* have the correct shared-hub shape (see §8.2). But `tilt3d.ts`,
  `pointer-position.ts` and `magnetic.ts` each attach their own `pointermove` + `scroll` + `resize`
  listeners **per element**, and tilt/pointer-position each run their own `requestAnimationFrame`.
  `magnetic.ts` is worst: it calls `getBoundingClientRect()` and writes `node.style.transform`
  **synchronously inside every `pointermove` event**, with no rAF at all — forced synchronous
  layout on every pointer sample. It also overwrites `style.transform` wholesale, so magnet cannot
  compose with press-scale or tilt. Across the registry, `requestAnimationFrame` appears **126
  times in 62 files**. No effect anywhere gates on `document.visibilityState`.

- **`F10` EFFECT DEFAULTS AND GUARDS HARDCODED IN JS, DIVERGING FROM SPEC.** `tilt3d` defaults to
  **9°** (§2 caps at 6°, `--fx-tilt-max`); glow radius defaults to **200px** (token says 180);
  magnet strength **0.4** unbounded (token says `--fx-magnet-max: 8px`). None read a CSS token.
  `proximity-glow` checks `(pointer: coarse)` but **never** `prefers-reduced-motion` — glow keeps
  tracking the pointer for users who asked it not to. Media queries are re-evaluated *inside the
  render loop*, once per entry per frame.

- **`F11` EFFECTS THAT MOVE THE LAYOUT BOX.** **67** `transition:` declarations target
  `width|height|padding|margin|top|left|right|bottom|inset`. The clearest case: `tooltip.svelte`
  animates `width` and `height` over 400 ms with a spring curve when the tooltip content changes.
  `.rx-button--gooey` sets `min-width: calc(var(--h)*2.05)`. §1 permits transform/filter/opacity/
  background only.

- **`F12` `setTimeout` AS AN ANIMATION SEQUENCER.** **69** occurrences across ~40 files
  (input-number 7, calendar 5, tooltip 3, radio 3, checkbox 3, alert 3, …), plus 4 `setInterval`.
  Every one is a hardcoded duration duplicated from a CSS transition — guaranteed to desync the
  moment either side changes. Explicitly banned in §1.

- **`F13` IMPERATIVE DOM CONSTRUCTION INSIDE COMPONENTS.** **27 component files** call
  `document.createElement`. `tooltip.svelte` is the extreme: it builds a module-level DOM singleton,
  appends it to `document.body`, lets bits-ui render the *real* tooltip, then copies that node's
  **`innerHTML`** into the singleton and hides the original. This renders every tooltip twice,
  destroys any event handler or component inside a `content` snippet, and is an XSS surface for
  user-supplied content. The module-level `let singleton` / `let connectedTooltips` are also
  cross-request-shared mutable state in an SSR context.

- **`F14` HAND-ROLLED A11Y WHERE BITS-UI ALREADY SHIPS IT.** Only **19 files** import `bits-ui`.
  Missing entirely from `dropdown`, `popup`, `context-menu`, `drawer`, `nav-menu`, `list`,
  `file-tree`, `pagination`, `progress`, `separator`, `table` — all of which have bits-ui or
  shadcn-svelte equivalents. Keyboard navigation is hand-written in 11 files (`ArrowDown` handlers
  in color-picker, dock, dot-stepper, file-tree, input-number, list, rating, slider, steps, switch,
  tick-rail). §1: behaviour and a11y come from bits-ui.

- **`F15` A PARALLEL `--rx-*` TOKEN UNIVERSE, DISCONNECTED FROM THE HOST THEME.** `theme.css`
  defines **262** `--rx-*` tokens and **zero** of `--background`, `--foreground`, `--primary`,
  `--muted`, `--destructive`, `--ring`, `--radius`. Dropped into a real shadcn app, every component
  ignores the app's theme. §2 says *extend* shadcn's token set, don't replace it. Separately:
  **281** raw hex literals and `--rip: 255 255 255` / `--rip: 0 0 0` are hardcoded in `<style>`.
  The `--ctrl-*` tokens *were* defined but the Button ignores them and re-declares
  `--h:40px; --r:12px; --fs:14px; --px:14px` inline — and gets it wrong (`lg` and `xl` are both
  48 px, `radius-rounded` is a literal `12px`).

- **`F16` SCOPE INFLATION.** 57 component families and 63 registry items against this spec's 28.
  Includes work nobody asked for: `plasma.ts` (15 KB WebGL plasma shader) and `aurora-webgl.ts`
  for a *button* and a *dock*; `ask-ai-button`, `dock`, `slide-confirm`, `tick-rail`,
  `inline-overflow`, `transform`, `spacer`. Button alone carries 18 variants. §5's collapses exist
  precisely to stop this.

- **`F17` `!important` AND UNCONDITIONAL `will-change`.** `.rx-button--borderless` uses
  `!important` on `border-color` and `background` — an admission that the BEM cascade (`F3`) had
  become unwinnable. `will-change: clip-path` is set permanently rather than for the duration of an
  animation, holding a compositor layer for the element's whole life.

- **`F18` COMMIT HYGIENE AND THE VISUAL-TEST DEATH SPIRAL.** Commits like
  "Complete Resax component registry and docs" and "Complete source-fidelity port and docs" span
  the whole library — nothing can be reverted independently. The final **15 of 61** commits are
  all one fight with flaky Playwright visual baselines ("Freeze visual choreography without
  dropping layers", "Settle finite motion before visual capture", "Calibrate hosted visual raster
  tolerances", "Record deterministic spinner visual states"). Pixel-diff baselines over
  pointer-tracked, spring-driven, infinitely-looping effects cannot be made deterministic. Assert
  on tokens, computed styles and `data-*` state instead; keep pixel comparison for a small set of
  static, `data-fx="off"` surfaces.

### 8.2 What Codex got right — do not rediscover these

- **Svelte 5 idiom is clean.** **0** `use:` actions, **0** `<slot>`, **0** `$$props`/`$$restProps`,
  **0** `createEventDispatcher`, **0** `cva`, **0** `svelte/store`, **0** `<svelte:component>`.
  42 `{@attach}` sites. `$derived` (339) vastly outnumbers `$effect` (69). §1's Svelte-5 rules and
  half the hard-ban list were already satisfied — the failures above are all *layer* and *policy*
  failures, not syntax ones.
- **Type discipline.** `svelte-check` passes with 0 errors / 1 warning over 5 165 files, and there
  are **0** occurrences of `: any`, `as any`, `@ts-ignore` or `@ts-expect-error`. Acceptance
  criterion §7.1 is achievable at this scale.
- **`proximity-glow.ts` has the right architecture** — module-level `Set` of entries, one shared
  `document` `pointermove` listener, one coalesced rAF, `IntersectionObserver` visibility gating,
  cached `DOMRect` invalidated on scroll/resize, per-entry restore of prior custom-property values
  on teardown, hub torn down when the last entry unregisters. Generalize this shape to *all four*
  pointer effects in `pointer.svelte.ts` — and add `visibilityState` gating and a
  reduced-motion check, both of which it lacks.
- **`easing.ts::cubicBezier` is a correct CSS-bezier solver** — Newton–Raphson with bisection
  fallback, and it correctly notes that CSS easing maps x(time)→y(progress) so naive `y(t)`
  sampling is wrong. Needed for the §4 Svelte transition functions. Reimplement it fresh; the
  algorithm is standard.
- **`scripts/consumer-smoke.mjs` is exactly the Phase-0 registry proof** — it `mkdtemp`s a real
  consumer, `pnpm dlx sv create --template minimal`, serves `static/r` over local HTTP, runs
  `shadcn-svelte add` against it, and builds. Build this early; it is the only honest way to satisfy
  acceptance criterion §7.3.
- **`scripts/check-registry.ts`** cross-validates `registry.json` against built `static/r` output
  and `package.json` dependencies, catching undeclared deps and duplicate item names.
- **Non-obvious registry mechanic, learned the hard way:** in `registryDependencies`, a **plain
  name always resolves to the official shadcn-svelte registry**; a dependency on your *own* item
  must be written **`local:<name>`**. Getting this wrong silently pulls upstream components.
- **The reference archive is well-built** — `references/` is byte-for-byte lossless, organized by
  component, SHA-256 manifested, with a `--check` script. Use it as-is; do not re-scrape.

### 8.3 Pre-flight checklist (re-read before every component)

1. Did I `add` the upstream shadcn-svelte component and diff against it? Is every upstream
   variant, size and sub-component still present and visually identical at `data-fx="calm"`? (`F1`)
2. Does the registry item target `ui/<name>/…`, overwriting in place — and does it ship **only**
   files I actually authored? (`F2`)
3. Do `tv()` variants produce **Tailwind utilities**, so `cn()` merges and the `class` prop wins? (`F3`)
4. Is the source formatted and readable — no line over ~120 characters? (`F4`)
5. `grep -E '[0-9]+m?s|cubic-bezier'` over my diff → must be empty. All motion via
   `var(--dur-*)` / `var(--ease-*)`. (`F5`)
6. `grep '--ease-spring'` → press feedback and toggle thumbs only. (`F6`)
7. `data-slot` on every part a consumer might style. (`F7`)
8. Every effect resolves through the §3.2 chain; props exist only where §3.4 allows. (`F8`)
9. No `requestAnimationFrame`, no `pointermove`/`scroll`/`resize` listener outside
   `pointer.svelte.ts`. (`F9`)
10. Effect magnitudes read from `--fx-*` tokens, not JS literals. Reduced-motion **and** coarse-
    pointer both checked, once, in the engine. (`F10`)
11. `grep -E 'transition:[^;]*(width|height|padding|margin|top|left|right|bottom|inset)'` → empty. (`F11`)
12. No `setTimeout`/`setInterval` for sequencing. (`F12`)
13. No `document.createElement`, no `innerHTML`, no mutable module-level state. (`F13`)
14. Anything bits-ui provides comes from bits-ui. No hand-written `ArrowDown` handler. (`F14`)
15. Colors resolve to shadcn tokens (`--primary`, `--ring`, …) or `--accent`-derived values.
    No hex, no raw rgb triplets. (`F15`)
16. Only what §5 lists. No extra variants, no WebGL. (`F16`)
17. No `!important`; `will-change` set and cleared around the animation only. (`F17`)
18. One logical unit per commit; tests assert tokens/computed styles/`data-*`, not pixels of a
    moving effect. (`F18`)

---

## 9. Amendments (post-audit, 2026-08-27)

Resolved against the live upstream API. These override anything above that contradicts them.
Full reasoning in `SUBSTRATE.md`.

- **A1 — Sizing follows shadcn, not vuesax.** The upstream `size` enum keeps `h-8 / h-9 / h-10`
  (and `h-9` for Input) byte-identical. `--ctrl-*` applies **only** to components with no upstream
  equivalent: Chip, Steps, Spinner, Rating, Timeline, UploadArea, ColorPicker, Code, CodeWindow.
- **A2 — Props follow shadcn conventions.** Anything resolving to Tailwind classes is a `tv`
  variant. Not a bespoke prop, not a CSS custom property, not a BEM modifier. (Fixes `F3`.)
- **A3 — `index.ts` uses named re-exports**, matching upstream (`export { Root, Root as Card, … }`,
  consumed as `import * as Card from …`). `export * as` does not exist upstream; §1 was wrong.
- **A4 — Transition primitives still ship in both forms**, but `data-[state]` CSS is the default
  (no `forceMount`, no snippet boilerplate) and the Svelte transition form is reserved for motion
  needing measured values (`collapse`, `crossfade`, `MorphIndicator`). bits-ui v2 *does* support
  Svelte transitions via `forceMount` + the `child` snippet; §4's stated reason was wrong.
- **A5 — `--fx-tint` holds a full colour, not an RGB triplet.** Default `var(--primary)`; alpha via
  `color-mix(in oklab, var(--fx-tint) N%, transparent)`. One OKLCH colour system, inherits consumer
  theming. (Avoids `F15`.)
- **A6 — Card keeps `overflow-hidden`.** Its glow is an inner radial layer clipped to the card's
  rounded box. Outer bleed remains Button-only.
- **A7 — Attachments never read `$state`/`$derived` directly.** Options are `T | (() => T)`,
  evaluated inside the pointer engine loop, or attachments tear down on every `data-fx` change.
- **A8 — Registry is served from the GitHub repo** (GitHub Pages). Phase 0 additionally proves
  `shadcn-svelte add` end-to-end against a local static server.
- **A9 — Size, spacing and colour come from shadcn-svelte, not vuesax.** Supersedes the `--ctrl-*`
  block in §2, which is **withdrawn entirely** (not merely scoped to new components as A1 said).
  Heights, padding, radii, font sizes and colours all resolve to shadcn's Tailwind scale and token
  set: `h-9`, `px-2.5`, `rounded-md`, `--radius`, `--primary`, `--muted`, `--ring`, … New
  components pick the nearest shadcn size rather than inventing one. **New CSS variables are added
  only where shadcn has no equivalent** — the motion scale (`--dur-*`, `--ease-*`) and the effect
  tokens (`--fx-*`: glow tint/radius, tilt max, magnet max, shimmer duration). Nothing that could
  be a Tailwind utility becomes a custom property. (Maintainer, 2026-08-27. Reinforces `A2`,
  closes `F15`.)

### Phase 1 amendments (from the vuesax source digest, `references/VUESAX-INTENT.md`)

- **A10 — Press stays a flat scale; the vuesax 3D press is not ported.** The source applies
  `perspective(P) rotateX(−ny·A) rotateY(nx·B) scale(S)` — a tilt toward the cursor — to all six
  form controls. It is a genuine signature, and it is declined for a structural reason: `perspective()`
  creates a containing block for `position: fixed`, and press is *always on* (§3.1). Every button
  that opens a dropdown, every select trigger, every popover trigger would anchor its portal to a
  transformed ancestor and land in the wrong place. That is the exact hazard §3.5 documents for
  tilt, and it is why tilt is withheld from anything with a trigger. §2 already specifies press as
  "scale down/up", so this follows the spec rather than the source.
- **A11 — Overshoot stays at exactly two sites.** The source has a *third*: the checkbox/radio
  **label** springs back over 620ms on an explicit `linear()` damped spring peaking at 1.15. Not
  ported. Extending the allowance from two mechanics to three is precisely the creep that ended in
  124 spring uses across 30 components (`F6`). The thumb pop itself (`0.86 → 1.14 → 1`) is ported in
  character, at our scale rather than the source's 420ms.
- **A12 — The three vuesax overshoots on layout properties are not ported.** The floating label's
  `max-width`, RadioGroup's indicator `width`/`height`, and Select's menu `height` morph all
  overshoot a layout property. §1 forbids it. `MorphIndicator` therefore overshoots transform only
  and interpolates size linearly — which is what FLIP does anyway.
- **A13 — Select's trigger→menu morph is not ported.** It animates `height` over 560ms, drives
  itself with inline styles plus a `transitionend` listener and a timeout fallback, and §3.4 gives
  Select no effects at all. The menu uses the `data-[state]` utilities in `motion.css` like every
  other bits-ui surface. **The one idea worth stealing is the close handoff**: the real trigger
  reappears already carrying a blur that then clears, so the swap is never visible. That is a
  `filter`, not a layout change, and it is portable — recorded here for Phase 2's popovers.
- **A14 — Select's glow is not ported.** The source has it on by default; §3.4 gives Select no glow,
  and §3.5 forbids glow on form fields outright because users read a glow on focus as an error
  state.
- **A15 — The vuesax accessibility defects are not inherited.** The source makes Input's clear and
  password-reveal buttons `tabIndex = -1` (mouse-only), never wires the hint through
  `aria-describedby`, and labels with a bare `aria-label`. alrein-ui uses a real `<label>`, real
  focusable buttons, and a real `aria-describedby` chain. Behaviour that bits-ui already owns —
  RadioGroup's auto-select on arrow, indeterminate → checked, and Select's typeahead and arrow
  navigation — is left to bits-ui rather than re-implemented (`F14`). **Deferred:** the switch's pointer-drag
  gesture. It is not in §5's collapse list and it would mean hand-rolling pointer handling on a
  control bits-ui owns.

  **Correction (verified against `bits-ui@2.19.0`, `dist/bits/switch/switch.svelte.js`):** this
  amendment originally claimed bits-ui implements the switch's absolute arrow keys
  (Right = on, Left = off). **It does not** — `SwitchRootState.onkeydown` handles `Enter` and
  `Space` only. The behaviour is still not implemented here, for a better reason: the ARIA
  Authoring Practices make arrow keys *optional* for a switch and Enter/Space mandatory, so
  bits-ui is standards-correct, and hand-rolling keyboard handling on a control bits-ui owns is
  exactly `F14`. If it is wanted it belongs upstream in bits-ui.
- **A16 — The floating label is structure, not an effect.** It is a `<fieldset>` with a zero-height
  `<legend>` whose `max-width` animates, cutting a real gap in the top border rather than painting
  an opaque backing. That animates a layout property, and it gets the same carve-out as `collapse`:
  the layout change *is* the thing being animated, not a decoration over one. `check-layout-safety`
  only polices the effect layer, so this is out of its scope by construction — but say so in the
  source where it appears, or a reviewer will read it as an `F11` violation.

### Phase 2/3 amendments (from `references/VUESAX-INTENT-2.md`)

- **A17 — Reduced motion has a third correct answer, and loading indicators need it.** §3.2 step 2
  says loops stop. That is right for decoration and **wrong for a loading indicator**: a motionless
  spinner and a motionless skeleton both assert that the work has finished. The vuesax source
  reaches the same conclusion independently — it slows its spinner to 2.4s and its skeleton to 3s
  rather than stopping them. So `--fx-shimmer-duration` (the loop) slows to 3s under reduced
  motion, while `--fx-shimmer-sweep-duration` (the triggered attention sweep, which *is*
  decoration) goes to zero and the attachment declines to run. Two tokens, because one would have
  to lie to one of them. Calm is not the same as lying.
- **A18 — §4.9 is corrected: MorphIndicator's consumers are Tabs, Pagination and Sidebar, not
  Steps.** Steps has no sliding indicator anywhere in the source: its progress is a per-segment
  `scaleX`/`scaleY` on the connector plus a `stroke-dashoffset` ring, which is already
  transform-only and already §1-clean. Pagination is the fourth real consumer and §4.9 missed it.
- **A19 — Tabs' window-mask reveal is declined.** The source's indicator is not an empty pill: it
  clips a counter-translated copy of the label strip, so the active label reads through it. Under a
  transform-only FLIP that copy stretches with the indicator and the letters distort. It is
  recoverable — a second `Element.animate()` on the inner strip with the inverse `scaleX` over the
  same duration — but it doubles the moving parts of the most-used navigation component to buy an
  effect §3.4 does not grant Tabs in the first place. Tabs recolours its active label, as upstream
  shadcn-svelte does. The `border-radius` distortion under `scaleX` is a real and separate concern
  and **is** handled: `border-radius` is paint, not layout, so it is animated alongside.
- **A20 — Four more source patterns declined, on the record rather than by omission.** A reader of
  the shadow CSS will find all of these and assume they belong.
  - **The 3D press** appears in *nine of nineteen* components. A10 already declined it; the reason
    holds harder here, because Avatar and Pagination buttons routinely host tooltips. The source's
    own majority — Chip, Tabs, Accordion, Rating — uses a flat scale, which is what A10 chose.
  - **The "water-drop" text reveal** (Checkbox label, Tabs, Breadcrumb): clones the element's text
    and paints an expanding radial through `background-clip: text` over 1820ms. It reads
    `textContent`, so it silently breaks for any rich label. Three occurrences make it intentional,
    not accidental — and it is still an effect §3.4 grants none of the three.
  - **The cursor light on text** (Tabs, Breadcrumb, Pagination, Accordion): a pointer-tracked
    `background-clip: text` radial that brightens glyphs under the cursor. That is a **glow**,
    applied to four components §3.4 gives no glow. Declining it is one decision, not four.
  - **The "neighbour light" lamp system** (Alert, Chip, Sidebar, and most Phase 1 controls): a
    second, non-cursor proximity engine that finds other coloured elements nearby and throws
    *their* colour onto this one, on its own `--lit-*` variables so it does not collide with the
    cursor glow. §3.1 has no entry for it and §3.4 has no row. It is out — but its CSS is in nearly
    every shadow sheet, so it is out on the record.
- **A21 — `collapse` should be `grid-template-rows: 0fr ↔ 1fr`, not an animated height.** Used by
  Accordion (six skins) and Sidebar submenus (four). It needs no measurement, no `transitionend`
  listener and no fallback timer, and it survives content resizing. It is an **A16 carve-out** — the
  layout change is the animation — and, like the floating label, must say so in the file where it
  appears or a reviewer reads it as `F11`. The source's overshoot on it is **separately declined**:
  `0fr → 1fr` overshooting means the panel opens taller than its content and settles back.
- **A22 — The timeout-fallback rule, stated honestly.** The source guards a transition with a
  timeout in exactly three places, and every one is animating a *measured* value. Everywhere the
  animation is a class toggle over CSS-declared values there is no listener at all, because there is
  nothing to clean up. **The fallback is needed exactly where a measurement is, and nowhere else.**
  That is the rule A13 was reaching for.
- **A23 — `--fx-glow-radius: 180px` is a Button-sized number, not a universal one.** The source
  scales its proximity radius to the element: Rating star 90px, Tabs and Pagination 96, Breadcrumb
  120, Avatar and Chip 160, Timeline 200, Accordion 220, Alert 240, Sidebar 320. Any component
  larger than a Button that is granted glow must pass its own radius rather than inherit the token.
- **A24 — Accessibility gaps in the source that must not be inherited (Phase 2/3).** Recorded here
  because each one looks like a design choice in the shadow CSS and is not.
  - **Pagination has no keyboard handling at all.** Every page number is a tab stop, and with no
    ellipsis handling a hundred-page set is a hundred stops.

    **Correction (verified against `bits-ui@2.19.0`, `dist/bits/pagination/pagination.svelte.js`):**
    bits-ui already has this. A shared `handleTriggerKeydown` is wired into both
    `PaginationPageState` and `PaginationButtonState`; it collects the page nodes, maps next/prev
    from the orientation *and* the resolved text direction, and handles `Home`/`End` with an
    optional `loop`. So, as with the switch in A15, this amendment named a gap that is bits-ui's
    and is already filled. Nothing was hand-rolled (`F14`).

    A roving tabindex was **also** declined, and on its own merits rather than by omission: the
    defect does not survive the change of design. The source has no ellipsis, so a hundred pages is
    a hundred buttons; bits-ui windows the run, so at `siblingCount: 1` it is at most seven page
    buttons plus two arrows *regardless of count*. Nine stops in a nav landmark is ordinary, and a
    roving tabindex would remove Tab as an escape for anyone who does not know the arrows work.
  - **Tabs declares `role="tablist"` and `role="tab"` with no panels and no `aria-controls`.** A tab
    that controls nothing is a lie to a screen reader. Either wire the panels properly or do not
    claim the roles.
  - **Rating puts `role="slider"` on the wrapper *and* keeps focusable `<button>` stars.** That is
    invalid — a slider has one focusable element with a value, not N children. The correct native
    shape is a radio group, which brings arrow-key navigation, form association and announcement
    for free.
  - **No Phase 3 component persists state**, so Sidebar's collapsed rail flashes open on first paint
    after a reload. Whatever we do about that, it has to be decided rather than discovered.
- **A25a — `MorphIndicator` compensates the border radius under a non-uniform scale.** A19 asserted
  this "is handled"; it was not, until now. A `scaleX` of 2.5 on a pill whose radius is half its
  height renders a lozenge for the length of the travel. The inverted keyframe pre-divides the
  radius by the scale — `border-radius: {r/sx}px / {r/sy}px`, using the two-value form because a
  non-uniform scale needs independent horizontal and vertical radii — and CSS interpolates back as
  the scale unwinds. Paint, not layout, so §1 permits it. Skipped when both scales are 1, which is
  the common case for a uniform row.

  **Still outstanding, and honestly so: `chrome` ships without its shoulders.** The source's sled
  has two quarter-disc pseudo-elements that would squash under `scaleX`, and reproducing them needs
  a counter-scaled *child*, which `MorphIndicator` does not render. The digest predicted exactly
  this as the one thing FLIP cannot reproduce. What ships is a top-rounded sled on a lip, which
  reads as a browser tab but is not the source's silhouette.
- **A25 — `MorphIndicator` must re-measure on two signals besides selection.** A container resize,
  caught by a `ResizeObserver` on the offset parent — not a `window` resize listener, because the
  container can change without the window and `pointer.svelte.ts` owns window-level listeners. And
  `document.fonts.ready`, because text measured against a fallback font is measured wrong and a
  `ResizeObserver` on the *track* does not see it: the track's box often does not change, only the
  item inside it. The source re-measures four ways for exactly this reason.

### Phase 4 dependency decisions (§5 requires these before Phase 4 starts)

- **A26 — ColorPicker uses an internal OKLCH converter, not `culori`.** §5 offered either. The
  deciding argument is what this project *is*: a registry ships **source into a consumer's
  repository**, so a dependency here is a dependency every consumer inherits, for one component
  most of them will not install. The conversions needed — OKLCH ↔ OKLab ↔ linear sRGB ↔ sRGB, plus
  HSL and hex at the boundary — are well-defined matrix arithmetic, not a judgement call, and they
  fit in well under 200 lines with the constants written out and cited. `culori` is a good library
  and the right choice in an application; it is the wrong choice in a registry item.
  OKLCH stays the internal space, matching Tailwind v4 and shadcn.
- **A27 — Code and CodeWindow load Shiki lazily, from the web bundle, with a restricted language
  set and a real `<pre>` fallback.** Shiki is the right highlighter and it is heavy — the full
  bundle is megabytes of grammars. `shiki/bundle/web` with an explicit language allowlist, imported
  with a dynamic `import()` only when a `Code` block actually mounts, keeps it off the critical path
  entirely. **The SSR render is a plain, correctly-escaped `<pre><code>`**, which means the content
  is readable and selectable before any highlighting arrives and remains so if it never does. Shiki
  is a `dependencies` entry on those two registry items only, so installing `Button` does not pull a
  syntax highlighter.
- **A28 — Tabs `gooey` is optional and must not be the default.** §5 already says so. It needs an
  SVG `feGaussianBlur` + `feColorMatrix` filter and must degrade to `chrome` under reduced motion.
  If it ships, `chrome` remains the default variant.

### Amendments from building Phase 3

- **A21a — `fx-collapse` alone is not enough for a panel bits-ui mounts.** A21 says the utility
  "needs no measurement, so no `transitionend` listener and no timeout guard". That is true of the
  CSS and false of the situation: bits-ui's presence layer *does* measure. With `forceMount` off,
  `AccordionContentState` zeroes `transitionDuration` inside an `afterTick` to measure the panel —
  which swallows the transition — and then re-applies `hidden` because `getAnimations()` comes back
  empty. Upstream survives this because a keyframe **animation** restarts when `animationName` is
  restored; a CSS **transition** does not.

  So `forceMount` is required, and it is exactly the mechanism §4/A4 describes. The cost is a
  permanently mounted panel, which moves the accessibility question from bits-ui to us; it is paid
  with `visibility` in the transition list, so it flips at the end of the close and the start of the
  open — no timer, no listener, consistent with A22.
- **A24a — bits-ui's Accordion has the same `aria-controls` gap A24 tells us not to inherit.**
  `AccordionTriggerState` emits `aria-expanded` and stops; `AccordionContentState` emits no id and
  no `aria-labelledby`. That is the identical defect A24 names in the vuesax source, and
  **inheriting it from a different upstream is the same outcome for the same user** — so `Accordion.Item`
  mints one id and both ends use it. `role="region"` is deliberately *not* added: the ARIA practices
  discourage it past roughly six panels, and neither bits-ui nor shadcn claims it.

  The general rule this establishes: **`F14` says do not re-implement what a primitive already does.
  It does not say inherit what a primitive fails to do.** Check, then fill the gap narrowly.
- **A24b — a strict superset sometimes means fixing upstream, not only preserving it.** Two real
  defects in shadcn-svelte's own components were corrected rather than carried:
  - **Sidebar loses `data-slot="sidebar-menu-button"` whenever a tooltip is attached.**
    `mergeProps(buttonProps, props)` lets bits-ui's `data-slot="tooltip-trigger"` win, so upstream's
    own `data-[slot=sidebar-menu-button]` selectors silently stop matching on exactly the buttons a
    collapsible sidebar always has — 5 of 7 on our demo page. Re-asserted after the merge, with
    `data-tooltip-trigger` preserving the tooltip's identity. This is `F7` occurring upstream.
  - **`pagination-ellipsis` puts `aria-hidden="true"` on the wrapper**, which prunes the
    `<span class="sr-only">More pages</span>` inside it, so the gap in the page run is announced as
    nothing at all. The attribute moved to the icon; visually identical, audibly not.

  §1's "never break an existing shadcn call site" is about **API and appearance**. It is not a
  commitment to reproduce a bug, and where the two conflict the user wins. Every such fix is
  recorded here rather than made quietly.
