# Vuesax design-intent digest — Phase 2 feedback/display, Phase 3 navigation/structure

Sequel to `VUESAX-INTENT.md`. Read from `/home/node/repos/resax/references/<component>/css/shadow/*.css`
and `web-component/*.js` (ground truth). Prose only, no code ported.

**Scope note.** Per SPEC §9 **A9**, every height, padding, radius, font size and palette value below is
*ignored*. Sizes and colours come from shadcn-svelte's Tailwind scale. Every duration and easing quoted
here is **vuesax's own number, given only as a calibration data point** — our scale is
80 / 120 / 180 / 240 ms with `--ease-out` / `--ease-in` / `--ease-spring`. **A10–A16** already settle
press (flat scale), overshoot (two mechanics), and layout animation (banned); this document's job is to
put every remaining case on the table so it can be declined explicitly rather than by omission.

Source coverage: all thirteen located, six skins each (Spinner has ten, Sidebar six). No gaps.

---

# Part A — Phase 2

## 1. Alert (`vs-alert` + 5 skins)

**States.** Tones `default` · `danger` · `warn` · `success` (`split` adds `purple`); variants
`soft` / `solid` / `outline`; plus `is-disabled` and `is-closing`. `dismissible` is a prop, not a state.
Banner and toast add an **auto-dismiss countdown** that pauses on hover. No `loading`.
Skins: `banner`, `inline`, `neon`, `split`, `toast`.

**Structure shadcn lacks.**
- **A tone-driven icon set baked in.** The component owns three SVG icon paths and picks one from the
  tone — danger and warn share a triangle, success a check-circle, default an info-circle. The icon is
  not a slot with a default; it is a function of the tone.
- **Auto-dismiss with a visible countdown** (banner, toast only — the base has no timer). One
  `duration` attribute drives both a `setTimeout` and the progress bar's `animationDuration`, so the
  bar and the timer cannot drift. `animation-play-state: paused` on hover stops the clock while you
  read. Toast also has an explicit `is-in` mount state, set after a double rAF.
- **Actions row** under the message, and a split layout with a coloured icon rail as its own column.
- **A "neighbour light" system.** Every alert paints two extra layers (`--lit-fill` on `::before`,
  `--lit-ring` on `::after`) fed by a page-level engine that finds *other* coloured elements nearby and
  throws their colour onto this one. Distinct from the cursor glow and driven by a different variable.
  There is nothing like it in shadcn and nothing like it in our §3.4.

**Motion character.** Resting state is nearly static — border-colour 200 ms `--ease-out`, background
200 ms `ease`. Everything happens on dismissal, and dismissal is a **height collapse with an
anticipation curve**: JS measures `getBoundingClientRect().height`, pins it inline, forces a reflow,
then in a `rAF` sets `height: 0`, listening for `transitionend` on `height`. The curve is **440 ms
`cubic-bezier(0.5, -0.45, 0.55, 1)`** — the negative first control point means the box grows *taller*
for a beat before collapsing. Padding, margin and border-width are driven to zero on the same curve;
opacity leaves in 300 ms and a `blur(6px)` in 340 ms, so it is already ghost-like before it is short.
Toast enters the other way: `translateY(14px) scale(0.97) blur(6px)` → rest over **480 ms** on the
spring curve, opacity 300 ms.

**Overshoot.** Three sites. (1) The dismiss curve is *anticipation*, the mirror image of overshoot, and
it is applied to `height`, `padding`, `margin` and `transform` together — banned by §1 on the first
three. (2) Toast enter uses `--spring` on `transform` over 480 ms. (3) `neon` runs a 4.4 s conic ring
and a 3.4 s bloom breathe, both `infinite` — not overshoot, but idle loops on a non-loading state,
which §3.5 forbids.

**Would get wrong.**
- The base sets **`role="alert"` unconditionally**, on informational alerts too — an assertive live
  region announcing "Your draft was saved" interrupts a screen-reader user mid-sentence. The `toast`
  skin gets this right with `role="status"`. Ours should be `status` unless the tone is `danger`.
- **Dismiss hides, it does not remove**: `this.style.display = "none"` plus a `dismiss` event. The
  element stays in the DOM and cannot be re-shown. Ours should be `onDismiss` + consumer-owned state.
- Banner re-arms its timer from `attributeChangedCallback`; toast arms it only in `connectedCallback`.
  Changing `duration` on a live toast silently does nothing — do not inherit that asymmetry.
- The dismiss animation is the whole component's personality and it is **entirely a layout animation**.
  Re-expressed as transform it is not the same effect: a `scaleY(0)` collapse leaves the following
  content in place until the element unmounts. If we want the list to close up, the honest options are
  the `collapse` transition primitive (§4, which has the same A16 carve-out the floating label has) or
  an explicit "no animated close, just remove". Decide, do not drift into it.
- The countdown bar pausing on hover is a real usability decision, not decoration. Keep it, and note
  it needs a keyboard equivalent (pause on `focus-within`) which the source does not have.
- Title and message are separate elements with separate typographic treatment; a naive port that
  renders one string loses the two-line hierarchy that makes `solid` legible.

---

## 2. Avatar + AvatarGroup (`vs-avatar`, `vs-avatar-group` + 5 skins each)

**States.** Avatar: presence `online` · `idle` · `dnd` · `offline`; activity `typing` · `call` ·
`video` · `streaming`; ring `story` · `seen` · `live`; plus `progress` (0–100 with an optional percent
pill), `count` (a number badge), `bordered`, `interactive`, `glow`, shapes `circle`/`rounded`/`squircle`,
sizes xs–xl. Group: `max` (overflow to a `+N` chip), `overlap` sm/md/lg, `spread`, `is-open`.
Avatar skins: `glow`, `ring`, `squircle`, `status`, `tilt`. Group skins: `fan`, `flip`, `grid`, `ring`,
`wave`.

