# Vuesax design-intent digest — Phase 2 feedback/display, Phase 3 navigation/structure

Sequel to `VUESAX-INTENT.md`. Read from `/home/node/repos/resax/references/<component>/css/shadow/*.css`
and `web-component/*.js` (ground truth). Prose only, no code ported.

**Scope note.** Per SPEC §9 **A9**, every height, padding, radius, font size and palette value below is
*ignored*. Sizes and colours come from shadcn-svelte's Tailwind scale. Every duration and easing quoted
here is **vuesax's own number, given only as a calibration data point** — our scale is
80 / 120 / 180 / 240 ms with `--ease-out` / `--ease-in` / `--ease-spring`. **A10–A16** already settle
press (flat scale), overshoot (two mechanics) and layout animation (banned); this document's job is to
put every remaining case on the table so it can be declined explicitly rather than by omission.

Source coverage: all thirteen located, five skins each (Spinner ten; Sidebar and Tabs six). Two minor
gaps: Accordion imports a shared `vs-fx.*.js` effects module that was **not** captured in the archive
(`FX_CSS` and `pressRipple` are referenced but unreadable), and the compiled Vue islands were consulted
only to confirm variant names.

---

# Part A — Phase 2

## 1. Alert (`vs-alert` + 5 skins)

**States.** Tones `default` · `danger` · `warn` · `success` (`split` adds `purple`); variants `soft` /
`solid` / `outline`; `is-disabled`, `is-closing`. Banner and toast add an **auto-dismiss countdown**
that pauses on hover. No `loading`. Skins: `banner`, `inline`, `neon`, `split`, `toast`.

**Structure shadcn lacks.**
- **Tone-driven icons baked in** — three SVG sets, picked by tone (danger/warn share a triangle), not a
  slot with a default. All three stay mounted and are toggled by `display`.
- **Auto-dismiss with a visible countdown** (banner and toast only; the base has no timer). One
  `duration` attribute drives both the `setTimeout` and the bar's `animationDuration`, so bar and timer
  cannot drift, and `animation-play-state: paused` on hover stops the clock while you read.
- **Actions row** under the message (hidden via `slotchange` when empty), and a split layout with a
  coloured icon rail as its own column.
- **A "neighbour light" system**: two extra layers (`--lit-fill`, `--lit-ring`) fed by a page-level
  engine that finds *other* coloured elements within 110 px and throws their colour onto this one.
  Distinct from the cursor glow, with its own variable so the two never collide. No §3.4 row exists
  for it at all.

**Motion character.** Nearly static at rest (border/background 200 ms). Everything happens on
dismissal, and dismissal is a **height collapse with anticipation**: JS measures the height, pins it
inline, forces a reflow, then in a `rAF` sets `height: 0` and waits for `transitionend` on `height`.
The curve is **440 ms `cubic-bezier(0.5, -0.45, 0.55, 1)`** — the negative first control point makes
the box grow *taller* for a beat before collapsing. Padding, margin and border-width ride the same
curve; opacity leaves in 300 ms and `blur(6px)` in 340 ms, so it is ghost-like before it is short.
Toast enters the other way: `translateY(14px) scale(0.97) blur(6px)` → rest over **480 ms** on the
spring, armed after a double rAF.

**Overshoot.** Three sites. The dismiss curve is *anticipation* — overshoot's mirror image — applied to
`height`, `padding`, `margin` and `transform` together; banned by §1 on the first three. Toast enter
uses `--spring` on `transform` (480 ms). `neon` runs a 4.4 s conic ring and a 3.4 s bloom breathe, both
`infinite` — idle loops on a non-loading state, which §3.5 forbids.

**Would get wrong.**
- The base sets **`role="alert"` unconditionally**. An assertive live region announcing "Your draft was
  saved" interrupts a screen-reader user mid-sentence. The `toast` skin gets it right with
  `role="status"`. Ours should be `status` unless the tone is `danger`.
- **Dismiss hides, it does not remove** — `style.display = "none"` plus a `dismiss` event, and it
  cannot be re-shown. Ours wants `onDismiss` and consumer-owned state.
- Banner re-arms its timer on attribute change; toast arms it only on connect, so changing `duration`
  on a live toast silently does nothing. Do not inherit the asymmetry.
- The countdown pausing on hover is real usability, not decoration — keep it, and add the keyboard
  equivalent (`:focus-within`) the source lacks.
