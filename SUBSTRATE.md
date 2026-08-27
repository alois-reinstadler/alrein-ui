# Substrate verification — 2026-08-27

Checked against live sources, not training data. Versions confirmed from the npm registry;
component source pulled from the live shadcn-svelte registry at
`https://shadcn-svelte.com/registry/styles/vega/<name>.json`.

## Versions (all current)

| Package | Latest | resax used |
|---|---|---|
| shadcn-svelte | 1.5.0 | 1.5.0 |
| bits-ui | 2.19.0 | 2.19.0 |
| svelte | 5.56.10 | 5.56.1 |
| tailwindcss / @tailwindcss/vite | 4.3.3 | 4.3.0 |
| tailwind-variants | 3.3.1 | 3.3.1 |
| tailwind-merge | 3.6.0 | 3.6.0 |
| @sveltejs/kit | 2.70.3 | 2.63.0 |

## Confirmed correct in SPEC.md

- **Registry item schema.** `registry:{ui,lib,hook,component,block,page,file,style,theme}`.
  `registryDependencies` accepts a plain name (**always resolves to the official shadcn-svelte
  registry**), a full URL, `local:<name>`, or `./<name>.json`. `cssVars` (theme/light/dark) and
  `css` (`@layer base`, `@layer components`, `@utility`, `@keyframes`) both exist — so the `.sq`
  utility and the `data-[state]` keyframes ship as registry `css` payloads, not loose files.
  Schema: `https://shadcn-svelte.com/schema/registry-item.json`.
- **Attachments.** Svelte 5.29+. `type Attachment<T> = (el: T) => void | (() => void)`.
  `createAttachmentKey` for spread props, `fromAction` for legacy library actions.
- **`corner-shape: squircle`.** Chromium/Edge 139+ only, ~65% global, **not Baseline**; no public
  Safari or Firefox timeline as of June 2026. The spec's progressive-enhancement-only decision
  (no SVG clip-path fallback) is correct and current.
- **Tailwind v4 CSS-first `@theme` / `@utility`** — current.

## Corrections to SPEC.md's assumptions

- **§1 "namespace re-export (`export * as Button from ...`)" is wrong.** Current shadcn-svelte
  uses **named re-exports** in `index.ts` and expects the *consumer* to namespace:
  ```ts
  // ui/card/index.ts
  export { Root, Content, /* … */ Root as Card, Content as CardContent, /* … */ };
  // call site
  import * as Card from "$lib/components/ui/card/index.js";
  ```
  There is no `export * as` anywhere upstream. Match the real pattern.

- **§4 "bits-ui animates via `data-state` and `forceMount`, *not* Svelte transitions" is wrong.**
  bits-ui v2 dropped the old `transition*` props, but `forceMount` + the `child` snippet
  (`{ props, open }`, or `{ wrapperProps, props, open }` for floating content) exposes `open` so
  Svelte transitions work fine:
  ```svelte
  <Popover.Content forceMount>
    {#snippet child({ wrapperProps, props, open })}
      {#if open}<div {...wrapperProps}><div {...props} transition:scaleFade></div></div>{/if}
    {/snippet}
  </Popover.Content>
  ```
  **The dual-form requirement still stands** — but for a different reason than the spec gives.
  `data-state` CSS keyframes need no `forceMount` and no snippet boilerplate, so they are the
  lighter default; the Svelte transition form is for motion that needs measured/JS-computed
  values (`collapse`, `crossfade`, `MorphIndicator`). Both read the same tokens.

- **Attachments re-run when reactive state read *inside* them changes.** So an attachment must not
  read `$state`/`$derived` directly, or every `data-fx` change tears down and re-registers the
  pointer-engine entry. Pass options as `T | (() => T)` and evaluate the getter inside the engine
  loop.

## Upstream API surface the Phase 0 supersets must preserve

```
button   variant: default | outline | secondary | ghost | destructive | link
         size:    default(h-9) | xs(h-6) | sm(h-8) | lg(h-10)
                  | icon(size-9) | icon-xs(size-6) | icon-sm(size-8) | icon-lg(size-10)
         renders <a> when href is set; data-slot="button"; bind:ref
badge    variant: default | secondary | destructive | outline | ghost | link
         h-5, rounded-4xl, text-xs; data-slot="badge"
card     7 files — card.svelte + card-{header,title,description,content,footer,action}.svelte
         Root: size: default | sm, data-size, --card-spacing, group/card, **overflow-hidden**
         data-slot: card | card-header | card-title | card-description | card-content
                  | card-footer | card-action
```

`ghost` already exists upstream on both Button and Badge, so §3.4's `ghost ●` for those two needs
no new prop — only the mutual-exclusion typing against `gradient`/`glow`.

## Open collisions between the spec and the real upstream

1. **Control scale vs upstream heights.** §2 defines `--ctrl-h-sm/md/lg = 32/40/48`. Upstream is
   `sm h-8 (32)`, `default h-9 (36)`, `lg h-10 (40)`; Input is also `h-9`. Applying the vuesax
   scale to the upstream `size` enum silently resizes every existing call site, which §1 forbids.
   Needs a decision — see the plan.
2. **Card `overflow-hidden` vs glow.** Upstream Card Root is `overflow-hidden`; §3.5 says glow
   bleeds outside the box and must not sit inside a tight `overflow: hidden`. Removing
   `overflow-hidden` would change upstream visuals (it is what rounds the corners of a
   first-child `<img>`). **Decision: keep `overflow-hidden`; Card's glow is an inner radial layer
   clipped to the card's own rounded box, not an outer bleed.** Outer bleed stays a Button-only
   treatment.
3. **`--fx-tint` colour model.** §2 specifies `--fx-tint: <accent RGB, space separated>` for
   `rgb(var(--fx-tint)/.6)`. shadcn-svelte v1 and Tailwind v4 are OKLCH throughout, so an RGB
   triplet means maintaining a second, parallel colour universe — failure `F15` exactly.
   **Decision: `--fx-tint` holds a full colour (`var(--primary)` by default) and every alpha step
   is `color-mix(in oklab, var(--fx-tint) N%, transparent)`.** Same visual result, one colour
   system, and it inherits any consumer theme change for free.

## Environment

Dev previews reach the tailnet only: `hetzner-server.tail.alrein.casa` (`100.64.0.2`),
ports 4000–4099, via `/workspace/previews/preview.env` + `dev-port`. Never bind `0.0.0.0`.
