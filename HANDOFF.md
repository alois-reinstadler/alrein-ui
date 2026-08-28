# Handoff — alrein-ui

Paste this as the first message of a new session.

---

You are picking up the vuesax → Svelte 5 + shadcn-svelte port at `~/repos/alrein-ui`. It is
**feature-complete and verified**: all five phases of `SPEC.md` §6 are built, and acceptance
criteria §7.1–§7.11 all pass. It is deployed and live. The one criterion still open is §7.12,
fidelity against the vuesax source.

## Read first, in this order

1. **`SPEC.md`** — authoritative. §1 conventions and hard bans, §3 the effect system, §7 the twelve
   acceptance criteria, §8 the audit of the failed prior attempt (`F1`–`F18`), and **§9, which is
   30 amendments recording every decision that departs from the original spec and why.**
   §9 is the most important section: it is where "why is it like this" is answered.
2. **`ACCEPTANCE.md`** — per-phase §7 self-checks, plus **the browser pass** at the end, which is
   the newest and most useful part.
3. **`README.md`** — the guarantee/check table and how to run the gate.
4. **`SUBSTRATE.md`** — live-docs verification of the shadcn-svelte / bits-ui / Tailwind substrate.
5. `references/VUESAX-INTENT.md` and `VUESAX-INTENT-2.md` — design-intent digests of the vuesax
   sources (Phase 1, and Phases 2–3). Read the section for whatever you touch.

## State

29 components · 31 registry items · 172 files · clean tree.

**Live at <https://alois-reinstadler.github.io/alrein-ui>**, published from `main` by
`.github/workflows/ci.yml` on every push. The registry is served from the same artifact
(`/r/<item>.json`), which is A8's whole point — the site build and the registry build cannot drift
because they are one build. `origin` is `github.com/alois-reinstadler/alrein-ui`.

Run the gate before you change anything, so you know it was green when you started:

```bash
pnpm install
pnpm check && pnpm test && pnpm bans:check && pnpm supersets:check
pnpm registry:gen --check && pnpm registry:build && pnpm registry:check
pnpm exec vite build && pnpm layout:check && pnpm ssr:check
```

Expected: 1136 files / 0 errors · 145 tests · 14 ban rules 0 violations · **51** supersets marked ·
31 registry items · 45 effect rules touch no layout · 31 pages × 3 effect levels.
`pnpm consumer:smoke` also passes but takes minutes — it scaffolds a real SvelteKit app.

## Ground rules — these are not negotiable and breaking one is a rejected change

- **Never run `shadcn-svelte add` for a component that already exists here.** It pulls dependencies
  and silently overwrites supersets with the stock upstream file. It has happened twice: once
  reverting Button, once reverting four components at a stroke. `pnpm supersets:check` catches it;
  recover with `git checkout -- <path>`. If you *extend* a new upstream file, add it to the
  `SUPERSETS` list in `scripts/check-supersets.mjs` — the check cannot infer it.
- **`registry.json` is generated.** Edit `registry.config.mjs` and run `pnpm registry:gen`.
- Every hard ban in §1 is mechanised in `scripts/check-bans.mjs`. If a rule fires on something
  legitimate, **change the rule and say why in its description** — do not add a silent exclusion.
  There is precedent for both narrowing and widening.
- Effects may touch transform, filter, opacity and background only. `layout:check` enforces it and
  carve-outs are enumerated in the script with their reason.
- German UI strings, English identifiers, `de-AT`.

## What is actually left

### 1. §7.12 — the side-by-side fidelity check against the vuesax source
The only acceptance criterion still open. It needs the shadow-DOM sources open beside the demo. Note
that **Phase 4's sources were never digested**: `color-picker`, `code` and `upload-file` were built
from §5 and the capability matrix alone. If fidelity there matters, digest them the way
`VUESAX-INTENT.md` and `VUESAX-INTENT-2.md` digest the others, then compare.

### 2. Smaller things
- `consumer:smoke` runs manually / nightly, not per push. That is deliberate (it builds a whole
  app), but it means a registry regression can sit for a day.
- The local branch was renamed `master` → `main` when the remote was added, because the workflow
  triggers on `main` and the Pages job is gated on `refs/heads/main`.

## What the last session did, so you do not redo it

- **Ran the browser pass.** `ACCEPTANCE.md` § *The browser pass* has the numbers and, more usefully,
  **four ways the sweep lied before it was made honest** — the `getBoundingClientRect` trap, the
  `:focus-visible` trap, the transition-timing trap and the stray-mouse `:hover` trap. Read those
  before writing any browser check of your own.
