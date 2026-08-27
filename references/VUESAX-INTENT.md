# Vuesax design-intent digest — Phase 1 form controls

Read from `/home/node/repos/resax/references/<component>/web-component/*.js` (source of truth)
and `css/shadow/*.css`. Prose only, no code ported.

**Scope note.** Per SPEC §9 **A9**, every height, padding, radius, font size and palette value below
is *ignored*. Sizes and colours come from shadcn-svelte's Tailwind scale. Every duration and easing
quoted here is **vuesax's own number, given only as a calibration data point** — our scale is
80 / 120 / 180 / 240 ms with `--ease-out` / `--ease-in` / `--ease-spring`.

Source coverage: all six located. One gap — `switch-dot`'s shadow CSS was never extracted
(28-byte stub); only its compiled Vue island survives, so its *visual* treatment is unknown.

---

## 1. Input (`vs-input` + 5 skins)

**States.** `default` · `danger` · `warn` · `success` (called "tone"); plus `focused`, `has-value`,
`has-label`, `has-prefix`, `disabled`, `readonly`, `block`, `pressed`. No `loading` state.
Skins: `filled`, `underline`, `spotlight`, `pulse`, `gradient-border`.

**Structure shadcn lacks.**
- **Floating label cut into the border.** The border is a real `<fieldset>` with a `<legend>`; the
  legend is `visibility: hidden`, `height: 0`, `max-width: 0.01px` and only *reserves width*, so
  when it expands it opens a genuine gap in the top border line. No opaque label background.
- **Placeholder suppression.** When a label is set, the placeholder is only written to the DOM
  *while focused*. So at rest you see the label; on focus the label floats and the placeholder
  appears underneath it. Two hints, never at once.
- **Prefix slot** (static text, `pointer-events: none`, aria-hidden), **clear button**,
  **password reveal** (eye / eye-off icon swap), **hint line** under the field.
- **Auto-contrast label.** JS walks up the ancestor chain for the first background colour with
  alpha > 0.1, computes luminance, and sets the resting/focused label colour to black or white.
  A `MutationObserver` on `documentElement[data-theme]` re-runs it.
- **`color` attribute**: any CSS colour string, parsed via a canvas 2d context, then ~19 CSS vars
  are derived from it including a WCAG-luminance-picked foreground.

**Motion character.** Focus is a three-part chord that does *not* land together: the label
translates up-left and scales to `0.82` over **240 ms `cubic-bezier(0.34, 1.4, 0.5, 1)`** (slight
overshoot); the legend gap widens `max-width: 0.01px → 100%` over **220 ms**, same curve, so the
border opens just behind the label; the outline border colour catches up over **220 ms
`cubic-bezier(0.22, 1, 0.36, 1)`**. Hover is a background tint over 220 ms plus a border-colour
step. On `pointerdown` the whole field **tilts in 3D**: `perspective(600px)` with rotateX up to 5°,
rotateY up to 8° toward the cursor and `scale(.985)`, springing back over **260 ms
`cubic-bezier(0.34, 1.56, 0.64, 1)`**. Skins layer one extra: `underline` grows a 2 px accent rule
`scaleX(0 → 1)` from centre over 320 ms; `pulse` fires one ring `scale(1 → 1.12)` fading out over
620 ms on focus; `gradient-border` runs a conic-gradient ring spinning at **2.4 s linear infinite**
while focused; `spotlight` fades a 150 px cursor-tracked radial in over 220 ms.

**Overshoot.** Yes, in three places: the press tilt/scale (1.56 control point), the label float and
legend width (1.4 control point), and the clear/reveal button's `:active { scale(.86) }` return
(160 ms, 1.56). The legend one is **overshoot on a width, i.e. on layout** — banned by our §2.

**Would get wrong.**
- The clear and reveal buttons are `tabIndex = -1`. Reachable by mouse only. That is a real
  accessibility defect, not a design intent — give them real tab stops or an explicit rationale.
- The hint `<p>` is never wired via `aria-describedby`; the label is applied as a bare
  `aria-label`. Both need fixing on the port.
- Focus is signalled by a **border-colour swap, not a ring**, and the proximity glow is explicitly
  driven to `opacity: 0` on focus. Vuesax's own comment: the accent border takes over. Do not
  stack a shadcn focus ring *and* an accent border — pick one.
- Tone colouring is not just the border: in `danger`/`warn`/`success` the resting border, hover
  border, hover tint, floating label, placeholder and hint text all recolour. `danger` is a
  *presentation* of the whole field, not a badge on it.
