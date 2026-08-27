# alrein-ui

A **shadcn-style registry**, not an npm package. Components are installed as source into your
project with `shadcn-svelte add`, and they **overwrite the upstream shadcn-svelte file at the same
path with a superset** — same import path, same API, plus a disciplined effect layer.

Design and implementation are governed by [`SPEC.md`](./SPEC.md). Substrate verification and the
resolved collisions with the real upstream API are in [`SUBSTRATE.md`](./SUBSTRATE.md).

**Status: Phase 2 in progress.** Phase 0 (foundation plus Button, Card and Badge) is complete and
recorded in [`ACCEPTANCE.md`](./ACCEPTANCE.md). The docs site lists the full 28-component inventory with
what has shipped and what has not.

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
| The §8 failure patterns cannot return | 14 grep rules over the diff | `pnpm bans:check` |
| The §3.2 resolution order is correct | 40 unit tests, one per numbered step | `pnpm test` |
| **Effects never touch the layout box** | parses the built CSS; no effect rule may declare or animate a layout property | `pnpm layout:check` |
| **The policy resolves correctly at every level** | server-renders 4 pages × 3 levels and asserts what may appear | `pnpm ssr:check` |
| **An upstream `add` has not reverted a superset** | every extended component still carries its marker | `pnpm supersets:check` |
| `registry.json` is not stale | regenerates from `registry.config.mjs` and diffs | `pnpm registry:gen --check` |
| Registry items are internally consistent | paths, targets, `local:` deps, declared deps | `pnpm registry:check` |
| `shadcn-svelte add` genuinely works | scaffolds a real consumer, installs over real upstream files, builds | `pnpm consumer:smoke` |
| Forbidden prop combinations | `@ts-expect-error` in `*.types.ts` and `*.call-sites.svelte` | `pnpm check` |

Three of those exist because eyeballing is not available and would be weaker anyway:

- **`layout:check`** meets acceptance criterion §7.10. Proving that nothing in the effect layer
  *can* reflow beats toggling `data-fx` and watching.
- **`ssr:check`** covers part of §7.7 and §7.9. A server is a machine with no pointer — the same
  situation as a touch device — so what reaches the markup is a real test of the policy. It caught
  a live bug on its first run: `FxScope` configured itself in `$effect.pre`, which does not run
  during SSR, so every scope rendered its parent's level server-side.
- **`supersets:check`** exists because `shadcn-svelte add field input-group` once pulled `button` in
  as a registry dependency and silently reverted the entire alrein Button to stock.

## Layout

```
src/lib/
  fx/          capability matrix, §3.2 resolution (pure, unit-tested),
               FxContext/FxScope, the singleton pointer engine,
               five effect attachments
  motion/      cubic-bezier solver, eight transitions, MorphIndicator
  styles/alrein/  tokens.css · fx.css · press.css · motion.css
  components/ui/  the extended shadcn-svelte components
  demo/        the docs site's shared pieces and the component inventory
registry.config.mjs   the registry, declared once
scripts/       gen-registry · check-bans · check-registry · check-supersets
               check-layout-safety · check-ssr · consumer-smoke
```

`registry.json` is **generated** from `registry.config.mjs` — a component names its directory and
the generator reads the file list off disk, so adding a file cannot be forgotten. The previous
attempt hand-maintained 53 KB of it across 63 items.

**One pointer loop.** All glow, tilt and magnet instances register with
`src/lib/fx/pointer.svelte.ts`, which runs exactly one `requestAnimationFrame`, one `pointermove`
listener, one `IntersectionObserver` and one `visibilitychange` listener for the whole page. It is
the only file permitted to do any of that, and `bans:check` enforces it.

## Development

```bash
pnpm install
pnpm dev

# the full gate, in the order CI runs it
pnpm check && pnpm test && pnpm bans:check && pnpm supersets:check && pnpm ssr:check
pnpm registry:gen --check && pnpm registry:build && pnpm registry:check
pnpm exec vite build && pnpm layout:check
```

`pnpm consumer:smoke` is the slow one — it scaffolds an entire throwaway SvelteKit app — so it runs
nightly rather than per push.

pnpm only. `npm install` and `yarn` are blocked by shims.