**Structure shadcn lacks.**
- **One corner slot, five different shapes.** The status element is a single node that morphs between a
  small presence dot, a larger round activity badge, and a wide short "typing" capsule. `idle` is drawn
  as a crescent by overlaying an offset disc in the page background colour (Discord's trick), `dnd` as a
  bar, `typing` as three bouncing dots.
- **A circular progress ring** around the avatar (SVG, `stroke-dashoffset`) with a percentage pill
  hanging off the bottom edge, and a **story/live ring** that is a separate element behind the face with
  its own gap.
- **A three-stage image fallback chain**: `<img>` → initials → a person-silhouette placeholder, driven
  by a one-shot failure flag set on the `error` event and **reset whenever `src` changes**, plus an
  `error` event for the consumer. `disconnectedCallback` strips `src` to cancel in-flight loads.
- **Deterministic fallback colour and initials**: `--ava-hue` is `(hash * 31 + charCode) % 360` over
  the name, so the same person always gets the same background; initials are the first two characters
  for a single word, first-of-first + first-of-last otherwise. The count badge caps at `99+` and sets
  `--digits` so the pill can size itself.
- **A `+N` overflow chip that is the same button as the popover anchor.** It opens a real portalled
  panel — a detached `<div>` with its own shadow root appended to `document.body` — holding a
  `role="menu"` list of the hidden avatars with its own sliding hover highlight. It flips above when
  it would overflow the bottom, right-aligns when it would overflow the right, clamps both axes to an
  8 px viewport pad, and writes the anchor offset back as `--ox`/`--oy` for the transform origin.
  Outside-click uses `composedPath()`, `Escape` closes **and refocuses the trigger**, and teardown
  waits on `transitionend` **or** a 380 ms fallback. **None of the five skins do any of this** — their
  `+N` is a static chip. Only the base is interactive.
- **Group spread on hover**: every item translates by `index × size × 0.16` and lifts 2 px; the hovered
  one lifts 5 px and comes forward **`translateZ(38px)`** through a `perspective: 620px` on the
  container. Overlap itself is a static negative `margin-left` — only the spread animates.

**Motion character.** The avatar itself moves on one curve — `transform 240 ms
cubic-bezier(0.34, 1.56, 0.64, 1)` — and everything else is layered on. Press is the **3D tilt** A10
declined, at `perspective(320px)`, `rotateX ≤14°`, `rotateY ≤10°`, `scale(0.94)`, with the same
`1 − 0.2 × min(|nx|,|ny|)` damping as Phase 1, plus a single ripple clipped to the face
(**720 ms `cubic-bezier(0.22, 1, 0.36, 1)`**, fading 0.85 → 0). The status capsule
resizes over **560 ms on an explicit `linear()` damped spring peaking at 1.117 at roughly 22 %**, with
`border-radius` on a plain 300 ms ease-out underneath, so the shape settles before the size does. Typing
dots run 1.1 s with −0.22 s / −0.11 s negative delays. Story ring: conic gradient rotating via a
registered `--ava-angle`, **6 s linear infinite**; live ring adds an outward pulse at 1.8 s.
Group: fan-out **460 ms `cubic-bezier(0.34, 1.8, 0.5, 1)`** — the loudest overshoot in either phase.
`fan` rotates each item 460 ms at 1.56; `flip` is a 560 ms `rotateY(180deg)` card at 1.4; `ring` spins a
conic ring at 3.4 s, dropping to 0.9 s on hover; `wave` bobs each item on a 1.1 s loop delayed by
`index × 110 ms`; `grid` re-lays out from a stack to a grid.

**Overshoot.** Five sites. The base transform (1.56). The status capsule's `linear()` spring at **+11.7 %
— on `width` and `height`**, i.e. on layout. The count badge's `width` at **460 ms
`cubic-bezier(0.34, 1.46, 0.44, 1)`** when the digit count changes — also layout. The group fan at
**1.8**, and the `squircle` skin's hover `scale(1.12) rotate(-2deg)` on its own 520 ms `linear()` spring.
Only the base transform and the fan are transform-only.

**Would get wrong.**
- **Presence and activity are one slot, not two.** `typing` replaces the presence dot; it does not sit
  beside it. A port with two badges renders a state the design never has.
- The `+N` chip is `aria-haspopup` + `role="menu"`, so the overflow is *navigable*, not a static count.
  shadcn's AvatarGroup has no such affordance and consumers assume the count is decorative.
- `translateZ` on the hovered group item means the group container establishes a 3D context. Any
  tooltip or popover anchored to an avatar inside it will mis-position — the same hazard A10 cites for
  press. If we keep the spread, keep it 2D.
- The status dot is punched out of the page background (`box-shadow: 0 0 0 2px var(--bg-card)`), so it
  breaks the moment an avatar sits on a non-default surface. Use a token the consumer can override, and
  say so.
- The story ring animates a registered custom property. Without `@property` it does not interpolate at
  all — and `@property` inside a shadow stylesheet never registers, which the neon alert's own comment
  notes. In our light-DOM Tailwind setup this works; do not assume it did there.

---

## 3. Chip (`vs-chip` + 5 skins)

**States.** `is-selected` · `is-clickable` · `is-disabled`; variants `soft` / `solid` / `outline`;
tones `default` / `danger` / `warn` / `success`; sizes sm/md/lg; `removable` (adds a close button),
`dot`, `avatar`, `check`. `selectable` gates whether clicking toggles.
Skins: `bounce`, `fill`, `glow`, `gradient`, `outline`.

**Structure shadcn lacks.**
- **Selection is a first-class state distinct from the variant.** `is-selected` overrides all three
  variants with a full-strength tone fill, and there is an explicit rule keeping that fill on hover —
  with a comment explaining that without it the soft-variant hover rule reverts the background to a
  translucent tint while the foreground stays `solid-fg`, killing contrast. That interaction is exactly
  the kind of thing a `tv()` port loses.
- **A leading slot with three mutually exclusive occupants** — dot, avatar image, or check — and the
  dot recolours to `currentColor` when selected so it reads against the fill.
- **A remove button with its own ripple layer**, separate from the chip's, with its own press scale
  (0.9 against the chip's 0.95) and a `stopPropagation`.
- The chip root **is a `<button>` in every case**. When `selectable` it gets `type="button"` and
  `aria-pressed`; when not, it keeps the button element but is pushed out of the tab order with
  `tabindex="-1"`.
- The avatar slot is detected by a **light-DOM `querySelector('[slot="avatar"]')`** plus a
  `slotchange` re-render, and its presence suppresses the dot.

**Motion character.** Base chip: `transform 240 ms cubic-bezier(0.34, 1.56, 0.64, 1)` plus 200 ms
colour transitions; a ripple at **780 ms `(0.22, 1, 0.36, 1)`**. Skins each pick one idea and commit:
`fill` slides a `scaleX(0 → 1)` background from the left over **340 ms ease-out** on hover *and* on
select — the only skin whose selection is a directional wipe; `bounce` runs a five-stop squash-stretch
keyframe (`0.9,1.05 → 1.12,0.9 → 0.96,1.04 → 1.03,0.98 → 1`) over **520 ms** and pops the check in at
**420 ms peaking 1.35**; `gradient` pans a gradient at **5 s linear infinite**, dropping to 3 s when
selected; `outline` spins a conic ring at 2.4 s, 1.6 s when selected; `glow` pulses a box-shadow at
1.9 s while selected.

**Overshoot.** Base transform (1.56), the bounce squash (+12 % on X, −10 % on Y), and the check pop
(+35 %). All transform-only. The three loop-based skins are not overshoot but are idle loops on a
*selected* state, which §3.5 forbids outright.

**Would get wrong.**
- **Selected ≠ solid variant.** They are two axes and they compose. A port that maps `selected` onto
  `variant="solid"` cannot express "an outline chip that is selected".
- The remove button is inside the clickable chip. Without stopping propagation, removing also toggles.
- Hover styling is gated on `.is-clickable`: a decorative chip must not light up. shadcn's Badge has no
  such gate and people paste `hover:` classes onto static badges.
- A non-selectable chip is a `<button tabindex="-1">` — an interactive element deliberately removed
  from the tab order. Render a `<span>` instead; do not inherit the hack.
- The `fill` skin uses `selected` + `value` where every other skin uses `model-value`. That drift is
  exactly what a single `tv()`-driven component prevents; note it as a symptom, not a feature.
- §3.4 gives Chip **ghost and gradient only**. The source has a full proximity glow layer on the base
  chip (opt-in via a `glow` attribute) plus the neighbour-light lamp. Chips appear in lists; §3.5's
  density rule kills glow there anyway. This is a clean decline.

---

## 4. Spinner (`vs-spinner` + 10 skins)

**States.** Not a stateful component. Axes: `size` sm/md/lg/xl, `speed` slow/normal/fast, `thickness`,
`tone`, `track` (on/off), `label`, and **`overlay`** — which makes the host `position: absolute; inset: 0`
and paints a `backdrop-filter: blur(2px)` scrim over its parent.
Skins: `arc` (base), `dual`, `gradient`, `bars`, `bounce`, `comet`, `dots`, `flip`, `grid`, `orbit`,
`pulse`, `ring`, `wave`.

**Structure shadcn lacks.**
- **A speed axis as a first-class prop**, expressed as one `--dur` that every keyframe reads. Every
  skin defines its own slow/normal/fast triple rather than sharing one number, because a 3-dot bounce
  and a conic sweep do not read as the same speed at the same duration.
- **The overlay mode**, which turns a spinner into a container-scoped loading scrim without a separate
  component.
- **A label slot on the same baseline as the glyph.** The root is `role="status"` **and**
  `aria-live="polite"` with `aria-label = label || "Loading"`, and the glyph box is `aria-hidden`, so
  a spinner announces once and never announces its own geometry.
- The `gradient` skin builds the ring as a conic gradient **masked to the stroke thickness** with a
  `radial-gradient(farthest-side, …)` mask, so the tail fades — a border-based arc cannot do this.

**Motion character.** Everything is `transform` or `opacity` on an infinite loop; there is not a single
layout animation in ten skins. Base arc: `rotate(360deg)` **900 ms linear**. `dual` stacks two arcs, one
linear and one on `cubic-bezier(0.65, 0.1, 0.35, 0.9)` at 0.5 opacity, so they beat against each other.
`bars` scales Y 0.35 → 1 over 1 s with **deliberately non-monotonic delays** (0, 0.18, 0.36, **0.12**)
so the equaliser does not read as a wave. `dots` bounce at 1.1 s staggered `index × 0.16`. `bounce`
drops a ball with a blurred shadow, both delayed by `−dur/n × index`. `ring`, `wave` and `grid` fade or
scale N children on negative delays computed from `--i`.

**Overshoot.** None anywhere. Ten skins, zero springs. Loading is the one place vuesax is disciplined.

**Would get wrong.**
- **Reduced motion does not stop the spinner — it slows it to 2.4 s** (3 s for Skeleton). Every skin
  does this, uniformly. That is a deliberate correction to our §3.2 rule "loops stop": a stopped
  spinner is a lie about the system's state. Spinner and Skeleton need a documented exception —
  slow the loop, never freeze it.
- `overlay` requires the parent to be `position: relative` and inherits its radius. Ship it as a prop
  with that contract stated, or people will get a full-viewport scrim.
- The base component ships **two** distinct ring implementations (bordered arc vs. masked conic) rather
  than one parameterised — §5 collapses ten skins into a `variant` enum, so pick the conic-mask one for
  anything with a fading tail and the border one for a hard arc.

---

## 5. Tooltip (`vs-tooltip` + 5 skins)

**States.** `is-visible` · `is-entering` · `is-exiting` · `is-swapping`; placements `top` / `bottom` /
`left` / `right`; variants `solid` / `fluent` / `outline` / `glass`; `delay` (default **120 ms**),
`hide-delay` (default **90 ms**), `offset` (default 10 px).
Skins: `blur`, `fade`, `glow`, `scale`, `slide`.

**Structure shadcn lacks.**
- **One singleton tooltip element for the whole page.** It is appended to `document.body` on the first
  `vs-tooltip` connect, reference-counted, and removed when the last one disconnects. Every trigger
  borrows the same box.
- **Therefore: a warm state.** If a tooltip is already open, the open delay for the next trigger is
  **0 ms** and there is no exit/enter at all — the shared host *travels* to the new anchor and morphs
  its content. This is the single most distinctive behaviour in Phase 2 and shadcn/bits-ui express it
  as `delayDuration` + `skipDelayDuration` on a provider, which is the same idea reached by a different
  route. Worth knowing they agree.
- **`aria-describedby` is moved, not held.** The new owner takes the host's id; the old owner drops it.
  So the description only exists while the tooltip is visible.
- Rich content: `<b>`, `<strong>` and a styled `<kbd>` are supported inside the tooltip.
- **Flip and nudge, hand-rolled.** It tests all four sides for fit, uses the requested one if it fits,
  the opposite one if that fits, and otherwise keeps the requested one. Then for `top`/`bottom` only it
  nudges x to keep an 8 px viewport margin and gives the arrow an equal **negative `margin-left`**, so
  the arrow stays on the trigger while the box slides. Positioning is one
  `transform: translate(px,px) translate(%,%)` with per-side percentage anchors — no `top`/`left`.
  **The five skins have none of this**: they are self-contained, CSS-positioned, and never measure the
  viewport at all.

**Motion character.** Enter is a pop: `vstip-pop` **320 ms `cubic-bezier(0.34, 1.46, 0.44, 1)`**,
`scale 0.7 → 1.04 → 1` with `blur(8px) → 0` and a directional 8 px `translate` keyed off the placement's
`transform-origin`. Exit is *slower and anticipatory*: **360 ms `cubic-bezier(0.36, 0, 0.66, -0.36)`**,
scaling **up to 1.05 at 30 %** before collapsing to 0.6 with the blur back on. The arrow has its own
pop, **420 ms scale 0 → 1.3 → 0.92 → 1**. Travel between triggers: the host translates over **420 ms
`(0.34, 1.46, 0.44, 1)`** while the box transitions `width` and `height` on the same curve and the
content plays `vstip-swap` (400 ms, blurring to 5 px and dipping to 0.3 opacity at 40 %, overshooting to
1.03 at 70 %). All three land together.

**Overshoot.** Four sites: enter pop (+4 %), exit anticipation (+5 % then undershoot to 0.6), arrow pop
(+30 %), content swap (+3 %) — and the travel/morph curve (1.46) applies simultaneously to `transform`
**and `width`/`height`**, i.e. to layout.

**Would get wrong.**
- **Exit is slower than enter here** (360 ms vs 320 ms), which inverts our "exit one step faster" rule
  and inverts Phase 1's own finding. It works only because the exit is a *scale-down-and-blur*, which
  reads as receding rather than as waiting. At our 120/180 scale, do not copy the inversion.
- The singleton means only one tooltip can ever be open. That is correct behaviour and it is also why
  `aria-describedby` cannot be persistent. bits-ui gives us per-instance content with a shared delay
  timer, which is strictly better; do not port the singleton.
- **There is no `Escape` handler and no key handling at all** — show/hide is `mouseenter`/`mouseleave`/
  `focusin`/`focusout` only. WAI-ARIA requires Escape to dismiss. bits-ui has it; the source does not.
- The trigger wrapper is given `tabIndex = 0` unconditionally, which makes non-interactive tooltip
  anchors focusable. Correct for an icon-only affordance, wrong for a wrapped button (two tab stops).
- **§3.4 gives Tooltip nothing at all** — no ghost, gradient, glow, shimmer, tilt or magnet. The source
  reaches for a decorative effect in four places (see §17). The nuance worth stating in the port: the
  `blur(8px)` on enter/exit is **not** an effect, it is the `blurFade` transition primitive §4 already
  sanctions. `backdrop-filter` on the glass/fluent variants **is** a surface treatment and is out.

---

## 6. Rating (`vs-rating` + 5 skins)

**States.** `value` (fractional when `allow-half`), `max`, `readonly`, `disabled`, per-item
`is-pop` / `is-lit` / `is-on`; a **hover-preview value distinct from the committed value**; tones
default/danger/warn/success; icons `star` / `heart` / `circle`; `show-value`. **All five skins add
`clearable` — clicking the currently selected value sets it to 0 — and the base does not.** That is a
real state (rated 3 vs. not rated) and it should exist once, on the component.
Skins: `bars`, `emoji`, `glow`, `hearts`, `numbers`.

**Structure shadcn lacks.**
- **`role="slider"` on the wrapper with a single tab stop**, `aria-valuenow` / `valuemin` / `valuemax`,
  `aria-readonly`, `aria-disabled`, and `aria-label` reading "Rating: 3.5 of 5". Not five buttons in a
  row. This is the correct pattern and shadcn-svelte has no Rating at all to compare against.
- **Half values by geometry, not by markup.** Each item is one icon; the fill is a
  `clip-path: inset(0 calc((1 - var(--fill)) * 100%) 0 0)`, and hit-testing is
  `clientX - rect.left < rect.width / 2 ? 0.5 : 1`. Arbitrary fractions render correctly for free —
  useful for displaying an average of 3.7.
- **A hover preview that fires its own `hover` event** with the previewed value, cleared on
  `pointerleave`. Consumers use it to drive a live label.
- **The outline stroke thickens with fill**: `stroke-width: calc(0.8 + var(--p) * 0.7)` and the stroke
  alpha rises with it, so a partially filled star does not look like a broken one.
- `emoji` swaps the glyph per index and greys the unselected ones with a filter; `numbers` is a row of
  numeric chips; `bars` is a vertical bar chart.

**Motion character.** Fill moves as a `clip-path` transition, **200 ms `--ease-out`** — so dragging
across the row sweeps rather than steps. Selection fires `is-pop`: **420 ms
`cubic-bezier(0.34, 1.56, 0.64, 1)`, `scale 0.82 → 1.22 → 0.94 → 1`** — a sink *then* a bounce, four
stops, the same shape as Phase 1's checkbox pop but with an explicit undershoot at 70 %. A ripple fires
per item at 640 ms. Skins escalate: `hearts` beats **620 ms, 1 → 1.28 → 0.94 → 1.16 → 1** (a double
beat) plus a 620 ms expanding aura; `emoji` bounces **560 ms with rotation, `scale(0.7) rotate(-8°)` →
`1.3 rotate(6°)` → `0.92 rotate(-2°)` → `1.04`**; `numbers` flips 360° on Y over 520 ms; `bars` rises
480 ms with a `scaleY` squash; `glow` flashes to 1.32 over 520 ms and then **pulses lit stars at 2.4 s
infinite**.

**Overshoot.** Every skin, on `transform` only — 1.22 base, 1.28/1.16 hearts, 1.30 emoji, 1.32 glow,
1.35 chip check. Under our rules this is "toggle mark" territory: the star filling *is* the mark, so
one pop at our scale is defensible. The hover lift on the item (`translateY(-2px)`, `scale(1.08)`) is a
sixth transform and is not a mark — drop it or fold it into press.

**Would get wrong.**
- **One tab stop, arrow keys to change the value.** Left/Down decrement, Right/Up increment,
  **Home → 0** (not 1), **End → max**, and the step is **0.5 when `allow-half`, 1 otherwise**.
  Building five focusable buttons is the classic mistake and it makes the control unusable.
- The source half-commits that mistake: it puts `role="slider"` and the only real tab stop on the
  wrapper, but each star is still a `<button aria-label="3 of 5">`, `disabled` when non-interactive.
  A slider containing buttons is invalid; pick the slider and make the stars `aria-hidden` spans.
- Hover preview must not commit. The visible fill follows the pointer, `aria-valuenow` does not.
- `readonly` and `disabled` are different: readonly keeps full opacity and keeps the value announced,
  disabled dims and sets `aria-disabled`. Both stop interaction.
- `allow-half` changes the hit test, the keyboard step *and* the displayed value formatting together.
- The `bars` skin animates the fill's `height`; every other skin uses `clip-path`. Use `clip-path` or
  `scaleY` everywhere.

---

## 7. Skeleton (`vs-skeleton` + 5 skins)

**States.** None. Axes: `shape` (`line` / `rect` / `circle` / `avatar` / `card`), `animation`
(`shimmer` / `pulse` / `both` / `none`), `speed` slow/normal/fast, `count`, `width`, `height`, `radius`.
`role="status"`, `aria-busy`, `aria-label`.
Skins: `blink`, `gradient`, `pulse`, `shine`, `wave`.

**Structure shadcn lacks — and this is the highest-value borrowing in Phase 2.**
- **One light across the whole group, not one per bone.** The group sets
  `container-type: inline-size`; every bone's shimmer mask is sized `100cqw` — the *group's* width — and
  animates its `mask-position` by `+100cqw`. Because they share the container query unit and the same
  duration, the band crosses the avatar and every line as a single coherent sweep. Six independent
  `background-position` shimmers, which is what everyone ships, look like six separate lights.
- **The band is a mask, not a highlight.** The notch is *transparent*, so what shows through is the
  page backdrop. On a purple surface the shine is purple. No hardcoded white gradient, no theming bug.
- **A per-row tilt**: `mask-position` is offset by `index × --sk-tilt` (−20 px), which slants the band
  ~30° across a stack of ~24 px rows.
- **An offset compensation for composite layouts**: in the `card` shape the text stack sits 62 px in
  from the group edge, so its bones get `--ox: -62px` and the band still crosses the avatar and the
  first line at the same instant.
- `--sk-cut` (0.85) controls how deeply the band carves, as a number rather than a colour.
- **The bone widths are opinionated, not uniform**: a `text` skeleton makes its **last** line 65 %
  wide (only when there is more than one), and `card` uses 60 % / 90 % / 75 %. Uniform bars read as a
  table; ragged ones read as prose. `role="status"` + `aria-busy="true"`, every bone `aria-hidden`.

**Motion character.** `shimmer` moves the mask linearly at 1.4 s (2.1 s slow, 0.9 s fast). `pulse` beats
opacity 1 → 0.45 → 1 on `ease-in-out` at the same duration. `both` runs them together on one clock.
Skins: `shine` translates a highlight `−120% → 120%` with a 40 % dwell at the end
(`60%, 100% { translateX(120%) }`) so there is a pause between passes; `gradient` pans
`background-position 200% → −200%`; `wave` and `blink` stagger per `--i`.

**Overshoot.** None. Correct — a loading state has no confirmation to celebrate.

**Would get wrong.**
- The container-query sizing is load-bearing. `cqw` without `container-type: inline-size` on the group
  silently falls back and every bone shimmers independently.
- `shape="card"` is a *layout*, not a bone: avatar column plus a stack. Our `Skeleton` is a leaf; the
  composite belongs in the demo, but the `--ox` compensation only works if one element owns the group.
  Either ship a `SkeletonGroup` that establishes the container, or accept per-bone lights.
- Reduced motion slows to **3 s**; it does not stop. Same exception as Spinner.
- §3.4 gives Skeleton `shimmer` and nothing else, which is exactly what the source does. This is the
  one component in either phase that needs no decline at all.

---

# Part B — Phase 3

## 8. Tabs (`vs-tabs` + 6 skins)

**States.** `is-active` per tab, `is-ready` and `is-pop` on the indicator, `:disabled` per tab,
`is-disabled` on the root; variants `line` / `solid` / `pill` (plus the skins); tones
default/danger/warn/success; sizes sm/md/lg; `block`, `icon-only`, radii none/subtle/rounded/squircle.
Skins: `bubble`, `card`, `chrome`, `gooey`, `neon`, `vertical`.

**Structure shadcn lacks.**
- **The indicator is a clipping window over a duplicate label strip.** Inside the indicator there is a
  second, complete copy of the tab labels rendered in the *inverted* colour. The indicator gets
  `transform: translate(offsetLeft, offsetTop)` and `width: offsetWidth`; the inner strip gets
  `transform: translate(-offsetLeft, -offsetTop)` and the full track width. The two cancel, so the copy
  stays visually fixed over the track while the pill slides across it — the active label is *revealed
  letter by letter* rather than recoloured. This is why the indicator animates `width` and not `scaleX`.
- **A per-tab cursor light**: each tab's text uses `background-clip: text` with a 140 px radial keyed to
  `--mx`/`--my`, so letters under the pointer brighten and distant ones stay muted. Driven by a
  `pointermove` listener on `window`.
- **A "water-drop" text ripple**: a cloned label with a double radial ring expanding
  `--tabs-r: 0 → 150px` over **1820 ms `(0.16, 1, 0.3, 1)`**, `background-clip: text`. Identical code to
  Breadcrumb and to Phase 1's checkbox label.
- `chrome` draws the browser-tab shape with two masked quarter-disc shoulders as pseudo-elements
  flanking a "sled", over a toolbar "lip" that is part of the component.
- `gooey` needs an SVG `feGaussianBlur` + `feColorMatrix` filter; `vertical` slides a left rail *and* a
  row fill; `bubble` hops a fixed 8 px dot.
- Overflow tracks are horizontally scrollable with the scrollbar hidden — no arrow buttons.

**Motion character.** The indicator travels **420 ms `cubic-bezier(0.34, 1.4, 0.64, 1)`** on
`transform` *and* `width` together, with a separate `is-pop` keyframe (`scale 1 → 1.099 → 1`, 460 ms)
armed by a **double rAF** after a single rAF measurement pass. Tabs sink `scale(0.92)` on `:active` and
return over 320 ms at 1.56. `gooey` uses **460 ms `(0.5, 1.5, 0.5, 1)`** so the blob visibly stretches
and re-collapses. `neon` adds a 3 s sweep along the bar.

`gooey` gets its stretch from JS rather than from the curve: it first writes the **union** of the old
and new boxes, then after a double rAF writes the new box, so the blob visibly swells to cover both
tabs before collapsing onto the target.

`chrome` is different again, and the difference is the interesting part. Its sled carries **no CSS
transition, deliberately** — the source comment says a transition "can only interpolate both edges with
ONE curve, which is exactly what kills the stretch". Instead JS integrates **two spring solvers at
module load** (leading `k=235, c=24, m=1`; trailing `k=168, c=21, m=1`, stepped at 1000/120 ms and
terminated at `|x| < 0.002 && |v| < 0.02`), assigns the stiffer one to whichever edge leads the
direction of travel, builds one keyframe per step each carrying a `translate3d` and a pixel `width`,
and plays them through `Element.animate()` with `easing: "linear"`. The sled therefore stretches on the
way and snaps closed on arrival. Width is clamped to `--r × 2` so the shoulders never overlap; an
interrupted move reads the running animation's live matrix and re-springs from there; the whole spring
pass is skipped under reduced motion.

**Overshoot.** Indicator travel (1.4), pop (+9.9 %), gooey (1.5), bubble dot (1.4) and its hop, tab
press return (1.56), chrome's two springs. **The 1.4/1.5 curves apply to `width` as well as `transform`
in every variant except `bubble`** — layout overshoot, five times over.

**Would get wrong.**
- **Arrow keys auto-activate.** Left/Up and Right/Down move *and select*, wrapping at both ends and
  skipping disabled tabs; Home/End jump; focus follows selection. That is the "selection follows focus"
  pattern, correct only when panels are cheap. bits-ui exposes `activationMode` — pick deliberately.
- The source declares `role="tablist"` and `role="tab"` but **has no panels and no `aria-controls`**. It
  is a segmented control wearing tab ARIA, which is invalid. Our Tabs is a real tab set; take the ARIA
  from bits-ui and take only the *visuals* from here.
- The double-rAF arming of `is-pop` matters: a single rAF fires the animation on the same frame as the
  measurement and it never plays.
- A `ResizeObserver` on the track re-measures the indicator — and `chrome` goes further, re-measuring
  synchronously, on the next rAF, after an 80 ms timeout, **and on `document.fonts.ready`**. A web font
  landing after first paint is the single most common cause of a misplaced indicator, and a
  `ResizeObserver` on the track alone does not always catch it. Our `MorphIndicator` needs the fonts
  hook.
- `vertical` restricts the keys to Up/Down/Home/End and sets `aria-orientation="vertical"`; the
  horizontal variants accept both axes. Orientation must gate the key set, not just the layout.

---

## 9. Steps (`vs-steps` + 5 skins)

**States.** Per step `pending` · `active` · `completed` · `error` (and `is-nav` when navigable); root
`orientation` horizontal/vertical, `variant` `numbered` / `dots` (+ skins), `clickable`, `disabled`,
tones, sizes. `aria-current="step"` on the active `<li>`; the container is an `<ol>`.
Skins: `arrow`, `bar`, `circular`, `pills`, `timeline`.

**Structure shadcn lacks.** shadcn-svelte has no Steps at all, so everything is new:
- **Only completed steps are navigable.** `is-nav` = `clickable && !disabled && status === 'completed'`,
  and only those markers get `role="button"` and `tabIndex = 0`. Pending and active markers have no
  role and no tab stop. Enter and Space activate; there are no arrow keys.
- **`error` is a per-step status that overrides the derived one**, not a root-level flag.
- **A progress ring around the marker** (SVG, `stroke-dasharray: 100.53` = 2π·16) that fills for active
  and completed, recoloured for error, rotated 180° so it starts at 9 o'clock — where the incoming
  connector line arrives.
- **The icon layer never unmounts.** Error, check and number are all present, absolutely stacked, and an
  `is-shown` class crossfades the right one with blur and scale. No mount churn, so the swap can be
  animated in both directions.
- **There is no sliding indicator anywhere in Steps.** Progress is per-segment.

**Motion character.** A staged chain with explicit delays, and the exit runs the chain **backwards**:
- *Enter (a step completes)*: the connector's `::after` fills `scaleX(0 → 1)` at 0 ms delay over
  **480 ms `--ease-out`**; the ring's `stroke-dashoffset` runs 480 ms (active gets a **380 ms delay** so
  the line arrives first); the marker's `::before` scales `0.5 → 1` with `blur(8px) → 0` over **420 ms
  `(0.34, 1.56, 0.64, 1)`** at 0 ms.
- *Exit (a step un-completes)*: the same three properties carry **480 ms and 900 ms `transition-delay`s**
  so the ring empties, then the line drains, then the fill fades. Reversing the order rather than
  reversing the animation is what makes stepping backwards read as undoing.
Active markers sit at `scale(1.06)` (`dots`: 1.15) on a 280 ms spring. `pills` grows the active pill and
reveals its label; `bar` fills a horizontal rail; `circular` is one big ring plus a dot row.

**Overshoot.** Marker fill pop (1.56), active marker scale (1.56), icon crossfade (1.56) — all
transform. Then `pills`, which overshoots **`flex-grow` over 460 ms at `(0.34, 1.4, 0.64, 1)`** and the
label's **`max-width: 0 → 240px`** on the same curve, with `padding` on a plain 300 ms ease.

**Would get wrong.**
- **Clicking a pending or active step does nothing.** Building "click any step" is a different product
  decision; make it explicit.
- The staged delays are the whole choreography. Fire all three at once and it reads as a flash.
- `dots` is not a size, it is a variant that halves the marker and drops the numbers.
- Steps is **not** a MorphIndicator consumer — see §16.
- §3.4 grants Steps `gradient` on the active step only. Everything the source does beyond that
  (`bar`'s `box-shadow` glow on the fill, `arrow`'s `filter: brightness(1.12)` hover) is out.

---

## 10. Accordion (`vs-accordion` + 5 skins)

**States.** `is-open` per item, `:disabled` per header, `is-disabled` on the root; `multiple` (else
single-open); variants `separated` / `contained` / `line`; tones; sizes; radii.
Skins: `bounce`, `filled`, `ghost`, `glow`, `slide`.

**Structure shadcn lacks — structurally, not much; mechanically, one big thing.**
- **The collapse is `grid-template-rows: 0fr → 1fr`, with no JS measurement at all.** Every one of the
  six accordions does this. There is no `scrollHeight`, no inline `height`, no `transitionend`
  listener, no timeout fallback. The panel is a one-column grid whose row track animates; a
  `min-height: 0; overflow: hidden` clip child does the rest. Content that changes size while open just
  works.
- **The body has its own entrance**, decoupled from the collapse: `opacity 0 → 1` (300 ms),
  `blur(6px) → 0` (380 ms), `translateY(-8px) → 0` (520 ms) with a **60 ms delay**, so the text settles
  into a box that has already opened.
- **A cursor light on the header title** (`background-clip: text` radial keyed to `--mx`/`--my`) plus a
  `--lit`-driven `text-shadow`, and a full proximity glow layer on the item.
- `slide` replaces the chevron with a plus/minus whose vertical bar `scaleY(0)`s away; `filled` wipes a
  `scaleY` background; `ghost` frosts; `glow` spins a conic ring while open.

**Motion character.** Panel **600 ms `cubic-bezier(0.34, 1.8, 0.42, 1)`** (skins 560–620 ms; `bounce`
uses **2.2**). Chevron rotates 180° over **540 ms** on the same spring — noticeably slower than the
panel's *perceived* open, which is what makes the chevron feel like it is catching up. Header sinks
`scale(0.985)` on `:active` over 320 ms. Reduced motion sets the panel to `transition: none` (instant)
and keeps a 200 ms opacity fade on the body.

**Overshoot.** One site, and it is the important one: **`grid-template-rows` at a 1.8 control point
(2.2 in `bounce`)**. Overshooting `0fr → 1fr` means the panel briefly opens *taller than its content*
and settles back — a layout overshoot, on the exact mechanic §1 bans. The chevron rotation shares the
curve but is transform-only and safe.

**Would get wrong.**
- The base sets `aria-expanded` on the header button and **nothing else** — no `aria-controls`, no
  `role="region"`, no ids. Two skins (`filled`, `slide`) *do* wire `aria-controls` + `aria-labelledby`
  + `role="region"` properly, which shows it was known and skipped. bits-ui gives us all three.
- `multiple` is a root attribute that changes whether opening one closes another; the closing item's
  panel and the opening item's panel animate simultaneously, so the whole list's height moves in two
  directions at once. Test that case.
- `grid-template-rows: 0fr → 1fr` is genuinely better than the `scrollHeight` dance and we should
  copy the *mechanism* even though it is a layout animation — it is A16's carve-out exactly: the
  layout change is the thing being animated, not a decoration over one. Say so in the source file or a
  reviewer will read it as an `F11` violation.
- §3.4 grants Accordion `glow` on the **trigger**. The source puts the glow layer on the whole **item**,
  which lights up the open panel too. Scope it to the header.

---

## 11. Breadcrumb (`vs-breadcrumb` + 5 skins)

**States.** `is-current` · `is-disabled` on crumbs, `is-pressing`, root `is-disabled`; `separator`
(character or SVG), sizes, tones. `aria-current` on the last crumb.
Skins: `arrow`, `collapse`, `glow`, `pill`, `slash`.

**Structure shadcn lacks.**
- **`collapse`: an overflow strategy, but a count-based one.** With `max-visible` (default 3) it shows
  the first crumb plus the last `max-visible − 1`, hiding the rest behind an ellipsis pill that expands
  them **inline** (not into a dropdown), staggered at 40 ms per item. Three caveats: it measures
  nothing — no `ResizeObserver`, no width test, so a narrow container with four short crumbs still
  overflows; expansion is **one-way and latched**, with no way back to the collapsed state; and the
  hidden crumbs are `display: none`, not removed, so they are correctly out of the a11y tree. The last
  crumb is the only flexible item (`flex: 0 1 auto; min-width: 0; overflow: hidden`) so a long final
  segment truncates instead of pushing the trail out of the container.
- **A touch-target correction worth stealing verbatim.** The ellipsis pill is 9 px tall; the button box
  is padded out to a 24 px thumb floor and the padding pulled back with an equal negative margin, so
  the target is hittable without the pill inflating or the trail leaving its line.
- **The cursor light on the letters** again (`background-clip: text`), and it applies to the separators
  too, which brighten by proximity.
- **The 1820 ms water-drop text ripple** on click — third appearance, identical code.

**Motion character.** Almost nothing at rest. The signature is the press, and it is **both** declined
mechanics at once: `pointerdown` applies the A10 3D tilt — `perspective(420px)`, `rotateX ≤12°`,
`rotateY ≤9°`, `scale(0.93)`, same damping formula — over **120 ms `cubic-bezier(0.4, 0, 0.2, 1)`**,
and release springs back over **620 ms on the explicit `linear()` damped spring peaking at 1.15 at
~26 %** that A11 declined. `collapse`'s reveal is `translateX(-6px) scale(0.9)` → rest over **360 ms at
1.56**, transform and opacity only. `slash` grows a `scaleX` underline from the centre over 320 ms;
`glow` flickers text-shadow at **1600 ms infinite** on hover.

**Overshoot.** Two: the 620 ms `linear()` crumb spring (+15 %) and the collapse reveal (1.56). Both
transform-only. The crumb spring is the **third** occurrence of the exact mechanic A11 declined
(checkbox label, radio label, breadcrumb crumb).

**Would get wrong.**
- The last crumb is not a link. It carries `aria-current="page"`, `cursor: default`, full-strength
  colour and no hover. A port that renders it as a disabled link is wrong twice.
- `collapse` expands **in place**; it does not open a menu. shadcn-svelte's `BreadcrumbEllipsis` opens a
  dropdown. Both are defensible — but the in-place expansion needs the last-crumb truncation rule or it
  overflows the moment it expands.
- There is **no key handling at all** and no roving tabindex. Breadcrumbs are links, so native tab
  order is correct — do not add one. But `collapse`'s ellipsis is a real `<button aria-expanded>` and
  needs to stay one.
- §3.4 gives Breadcrumb `ghost` and nothing else. The cursor light, the drop ripple and the glow skin
  are all out.

---

## 12. Pagination (`vs-pagination` + 5 skins)

**States.** `current` / `page`, `total`, `sibling-count`, `is-edge` (first or last page), per-button
`disabled`, root `is-disabled`; `show-prev-next`, `show-edges`; sizes, shapes rounded/pill/squircle.
`role="navigation"`, `aria-current` on the active page.
Skins: `compact`, `dots`, `gooey`, `ink`, `segments`.

**Structure shadcn lacks.**
- **A carousel, not an ellipsis.** The window is exactly `siblingCount × 2 + 1` buttons wide; all page
  numbers live in one flex track that **translates** so the active page is centred, clamped at both
  ends (`max(minOffset, min(0, halfWindow - activeCentre))`). Numbers slide past a fixed window rather
  than being replaced by `…`. There is no ellipsis element anywhere.
- **The same indicator-window trick as Tabs**: the pill contains an inverted-colour copy of the whole
  number strip, counter-translated, so digits are revealed by the pill rather than recoloured.
- **`is-edge` reduces the overshoot.** At the first or last page the indicator's curve drops from
  `(0.34, 1.4, 0.64, 1)` to `(0.34, 1.12, 0.64, 1)` and the pop from +9.9 % to +3.5 %, with a comment:
  at the edges there are no more numbers behind, so a full overshoot reads as the pill jumping out of
  the control. A small, correct, easy-to-miss decision.
- `compact` is a **number reel**: the current page rolls up or down depending on direction, blurring
  through 7 px, and the reel's `width` springs when the digit count changes.
- `dots`, `segments` and `ink` are three different progress metaphors on the same state.

**Motion character.** Track **420 ms `(0.34, 1.4, 0.64, 1)`**; indicator the same on `transform` and
`width`; pop armed by double rAF. Nav arrows get the **3D press tilt** —
`perspective(420px) rotateX(≤9°) rotateY(≤7°) scale(0.9)` — the exact mechanic A10 declined, cleared
on `pointerup`/`pointerleave`/`pointercancel`. Ripples on arrows are **unclipped** (`overflow: visible`)
and scale to 1.7 over 720 ms. `ink` 560 ms, `gooey` 620 ms plus a `pgg-wobble` squash
(`1.05/0.96 → 0.98/1.02 → 1`), `dots` 520 ms at **1.8**, `segments` 560 ms.

**Overshoot.** Six sites, and **all but the wobble apply to `width`**: base indicator + mask (1.4 /
1.12 at edges), pop (+9.9 % / +3.5 %), `ink` (1.4-family), `gooey` (spring), `dots` (**1.8**),
`segments` (spring), `compact`'s reel width (1.56). The gooey wobble and the arrow press are
transform-only.

**Would get wrong.**
- **`sibling-count` sets the window width, not the ellipsis threshold.** `siblingCount=1` means three
  visible buttons, always three, regardless of `total`. Mapping it onto shadcn's ellipsis semantics
  produces a different component.
- The active page is centred *except* at the ends, where the track stops. Without the clamp the strip
  scrolls into empty space.
- **There is no keyboard handling whatsoever** — no arrows, no Home/End, no roving tabindex. Every page
  button is its own tab stop, so a 40-page control is 40 tab stops. This is the largest a11y gap in
  Phase 3 and it follows directly from the no-ellipsis design.
- `role="navigation"` needs an `aria-label`; the source sets one but a port that drops it leaves an
  unnamed landmark.
- `compact` is the only place in either phase that uses a `transitionend` listener with a timeout
  fallback (600 ms, filtered on `propertyName === "transform"`). That is the A13 lesson restated: any
  measured animation needs the fallback, or the reel can stick mid-roll.
- §3.4 gives Pagination `ghost` only. The `--lit` proximity light on the arrows, the `drop-shadow`
  filter driven from it, the cursor light on the digits and the gooey SVG filter are all out.

---

## 13. Sidebar (`vs-sidebar` + 6 skins)

**States.** `collapsed` (with `collapsible`), `flush` (edge-to-edge app-shell cut), `full` (fill the
given height), per-item `is-active` / `is-childactive`, submenu `is-open`, `is-disabled`, `dividers`,
`sub-dots`, `scrollbar`, `glow`. `role="menu"` / `role="menuitem"`, `aria-current`, `aria-expanded`,
`aria-pressed` on the collapse toggle, `<nav aria-label="Main navigation">`.
Skins: `classic`, `floating`, `glow`, `gradient`, `minimal`, `rail`.

**Structure shadcn lacks.**
- **A cursor-following hover highlight.** `.sb__hl` is a *single* element that translates and resizes to
  whatever item the pointer is over, cleared on `pointerleave`. It is **not** the selection indicator —
  the active item is marked by a static 3 px bar. Two separate affordances; shadcn has neither.
  Note the bar sits on the **right** edge, not the left.
- **A collapsed flyout, not just a tooltip, and two different implementations of it.** In `minimal`
  and `floating` it is pure CSS on `:hover` / `:focus-within`, so it is keyboard reachable for free. In
  the base it is a **separate custom element appended to `document.body`**, positioned `fixed` at
  `top: itemRect.top`, `left: itemRect.right + 10`, talking back through a composed
  `vs-flyout-select` event, with `transitionend` + 380 ms / 220 ms fallbacks on enter and leave.
  Clicking a parent while *expanded* toggles an inline submenu instead; the same click does two
  different things depending on collapse state. shadcn-svelte's collapsed sidebar gives you a tooltip
  and nothing more.
- **A dismissable-layer contract**: `pointerdown` at the document in the capture phase (through
  `composedPath()`, so clicks inside the flyout's own shadow tree count as inside) and `Escape` at the
  document close the flyout. Un-collapsing also closes it.
- **Collapsed items get a native `title` attribute** as the label fallback — removed when expanded.
- **Collapsed-only affordances**: when collapsed, the count badge and the "has updates" dot shrink onto
  the icon (`scale(0.4) → 1`), because the label that carried the count is gone.
- `flush` and `full` exist because a floating card with a radius on four sides is the wrong shape for a
  real app shell — a distinction worth keeping as two props.

**Motion character.** The rail collapses by animating **`width: 256px → 72px` over 460 ms
`cubic-bezier(0.34, 1.4, 0.6, 1)`** (glow: 420 ms ease-out; gradient: 460 ms at 1.8). The collapse
chevron rotates 180° over **480 ms at 1.56**. Labels cross-fade over 200 ms. Submenus are
`grid-template-rows: 0fr ↔ 1fr` with **asymmetric curves**: opening **560 ms
`cubic-bezier(0.34, 1.8, 0.5, 1)`** (overshoot), closing **500 ms `cubic-bezier(0.5, -0.6, 0.5, 1)`**
(anticipation — it pulls open a little before shutting). The submenu's inner content has its own
blur-and-lift entrance at 520 ms. The hover highlight is the calmest thing in the file: 260 ms plain
`--ease-out`, no spring. `rail`'s selection pill is 620 ms at 1.8 on `transform` and `height`.

**Overshoot.** Rail width (1.4 / 1.8), submenu open (1.8) and close (anticipation −0.6), chevron
(1.56), active item `padding-left` (1.56), badge `margin-right` (1.56), rail pill (1.8). **Four of
those seven are on layout properties.**

**Would get wrong.**
- The sliding highlight follows the **cursor**, not the selection. Wiring it to the active item
  produces a different component and loses the static active bar's job.
- `role="menu"` / `role="menuitem"` on a navigation list is questionable — menu semantics imply an
  application menu with arrow-key navigation, and the source only handles `Escape` and `Home`. shadcn
  uses a plain `<nav>` + list, which is right. Take shadcn's semantics.
- Collapsing does not just narrow the box: the header centres, the logo is `display: none`, labels and
  chevrons disappear, the active bar is removed, item padding resets, and submenus are hidden entirely
  in favour of the flyout. That is nine coupled rules, and it is why the width animation feels like
  more than a width animation.
- The collapse state is **not persisted** — no `localStorage`, no cookie, in any of the seven Phase 3
  components. shadcn's Sidebar persists via a cookie so SSR does not flash. Do not inherit this gap.
- `rail`'s pill has a detail worth keeping: **when collapsed, the pill's target falls back from the
  active *child* to its visible parent**, so it never tries to follow an element that is hidden. Any
  FLIP indicator over a collapsible tree needs the same fallback or it flies to `0,0`.
- §3.4 gives Sidebar `ghost` only. The border glow, the neighbour-light lamp, `glow`'s 2.6 s scanline
  and `gradient`'s 12 s drift are all out.

---

## 14. Timeline (`vs-timeline` + 5 skins)

**States.** Per item `--done` / `--ln-done` (the connector *above* it is complete) / tone
danger/warn/success / `--right` (in alternating mode) / `--now` / `--active`; root `align`
left/right/alternate, `line-style` solid/dashed, `progress`, `glow`, sizes.
Skins: `alternating`, `cards`, `compact`, `glow`, `gradient`.

**Structure shadcn lacks.** shadcn-svelte has no Timeline; everything here is new:
- **Two independent completion flags per item**: the dot's own `done` and the connector's `ln-done`.
  A gradient can therefore run *between* two dots and stop mid-segment.
- **The connector is a `::before` on the item**, positioned from the marker's centre to the next
  marker's centre with `calc`, `display: none` on the last child. Dashed is a repeating mask, not a
  `border-style`, so it keeps the rounded caps.
- **A completion check as a small badge overlapping the dot's upper-left**, separate from the dot's own
  icon — so a dot can carry a category icon *and* a done marker.
- **Alternating layout via a three-column grid** (`1fr var(--gut) 1fr`) with the marker in the middle
  and the content switching sides per item, plus a container query that collapses to single-column
  below 420 px.
- `gradient` adds a **rail head** — a puck that rides the fill's leading edge — and `compact` reveals
  the description only on hover.

**Motion character.** Items enter on mount, staggered by an inline `--d` of **`index × 60 ms`** (cards
70 ms, alternating a configurable 90 ms), with `tl-in 560 ms cubic-bezier(0.34, 1.56, 0.64, 1)`:
`translateY(14px) scale(0.86) blur(8px)` → **`scale(1.04)` at 60 %** → rest. `cards` uses 480 ms,
`alternating` 500 ms with a mirrored keyframe for right-side items. The done check pops
`scale(0 → 1)` over 360 ms at 1.56. Dot colour transitions are plain 200–300 ms eases. In the base
component **the connector does not animate its geometry at all** — it animates `background` over
300 ms, interpolating a gradient between the two adjacent items' colours.

**Overshoot.** Item entrance (+4 %) and the check pop, both transform-only. `gradient`'s rail fill and
head use plain `--ease-out`, no spring. Timeline is the least springy component in Phase 3.

**Would get wrong.**
- **The base Timeline is not a layout-animation offender** — only `gradient` and `alternating` are (see
  §17). The likely assumption that a timeline grows its line is wrong for the default.
- The connector belongs to the item *below* the gap it spans, and `ln-done` is a separate flag from
  `done`. Deriving the line's state from the dot's produces an off-by-one where the last completed
  segment never fills.
- **There is no scroll-reveal.** The `IntersectionObserver` in the file belongs to the glow lamp, not
  to entrance animation; `tl-in` fires unconditionally on render. Do not assume the entrance is tied
  to viewport entry.
- Mount-stagger delays must be capped (§4's `stagger` helper): `index × 60 ms` with no ceiling makes
  item 40 arrive 2.4 s late.
- **`progress` (1-based) overrides every item's own `done`.** Two sources of truth for the same
  visual state, and the root-level one silently wins. Pick one.
- Reduced motion sets `animation: none` on the items, which means they appear *instantly and
  correctly*. Copy that, not a shortened stagger.
- `done` strikes through the title and the description. That is a semantic decision (a done timeline
  entry is a completed task), not styling — check it is what we want before inheriting it.

---

# 15. Cross-cutting observations

**One indicator implementation, four components.** Tabs, Pagination, Sidebar-rail and (in skins) Tabs
`vertical` all run the same shape: an absolutely positioned element, `is-ready` to gate the first
paint so it appears rather than flies in from `0,0`, `is-pop` armed by a double rAF, a `ResizeObserver`
or `rAF` re-measure, and `transform` + `width` (or `height`) on one spring. Tabs and Pagination share
the *identical* window-mask refinement. **This is one primitive, and it is `MorphIndicator`.**

**The MorphIndicator compatibility answer.** Split three ways:

- **Sidebar — fully compatible, no caveats.** `.sb__hl` and `.seg__pill` are written with `left: 6px;
  right: 6px` or measured full-width, in a vertical list of uniform-height rows. Their `width`/`height`
  transitions are defensive; in practice only `translateY` changes. `orientation="vertical"` on our
  existing FLIP indicator is exactly right, and the 260 ms plain ease-out the source uses for the hover
  highlight is already in our range. Ship it as-is.
- **Steps — does not need it and should not get it.** There is no sliding indicator anywhere in Steps
  or its five skins. Progress is a per-segment `scaleX`/`scaleY` on the connector plus a
  `stroke-dashoffset` ring — already transform-only and already §1-clean. §4.9 lists Steps as a
  MorphIndicator consumer; **that should be corrected to Pagination**, which is the fourth real
  consumer.
- **Tabs and Pagination — compatible *as FLIP*, but only if two known casualties are handled.** The
  indicator genuinely changes width between tabs, so transform-only means `scaleX`, and two things ride
  along:
  1. **The window-mask reveal breaks.** The indicator is not an empty pill: it clips a counter-translated
     copy of the label/number strip. Under `scaleX` the copy stretches with it and the letters distort.
     Fixable — run a second `Element.animate()` on the inner strip with the inverse `scaleX` over the
     same duration and easing — but it must be designed in, not discovered. If we drop the reveal and
     just recolour the active label (which is what shadcn does), the problem disappears entirely and so
     does the effect. **Decide this before building Tabs.**
  2. **The border radius distorts.** A pill at `radius = height/2` scaled 2.5× on X becomes a lozenge.
     `border-radius` is paint, not layout, so animating it alongside is permitted by §1 — but it is an
     extra keyframe track and it must be added deliberately.
  `chrome` is the happy surprise: its stretch already *requires* two independently-curved edges, which
  is precisely `translateX` on one curve plus `scaleX` on another. Chrome is **more** natural under FLIP
  than under the CSS transition it explicitly refuses. Its shoulders are fixed-size pseudo-elements and
  would squash under `scaleX`, so they must become real counter-scaled children or move to the lip.

  Net: **the source's indicators depend on animating size, and the dependency is recoverable.** FLIP
  with a counter-scaled child reproduces every one of them except the pseudo-element shoulders.

**One press primitive, still copy-pasted.** Pagination's nav arrows carry the identical
`perspective(P) rotateX rotateY scale` formula from Phase 1 (`420/9/7/0.9`), and Accordion headers,
Chip, Tabs and Avatar all sink on `:active` with a flat scale (0.985 / 0.94 / 0.92 / 0.96). A10 already
chose the flat scale; Phase 2/3 confirms the source itself uses the flat version more often than the
tilt.

**One ripple emitter, still copy-pasted.** Alert (close button), Avatar, Chip, Rating, Steps, Tabs and
Pagination all compute `hypot(max(x, w−x), max(y, h−y)) × 2`, spawn at the pointer, remove on
`animationend`, and bail under reduced motion. Durations drift — 640 / 720 / 780 ms — with no visible
reason. One attachment, one token.

**The 1820 ms water-drop is a third-time pattern.** Checkbox label (Phase 1), Tabs and Breadcrumb all
clone their own text, paint a double expanding radial ring through `background-clip: text`, and run it
`0 → 150px` over 1820 ms on `(0.16, 1, 0.3, 1)`. It reads the element's `textContent`, so it silently
breaks for rich labels. Three occurrences means it is intentional, not an accident — and it is still
not an effect §3.4 grants to any of the three.

**The cursor light on text is a fourth-time pattern.** Tabs, Breadcrumb, Pagination and Accordion all
paint their label with a `background-clip: text` radial keyed to `--mx`/`--my`, so glyphs under the
pointer brighten. It is a **glow**, pointer-tracked, applied to four components §3.4 gives no glow to.
Declining it is one decision, not four.

**The "neighbour light" lamp system is undocumented in our spec at all.** Alert, Chip, Sidebar and (in
Phase 1) most controls paint `--lit-fill` and `--lit-ring` layers fed by a page-level engine that finds
other coloured elements nearby and throws *their* colour onto this one. It is a second, non-cursor
proximity system with its own variable so the two do not collide. §3.4 has no row for it, §3.1 no
entry. It is out — but it should be out *on the record*, because the CSS for it is in nearly every
shadow sheet and a reader of the source will assume it belongs.

**Reduced motion has three distinct correct answers here, and the source knows it.** (a) Transition to
none / opacity-only at ~120–200 ms — the default, used by Tooltip, Accordion, Tabs, Sidebar. (b)
**Slow the loop rather than stop it** — Spinner (2.4 s) and Skeleton (3 s), because a frozen loading
indicator asserts something false. (c) **Branch in JS before writing any inline style** — Tabs `chrome`
skips its spring sampling entirely and just sets the final transform and width. Our §3.2 chain covers
(a) and (c); **(b) needs to be added as an explicit exception for loading indicators.**

**Enter/exit asymmetry is not uniform, and one case inverts.** Steps reverses the *order* of its chain
rather than the timing. Sidebar's submenu uses anticipation to close and overshoot to open. Tooltip's
exit is *longer* than its enter. Alert's dismiss is 440 ms against a 300 ms fade. The house rule "exit
one step faster" holds for most of it but not all, and where it does not, the reason is always that the
exit is doing something other than reversing the enter.

**Candidate shared primitives, ranked.** (1) `MorphIndicator` — four real consumers (Tabs, Pagination,
Sidebar, and any segmented control), *not* Steps. (2) A `shimmer` group primitive with the
container-query sweep — Skeleton's single-light-across-the-group is the best idea in Phase 2 and it is
one `container-type` plus `cqw` mask sizing. (3) `collapse` on `grid-template-rows: 0fr↔1fr` — used by
Accordion (×6) and Sidebar submenus (×4); it needs no measurement, no `transitionend`, no fallback
timer, and it survives content resize. (4) `stagger` with a delay ceiling — Timeline, Breadcrumb
collapse, AvatarGroup grid, Select's option list. (5) The `ripple` attachment, already identified. (6)
A `statusBadge` shape for Avatar's morphing corner slot, if we want presence at all.

---

# 16. Layout-animation inventory

Every place these thirteen animate `width` · `height` · `padding` · `margin` · `top`/`left` ·
`gap` · `flex-grow` · `max-width` · `grid-template-rows`. §1 bans all of it. Each row is either
**decline**, **re-express as transform**, or **A16 carve-out** (the layout change *is* the animation).

| # | Component / skin | Property | Vuesax timing | Verdict |
|---|---|---|---|---|
| 1 | **Alert** (all 6) | `height` (JS-measured → 0), `padding`, `margin`, `border-width` | 440 ms `(0.5, -0.45, 0.55, 1)` — anticipation | Carve-out *or* decline. Use the `collapse` primitive or do not animate removal. |
| 2 | **Avatar** `.ava__status` | `width`, `height` | 560 ms `linear()` peaking **1.117** | Decline. Presence↔typing is a shape change; cross-fade two elements. |
| 3 | **Avatar** `.ava__count` | `width` | 460 ms `(0.34, 1.46, 0.44, 1)` | Decline. Digit-count changes are rare; let it snap. |
| 4 | **AvatarGroup** `grid` skin | `gap` (container), `margin` (items), staggered 22 ms | 420 ms `--ease-out` | Re-express: the base skin already does the identical fan with `translateX` — reuse that. |
| 5 | **Tooltip** content swap | `width`, `height` (inline, + 440 ms `setTimeout` cleanup) | 420 ms `(0.34, 1.46, 0.44, 1)` | Decline. Singleton travel is not ported (§5); per-instance tooltips have nothing to morph. |
| 6 | **Rating** `bars` skin | `height` of the fill | 240 ms `--ease-out` | Re-express: `scaleY` with `transform-origin: bottom`, or `clip-path` like every other rating skin. |
| 7 | **Steps** `pills` skin | `flex-grow`, `padding` | 460 ms `(0.34, 1.4, 0.64, 1)` / 300 ms | Decline. |
| 8 | **Steps** `pills` skin | `max-width: 0 → 240px` (label reveal) | 460 ms `(0.34, 1.4, 0.64, 1)` | Decline, or re-express as opacity + `translateX`. |
| 9 | **Steps** `bar` skin | `width` of the fill | 520 ms `--ease-out` | Re-express: `scaleX`, `transform-origin: left`. The base component already does exactly this. |
| 10 | **Tabs** base | indicator `width` + mask `width` | 420 ms `(0.34, 1.4, 0.64, 1)` | Re-express: FLIP `scaleX` + counter-scaled inner strip (§15). |
| 11 | **Tabs** `chrome` | sled `width`, per-keyframe px, WAAPI | two sampled springs, `easing: linear` | Re-express: `translateX` on the leading spring, `scaleX` on the trailing. Naturally FLIP-shaped. |
| 12 | **Tabs** `gooey` | indicator `width` | 460 ms `(0.5, 1.5, 0.5, 1)` | Re-express as `scaleX`; the stretch is the point and `scaleX` gives it for free. |
| 13 | **Tabs** `neon` | bar `width` | 420 ms `(0.34, 1.4, 0.64, 1)` | Re-express (`scaleX`; a 2 px bar has no radius to distort). |
| 14 | **Tabs** `vertical` | rail + fill `height` | 420 ms `(0.34, 1.4, 0.64, 1)` | Re-express: `scaleY` / FLIP `orientation="vertical"`. |
| 15 | **Accordion** base + `slide`/`filled`/`ghost`/`glow` | `grid-template-rows: 0fr → 1fr` | 560–600 ms `(0.34, 1.8, 0.42, 1)` | **A16 carve-out** — port the mechanism, drop the overshoot (see §16 note). |
| 16 | **Accordion** `bounce` | `grid-template-rows` | 620 ms `(0.2, 2.2, 0.35, 1)` | Carve-out for the mechanism; **decline the 2.2 curve outright**. |
| 17 | **Pagination** base | indicator `width` + mask `width` | 420 ms `(0.34, 1.4, 0.64, 1)`; edges `(0.34, 1.12, 0.64, 1)` | Re-express: same FLIP as Tabs. |
| 18 | **Pagination** `ink` / `gooey` / `segments` | indicator or segment `width` | 560 / 620 / 560 ms, springs | Re-express as `scaleX`. |
| 19 | **Pagination** `dots` | active dot `width: dot → pill` | 520 ms `(0.34, 1.8, 0.5, 1)` | Re-express as `scaleX` on a pill-shaped dot, or decline the growth and use opacity. |
| 20 | **Pagination** `compact` | reel `width` (digit-count change) | 380 ms `--ease-spring` | Decline; `font-variant-numeric: tabular-nums` plus a fixed `ch` width removes the need. |
| 21 | **Sidebar** (all 6) | rail `width: 256px → 72px` | 460 ms `(0.34, 1.4, 0.6, 1)`; glow 420 ms ease; gradient 460 ms at 1.8 | **A16 carve-out** — the collapse *is* the layout change. Drop the overshoot; a bouncing app shell is the "slow and drunk" case §2 names. |
| 22 | **Sidebar** `.sb__item` | `padding-left` on active | 340 ms `(0.34, 1.56, 0.64, 1)` | Decline. Indent by `translateX` on the content or not at all. |
| 23 | **Sidebar** `.sb__badge` | `margin-right` on active | 340 ms `(0.34, 1.56, 0.64, 1)` | Decline. |
| 24 | **Sidebar** `.sb__hl` | `width`, `height` | 260 ms `--ease-out` | Re-express: MorphIndicator FLIP; in a uniform list both are constant anyway. |
| 25 | **Sidebar** `rail` `.seg__pill` | `height` | 620 ms `(0.34, 1.8, 0.5, 1)` | Re-express: FLIP vertical. |
| 26 | **Sidebar** submenus (base, `rail`, `glow`, `gradient`) | `grid-template-rows: 0fr → 1fr` | open 560 ms `(0.34, 1.8, 0.5, 1)`; close 500 ms `(0.5, -0.6, 0.5, 1)` | **A16 carve-out** for the mechanism; decline both the overshoot and the anticipation. |
| 27 | **Timeline** `gradient` | rail fill `height`; head puck `margin-top` | 620 ms `--ease-out` (both) | Re-express: `scaleY` from the top for the fill, `translateY` for the puck. |
| 28 | **Timeline** `alternating` | spine fill `height` | 480 ms `--ease-out` | Re-express: `scaleY`, `transform-origin: top`. |

**Clean — no layout animation anywhere in the component or its skins:** Chip, Spinner, Skeleton,
Breadcrumb (the collapse reveal is `translateX` + opacity), Timeline base, Tabs `bubble` (fixed 8 px
dot) and `card`.

**Note on the two carve-outs.** `grid-template-rows: 0fr ↔ 1fr` and the sidebar rail width are both
cases where the layout change is the animation, exactly like the floating label in A16. They pass, but
`check-layout-safety` polices the effect layer only, so — as A16 instructs — say so *in the source
file* where it appears, or a reviewer reads it as an `F11` violation. In both cases the **overshoot on
the layout property is separately declined**: `0fr → 1fr` overshooting means the panel opens taller
than its content and settles back, and a rail that overshoots its collapsed width shoves the page
content twice.

---

# 17. Effects inventory against §3.4

For each component, the decorative effects the source applies that our capability matrix does **not**
grant it. `press` and `ripple` are omitted — press is always-on per §3.1.

| Component | §3.4 grants | Source applies beyond it |
|---|---|---|
| **Alert** | ghost, gradient, glow (danger/warn), shimmer (once on mount) | Proximity **glow on any tone**, not just danger/warn. **Neighbour-light lamp** (`--lit-fill` / `--lit-ring`) — not in the matrix at all. `neon`: 4.4 s conic ring + 3.4 s bloom breathe, both infinite → §3.5 idle-loop violation; `text-shadow` and `drop-shadow` on the icon. `inline`: 1.8 s dot pulse, infinite. `toast`: 480 ms spring enter (transform, allowed as motion, not as an effect). |
| **Avatar** | gradient (fallback bg), glow (presence), shimmer (loading), tilt (≥ lg) | `story` ring **6 s conic spin, infinite** — decorative, not loading. `live` ring **1.8 s pulse, infinite**. `glow` skin **3 s box-shadow breathe, infinite**. `ring` skin 5 s spin (0.9 s on hover). `squircle` skin hover `scale(1.12) rotate(-2°)` on a 520 ms `linear()` spring — a hover transform with no matrix row. `tilt` skin uses `perspective: 340px` against our 800 px token. |
| **AvatarGroup** | gradient, shimmer (loading) | **`translateZ(38px)` through a container `perspective: 620px`** on the hovered item — a tilt-family effect, not granted, and it creates a containing block for any anchored popover. `ring` skin 3.4 s conic spin, infinite. `wave` skin 1.1 s bob loop on hover. `fan` 460 ms rotation, `flip` 560 ms `rotateY`. |
| **Chip** | ghost, gradient | **Proximity glow** (`.chip__glow`, opt-in) — forbidden. **Neighbour-light lamp** — forbidden. `glow` skin **1.9 s pulse while selected, infinite**. `outline` skin conic ring spin 2.4 s / 1.6 s, infinite. `gradient` skin **animated** gradient pan 5 s / 3 s — gradient is granted, animating it is a loop. |
| **Spinner** | *(no row — it is a loading indicator)* | Nothing decorative. `overlay` adds `backdrop-filter: blur(2px)`, which is a surface treatment; call it out but it is functional. |
| **Tooltip** | **nothing** | `blur(8px)` on enter/exit — **this is `blurFade`, a §4 transition primitive, not an effect; keep it.** Everything else goes: `backdrop-filter: blur(12px)` (`fluent`) and `blur(16px) saturate(160%)` (`glass`); the arrow's +30 % overshoot pop; the content-swap blur morph; the whole `glow` skin (settled box-shadow halo + a 620 ms `vstg-flare`). |
| **Rating** | *(no row)* | `glow` skin **2.4 s halo pulse on lit stars, infinite** + `drop-shadow` on the fill. `hearts` 620 ms expanding aura. `emoji` `filter: grayscale` on unselected. Hover lift (`translateY(-2px)`, `scale(1.08)`) on every skin — a sixth transform beyond the mark pop. |
| **Skeleton** | shimmer | **Nothing.** The only fully compliant component in either phase. |
| **Tabs** | ghost | **Cursor light on the letters** (pointer-tracked `background-clip: text` radial) — a glow. The **1820 ms water-drop** text ripple. `neon` 3 s indicator sweep, infinite, plus `text-shadow` on tabs. `gooey` SVG `feGaussianBlur` + `feColorMatrix` filter (§5 permits it as a variant but it must degrade to `chrome` under reduced motion and must not be default). `chrome` masked shoulders (structure, not effect). |
| **Steps** | gradient (active step only) | `bar` skin `box-shadow: 0 0 10px accent` on the fill — a static glow. `arrow`/`circular` `filter: brightness(1.12–1.15)` on hover. `box-shadow: 0 0 0 4px ring/0.16` rings on active markers in `bar` / `timeline` — a focus-ring-shaped decoration that §3.5 forbids competing with the real ring. The marker's `blur(8px) → 0` is transition motion, keep it. |
| **Accordion** | ghost, gradient (header only), glow (**trigger**) | Glow layer is on the **whole item**, so it lights the open panel — scope it to the header. `--lit`-driven `text-shadow` on the title, plus the cursor light. `glow` skin conic ring **3.2 s spin while open, infinite**. `ghost` skin `backdrop-filter` frost. |
| **Breadcrumb** | ghost | Cursor light on crumbs **and separators**. The 1820 ms water-drop. `glow` skin **1600 ms flicker, infinite**, on hover. `arrow`/`pill` hover `transform` lifts. |
| **Pagination** | ghost | `--lit` proximity light on the nav arrows, driving a `drop-shadow` filter on the SVG. Cursor light on the digits. **3D press tilt** (`perspective(420px)`) — declined by A10. Unclipped ripples that bloom past the button. `gooey` SVG goo filter. `dots` `box-shadow: 0 0 10px` on the active dot. |
| **Sidebar** | ghost | Border **proximity glow** (opt-in `glow` attr) + **neighbour-light lamp**. `glow` skin **2.6 s scanline, infinite**. `gradient` skin **12 s background drift, infinite**. `floating` skin `box-shadow` transitions on tiles. |
| **Timeline** | *(no row)* | **Per-dot proximity glow** (`.tl__dot::after` driven by `--glow`) — the `glow` attribute is on the base component. `glow` skin **1800 ms dot pulse, infinite**. `gradient` skin **2600 ms rail sheen + 2200 ms head breathe + 1600 ms spin on the "now" dot**, all infinite. |

**The recurring shapes.** Three families account for nearly every row: (a) a **conic-gradient ring
spinning on an infinite loop** — Alert `neon`, Avatar `story`/`ring`, AvatarGroup `ring`, Chip
`outline`, Accordion `glow`, Timeline `gradient`; (b) a **breathing halo or pulse on a resting state** —
Alert `inline`, Avatar `live`/`glow`, Chip `glow`, Rating `glow`, Sidebar `glow`, Timeline `glow`; (c)
the **cursor light on text**, in four navigation components. Declining them is three decisions, not
eighteen, and (a) and (b) are the same §3.5 rule: an idle loop is loading, or it is a migraine.