- Nothing here is form-associated. No hidden input, no `ElementInternals`. bits-ui gives us that
  for free; do not treat vuesax as a reference for form semantics.

---

## 2. Textarea (`vs-textarea` + 5 skins)

**States.** Same tone set as Input (`default`/`danger`/`warn`/`success`), plus `focused`,
`has-value`, `has-label`, `disabled`, `readonly`, `autosize`, `resize-none|vertical`, `block`.
Skins: `filled`, `underline`, `spotlight`, `gradient-border`, `code`.

**Structure shadcn lacks.**
- Same fieldset/legend floating label, but anchored to the **first text line** (`transform-origin:
  left top`), not vertically centred — so it rises from where the text starts.
- **Label truncation on float.** At rest the label may wrap to multiple lines inside the field;
  once floated it is hard-truncated to `label-max-chars` (default 28) with an ellipsis and the full
  text moved to `title`. Two different label renderings for two states.
- **Character counter** in a meta row alongside the hint, `font-variant-numeric: tabular-nums`,
  flipping to the danger colour at `length >= maxlength`.
- **Autosize** (height → `scrollHeight` on every input) which also forces `resize: none` and
  `overflow: hidden`.
- **Clear button** pinned to the top-right corner rather than vertically centred.
- **A glow mask that carves out the floated label.** The proximity glow layer uses a three-layer
  CSS mask whose third layer is positioned and sized from the *measured* bounding box of the label
  element (+3 px bleed), kept in sync by a `ResizeObserver`, a rAF and a 280 ms fallback timeout.
  This is how the light passes *around* the label without an opaque backing.

**Motion character.** Identical to Input's focus chord — label 240 ms `cubic-bezier(0.34,1.4,0.5,1)`,
legend 220 ms, border 220 ms — with one deliberate subtraction: **the field does not tilt or scale
on press.** A textarea is a text surface you put a caret in, not a button. Ripples still fire on
`pointerdown`. The `code` skin drops nearly all motion (border + box-shadow, 200 ms) because it is
a monospace editor surface.

**Overshoot.** Only the label float / legend width (1.4 control point) and the clear button's
`:active` return. No press spring on the field itself.

**Would get wrong.**
- Dropping the press-tilt is a *decision*, not an omission. Keep textarea non-springy.
- The counter and hint share one baseline-aligned row; a naive port puts the counter under the
  hint and the layout shifts when the hint is empty.
- Autosize + `resize` are mutually exclusive; `disabled` also forces `resize: none`.
- The label truncation means the accessible name and the visible name diverge once floated —
  the port must keep the accessible name the untruncated one.

---

## 3. Checkbox (`vs-checkbox` + 5 skins)

**States.** `checked` · `indeterminate` (aria `mixed`) · `disabled` · `pressed` · `pop` (a
transient post-toggle class), tones `default`/`danger`/`warn`/`success`, label position
left/right, sizes sm/md/lg. No loading, no readonly.
Skins: `bounce`, `fill`, `flip`, `neon`, `card`.

**Structure shadcn lacks.**
- **Card presentation** (`checkbox-card`): a bordered panel with a title, a description line and a
  corner check *badge*; selection tints the whole card background and adds an inset ring.
- **Indeterminate is a first-class third state** with its own SVG dash path, and clicking an
  indeterminate box goes to **checked**, never to unchecked.
- **The label is interactive in its own right** — it has its own press handler, its own 3D tilt and
  its own "water-drop" ripple (below). It is not a passive `<label for>`.

**Motion character.** Three separate things move on toggle, in order:
1. `pointerdown` — the box scales to **0.82** and **two** ripples fire from the exact cursor point:
   an inner core at 0.8× the diagonal (**460 ms**) and an outer wave at 1.9× (**620 ms**) delayed
   **90 ms**. Both `cubic-bezier(0.22, 1, 0.36, 1)`, fading 0.7 → 0. They expand *outside* the box
   (`overflow: visible`, `z-index: -1`) as a halo, not clipped like Material.
2. On state change — a `pop` keyframe on the box, `scale: 0.86 → 1.14 → 1` over **420 ms
   `cubic-bezier(0.34, 1.7, 0.5, 1)`**, scheduled via a **double rAF** (not a timeout — matches our
   `doubleRaf` helper). It runs on *both* check and uncheck.