- The dismiss animation is the component's whole personality and it is **entirely layout**. Re-expressed
  as `scaleY` it is a different effect: following content stays put until unmount. Choose the `collapse`
  primitive (which has A16's carve-out) or choose not to animate removal — do not drift into it.

---

## 2. Avatar + AvatarGroup (`vs-avatar`, `vs-avatar-group` + 5 skins each)

**States.** Avatar: presence `online` · `idle` · `dnd` · `offline`; activity `typing` · `call` ·
`video` · `streaming`; ring `story` · `seen` · `live`; plus `progress` (with an optional percent pill),
`count`, `bordered`, `interactive`, `glow`; shapes circle/rounded/squircle; sizes xs–xl. Group: `max`
(overflow `+N`), `overlap` sm/md/lg, `spread`, `is-open`.

**Structure shadcn lacks.**
- **One corner slot, five shapes.** A single node morphs between a presence dot, a round activity
  badge, and a wide short "typing" capsule. `idle` is a crescent cut by an offset disc in the page
  background colour; `dnd` a bar; `typing` three bouncing dots.
- **A circular progress ring** (`stroke-dashoffset`, `role="progressbar"` with live `aria-valuenow`)
  with a percent pill on the bottom edge, plus a separate **story/live ring** behind the face.
- **A three-stage image fallback**: `<img>` → initials → silhouette placeholder, driven by a one-shot
  failure flag **reset whenever `src` changes**, with an `error` event; `disconnectedCallback` strips
  `src` to cancel in-flight loads.
- **Deterministic identity**: hue is `(hash × 31 + charCode) % 360` over the name; initials are the
  first two characters of a single word, else first-of-first + first-of-last; the count caps at `99+`
  and publishes `--digits`.
- **A `+N` chip that is also a real popover anchor.** It portals a panel (a detached `<div>` with its
  own shadow root on `document.body`) holding a `role="menu"` list with its own sliding hover highlight:
  flips above on bottom overflow, right-aligns on right overflow, clamps to an 8 px viewport pad,
  publishes the anchor offset as `--ox`/`--oy`, dismisses via `composedPath()`, and on `Escape`
  **refocuses the trigger**. **None of the five group skins do any of this** — their `+N` is inert.
- **Group spread on hover**: items translate by `index × size × 0.16` and lift 2 px; the hovered one
  lifts 5 px and comes forward `translateZ(38px)` through a container `perspective: 620px`. Overlap
  itself is a static negative margin — only the spread animates.

**Motion character.** The avatar moves on one curve, `transform 240 ms cubic-bezier(0.34, 1.56, 0.64, 1)`.
Press is the **3D tilt A10 declined** — `perspective(320px)`, `rotateX ≤14°`, `rotateY ≤10°`,
`scale(0.94)`, same `1 − 0.2 × min(|nx|,|ny|)` damping as Phase 1 — plus one ripple clipped to the face
(**720 ms `(0.22, 1, 0.36, 1)`**, 0.85 → 0). The status capsule resizes over **560 ms on an explicit
`linear()` spring peaking at 1.117 at ~22 %** with `border-radius` on a plain 300 ms ease underneath, so
the shape settles before the size. Typing dots run 1.1 s on −0.22 s / −0.11 s delays. Story ring: conic
gradient spun through a registered `--ava-angle` at **6 s linear infinite**; live ring pulses at 1.8 s.
Group fan-out: **460 ms `cubic-bezier(0.34, 1.8, 0.5, 1)`** — the loudest overshoot in either phase.
`fan` rotates at 1.56/460 ms; `flip` is a 560 ms `rotateY(180deg)` at 1.4; `ring` spins at 3.4 s (0.9 s
on hover); `wave` bobs on a 1.1 s loop delayed `index × 110 ms`; `grid` re-lays out stack → grid.

**Overshoot.** Five: base transform (1.56); the status capsule's `linear()` spring at **+11.7 % on
`width`/`height`**; the count badge's `width` at **460 ms `(0.34, 1.46, 0.44, 1)`**; the group fan at
**1.8**; `squircle`'s hover `scale(1.12) rotate(-2°)` on its own 520 ms `linear()` spring. Only the base
transform and the fan are transform-only.

**Would get wrong.**
- **Presence and activity share one slot.** `typing` *replaces* the dot; it does not sit beside it. Two
  badges renders a state the design never has.
- The `+N` chip is `aria-haspopup="menu"` — the overflow is navigable, not a decorative count. shadcn's
  AvatarGroup has no such affordance and consumers assume the number is inert.
- `translateZ` on the hovered item makes the group a 3D context, so any tooltip or popover anchored to
  an avatar inside it mis-positions — the exact hazard A10 cites. Keep the spread 2D.
- The status dot is punched out with `box-shadow: 0 0 0 2px var(--bg-card)`, so it breaks on any
  non-default surface. Expose the token.
- The story ring animates a registered custom property; without `@property` it does not interpolate at
  all, and `@property` inside a shadow stylesheet never registers (the neon alert's own comment says
  so). Our light-DOM setup works — do not assume theirs did.

---

## 3. Chip (`vs-chip` + 5 skins)

**States.** `is-selected` · `is-clickable` · `is-disabled`; variants `soft`/`solid`/`outline`; tones
default/danger/warn/success; sizes sm/md/lg; `removable`, `dot`, `avatar`, `check`; `selectable` gates
toggling. Skins: `bounce`, `fill`, `glow`, `gradient`, `outline`.

**Structure shadcn lacks.**
- **Selection is a state orthogonal to the variant.** `is-selected` overrides all three variants with a
  full-strength tone fill, and there is an explicit rule keeping that fill on hover — with a comment
  explaining that without it the soft-variant hover rule reverts the background to a translucent tint
  while the foreground stays `solid-fg`, killing contrast. Exactly the kind of interaction a naive
  `tv()` port loses.
- **A leading slot with three mutually exclusive occupants** — dot, avatar, or check — and the dot
  recolours to `currentColor` when selected so it reads against the fill. Avatar presence is detected
  by a **light-DOM `querySelector('[slot="avatar"]')`** plus `slotchange`, and it suppresses the dot.
- **A remove button with its own ripple layer** and its own press scale (0.9 against the chip's 0.95).
- The root **is a `<button>` in every case**: with `selectable` it gets `type="button"` and
  `aria-pressed`; without, it keeps the button element but is pushed out of the tab order with
  `tabindex="-1"`.

**Motion character.** Base: `transform 240 ms (0.34, 1.56, 0.64, 1)` plus 200 ms colour, ripple at
**780 ms `(0.22, 1, 0.36, 1)`**. Each skin commits to one idea: `fill` slides a `scaleX(0 → 1)`
background from the left over **340 ms ease-out** on hover *and* select — the only skin whose selection
is a directional wipe; `bounce` runs a five-stop squash-stretch (`0.9,1.05 → 1.12,0.9 → 0.96,1.04 →
1.03,0.98 → 1`) over **520 ms** and pops the check at **420 ms peaking 1.35**; `gradient` pans at
**5 s linear infinite** (3 s selected); `outline` spins a conic ring at 2.4 s (1.6 s selected); `glow`
pulses a box-shadow at 1.9 s while selected.

**Overshoot.** Base transform (1.56), bounce squash (+12 % X, −10 % Y), check pop (+35 %) — all
transform-only. The three loop skins are not overshoot but are idle loops on a *selected* state, which
§3.5 forbids outright.

**Would get wrong.**
- **Selected ≠ solid variant.** Two axes that compose; mapping one onto the other makes "an outline chip
  that is selected" inexpressible.
- The remove button sits inside the clickable chip — without `stopPropagation`, removing also toggles.
- Hover styling is gated on `.is-clickable`; a decorative chip must not light up. shadcn's Badge has no
  such gate and people paste `hover:` classes onto static badges.
- A non-selectable chip is a `<button tabindex="-1">` — an interactive element deliberately removed from
  the tab order. Render a `<span>`; do not inherit the hack.
- The `fill` skin uses `selected` + `value` where every other skin uses `model-value`. Note it as a
  symptom of six parallel implementations, not as a feature.

---

## 4. Spinner (`vs-spinner` + 10 skins)

**States.** Not stateful. Axes: `size` sm/md/lg/xl, `speed` slow/normal/fast, `thickness`, `tone`,
`track`, `label`, and **`overlay`** — which makes the host `position: absolute; inset: 0` with a
`backdrop-filter: blur(2px)` scrim over its parent. Skins: `arc` (base), `dual`, `gradient`, `bars`,
`bounce`, `comet`, `dots`, `flip`, `grid`, `orbit`, `pulse`, `ring`, `wave`.

**Structure shadcn lacks.**
- **Speed as a first-class prop**, one `--dur` every keyframe reads — and each skin defines its own
  slow/normal/fast triple (1.4/0.9/0.55 for the arc, 1.5/1.1/0.75 for waves), because a 3-dot bounce and
  a conic sweep do not read as the same speed at the same duration.
- **The overlay mode**, a container-scoped loading scrim without a second component.
- **Correct live-region wiring**: root is `role="status"` **and** `aria-live="polite"` with
  `aria-label = label || "Loading"`, glyph box `aria-hidden` — it announces once and never announces its
  own geometry.
- The `gradient` skin builds the ring as a conic gradient **masked to the stroke thickness** with
  `radial-gradient(farthest-side, …)`, so the tail fades. A border-based arc cannot do this.

**Motion character.** Everything is `transform` or `opacity` on an infinite loop; **not one layout
animation in ten skins.** Base arc: `rotate(360deg)` **900 ms linear**. `dual` stacks two arcs, one
linear and one on `(0.65, 0.1, 0.35, 0.9)` at 0.5 opacity, so they beat against each other. `bars`
scales Y 0.35 → 1 over 1 s with **deliberately non-monotonic delays** (0, 0.18, 0.36, **0.12**) so the
equaliser does not read as a wave. The rest stagger N children on negative delays from `--i`.

**Overshoot.** None anywhere. Ten skins, zero springs. Loading is the one place vuesax is disciplined.

**Would get wrong.**
- **Reduced motion does not stop the spinner — it slows it to 2.4 s** (Skeleton: 3 s), uniformly across
  every skin. That is a deliberate correction to our §3.2 rule "loops stop": a frozen spinner asserts
  something false about the system. Spinner and Skeleton need a documented exception.
- `overlay` requires the parent to be `position: relative` and inherits its radius. Ship it with that
  contract stated or people get a full-viewport scrim.
- The base ships **two** ring implementations (bordered arc and masked conic) rather than one
  parameterised. §5 collapses ten skins to a `variant` enum: use the conic mask wherever the tail must
  fade, the border wherever the arc must be hard-edged.

---

## 5. Tooltip (`vs-tooltip` + 5 skins)

**States.** `is-visible` · `is-entering` · `is-exiting` · `is-swapping`; placements top/bottom/left/
right; variants `solid` / `fluent` / `outline` / `glass`; `delay` (default **120 ms**), `hide-delay`
(**90 ms**), `offset` (10 px). Skins: `blur`, `fade`, `glow`, `scale`, `slide`.

**Structure shadcn lacks.**
- **One singleton tooltip element for the whole page**, appended to `document.body` on the first
  connect, reference-counted, torn down (with all five timers) when the last instance disconnects.
- **Therefore: a warm state.** If a tooltip is already open the next trigger's delay is **0 ms** and
  there is no exit/enter at all — the shared host *travels* to the new anchor and morphs its content.
  This is the most distinctive behaviour in Phase 2, and shadcn/bits-ui reaches the same idea by a
  different route (`delayDuration` + `skipDelayDuration` on a provider). Worth knowing they agree.
- **`aria-describedby` is moved, not held** — the new owner takes the host's id, the old one drops it.
  The description exists only while visible.
- **Flip and nudge, hand-rolled.** It tests all four sides, uses the requested one if it fits, the
  opposite if that fits, else keeps the requested one. Then, for top/bottom only, it nudges x to hold an
  8 px viewport margin and gives the arrow an equal **negative `margin-left`** so the arrow stays on the
  trigger while the box slides. Position is one `transform: translate(px,px) translate(%,%)` with
  per-side percentage anchors — no `top`/`left`. **The five skins have none of this**: self-contained,
  CSS-positioned, never measuring the viewport.
- Rich content: `<b>`, `<strong>` and a styled `<kbd>`.

**Motion character.** Enter is a pop: `vstip-pop` **320 ms `(0.34, 1.46, 0.44, 1)`**, `scale 0.7 → 1.04
→ 1` with `blur(8px) → 0` and a directional 8 px translate keyed off the placement's origin. Exit is
*slower and anticipatory*: **360 ms `cubic-bezier(0.36, 0, 0.66, -0.36)`**, scaling **up to 1.05 at
30 %** before collapsing to 0.6 with the blur back on. The arrow has its own pop, **420 ms scale
0 → 1.3 → 0.92 → 1**. Travel: the host translates over **420 ms `(0.34, 1.46, 0.44, 1)`** while the box
transitions `width`/`height` on the same curve (inline styles, cleaned up by a 440 ms timeout) and the
content plays `vstip-swap` (400 ms, blurring to 5 px and dipping to 0.3 opacity at 40 %, overshooting to
1.03 at 70 %). All three land together.

**Overshoot.** Four: enter pop (+4 %), exit anticipation (+5 % then undershoot to 0.6), arrow pop
(+30 %), content swap (+3 %) — and the 1.46 travel curve applies simultaneously to `transform` **and
`width`/`height`**, i.e. to layout.

**Would get wrong.**
- **Exit is slower than enter** (360 vs 320 ms), inverting our "exit one step faster" rule and Phase 1's
  own finding. It works only because the exit *recedes* (scale down + blur) rather than waits. At
  120/180 ms, do not copy the inversion.
- **No key handling at all** — show/hide is `mouseenter`/`mouseleave`/`focusin`/`focusout`. WAI-ARIA
  requires `Escape` to dismiss; bits-ui has it, the source does not.
- The trigger wrapper gets `tabIndex = 0` unconditionally: correct for an icon-only anchor, wrong for a
  wrapped button (two tab stops).
- The singleton means only one tooltip can ever be open — which is correct, and is also why
  `aria-describedby` cannot be persistent. bits-ui gives per-instance content with a shared delay timer,
  strictly better. Do not port the singleton.
- **§3.4 gives Tooltip nothing at all.** The source reaches for a decorative effect four times (§17).
  The nuance to state in the port: `blur(8px)` on enter/exit is **not** an effect, it is the `blurFade`
  transition primitive §4 already sanctions. `backdrop-filter` on glass/fluent **is** a surface
  treatment and is out.

---

## 6. Rating (`vs-rating` + 5 skins)

**States.** `value` (fractional when `allow-half`), `max`, `readonly`, `disabled`, per-item `is-pop` /
`is-lit` / `is-on`; a **hover-preview value distinct from the committed one**; tones; icons `star` /
`heart` / `circle`; `show-value`. **All five skins add `clearable` — clicking the current value sets it
to 0 — and the base does not.** "Rated 3" vs. "not rated" is a real state; it belongs on the component
once. Skins: `bars`, `emoji`, `glow`, `hearts`, `numbers`.

**Structure shadcn lacks** (shadcn-svelte has no Rating at all):
- **`role="slider"` on the wrapper with a single tab stop**, `aria-valuenow`/`valuemin`/`valuemax`,
  `aria-readonly`, `aria-disabled`, `aria-label = "Rating: 3.5 of 5"`. Not five buttons in a row.
- **Half values by geometry, not markup.** Each item is one icon; the fill is
  `clip-path: inset(0 calc((1 - var(--fill)) * 100%) 0 0)` and hit-testing is
  `clientX - rect.left < rect.width/2 ? 0.5 : 1`. Arbitrary fractions render for free — useful for a
  3.7 average.
- **A hover preview with its own `hover` event**, cleared on `pointerleave`, that never touches
  `aria-valuenow`.
- **The outline thickens with fill**: `stroke-width: calc(0.8 + var(--p) * 0.7)` with a matching alpha
  ramp, so a partially filled star does not look broken.

**Motion character.** Fill moves as a `clip-path` transition, **200 ms `--ease-out`**, so dragging across
the row sweeps rather than steps. Selection fires `is-pop`: **420 ms `(0.34, 1.56, 0.64, 1)`,
`scale 0.82 → 1.22 → 0.94 → 1`** — a sink *then* a bounce, with an explicit undershoot at 70 %. Ripple
per item at 640 ms, pool capped at 3. Skins escalate: `hearts` **620 ms double beat**
(1 → 1.28 → 0.94 → 1.16 → 1) plus an expanding aura; `emoji` **560 ms with rotation** (0.7/−8° → 1.3/6°
→ 0.92/−2° → 1.04); `numbers` flips 360° on Y over 520 ms; `bars` rises 480 ms with a `scaleY` squash;
`glow` flashes to 1.32 and **pulses lit stars at 2.4 s infinite**.

**Overshoot.** Every skin, transform-only: 1.22 base, 1.28/1.16 hearts, 1.30 emoji, 1.32 glow, 1.35
numbers. The star filling *is* the mark, so one pop at our scale is defensible under the toggle-mark
allowance. The hover lift (`translateY(-2px)` / `scale(1.08)`) is a sixth transform and is not a mark —
drop it or fold it into press.

**Would get wrong.**
- **One tab stop, arrows change the value.** Left/Down decrement, Right/Up increment, **Home → 0** (not
  1), **End → max**, step **0.5 when `allow-half`, else 1**. Five focusable buttons is the classic
  mistake and it makes the control unusable.
- The source half-commits that mistake: `role="slider"` and the tab stop live on the wrapper, but each
  star is still a `<button aria-label="3 of 5">`. A slider containing buttons is invalid — pick the
  slider and make the stars `aria-hidden` spans.
- Hover preview must not commit: the fill follows the pointer, `aria-valuenow` does not.
- `readonly` keeps full opacity and keeps the value announced; `disabled` dims and sets
  `aria-disabled`. Both stop interaction, differently.
- `allow-half` changes the hit test, the keyboard step *and* the value formatting together.
- The `bars` skin animates the fill's `height`; every other skin uses `clip-path`. Standardise.

---

## 7. Skeleton (`vs-skeleton` + 5 skins)

**States.** None. Axes: `shape` (`text` / `card` / `circle` / `rect` / `avatar`), `animation`
(`shimmer` / `pulse` / `both` / `none`), `speed`, `count`, `width`, `height`, `radius`.
Skins: `blink`, `gradient`, `pulse`, `shine`, `wave`.

**Structure shadcn lacks — the highest-value borrowing in Phase 2.**
- **One light across the whole group, not one per bone.** The group sets `container-type: inline-size`;
  every bone's shimmer mask is sized `100cqw` — the *group's* width — and animates `mask-position` by
  `+100cqw`. Sharing the container-query unit and the clock makes the band cross the avatar and every
  line as a single coherent sweep. Six independent `background-position` shimmers, which is what
  everyone ships, look like six separate lights.
- **The band is a mask, not a highlight.** The notch is *transparent*, so what shows through is the
  page backdrop. On a purple surface the shine is purple: no hardcoded white gradient, no theming bug.
  `--sk-cut` (0.85) controls the carve depth as a number rather than a colour.
- **A per-row tilt**: `mask-position` offset by `index × --sk-tilt` (−20 px), slanting the band ~30°
  across ~24 px rows.
- **Offset compensation for composite layouts**: in `card` the text stack sits 62 px in, so its bones
  get `--ox: -62px` and the band still crosses the avatar and the first line at the same instant.
- **Opinionated bone widths**: `text` makes its **last** line 65 % wide (when count > 1), `card` uses
  60 % / 90 % / 75 %. Uniform bars read as a table; ragged ones read as prose. `role="status"` +
  `aria-busy="true"`, every bone `aria-hidden`.

**Motion character.** `shimmer` moves the mask linearly at 1.4 s (2.1 s slow, 0.9 s fast). `pulse` beats
opacity 1 → 0.45 → 1 on the same clock. `both` runs them together. `shine` translates a highlight
`−120% → 120%` with a 40 % dwell at the end (`60%, 100%`), so there is a pause between passes;
`gradient` pans `background-position 200% → −200%`; `wave` and `blink` stagger per `--i` (120 / 160 ms).

**Overshoot.** None. Correct — a loading state has no confirmation to celebrate.

**Would get wrong.**
- The container-query sizing is load-bearing. `cqw` without `container-type: inline-size` on the group
  silently degrades to per-bone shimmering.
- `shape="card"` is a *layout*, not a bone. Our `Skeleton` is a leaf; the `--ox` compensation only works
  if one element owns the group. Either ship a `SkeletonGroup` that establishes the container, or accept
  independent lights.
- Reduced motion slows to **3 s**; it does not stop. Same exception as Spinner.
- §3.4 gives Skeleton `shimmer` and nothing else, which is exactly what the source does. **The one
  component in either phase that needs no decline at all.**

---

# Part B — Phase 3

## 8. Tabs (`vs-tabs` + 6 skins)

**States.** `is-active` per tab; `is-ready` and `is-pop` on the indicator; `:disabled` per tab;
`is-disabled` on the root. Variants `line` / `solid` / `pill` plus the skins; tones; sizes; `block`,
`icon-only`, radii. Skins: `bubble`, `card`, `chrome`, `gooey`, `neon`, `vertical`.

**Structure shadcn lacks.**
- **The indicator is a clipping window over a duplicate label strip.** Inside it sits a second, complete
  copy of the tab labels in the *inverted* colour. The indicator gets
  `transform: translate(offsetLeft, offsetTop)` + `width: offsetWidth`; the inner strip gets
  `translate(-offsetLeft, -offsetTop)` + the full track width. The two cancel, so the copy stays visually
  fixed while the pill slides across it and the active label is **revealed letter by letter** rather than
  recoloured. This is why the indicator animates `width` and not `scaleX`.
- **A per-tab cursor light**: `background-clip: text` with a 96 px radial keyed to `--mx`/`--my`, so
  letters under the pointer brighten and distant ones stay muted.
- **A "water-drop" text ripple**: a cloned label with a double radial ring expanding
  `--tabs-r: 0 → 150px` over **1820 ms `(0.16, 1, 0.3, 1)`**, `background-clip: text` — identical code
  to Breadcrumb and to Phase 1's checkbox label.
- `chrome` draws the browser-tab shape with two masked quarter-disc shoulders flanking a "sled", over a
  toolbar "lip" that is part of the component, and adds `closable` / `addable` tabs.
- `gooey` needs an SVG `feGaussianBlur` + `feColorMatrix`; `vertical` slides a left rail *and* a row
  fill; `bubble` hops a fixed 8 px dot. Overflow tracks scroll horizontally with the scrollbar hidden —
  no arrow buttons anywhere.

**Motion character.** The indicator travels **420 ms `(0.34, 1.4, 0.64, 1)`** on `transform` *and*
`width` together, with `is-pop` (`scale 1 → 1.099 → 1`, 460 ms) armed by a **double rAF** after a single
rAF measurement pass. Tabs sink `scale(0.92)` on `:active` and return over 320 ms at 1.56. `neon` adds a
3 s sweep along the bar.

`gooey` gets its stretch from JS rather than the curve: it writes the **union** of the old and new
boxes, then after a double rAF writes the new box, so the blob swells to cover both tabs before
collapsing onto the target.

`chrome` is different again, and the difference is the interesting part. Its sled carries **no CSS
transition, deliberately** — the comment says a transition "can only interpolate both edges with ONE
curve, which is exactly what kills the stretch". Instead JS integrates **two spring solvers at module
load** (leading `k=235, c=24, m=1`; trailing `k=168, c=21, m=1`, stepped at 1000/120 ms, terminated at
`|x| < 0.002 && |v| < 0.02`), assigns the stiffer one to whichever edge leads the direction of travel,
builds one keyframe per step carrying a `translate3d` and a pixel `width`, and plays them through
`Element.animate()` with `easing: "linear"`. The sled stretches on the way and snaps closed on arrival.
Width is clamped to `--r × 2` so the shoulders never overlap; an interrupted move reads the running
animation's live matrix and re-springs from there; the spring pass is skipped entirely under reduced
motion.

**Overshoot.** Indicator travel (1.4), pop (+9.9 %), gooey (1.5), bubble dot (1.4) plus its hop, tab
press return (1.56), chrome's two springs. **The 1.4/1.5 curves apply to `width` as well as `transform`
in every variant except `bubble`** — layout overshoot, five times over.

**Would get wrong.**
- **Arrow keys auto-activate.** Left/Up and Right/Down move *and select*, wrapping at both ends and
  skipping disabled tabs; Home/End jump; focus follows selection via a rAF. That is "selection follows
  focus", correct only when panels are cheap. bits-ui exposes `activationMode` — choose deliberately.
- The source declares `role="tablist"` / `role="tab"` but **has no panels and no `aria-controls`**. It is
  a segmented control wearing tab ARIA, which is invalid. Take ARIA from bits-ui, visuals from here.
- The double-rAF arming of `is-pop` matters: a single rAF fires on the measurement frame and never plays.
- A `ResizeObserver` re-measures — and `chrome` goes further, re-measuring synchronously, on the next
  rAF, after an 80 ms timeout, **and on `document.fonts.ready`**. A web font landing after first paint
  is the commonest cause of a misplaced indicator and a track `ResizeObserver` does not always catch it.
  **Our `MorphIndicator` needs the fonts hook.**
- `vertical` restricts keys to Up/Down/Home/End and sets `aria-orientation`; horizontal variants accept
  both axes. Orientation must gate the key set, not just the layout.

---

## 9. Steps (`vs-steps` + 5 skins)

**States.** Per step `pending` · `active` · `completed` · `error` (plus `is-nav`); root `orientation`,
`variant` `numbered` / `dots`, `clickable`, `disabled`, tones, sizes. Container is an `<ol>` with
`aria-current="step"` on the active `<li>`. Skins: `arrow`, `bar`, `circular`, `pills`, `timeline`.

**Structure shadcn lacks** (shadcn-svelte has no Steps):
- **Only completed steps are navigable.** `is-nav = clickable && !disabled && status === 'completed'`,
  and only those markers get `role="button"` and `tabIndex = 0` — pending and active have no role and no
  tab stop. Enter and Space activate; there are no arrow keys. You can only go *backwards*.
- **`error` is a per-step status that overrides the derived one**, not a root-level flag.
- **A progress ring around the marker** (`stroke-dasharray: 100.53` = 2π·16), rotated 180° so it starts
  at 9 o'clock — where the incoming connector arrives.
- **The icon layer never unmounts.** Error, check and number are all present and absolutely stacked; an
  `is-shown` class crossfades the right one with blur and scale. No mount churn, so the swap animates
  in both directions.
- **There is no sliding indicator anywhere in Steps.** Progress is per-segment.

**Motion character.** A staged chain with explicit delays whose **exit runs backwards**:
- *Enter*: the connector's `::after` fills `scaleX(0 → 1)` at 0 ms over **480 ms `--ease-out`**; the
  ring's `stroke-dashoffset` runs 480 ms (active delayed **380 ms** so the line arrives first); the
  marker's `::before` scales `0.5 → 1` with `blur(8px) → 0` over **420 ms at 1.56** at 0 ms.
- *Exit*: the same three properties carry **480 ms and 900 ms delays**, so the ring empties, then the
  line drains, then the fill fades. Reversing the *order* rather than the animation is what makes
  stepping backwards read as undoing.
Active markers sit at `scale(1.06)` (`dots`: 1.15) on a 280 ms spring.

**Overshoot.** Marker fill pop, active marker scale, icon crossfade — all 1.56, all transform. Then
`pills`, which overshoots **`flex-grow` over 460 ms at `(0.34, 1.4, 0.64, 1)`** and its label's
**`max-width: 0 → 240px`** on the same curve, with `padding` on a plain 300 ms ease.

**Would get wrong.**
- **Clicking a pending or active step does nothing.** "Click any step" is a different product decision.
- The staged delays are the whole choreography; fire all three at once and it reads as a flash.
- `dots` is a variant that halves the marker and drops the numbers, not a size.
- **Steps is not a MorphIndicator consumer** — see §15.
- §3.4 grants Steps `gradient` on the active step only; `bar`'s `box-shadow` glow and `arrow`'s
  `brightness()` hover are out, and the `box-shadow: 0 0 0 4px` rings on active markers compete with the
  real focus ring, which §3.5 forbids.

---

## 10. Accordion (`vs-accordion` + 5 skins)

**States.** `is-open` per item, `:disabled` per header, `is-disabled` on the root; `multiple`; variants
`separated` / `contained` / `line`; tones; sizes; radii. Skins: `bounce`, `filled`, `ghost`, `glow`,
`slide`.

**Structure shadcn lacks — structurally little; mechanically one big thing.**
- **The collapse is `grid-template-rows: 0fr → 1fr`, with no JS measurement at all.** All six do this.
  No `scrollHeight`, no inline `height`, no `transitionend`, no timeout fallback — just a class toggle
  over a one-column grid with a `min-height: 0; overflow: hidden` clip child. Content that resizes while
  open just works.
- **The body has its own entrance**, decoupled from the collapse: opacity 300 ms, `blur(6px) → 0`
  380 ms, `translateY(-8px) → 0` 520 ms, all delayed **60 ms**, so the text settles into a box that has
  already opened.
- **A cursor light on the header title** (`background-clip: text`, 220 px radius) plus a `--lit`-driven
  `text-shadow`, and a full proximity glow layer on the item.
- `slide` swaps the chevron for a plus/minus whose vertical bar `scaleY(0)`s away; `filled` wipes a
  `scaleY` background; `ghost` frosts; `glow` spins a conic ring while open.

**Motion character.** Panel **600 ms `cubic-bezier(0.34, 1.8, 0.42, 1)`** (skins 560–620 ms; `bounce`
uses **2.2**). Chevron rotates 180° over **540 ms** on the same spring — noticeably slower than the
panel's perceived open, which is what makes it feel like it is catching up. Header sinks `scale(0.985)`
on `:active` over 320 ms. Reduced motion sets the panel to `transition: none` (instant) and keeps a
200 ms opacity fade on the body.

**Overshoot.** One site, and it is the important one: **`grid-template-rows` at a 1.8 control point
(2.2 in `bounce`)**. Overshooting `0fr → 1fr` opens the panel *taller than its content* and settles
back — a layout overshoot on the exact mechanic §1 bans. The chevron shares the curve but is
transform-only and safe.

**Would get wrong.**
- The base sets `aria-expanded` and **nothing else** — no `aria-controls`, no `role="region"`, no ids.
  Two skins (`filled`, `slide`) *do* wire all three, which shows it was known and skipped.
- `multiple` off means opening one closes another, and both panels animate simultaneously, so the list's
  height moves in two directions at once. Test that case.
- `grid-template-rows: 0fr → 1fr` is genuinely better than the `scrollHeight` dance and we should copy
  the *mechanism* even though it is a layout animation — it is A16's carve-out exactly: the layout change
  is the thing being animated, not a decoration over one. **Say so in the source file** or a reviewer
  reads it as an `F11` violation.
- §3.4 grants glow on the **trigger**; the source puts the layer on the whole item and lights the open
  panel too. Scope it to the header.

---

## 11. Breadcrumb (`vs-breadcrumb` + 5 skins)

**States.** `is-current` · `is-disabled` on crumbs, `is-pressing`, root `is-disabled`; `separator`
(character or SVG), sizes, tones. `aria-label="Breadcrumb"` on the `<nav>`, `aria-current="page"` on the
last crumb. Skins: `arrow`, `collapse`, `glow`, `pill`, `slash`.

**Structure shadcn lacks.**
- **`collapse`: an overflow strategy, but a count-based one.** With `max-visible` (default 3) it shows
  the first crumb plus the last `max-visible − 1`, hiding the rest behind an ellipsis pill that expands
  them **inline**, staggered 40 ms per item. Three caveats: it measures nothing — no `ResizeObserver`, no
  width test, so a narrow container with four short crumbs still overflows; expansion is **one-way and
  latched**, with no route back; and hidden crumbs are `display: none`, so they are correctly out of the
  a11y tree. The last crumb is the only flexible item (`flex: 0 1 auto; min-width: 0; overflow: hidden`)
  so a long final segment truncates instead of pushing the trail out of its container.
- **A touch-target correction worth stealing verbatim**: the ellipsis pill is 9 px tall, so the button
  box is padded out to the 24 px thumb floor and the padding pulled back with an equal negative margin —
  hittable without inflating the pill or breaking the line.
- **The cursor light on the letters** (120 px radius), applied to the **separators** too.
- **The 1820 ms water-drop text ripple** — third appearance, identical code.

**Motion character.** Almost nothing at rest. The signature is the press, and it is **both declined
mechanics at once**: `pointerdown` applies the A10 3D tilt — `perspective(420px)`, `rotateX ≤12°`,
`rotateY ≤9°`, `scale(0.93)`, same damping formula — over **120 ms `(0.4, 0, 0.2, 1)`**, and release
springs back over the **620 ms explicit `linear()` damped spring peaking at 1.15 at ~26 %** that A11
declined. `collapse`'s reveal is `translateX(-6px) scale(0.9)` → rest over **360 ms at 1.56**, transform
and opacity only. `slash` grows a `scaleX` underline from centre over 320 ms; `glow` flickers text-shadow
at **1600 ms infinite** on hover.

**Overshoot.** Two: the 620 ms `linear()` crumb spring (+15 %) and the collapse reveal (1.56), both
transform-only. The crumb spring is the **third** occurrence of the exact mechanic A11 declined
(checkbox label, radio label, breadcrumb crumb).

**Would get wrong.**
- The last crumb is not a link: `aria-current="page"`, `cursor: default`, full-strength colour, no hover.
  Rendering it as a disabled link is wrong twice.
- `collapse` expands **in place**, not into a dropdown, where shadcn-svelte's `BreadcrumbEllipsis` opens
  a menu. Both are defensible, but in-place expansion needs the last-crumb truncation rule or it
  overflows the instant it expands.
- **No key handling and no roving tabindex.** Breadcrumbs are links, so native tab order is right — do
  not add one. But `collapse`'s ellipsis is a real `<button aria-expanded>` and must stay one.
- §3.4 gives Breadcrumb `ghost` and nothing else. The cursor light, the drop ripple and the glow skin
  are all out.

---

## 12. Pagination (`vs-pagination` + 5 skins)

**States.** `current`/`page`, `total`, `sibling-count`, **`is-edge`** (first or last page), per-button
`disabled`, root `is-disabled`; `show-prev-next`, `show-edges`; sizes, shapes. `role="navigation"` with
`aria-label`, `aria-current="page"` on the active button. Skins: `compact`, `dots`, `gooey`, `ink`,
`segments`.

**Structure shadcn lacks.**
- **A carousel, not an ellipsis.** The window is exactly `siblingCount × 2 + 1` buttons wide; *every*
  page 1..total is a real button in one flex track that **translates** so the active page is centred,
  clamped at both ends (`max(minOffset, min(0, halfWindow − activeCentre))`). Numbers slide past a fixed
  window rather than being replaced by `…`. There is no ellipsis element anywhere.
- **The same indicator-window trick as Tabs**: the pill clips an inverted-colour copy of the number
  strip, counter-translated, so digits are revealed by the pill rather than recoloured.
- **`is-edge` reduces the overshoot.** At the first or last page the curve drops from
  `(0.34, 1.4, 0.64, 1)` to `(0.34, 1.12, 0.64, 1)` and the pop from +9.9 % to +3.5 %, with a comment:
  at the edges there are no more numbers behind, so a full overshoot reads as the pill jumping out of
  the control. Small, correct, easy to miss.
- `compact` is a **number reel** — the page rolls up or down by direction, blurring through 7 px, with
  the reel's width in `ch` units springing when the digit count changes.
- `dots`, `segments` and `ink` are three progress metaphors over the same state.

**Motion character.** Track **420 ms `(0.34, 1.4, 0.64, 1)`**; indicator the same on `transform` and
`width`; pop armed by a double rAF guarded on `isConnected`. Nav arrows get the **3D press tilt** —
`perspective(420px) rotateX(≤9°) rotateY(≤7°) scale(0.9)`, the mechanic A10 declined — cleared on
`pointerup`/`pointerleave`/`pointercancel`. Arrow ripples are **unclipped** and scale to 1.7 over 720 ms.
`ink` 560 ms, `gooey` 620 ms plus a `pgg-wobble` squash (`1.05/0.96 → 0.98/1.02 → 1`), `dots` 520 ms at
**1.8**, `segments` 560 ms.

**Overshoot.** Six sites, and **all but the wobble and the press apply to `width`**: base indicator and
mask (1.4, or 1.12 at edges), pop, `ink`, `gooey`, `dots` (**1.8**), `segments`, `compact`'s reel (1.56).

**Would get wrong.**
- **`sibling-count` sets the window width, not an ellipsis threshold.** `siblingCount=1` means three
  visible buttons, always three, regardless of `total`. Mapping it onto shadcn's ellipsis semantics
  produces a different component.
- **There is no keyboard handling whatsoever** — no arrows, no Home/End, no roving tabindex. Every page
  is its own tab stop, so a 40-page control is 40 tab stops. The largest a11y gap in Phase 3, and it
  follows directly from the no-ellipsis design.
- The active page is centred *except* at the ends, where the track stops. Without the clamp the strip
  scrolls into empty space.
- `compact` is the only place in either phase using a `transitionend` listener with a timeout fallback
  (600 ms, filtered on `propertyName === "transform"`). A13's lesson restated: any *measured* animation
  needs the fallback or the reel sticks mid-roll.
- §3.4 gives Pagination `ghost` only. The `--lit` light on the arrows and the `drop-shadow` it drives,
  the cursor light on the digits, and the gooey SVG filter are all out.

---

## 13. Sidebar (`vs-sidebar` + 6 skins)

**States.** `collapsed` (with `collapsible`), `flush` (edge-to-edge app-shell cut), `full`, per-item
`is-active` / `is-childactive`, submenu `is-open`, `is-disabled`, `dividers`, `sub-dots`, `scrollbar`,
`glow`. `role="menu"` / `role="menuitem"`, `aria-current`, `aria-expanded`, `aria-pressed` on the toggle,
`<nav aria-label="Main navigation">`. Skins: `classic`, `floating`, `glow`, `gradient`, `minimal`,
`rail`.

**Structure shadcn lacks.**
- **A cursor-following hover highlight.** `.sb__hl` is a *single* element that translates and resizes to
  whatever item the pointer is over, cleared on `pointerleave`. It is **not** the selection indicator —
  the active item is marked by a static 3 px bar, and that bar sits on the **right** edge, not the left.
  Two separate affordances; shadcn has neither.
- **A collapsed flyout, not just a tooltip — and two implementations of it.** In `minimal` and
  `floating` it is pure CSS on `:hover` / `:focus-within`, so it is keyboard reachable for free. In the
  base it is a **separate custom element appended to `document.body`**, positioned fixed at
  `top: itemRect.top`, `left: itemRect.right + 10`, talking back through a composed `vs-flyout-select`
  event, with `transitionend` + 380 ms / 220 ms fallbacks. Clicking a parent while *expanded* toggles an
  inline submenu instead — the same click does two different things by collapse state.
- **A dismissable-layer contract**: capturing `document` `pointerdown` through `composedPath()` (so
  clicks inside the flyout's own shadow tree count as inside) plus `Escape`. Un-collapsing also closes.
- **Collapsed-only affordances**: the count badge and "has updates" dot shrink onto the icon
  (`scale(0.4) → 1`) because the label that carried the count is gone, and items gain a native `title`.
- `flush` and `full` exist because a floating card with a radius on four sides is the wrong shape for a
  real app shell — a distinction worth keeping as two props.

**Motion character.** The rail collapses by animating **`width: 256px → 72px` over 460 ms
`cubic-bezier(0.34, 1.4, 0.6, 1)`** (glow 420 ms ease-out; gradient 460 ms at 1.8). The chevron rotates
180° over **480 ms at 1.56**; labels cross-fade over 200 ms. Submenus are `grid-template-rows: 0fr ↔ 1fr`
with **asymmetric curves**: opening **560 ms `(0.34, 1.8, 0.5, 1)`** (overshoot), closing **500 ms
`(0.5, -0.6, 0.5, 1)`** (anticipation — it pulls open a little before shutting), with the inner content
on its own blur-and-lift at 520 ms. The hover highlight is the calmest thing in the file: 260 ms plain
`--ease-out`, no spring. `rail`'s selection pill is 620 ms at 1.8 on `transform` and `height`.

**Overshoot.** Rail width (1.4 / 1.8), submenu open (1.8) and close (anticipation −0.6), chevron (1.56),
active item `padding-left` (1.56), badge `margin-right` (1.56), rail pill (1.8). **Four of those seven
are on layout properties.**

**Would get wrong.**
- The sliding highlight follows the **cursor**, not the selection. Wiring it to the active item produces
  a different component and orphans the static active bar's job.
- `role="menu"` / `role="menuitem"` on a navigation list is questionable — menu semantics imply arrow-key
  navigation, and the source handles only `Escape` and `Home`. shadcn uses a plain `<nav>` + list, which
  is right. Take shadcn's semantics.
- Collapsing is nine coupled rules, not one: the header centres, the logo goes, labels and chevrons
  disappear, the active bar is removed, item padding resets, and submenus are replaced by the flyout.
  That is why the width animation feels like more than a width animation.
- **Nothing is persisted** — no `localStorage`, no cookie, in any of the seven Phase 3 components.
  shadcn's Sidebar persists via a cookie so SSR does not flash. Do not inherit this gap.
- `rail`'s pill has a detail worth keeping: **when collapsed, its target falls back from the active
  *child* to the visible parent**, so it never follows a hidden element. Any FLIP indicator over a
  collapsible tree needs the same fallback or it flies to `0,0`.
- §3.4 gives Sidebar `ghost` only. The border glow, the neighbour-light lamp, `glow`'s 2.6 s scanline
  and `gradient`'s 12 s drift are all out.

---

## 14. Timeline (`vs-timeline` + 5 skins)

**States.** Per item `--done` / **`--ln-done`** (the connector above it is complete) / tone / `--right`
(alternating) / `--now` / `--active`; root `align` left/right/alternate, `line-style` solid/dashed,
`progress`, `glow`, sizes. Skins: `alternating`, `cards`, `compact`, `glow`, `gradient`.

**Structure shadcn lacks** (shadcn-svelte has no Timeline):
- **Two independent completion flags per item** — the dot's `done` and the connector's `ln-done` — so a
  gradient can run *between* two dots and stop mid-segment.
- **The connector is a `::before` on the item**, positioned marker-centre to marker-centre with `calc`,
  `display: none` on the last child. Dashed is a repeating mask, not a `border-style`, so it keeps the
  rounded caps.
- **A completion check as a small badge overlapping the dot's upper-left**, separate from the dot's own
  icon — so a dot can carry a category icon *and* a done marker.
- **Alternating layout via a three-column grid** (`1fr var(--gut) 1fr`) with the marker in the middle and
  content switching sides, plus a container query collapsing to one column below 420 px.
- `gradient` adds a **rail head** — a puck riding the fill's leading edge — whose position is
  interpolated between the two bracketing marker centres by the fractional part of `progress`, and which
  only appears past a 0.06 fraction. `compact` reveals the description on hover.

**Motion character.** Items enter on mount staggered by an inline `--d` of **`index × 60 ms`** (cards
70 ms, alternating a configurable 90 ms) with `tl-in 560 ms (0.34, 1.56, 0.64, 1)`:
`translateY(14px) scale(0.86) blur(8px)` → **`scale(1.04)` at 60 %** → rest; `alternating` mirrors the
keyframe for right-side items. The done check pops `scale(0 → 1)` over 360 ms at 1.56. In the base
component **the connector does not animate its geometry at all** — it animates `background` over 300 ms,
interpolating a gradient between the two adjacent items' colours.

**Overshoot.** Item entrance (+4 %) and the check pop, both transform-only. `gradient`'s rail uses plain
`--ease-out`. Timeline is the least springy component in Phase 3.

**Would get wrong.**
- **The base Timeline is not a layout-animation offender** — only `gradient` and `alternating` are (§16).
  The likely assumption that a timeline grows its line is wrong for the default.
- The connector belongs to the item *below* the gap it spans, and `ln-done` is a separate flag from
  `done`. Deriving the line's state from the dot's produces an off-by-one where the last completed
  segment never fills.
- **There is no scroll-reveal.** The `IntersectionObserver` in the file belongs to the glow lamp, not to
  entrance animation; `tl-in` fires unconditionally on render.
- Stagger delays must be capped (§4's `stagger` helper): `index × 60 ms` uncapped makes item 40 arrive
  2.4 s late.
- **`progress` (1-based) overrides every item's own `done`.** Two sources of truth for one visual state,
  and the root-level one silently wins. Pick one.
- `done` strikes through the title *and* the description — a semantic decision, not styling. Confirm it
  is what we want before inheriting it.

---

# 15. Cross-cutting observations

**One indicator implementation, four components.** Tabs, Pagination, Sidebar-rail and Tabs `vertical`
all run the same shape: an absolutely positioned element, `is-ready` gating the first paint so it
appears rather than flying in from `0,0`, `is-pop` armed by a double rAF, a `ResizeObserver` re-measure,
and `transform` + `width` (or `height`) on one spring. Tabs and Pagination share the *identical*
window-mask refinement. **This is one primitive, and it is `MorphIndicator`.**

**The MorphIndicator compatibility answer.** Three different answers:

- **Sidebar — fully compatible, no caveats.** `.sb__hl` and `.seg__pill` are anchored `left: 6px;
  right: 6px` or measured full-width in a vertical list of uniform-height rows, so their `width`/`height`
  transitions are defensive; in practice only `translateY` changes. `orientation="vertical"` on our
  existing FLIP indicator is exactly right, and the 260 ms plain ease-out the source uses is already in
  our range. Ship it as-is. Add the collapsed-target fallback from `rail`.
- **Steps — does not need it and should not get it.** There is no sliding indicator in Steps or any of
  its five skins. Progress is a per-segment `scaleX`/`scaleY` on the connector plus a `stroke-dashoffset`
  ring — already transform-only and already §1-clean. **§4.9 lists Steps as a MorphIndicator consumer;
  that should be corrected to Pagination**, which is the fourth real one.
- **Tabs and Pagination — compatible *as FLIP*, but only with two known casualties handled.** The
  indicator genuinely changes width between tabs, so transform-only means `scaleX`, and two things ride
  along:
  1. **The window-mask reveal breaks.** The indicator is not an empty pill: it clips a counter-translated
     copy of the label/number strip. Under `scaleX` the copy stretches with it and the letters distort.
     Fixable — run a second `Element.animate()` on the inner strip with the inverse `scaleX` over the
     same duration and easing — but it must be designed in, not discovered. If we drop the reveal and
     just recolour the active label (what shadcn does), the problem disappears and so does the effect.
     **Decide this before building Tabs.**
  2. **The border radius distorts.** A pill at `radius = height/2` scaled 2.5× on X becomes a lozenge.
     `border-radius` is paint, not layout, so animating it alongside is permitted by §1 — but it is an
     extra keyframe track and must be added deliberately.

  `chrome` is the happy surprise: its stretch already *requires* two independently-curved edges, which is
  precisely `translateX` on one curve plus `scaleX` on another. Chrome is **more** natural under FLIP
  than under the CSS transition it explicitly refuses. Its shoulders are fixed-size pseudo-elements and
  would squash, so they must become real counter-scaled children or move onto the lip.

  Net: **the source's indicators do depend on animating size, and the dependency is recoverable.** FLIP
  with a counter-scaled child reproduces every one of them except the pseudo-element shoulders.

  Against what we already have: `motion/morph-indicator.svelte` is structurally correct — it places at
  Last instantly and animates `transform: translate(...) scale(...)` with `transform-origin: top left`,
  which is precisely the right shape, and it reads `--ease-fx-out` rather than a spring, so none of the
  source's layout overshoot is inherited. It needs exactly three additions: an optional counter-scaled
  child animation, an optional `border-radius` track, and the `document.fonts.ready` re-measure.

**Any FLIP indicator needs a fonts hook.** `chrome` re-measures synchronously, on the next rAF, after an
80 ms timeout **and** on `document.fonts.ready`. A `ResizeObserver` on the track does not reliably catch
a web font landing after first paint, and a mis-seated indicator is the most visible possible bug.

**The press tilt is more widespread than Phase 1 suggested.** Three more components carry the identical
`perspective(P) rotateX(−ny·A) rotateY(nx·B) scale(S)` formula with the same `1 − 0.2 × min(|nx|,|ny|)`
damping: **Avatar** `320/14/10/0.94`, **Breadcrumb** `420/12/9/0.93`, **Pagination** `420/9/7/0.9` —
nine of nineteen components audited. A10 declined it structurally and that reason holds harder here,
since Avatar and Pagination buttons routinely host tooltips. Chip, Tabs, Accordion and Rating meanwhile
sink with a **flat scale** (0.95 / 0.92 / 0.985 / 0.82), so A10's choice is the source's own majority.

**One ripple emitter, still copy-pasted.** Alert (close), Avatar, Chip, Rating, Steps, Tabs and
Pagination all compute `hypot(max(x, w−x), max(y, h−y)) × 2`, spawn at the pointer, remove on
`animationend`, cap the pool at **6** (Rating: 3), and bail under reduced motion in JS. Durations drift
640 / 720 / 780 ms for no visible reason; Tabs alone scales the radius by 0.7 and only ripples in
`solid`. One attachment, one token.

**Proximity-glow radii, as calibration.** One engine, nine radii scaled to the element: Rating star
**90 px**, Tabs and Pagination **96**, Breadcrumb **120**, Avatar and Chip **160**, Timeline **200**,
Accordion **220**, Alert **240**, Sidebar **320**. `--fx-glow-radius: 180px` is a Button-sized number,
not a universal one.

**Two text effects recur across four components each, and neither is granted.** (a) The **1820 ms
water-drop** — Checkbox label (Phase 1), Tabs, Breadcrumb clone their own text and expand a double
radial ring through `background-clip: text`, `0 → 150px` on `(0.16, 1, 0.3, 1)`; it reads `textContent`
so it silently breaks for rich labels. (b) The **cursor light on the letters** — Tabs, Breadcrumb,
Pagination, Accordion paint the label with a `background-clip: text` radial keyed to `--mx`/`--my` so
glyphs under the pointer brighten. That is a pointer-tracked **glow** on four components §3.4 gives no
glow to. Declining each is one decision, not four.

**The "neighbour light" lamp system has no row in our spec at all.** Alert, Chip, Sidebar and most
Phase 1 controls paint `--lit-fill` / `--lit-ring` layers fed by a page-level engine that finds *other*
coloured elements within 110 px and throws their colour onto this one — a second, non-cursor proximity
system with its own variable so the two never collide. It is out, but it should be out *on the record*:
the CSS is in nearly every shadow sheet and a reader of the source will assume it belongs.

**Reduced motion has three distinct correct answers, and the source knows it.** (a) Transition to none or
opacity-only at ~120–200 ms — the default, used by Tooltip, Accordion, Tabs, Sidebar. (b) **Slow the loop
rather than stop it** — Spinner (2.4 s) and Skeleton (3 s), because a frozen loading indicator asserts
something false. (c) **Branch in JS before writing any inline style** — `chrome` skips its spring
sampling entirely and writes only the final values. Our §3.2 chain covers (a) and (c); **(b) needs adding
as an explicit exception for loading indicators.**

**Only three files guard a transition with a timeout fallback**, and each is animating a *measured*
value: Sidebar's flyout (380 ms enter / 220 ms leave), Sidebar `classic`'s flyout (500 ms), Pagination
`compact`'s digit reel (600 ms, filtered on `propertyName`). Wherever the animation is a pure class
toggle over CSS-declared values — all six accordions, every indicator — there is no listener at all,
because there is nothing to clean up. That is the honest rule A13 was reaching for: **the fallback is
needed exactly where a measurement is, and nowhere else.** Correspondingly, only `tabs-chrome` uses the
Web Animations API, and no component in either phase uses a `MutationObserver`.

**Enter/exit asymmetry is not uniform, and one case inverts.** Steps reverses the *order* of its chain
rather than its timing. Sidebar's submenu anticipates to close and overshoots to open. Tooltip's exit is
*longer* than its enter. Alert's dismiss is 440 ms against a 300 ms fade. "Exit one step faster" holds
for most of it, and where it does not the reason is always that the exit is doing something other than
reversing the enter.

**Candidate shared primitives, ranked.** (1) `MorphIndicator` — four real consumers (Tabs, Pagination,
Sidebar, any future segmented control), *not* Steps. (2) A `shimmer` **group** primitive with the
container-query sweep — Skeleton's single-light-across-the-group is the best idea in Phase 2 and it is
one `container-type` plus `cqw` mask sizing. (3) `collapse` on `grid-template-rows: 0fr↔1fr` — used by
Accordion (×6) and Sidebar submenus (×4); no measurement, no `transitionend`, no fallback timer, and it
survives content resize. (4) `stagger` with a delay ceiling — Timeline, Breadcrumb collapse, AvatarGroup
grid, Select's option list. (5) The `ripple` attachment, already identified in Phase 1. (6) A
`statusBadge` shape for Avatar's morphing corner slot, if we want presence at all.

---

# 16. Layout-animation inventory

Every place these thirteen animate `width` · `height` · `padding` · `margin` · `top`/`left` · `gap` ·
`flex-grow` · `max-width` · `grid-template-rows`. §1 bans all of it. Each row is **decline**,
**re-express as transform**, or **A16 carve-out** (the layout change *is* the animation).

| # | Component / skin | Property | Vuesax timing | Verdict |
|---|---|---|---|---|
| 1 | **Alert** (all 6) | `height` (JS-measured → 0), `padding`, `margin`, `border-width` | 440 ms `(0.5, -0.45, 0.55, 1)` — anticipation | Carve-out *or* decline: use the `collapse` primitive, or do not animate removal. |
| 2 | **Avatar** `.ava__status` | `width`, `height` | 560 ms `linear()` peaking **1.117** | Decline. Presence↔typing is a shape change; cross-fade two elements. |
| 3 | **Avatar** `.ava__count` | `width` | 460 ms `(0.34, 1.46, 0.44, 1)` | Decline. Digit-count changes are rare; let it snap. |
| 4 | **AvatarGroup** `grid` | `gap` (container), `margin` (items), staggered 22 ms | 420 ms `--ease-out` | Re-express: the base skin already does the identical fan with `translateX`. Reuse it. |
| 5 | **Tooltip** content swap | `width`, `height` (inline + 440 ms timeout cleanup) | 420 ms `(0.34, 1.46, 0.44, 1)` | Decline. The singleton travel is not ported; per-instance tooltips have nothing to morph. |
| 6 | **Rating** `bars` | fill `height` | 240 ms `--ease-out` | Re-express: `scaleY` from the bottom, or `clip-path` like every other rating skin. |
| 7 | **Steps** `pills` | `flex-grow`, `padding` | 460 ms `(0.34, 1.4, 0.64, 1)` / 300 ms | Decline. |
| 8 | **Steps** `pills` | label `max-width: 0 → 240px` | 460 ms `(0.34, 1.4, 0.64, 1)` | Decline, or re-express as opacity + `translateX`. |
| 9 | **Steps** `bar` | fill `width` (%) | 520 ms `--ease-out` | Re-express: `scaleX` from the left — the base component already does exactly this. (The per-node `left: %` is static placement, not animated.) |
| 10 | **Tabs** base | indicator `width` + mask `width` | 420 ms `(0.34, 1.4, 0.64, 1)` | Re-express: FLIP `scaleX` + counter-scaled inner strip (§15). |
| 11 | **Tabs** `chrome` | sled `width`, per-keyframe px, WAAPI | two sampled springs, `easing: linear` | Re-express: `translateX` on the leading spring, `scaleX` on the trailing. Naturally FLIP-shaped. |
| 12 | **Tabs** `gooey` | indicator `width` (via a JS union-rect then collapse) | 460 ms `(0.5, 1.5, 0.5, 1)` | Re-express as `scaleX`; the stretch is the point and `scaleX` gives it free. |
| 13 | **Tabs** `neon` | bar `width` | 420 ms `(0.34, 1.4, 0.64, 1)` | Re-express (`scaleX`; a 2 px bar has no radius to distort). |
| 14 | **Tabs** `vertical` | rail + fill `height` | 420 ms `(0.34, 1.4, 0.64, 1)` | Re-express: `scaleY` / FLIP `orientation="vertical"`. |
| 15 | **Accordion** base + `slide`/`filled`/`ghost`/`glow` | `grid-template-rows: 0fr → 1fr` | 560–600 ms `(0.34, 1.8, 0.42, 1)` | **A16 carve-out** — port the mechanism, decline the overshoot. |
| 16 | **Accordion** `bounce` | `grid-template-rows` | 620 ms `(0.2, 2.2, 0.35, 1)` | Carve-out for the mechanism; **decline the 2.2 curve outright**. |
| 17 | **Pagination** base | indicator `width` + mask `width` | 420 ms `(0.34, 1.4, 0.64, 1)`; edges `(0.34, 1.12, 0.64, 1)` | Re-express: same FLIP as Tabs. |
| 18 | **Pagination** `ink` / `gooey` / `segments` | indicator or segment `width` | 560 / 620 / 560 ms, springs | Re-express as `scaleX`. |
| 19 | **Pagination** `dots` | active dot `width: dot → pill` | 520 ms `(0.34, 1.8, 0.5, 1)` | Re-express as `scaleX` on a pill dot, or decline the growth and use opacity. |
| 20 | **Pagination** `compact` | reel `width` (in `ch`, on digit-count change) | 380 ms `--ease-spring` | Decline; `font-variant-numeric: tabular-nums` plus a fixed `ch` width removes the need. |
| 21 | **Sidebar** (all collapsible) | rail `width: 256px → 72px` | 460 ms `(0.34, 1.4, 0.6, 1)`; glow 420 ms ease; gradient 460 ms at 1.8 | **A16 carve-out** — the collapse *is* the layout change. Decline the overshoot: a bouncing app shell is the "slow and drunk" case §2 names. |
| 22 | **Sidebar** `.sb__item` | `padding-left` when active | 340 ms `(0.34, 1.56, 0.64, 1)` | Decline. Indent by `translateX` on the content, or not at all. |
| 23 | **Sidebar** `.sb__badge` | `margin-right` when active | 340 ms `(0.34, 1.56, 0.64, 1)` | Decline. |
| 24 | **Sidebar** `.sb__hl` | `width`, `height` | 260 ms `--ease-out` | Re-express: MorphIndicator FLIP; in a uniform list both are constant anyway. |
| 25 | **Sidebar** `rail` `.seg__pill` | `height` | 620 ms `(0.34, 1.8, 0.5, 1)` | Re-express: FLIP vertical. |
| 26 | **Sidebar** submenus (base, `rail`, `glow`, `gradient`) | `grid-template-rows: 0fr → 1fr` | open 560 ms `(0.34, 1.8, 0.5, 1)`; close 500 ms `(0.5, -0.6, 0.5, 1)` | **A16 carve-out** for the mechanism; decline both the overshoot and the anticipation. |
| 27 | **Timeline** `gradient` | rail fill `height` (px branch via `--fill`, % branch via inline `height`); head puck `margin-top` | 620 ms `--ease-out` | Re-express: `scaleY` from the top, `translateY` for the puck. Keep the measurement — interpolating marker centres by the fractional `progress` is what lets the fill stop *between* dots. |
| 28 | **Timeline** `alternating` | spine fill `height` (%) | 480 ms `--ease-out` | Re-express: `scaleY`, `transform-origin: top`. |

**Clean — no layout animation in the component or its skins:** Chip, Spinner, Skeleton, Breadcrumb (the
collapse reveal is `translateX` + opacity), Timeline base and its `glow`/`cards`/`compact` skins, Tabs
`bubble` (fixed 8 px dot) and `card`, Steps base and its `arrow`/`circular`/`timeline` skins, Sidebar
`floating` and `minimal` (no collapse at all). Note that Pagination `dots` and `segments` do *no JS
measurement* yet still carry a CSS `width` transition, so they are in the table, not here — "no
measurement" and "no layout animation" are different claims and the source separates them.

**On the three carve-outs.** `grid-template-rows: 0fr ↔ 1fr` (Accordion, Sidebar submenus) and the
sidebar rail width are cases where the layout change *is* the animation, exactly like the floating label
in A16. They pass — but `check-layout-safety` polices the effect layer only, so, as A16 instructs, **say
so in the source file** or a reviewer reads it as an `F11` violation. In all three the **overshoot on the
layout property is separately declined**: `0fr → 1fr` overshooting opens the panel taller than its
content and settles back, and a rail that overshoots its collapsed width shoves the page content twice.

---

# 17. Effects inventory against §3.4

Decorative effects the source applies that the capability matrix does **not** grant. `press` and
`ripple` are omitted — press is always-on per §3.1.

| Component | §3.4 grants | Applied beyond it |
|---|---|---|
| **Alert** | ghost, gradient, glow (danger/warn), shimmer (once on mount) | Proximity **glow on any tone**. **Neighbour-light lamp** — no matrix row at all. `neon`: 4.4 s conic ring + 3.4 s bloom breathe, both infinite (§3.5 idle-loop violation), plus `text-shadow` and icon `drop-shadow`. `inline`: 1.8 s dot pulse, infinite. |
| **Avatar** | gradient (fallback bg), glow (presence), shimmer (loading), tilt (≥ lg) | `story` ring **6 s conic spin, infinite** — decorative, not loading. `live` **1.8 s pulse, infinite**. `glow` skin **3 s box-shadow breathe, infinite**. `ring` skin 5 s spin (0.9 s hover). `squircle` hover `scale(1.12) rotate(-2°)` on a 520 ms `linear()` spring — a hover transform with no matrix row. `tilt` skin uses `perspective: 340px` against our 800 px token. |
| **AvatarGroup** | gradient, shimmer (loading) | **`translateZ(38px)` through a container `perspective: 620px`** on the hovered item — a tilt-family effect that also creates a containing block for anchored popovers. `ring` 3.4 s conic spin. `wave` 1.1 s bob loop on hover. `fan` 460 ms rotation, `flip` 560 ms `rotateY`. |
| **Chip** | ghost, gradient | **Proximity glow** (opt-in). **Neighbour-light lamp.** `glow` **1.9 s pulse while selected, infinite**. `outline` conic spin 2.4 s / 1.6 s, infinite. `gradient` **animated** pan 5 s / 3 s — gradient is granted, animating it is a loop. |
| **Spinner** | *(no row — loading indicator)* | Nothing decorative. `overlay`'s `backdrop-filter: blur(2px)` is a surface treatment; functional, but call it out. |
| **Tooltip** | **nothing** | `blur(8px)` on enter/exit is **`blurFade`, a §4 transition primitive, not an effect — keep it.** Everything else goes: `backdrop-filter: blur(12px)` (`fluent`) and `blur(16px) saturate(160%)` (`glass`); the arrow's +30 % pop; the content-swap blur morph; the whole `glow` skin (settled halo + a 620 ms flare). |
| **Rating** | *(no row)* | `glow` **2.4 s halo pulse on lit stars, infinite** + `drop-shadow` on the fill. `hearts` 620 ms expanding aura. `emoji` `filter: grayscale` on unselected. A hover lift on every skin — a transform beyond the mark pop. |
| **Skeleton** | shimmer | **Nothing.** The only fully compliant component in either phase. |
| **Tabs** | ghost | **Cursor light on the letters** (pointer-tracked, i.e. a glow). The **1820 ms water-drop**. `neon` 3 s indicator sweep, infinite, plus tab `text-shadow`. `gooey` SVG `feGaussianBlur` + `feColorMatrix` (§5 permits it as a variant, but it must degrade to `chrome` under reduced motion and must not be the default). |
| **Steps** | gradient (active step only) | `bar` `box-shadow: 0 0 10px accent` on the fill — a static glow. `arrow`/`circular` `filter: brightness(1.12–1.15)` on hover. `box-shadow: 0 0 0 4px` rings on active markers in `bar`/`timeline` — a focus-ring-shaped decoration §3.5 forbids competing with the real ring. The marker's `blur(8px) → 0` is transition motion; keep it. |
| **Accordion** | ghost, gradient (header only), glow (**trigger**) | Glow layer sits on the **whole item**, lighting the open panel; scope it to the header. `--lit`-driven `text-shadow` on the title plus the cursor light. `glow` conic ring **3.2 s spin while open, infinite**. `ghost` `backdrop-filter` frost. |
| **Breadcrumb** | ghost | Cursor light on crumbs **and separators**. The 1820 ms water-drop. `glow` **1600 ms flicker, infinite**, on hover. `arrow`/`pill` hover transform lifts. |
| **Pagination** | ghost | `--lit` proximity light on the nav arrows driving an SVG `drop-shadow`. Cursor light on the digits. **3D press tilt** (`perspective(420px)`) — declined by A10. Unclipped ripples blooming past the button. `gooey` SVG goo filter. `dots` `box-shadow: 0 0 10px` on the active dot. |
| **Sidebar** | ghost | Border **proximity glow** (opt-in) + **neighbour-light lamp**. `glow` **2.6 s scanline, infinite**. `gradient` **12 s background drift, infinite**. `floating` box-shadow transitions on tiles. |
| **Timeline** | *(no row)* | **Per-dot proximity glow** — `glow` is on the base component. `glow` skin **1800 ms dot pulse, infinite**. `gradient` **2600 ms rail sheen + 2200 ms head breathe + 1600 ms spin on the "now" dot**, all infinite. |

**The recurring shapes.** Three families account for nearly every row: (a) a **conic-gradient ring
spinning on an infinite loop** — Alert `neon`, Avatar `story`/`ring`, AvatarGroup `ring`, Chip `outline`,
Accordion `glow`, Timeline `gradient`; (b) a **breathing halo or pulse on a resting state** — Alert
`inline`, Avatar `live`/`glow`, Chip `glow`, Rating `glow`, Sidebar `glow`, Timeline `glow`; (c) the
**cursor light on text**, in four navigation components. Declining them is three decisions, not eighteen,
and (a) and (b) are the same §3.5 rule: an idle loop is loading, or it is a migraine.
