# Handoff — alrein-ui

Paste this as the first message of a new session.

---

You are picking up the vuesax → Svelte 5 + shadcn-svelte port at `~/repos/alrein-ui`. It is
**feature-complete**: all five phases of `SPEC.md` §6 are built. Your job is the tail — verification
that could not be done, two known gaps, and deployment.

## Read first, in this order

1. **`SPEC.md`** — authoritative. §1 conventions and hard bans, §3 the effect system, §7 the twelve
   acceptance criteria, §8 the audit of the failed prior attempt (`F1`–`F18`), and **§9, which is
   28 amendments (A1–A28) recording every decision that departs from the original spec and why.**
   §9 is the most important section for you: it is where "why is it like this" is answered.
2. **`ACCEPTANCE.md`** — per-phase §7 self-checks, **including what is not verified and why**, and a
   list of every bug each check caught.
3. **`README.md`** — the guarantee/check table and how to run the gate.
4. **`SUBSTRATE.md`** — live-docs verification of the shadcn-svelte / bits-ui / Tailwind substrate.
5. `references/VUESAX-INTENT.md` and `VUESAX-INTENT-2.md` — design-intent digests of the vuesax
   sources (Phase 1, and Phases 2–3). Read the section for whatever you touch.

## State

29 components · 31 registry items · 172 files · 63 commits on `master` · clean tree · **no git remote.**

Run the gate before you change anything, so you know it was green when you started:

```bash
pnpm install
pnpm check && pnpm test && pnpm bans:check && pnpm supersets:check
pnpm registry:gen --check && pnpm registry:build && pnpm registry:check
pnpm exec vite build && pnpm layout:check && pnpm ssr:check
```

Expected: 1135 files / 0 errors · 145 tests · 14 ban rules 0 violations · 50 supersets marked ·
31 registry items · 45 effect rules touch no layout · 31 pages × 3 effect levels.
`pnpm consumer:smoke` also passes but takes minutes — it scaffolds a real SvelteKit app.

## Ground rules — these are not negotiable and breaking one is a rejected change

- **Never run `shadcn-svelte add` for a component that already exists here.** It pulls dependencies
  and silently overwrites supersets with the stock upstream file. It has happened twice: once
  reverting Button, once reverting four components at a stroke. `pnpm supersets:check` catches it;
  recover with `git checkout -- <path>`.
- **`registry.json` is generated.** Edit `registry.config.mjs` and run `pnpm registry:gen`.
- Every hard ban in §1 is mechanised in `scripts/check-bans.mjs`. If a rule fires on something
  legitimate, **change the rule and say why in its description** — do not add a silent exclusion.
  There is precedent for both narrowing and widening.
- Effects may touch transform, filter, opacity and background only. `layout:check` enforces it and
  carve-outs are enumerated in the script with their reason.
- German UI strings, English identifiers, `de-AT`.

## Outstanding work, in the order I would do it

### 1. Browser verification — the largest gap, and it blocks acceptance criteria
`§7.6` (focus ring unobscured at every `data-fx` level) and `§7.7` (correct in light and dark) are
**PARTIAL for all five phases**, because no browser automation host exists in this container:
`preview_status` reports none and CDP on `127.0.0.1:9222` is refused. Per the operating rules I did
not start one.

If the Xvfb/Chrome stack is up in your session: the docs site runs on `pnpm dev`, every page
accepts `?fx=off|calm|expressive` and `?density=list|table`, and the dark toggle is in the header.
Walk all 31 pages at three levels in both schemes. Look specifically for: a focus ring obscured by
an effect layer, a glow that reads as an error state on a form field, and any layout shift when
toggling `data-fx` (which `layout:check` says is impossible — confirm it).

Do **not** add pixel-diff visual regression tests over pointer-tracked or looping effects. That is
`F18`: the prior attempt spent its last fifteen commits fighting exactly that.

### 2. Two known functional gaps
- **Tabs `chrome` ships without its shoulders (A25a).** The source's sled has two quarter-disc
  pseudo-elements that squash under `scaleX`. Fixing it needs an optional **counter-scaled child**
  in `src/lib/motion/morph-indicator.svelte` — the digest predicted this as the one thing FLIP
  cannot reproduce. The radius track it needed is already there.
- **§5's "Button progress state" was never built.** `UploadState` and `UploadArea` exist and share
  the class as specified, but Button has no progress/loading variant wired to it. Check §3.4 before
  adding props.

### 3. A23 is recorded but unapplied
`--fx-glow-radius: 180px` is a **Button-sized** number. The source scales it per component — Rating
90, Tabs/Pagination 96, Breadcrumb 120, Avatar/Chip 160, Timeline 200, Accordion 220, Alert 240,
Sidebar 320. Only `UploadArea` passes an explicit radius (220). Every other `glowEffect()` call
inherits the Button default, so glow on Alert and Accordion is under-scaled. One-line fix each; the
list is in `VUESAX-INTENT-2.md` §15.

### 4. Deployment — never done
There is **no git remote**. `registry.json`'s `homepage` is
`https://alois-reinstadler.github.io/alrein-ui`, which is an assumption I inferred from the prior
project and **the maintainer has not confirmed**. `.github/workflows/ci.yml` has a Pages job with
`BASE_PATH=/alrein-ui` that has never run. Confirm the repo owner/name before publishing anything.

### 5. Smaller things
- `consumer:smoke` runs manually / nightly, not per push. That is deliberate (it builds a whole
  app), but it means a registry regression can sit for a day.
- `references/VUESAX-INTENT-2.md` covers Phases 2–3 only. Phase 4's sources (`color-picker`,
  `code`, `upload-file`) were **never digested** — those four components were built from §5 and the
  capability matrix alone. If fidelity matters there, digest them the way the other two were.

## Traps that will bite you

- **`display: contents` does not remove an element from the *selector* tree.** Wrapping children in
  `<FxScope>` breaks any `> [data-slot]` selector reaching them. `button-group.svelte` sets the
  context on its own element instead, and had to.
- **`$effect` does not run during SSR.** `FxScope` configured its context in `$effect.pre` and every
  scope rendered its parent's level server-side. Configure synchronously with getters.
- **`{#snippet children(...)}` shadows the `children` prop** and recurses until the stack blows.
  `svelte-check` does not catch it; only rendering does.
- **Regexes over rendered HTML:** Tailwind class values contain `>` (`[&>span:last-child]`), so
  `[^>]*` breaks. I reported a working fix as broken because of this.
- **`Math.round` at an exact `.5` tie** is unstable under any float perturbation. Two of my colour
  tests were measuring the tie rather than the converter.
- `.svelte.ts` files are runes modules; `vitest.config.ts` loads the Svelte plugin for that reason.

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