3. The tick itself is a **stroke-dashoffset draw**, `24 → 0` over **300 ms
   `cubic-bezier(0.65, 0, 0.35, 1)`** (an in-out curve — the line accelerates then settles). The
   indeterminate dash uses the same trick over 220 ms. The two marks cross-swap by dashoffset,
   never by opacity.

The label, meanwhile: on press it tilts `perspective(420px)`, rotateX ≤12°, rotateY ≤9°,
`scale(0.93)` with a fast **120 ms** ease-in-out sink, and on release springs back over **620 ms**
using an explicit `linear()` damped spring that peaks at **1.15 at ~26 %** before settling. And a
"water-drop" — a cloned copy of the label text with a double radial-gradient ring
`background-clip: text`, expanding 0 → 150 px over **1820 ms `cubic-bezier(0.16, 1, 0.3, 1)`**.

**Overshoot.** Heavy and in four places: press scale return (1.7 control point), the pop keyframe
(**+14 %**), the label spring-back (**+15 %**), and in skins the bounce pop (+16 %) and the card
badge pop (+18 %). Our §2 permits overshoot on press feedback and the check mark — that covers (1)
and (2). The **label spring is a third overshoot** and is not covered; either extend the allowance
deliberately or drop it.

**Would get wrong.**
- Indeterminate → click → **checked**. Getting this backwards is the classic bug.
- The pop fires on uncheck too, so unchecking is as loud as checking. If we want quieter, that is
  an explicit change from source.
- The ripple halo is unclipped and sits at `z-index: -1` behind the box — it needs `isolation:
  isolate` on the box and no clipping ancestor, which conflicts with dense list layouts.
- The `role="checkbox"` control is a `<button>`, and Space *and* Enter both toggle. Native
  checkboxes ignore Enter; bits-ui will decide this for us, but the source is not native behaviour.
- The water-drop reads the label's own text content to build the clone — it silently breaks for
  rich-content labels.

---

## 4. Radio + RadioGroup (`vs-radio`, `vs-radio-group` + skins)

**States.** Radio: `checked` · `disabled` · `pressed` · `pop`, tones default/danger/warn/success,
sizes sm/md/lg, label left/right. Group adds `direction` horizontal|vertical and a group-level
`disabled` that ORs into each option.
Radio skins: `bounce`, `fill`, `ring`, `glow`, `card`.
Group skins: `segment`, `pill`, `slide`, `cards`, `glow`.

**Structure shadcn lacks.**
- **`RadioGroup` renders its options from an `options` array property**, not from slotted children.
  It builds each radio's DOM itself, which is why the group can own the roving tabindex and the
  sliding indicator. (Our port should keep composition, but note the group must still *own* focus.)
- **A single persistent sliding indicator** in `segment` / `pill` / `slide`: one element that
  animates its `transform`, `width` *and* `height` to the selected option's measured box, rather
  than fading a per-option background.
- **Card presentation** with title + description + corner check, same as checkbox-card.
- The standalone `vs-radio` implements grouping by scanning the document for
  `vs-radio[name="…"]` and unchecking siblings — a fallback, not a design.

