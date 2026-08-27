# alrein-ui

A **shadcn-style registry**, not an npm package. Components are installed as source into your
project with `shadcn-svelte add`, and they **overwrite the upstream shadcn-svelte file at the same
path with a superset** — same import path, same API, plus a disciplined effect layer.

Design and implementation are governed by [`SPEC.md`](./SPEC.md). Substrate verification and the
resolved collisions with the real upstream API are in [`SUBSTRATE.md`](./SUBSTRATE.md).

**Status: Phase 0.** Foundation plus Button, Card and Badge. Phases 1–4 are not started.

## Install

```bash
npx shadcn-svelte@latest add https://alois-reinstadler.github.io/alrein-ui/r/button.json
```

The first item you add pulls in `theme` and `fx` automatically and adds one `@import` line to your
`app.css`.

## What "superset" means here, precisely

`shadcn-svelte add button` from this registry replaces your `ui/button/button.svelte`. Every
upstream variant (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`), every size
(`default`, `xs`, `sm`, `lg`, and the four icon sizes), every prop and every class string is
byte-identical to upstream. `scripts/consumer-smoke.mjs` installs the upstream components into a
throwaway project first and then overwrites them, asserting each survivor by name — so this is a
tested claim, not an intention.

**Style coupling, stated plainly.** shadcn-svelte's styles (`nova`, `vega`, …) differ in their size
and radius rhythm. Overwriting a file necessarily bakes one in. alrein-ui is authored against
**`vega`** (`components.json` → `"style": "vega"`, preset `bIkeymG`). On another style you will get
vega's `h-9`/`rounded-md` button metrics. Size, spacing and colour otherwise come entirely from
shadcn's Tailwind scale and token set — see amendment A9.

## The effect layer in one paragraph

Seven effects, each carrying a signal rather than decoration: **press** ("I registered your click",
always on), **ghost** (a variant, already upstream), **gradient**, **glow**, **shimmer**, **tilt**,
**magnet**. Which components may use which is a hard contract — the
[capability matrix](./SPEC.md#34-capability-matrix) — enforced by *withholding the prop*, so
`<Badge tilt />` is a compile error. Contradictions like `ghost + glow` are compile errors too.
Everything resolves through a seven-step chain (`src/lib/fx/resolution.ts`): `data-fx="off"` wins
over everything, then reduced motion, then coarse pointer, then the matrix, then density, then the
per-instance prop, then the preset.

**Calm by default.** Nothing glows, tilts, shimmers or magnets unless asked. `data-fx="expressive"`
is opt-in and is the only level where magnet exists at all.

```svelte
<FxScope level="expressive">
  <Button glow>Primary</Button>
</FxScope>
```

## Guarantees, and how each is checked

| Guarantee | Check | Command |
|---|---|---|
| Types are sound, no `any` | `svelte-check` strict | `pnpm check` |
| The §8 failure patterns cannot return | 13 grep rules over the diff | `pnpm bans:check` |
| The §3.2 resolution order is correct | 40 unit tests, one per step | `pnpm test` |
| **Effects never touch the layout box** | parses the built CSS; no effect rule may declare or animate a layout property | `pnpm layout:check` |
| Registry items are internally consistent | paths, targets, `local:` deps, declared deps | `pnpm registry:check` |
| `shadcn-svelte add` genuinely works | scaffolds a real consumer, installs over real upstream files, builds | `pnpm consumer:smoke` |
| Forbidden prop combinations | `@ts-expect-error` in `*.types.ts` | `pnpm check` |

`pnpm layout:check` is how acceptance criterion §7.10 is met. Eyeballing a reflow is unreliable;
proving that nothing in the effect layer *can* reflow is stronger and runs in CI.

## Layout

```
src/lib/
  fx/          capability matrix, §3.2 resolution, FxContext/FxScope,
               the singleton pointer engine, five effect attachments
  motion/      cubic-bezier solver, eight transitions, MorphIndicator
  styles/alrein/  tokens.css · fx.css · press.css · motion.css
  components/ui/  button · card · badge
scripts/       check-bans · check-registry · check-layout-safety · consumer-smoke
```

**One pointer loop.** All glow, tilt and magnet instances register with
`src/lib/fx/pointer.svelte.ts`, which runs exactly one `requestAnimationFrame`, one `pointermove`
listener, one `IntersectionObserver` and one `visibilitychange` listener for the whole page. It is
the only file permitted to do any of that, and `bans:check` enforces it.

## Development

```bash
pnpm install
pnpm dev
pnpm check && pnpm test && pnpm bans:check && pnpm registry:check
pnpm exec vite build && pnpm layout:check
```

pnpm only. `npm install` and `yarn` are blocked by shims.