- **`A29`** — fixed the one real defect the sweep found: shadcn-svelte's `TabsContent` is focusable
  and paints no focus indicator (WCAG 2.4.7). `tabs-content.svelte` is now a superset.
- **`A25b`** — Tabs `chrome` has its shoulders. `MorphIndicator` counter-scales any child carrying
  `data-morph-counter-scale`; the shoulders are two masked layers per side. The old handoff listed
  this as the thing FLIP could not reproduce; it can.
- **`A30`** — built §5's Button progress state (`progress?: number | null`), on the same
  `UploadState` as `UploadArea`. Demonstrated on both `/button` and `/upload-area`.
- **Published it.** First push to `github.com/alois-reinstadler/alrein-ui`, CI green, Pages live.
  Two defects surfaced only once it was actually deployed, and both are fixed:
  - **Every URL returned HTTP 404.** `adapter-static` had `fallback: '404.html'` and no route was
    ever marked prerenderable, so the only HTML in `build/` was the fallback. It *looked* fine —
    the client router booted and rendered the right page — but curl, crawlers and anything without
    JavaScript saw "not found". `prerender = true` at the root now emits 31 real pages. Getting
    there needed a `building` guard on the `?fx=` seeding (SvelteKit refuses `url.searchParams`
    while prerendering, and `ssr:check` depends on that read), and it exposed four demo links that
    ignored `paths.base` plus two Sidebar anchors pointing at ids that do not exist.
  - **`bans:check` scanned 0 files in CI.** On a push to `main`, `HEAD` *is* `origin/main`, so the
    default diff mode compared the branch against itself and reported OK having checked nothing —
    on the one branch that deploys. It now runs `--all` on push and keeps the diff for PRs.
- **`A23` was not outstanding.** The previous handoff claimed the per-component glow radii were
  "recorded but unapplied". They were applied in the commits that built each component. Cross the
  nine source radii against §3.4 and only Avatar (160), Accordion (220) and Alert (240) are granted
  glow at all; all three carry theirs. The note in A23 records this so nobody re-checks it a third
  time.

## Traps that will bite you

- **`display: contents` does not remove an element from the *selector* tree.** Wrapping children in
  `<FxScope>` breaks any `> [data-slot]` selector reaching them. `button-group.svelte` sets the
  context on its own element instead, and had to.
- **`$effect` does not run during SSR.** `FxScope` configured its context in `$effect.pre` and every
  scope rendered its parent's level server-side. Configure synchronously with getters.
- **`{#snippet children(...)}` shadows the `children` prop** and recurses until the stack blows.
  `svelte-check` does not catch it; only rendering does. `tabs-list.svelte` names its snippets
  `shoulders` and `indicator` for exactly this reason.
- **Regexes over rendered HTML:** Tailwind class values contain `>` (`[&>span:last-child]`), so
  `[^>]*` breaks. A working fix was once reported as broken because of this.
- **`Math.round` at an exact `.5` tie** is unstable under any float perturbation. Two colour tests
  were measuring the tie rather than the converter.
- **Button has no pseudo-element left.** `fx-glow` owns `::before`, `fx-press` owns `::after`, and
  `background-image` belongs to gradient and shimmer. Anything new on Button is a real child — which
  is what the progress fill is, and why it also adds `relative isolate`.
- `.svelte.ts` files are runes modules; `vitest.config.ts` loads the Svelte plugin for that reason.
- The dev server must not bind `0.0.0.0`. The container's own address is `10.0.1.17`; the tailnet
  address `100.64.0.2` lives on the host and `EADDRNOTAVAIL`s from inside.

## Where things live

```
src/lib/fx/          capability matrix · §3.2 resolution (pure, unit-tested) ·
                     FxContext/FxScope · the singleton pointer engine · 5 attachments
src/lib/motion/      cubic-bezier solver · 8 transitions · MorphIndicator
src/lib/styles/alrein/  tokens · fx · press · motion   (press is split out so the
                        spring allowlist stays narrow)
src/lib/components/ui/  the 29 components
src/lib/demo/nav.ts     the inventory the docs site renders from
registry.config.mjs     the registry, declared once
scripts/                7 checkers — read check-bans.mjs first
```

Component sources carry long comments explaining *why*, including what was declined from the vuesax
source and on what grounds. Read the file before changing it; most surprises are already answered
in it.