**Motion character.** Press and ripple are byte-identical to Checkbox (0.82 scale, twin ripples at
460/620 ms with 90 ms offset, label tilt + 620 ms `linear()` spring, 1820 ms water-drop). The only
different piece is the mark: the inner dot scales **0 → 1** over **360 ms
`cubic-bezier(0.34, 1.7, 0.5, 1)`** with opacity over 180 ms — so the dot arrives with a visible
bounce while the border colour changes underneath it. `pop` fires **only on select, never on
deselect** (radios don't deselect). Skin flavours: `bounce` drops the dot in with a 760 ms
squash-and-stretch keyframe (six bounces damping out, `scaleY` down to 0.72 at impact); `ring`
draws a circular stroke `dashoffset → 0` over 480 ms then pops the dot in at a **120 ms delay**;
`glow` breathes a halo at **1800 ms ease-in-out infinite** while selected — an idle loop on a
selection state, which our §3.5 shimmer rule forbids.

Group indicators: `segment` **340 ms `cubic-bezier(0.34, 1.4, 0.5, 1)`**, `slide` **360 ms
`(0.34, 1.35, 0.5, 1)`**, `pill` **420 ms `--ease-spring`** — all animating width/height alongside
transform.

**Overshoot.** Dot scale-in (1.7), pop (+14 %), press return, label spring (+15 %), plus every
group indicator. **The group indicators overshoot on `width` and `height`, i.e. on layout** — our
`MorphIndicator` should overshoot the transform only and interpolate size linearly, or it will read
as the "slow and drunk" case §2 warns about.

**Would get wrong.**
- Arrow keys **select as they move** (auto-select), wrap around the ends, and skip disabled
  options; Space/Enter select the focused option. Roving tabindex puts `0` on the selected enabled
  option, falling back to the first enabled one when nothing is selected.
- Group `disabled` ORs with per-option `disabled` — a disabled group must not be re-enabled by an
  option.
- If the bound value matches no option, the group silently falls back to the first option's value.
  That is a data-loss-shaped behaviour; decide deliberately rather than inheriting it.
- Radio and Checkbox share ~90 % of their press/ripple/label code. Build it once.

---

## 5. Switch (`vs-switch` + 6 skins)

**States.** `checked` · `disabled` · **`loading`** · `pressed` · **`dragging`**, tones
`accent`/`success`/`danger`/`warn`/`neutral`, sizes sm/md/lg, label left/right, optional
`icons`. Skins: `material`, `label`, `dot`, `glow`, `liquid`, `day-night`.

**Structure shadcn lacks.**
- **A drag gesture.** `pointerdown` captures the pointer; horizontal movement past **4 px** sets
  `dragging` and the state follows the drag *direction* (right = on, left = off) live. On
  `pointerup`, if a drag happened the click-toggle is **suppressed** — otherwise it toggles.
- **A loading state**: a spinner replaces the thumb icon, `cursor: progress`, `aria-busy="true"`,
  and interaction is blocked without setting `disabled`.
- **Icons inside the thumb** (check / dash), cross-faded.
- **Skin-level content**: `label` prints ON/OFF text inside the track; `day-night` animates stars,
  clouds and moon craters; `liquid` runs an SVG goo filter over three lagging blobs.

**Motion character.** The base transition is **480 ms `cubic-bezier(0.34, 1.56, 0.64, 1)`** for
`transform`, and — critically — **the same duration and curve for `width`**, with a comment
explaining why: if they diverge, the stretched thumb's trailing edge drifts off the track edge.
Track background crossfades over the same 480 ms but with `ease-out`, so the colour lands ahead of
the thumb. On press the thumb **stretches iOS-style to 1.32× its width**, and when already on, the
translate is compensated by `0.32 × thumb` so it grows only toward the far edge. The track itself
tilts in 3D on press: `perspective(300px)`, rotateX ≤18°, rotateY ≤12°, `scale(0.93)`, returning
over 260 ms with the same spring. A single ripple (640 ms) is clipped *inside* the track — unlike
checkbox/radio, whose ripples escape. Thumb icons swap with opacity 200 ms + `scale(0.4) rotate(-45°)
→ scale(1) rotate(0)` over 320 ms spring.

**Overshoot — the answer you asked for.** Yes. The thumb travel uses
**`cubic-bezier(0.34, 1.56, 0.64, 1)` over 480 ms**, i.e. the standard ~10 % positional overshoot,
and the same curve on width. The `glow` skin adds a press squish `scaleX(1.12) scaleY(0.92)`;
`liquid` leans the blob toward the target on press with `scaleX(1.1) scaleY(0.93)` while two trail
blobs lag at **1.32×** and **1.62×** the base duration, producing the necking. So: **switch thumb
overshoots on translate, roughly the same curve we already permit; magnitude is the default 1.56
control point, not a custom value.** Vuesax's 480 ms is twice our `--dur-slow`; at 180–240 ms the
same curve reads much crisper.

**Would get wrong.**
- Drag-to-toggle, and specifically the suppression of the click toggle after a drag. Without it a
  drag toggles twice.
- ArrowRight sets **on** and ArrowLeft sets **off** — absolute, not a toggle. A "toggle on any
  arrow" port is wrong.
- `loading` blocks interaction but is *not* `disabled`: it keeps full opacity, keeps focus, sets
  `aria-busy`. Two distinct non-interactive states.
- The thumb's `border-radius` is pinned to half the *track* height so that stretching yields a
  rounded rectangle, not an oval. A `rounded-full` thumb breaks this.
- `switch-dot` has no extractable CSS — do not guess at it.

---

## 6. Select (`vs-select` + 5 skins)

**States.** `open` · `expanded` (a second, later phase of open) · `has-menu` · `up` (drop-up) ·
`disabled`, tones default/danger/warn/success, sizes sm/md/lg, per-option `selected` /
`disabled` / `active` (keyboard highlight). No loading, no multi-select, no readonly.
Skins: `floating` (fieldset label), `pill`, `underline`, `slide`, `search`.

**Structure shadcn lacks.**
- **The trigger morphs into the menu.** On open the real trigger is hidden *instantly* (no fade),
  the menu is created at exactly the trigger's box, and a **cloned, non-interactive copy of the
  trigger's face** is painted on top of the menu so the user sees continuity. The menu then grows
  downward while the clone dissolves. On close the whole thing reverses. This is the single most
  distinctive thing in the whole set and it has no shadcn analogue.
- **Drop-up with real containment detection**: it walks every ancestor — *including across shadow
  hosts* — looking for `overflow-y != visible`, intersects their rects, and flips to
  `transform-origin: bottom` when the list will not fit below.
- **A sliding highlight** — one element that translates by `activeIndex × optionHeight` rather than
  per-option hover backgrounds.
- **A custom scrollbar component** inside the menu (max-height 264 px, smoothed).
- `search` skin turns the trigger into a live filter input and focuses it on open.
- `floating` skin puts the same fieldset/legend floating label from Input on a select trigger.

**Motion character (base).** Open is a four-track morph, all starting together:
`height: triggerHeight → scrollHeight` and `transform: scale(0.9) → scale(1)` both over
**560 ms `cubic-bezier(0.34, 1.46, 0.44, 1)`**; `filter: blur(8px) → blur(0)` over **340 ms**;
`opacity: 0.5 → 1` over **240 ms**. So it un-blurs and solidifies well before it finishes growing.
The cloned face dissolves over **220 ms** with `translateY(-6px) scale(0.97)`. Options are hidden
at rest (`opacity: 0, translateY(-6px)`) and enter **staggered at `index × 26 ms + 90 ms`**, 240 ms
opacity / 280 ms transform, so the list appears to fall in behind the growing box. The caret rotates
180° over **240 ms `cubic-bezier(0.34, 1.56, 0.64, 1)`**. The highlight slides over **280 ms
`cubic-bezier(0.34, 1.42, 0.5, 1)`**.

Close is faster and asymmetric: **420 ms** for everything, and at **45 % through the close** the
real trigger is un-hidden already carrying `blur(3.6px)`, which then clears over the remaining 55 %
— the blur is *handed off* from menu to trigger so the swap is invisible. That handoff is the trick
worth stealing; the 560 ms is not.

**Overshoot.** Three places: the menu's `height` and `scale` morph (1.46), the caret rotation
(1.56), and the highlight slide (1.42). **The menu-height one is overshoot on layout** — exactly
what §2 bans. The caret and highlight are transform-only and safe.

**Would get wrong.**
- Reduced motion is not "the same, faster": the whole morph is **skipped**, the menu is shown at
  final size, and the JS branches before any inline styles are written. Copy that structure.
- The open/close animations are driven by inline styles plus a `transitionend` listener **with a
  timeout fallback** (open 620 ms, close 540 ms) and a cancel path that clears both — because
  `transitionend` on `height` does not fire reliably. Any port that trusts `transitionend` alone
  will leave menus stuck.
- Two distinct classes are needed: `has-menu` (menu exists in the DOM) and `is-expanded` (the
  growth animation has been armed, one double-rAF later). Collapsing them into one loses the
  stagger's starting gun.
- **The proximity glow is ON by default on Select** (`glow` absent ⇒ enabled) whereas every other
  control here is opt-in. Our §3.4 forbids glow on Select entirely — a deliberate divergence.
- Keyboard: Enter/Space open, or commit the active option if open; arrows move the active index
  wrapping and skipping disabled; Escape and Tab both close. There is **no typeahead** — bits-ui
  gives us that and it will be a visible improvement.
- Outside-close uses `composedPath()`, and Escape is captured at the document in the capture phase.

---

## 7. Cross-cutting observations

**One state-class vocabulary, applied to the wrapper.** Every component puts `is-on` / `is-pressed`
/ `is-pop` / `is-disabled` / `is-focused` on the **root label or wrapper**, never on the control,
and every visual rule is a descendant selector from there. Our equivalent is `data-slot` +
`data-state` on the root — worth being just as disciplined about, because it is what makes the
label, the box and the halo able to react to one press.

**One press primitive, copy-pasted six times.** Input, Checkbox, Radio, RadioGroup, Switch and
Select all run the identical formula: normalise the pointer to −1…1 within the element, damp it by
`1 − 0.2 × min(|nx|, |ny|)`, then
`perspective(P) rotateX(−ny·A) rotateY(nx·B) scale(S)`. Only the four constants change —
Input `600/5/8/.985`, Checkbox+Radio label `420/12/9/.93`, Switch track `300/18/12/.93`. **This is
one attachment**, parameterised, not six implementations. It is also the honest reading of "press
feedback" in §3.1: vuesax's press is a *tilt toward the cursor*, not a flat scale-down.

**One ripple emitter, copy-pasted six times.** Same code everywhere: radius =
`hypot(max(x, w−x), max(y, h−y)) × 2`, spawn at the pointer, remove on `animationend`, cap the pool
at 5–6 nodes, bail entirely under reduced motion. Checkbox and Radio emit **two** (inner core at
0.8× / 460 ms, outer wave at 1.9× / 620 ms delayed 90 ms) and let them escape the box as a halo;
Switch and Select clip theirs. One `ripple` attachment with a `count` and a `clip` option covers
all six.

**One colour-derivation routine, copy-pasted six times.** A `color` attribute holding any CSS colour
is parsed through a canvas 2d context, sRGB-linearised, luminance-tested at a 0.45 threshold, and
then ~19 custom properties are written including an auto-picked `#0b0b0b` / `#ffffff` foreground and
a hover shade (×0.92 darker on light, +16 % toward white on dark). Under **A5/A9** this becomes a
single OKLCH `color-mix` derivation off `--primary` — but the *intent* to derive a whole local
theme from one colour, contrast included, is worth keeping as one utility.

**One floating-label primitive.** Input, Textarea and Select-floating share the `<fieldset>` +
zero-height `<legend>` gap-cutting trick, the `translateY(...) scale(0.82)` float and the
`max-width: 0.01px → 100%` gap. Textarea differs only in origin (top vs centre). **Build this once**
— it is the highest-value structural borrowing in the set and it is genuinely hard to get right
(the `height: 0` on the legend is what keeps the border from shifting).

**Focus treatment is inconsistent in source — do not copy the inconsistency.** Four different
things: Input/Textarea/Select-base swap the *border colour* and explicitly kill the glow on focus;
Checkbox/Radio use `:focus-visible { box-shadow: 0 0 0 3px rgb(var(--ring) / 0.3) }`; Switch uses
`outline: 2px + offset 3px`; Select trigger uses `outline: 2px + offset 2px`. Pick shadcn's `--ring`
treatment for all six and inherit the *idea* that a focused field's accent border and the focus ring
must not compete.

**One tone system.** `default | danger | warn | success` everywhere (Switch names it
`accent | success | danger | warn | neutral`), expressed as three variables — `--accent` (solid),
`--ring` (an RGB triplet for alpha compositing) and `--fx-tint`. Under A5 that collapses to one
`--fx-tint` colour plus `color-mix`. Note that a tone is never a badge: it recolours the resting
border, the hover border, the hover tint, the label, the placeholder and the hint together.

**Enter/exit asymmetry is already the house style.** Select closes in 420 ms against 560 ms open;
the `-pop` skins' leave transitions are ~140–180 ms against ~200–320 ms enter. Our "exit one step
faster" rule matches the source rather than overriding it.

**`prefers-reduced-motion` is handled per-component, and not uniformly.** Some blocks set
`transition: none`, some `transition-duration: 0ms`, ripples are always `display: none`, and Select
branches in **JS** before writing any inline style. The JS branch is the pattern that actually works
for measured animations; the CSS blocks are the pattern for everything else. Our §3.2 chain needs
both paths.

**Candidate shared primitives, ranked.** (1) `FloatingLabel` — fieldset/legend gap + float, used by
3 of 6. (2) `press` attachment with the tilt formula — used by 6 of 6. (3) `ripple` attachment with
count/clip options — used by 6 of 6. (4) The `is-pop` mark-confirmation animation (double-rAF armed,
`scale 0.86 → 1.14 → 1`) — shared verbatim by Checkbox and Radio. (5) `MorphIndicator` — already in
Phase 0; RadioGroup's segment/pill/slide are three tunings of it, and note they animate size as well
as position. (6) An `OptionList` behaviour shared by Select and RadioGroup: active index, wrap,
skip-disabled, `scrollIntoView({ block: 'nearest' })`.
