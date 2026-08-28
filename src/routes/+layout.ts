/**
 * Prerender the whole docs site.
 *
 * `adapter-static` was configured with `fallback: '404.html'` and nothing was
 * ever marked prerenderable, so the first Pages deployment shipped as a pure
 * SPA: the only HTML in `build/` was the fallback. GitHub Pages then served
 * that fallback — with an HTTP **404** — for every route including `/`. The site
 * worked, because the client router booted and rendered the right page, but
 * every response said "not found" to anything that was not a browser, and there
 * was no content at all without JavaScript.
 *
 * Every route here is a static demo page with no loader and no dynamic segment,
 * so there is nothing to prerender *against* — which is why this is one line at
 * the root rather than a per-route decision. `prerender.handleHttpError: 'fail'`
 * was already set in `vite.config.ts`, so a broken internal link fails the build
 * rather than being deployed.
 *
 * `?fx=` and `?density=` still work. SvelteKit prerenders a path once, without
 * its query string, so the baked HTML carries the default level and the client
 * applies the requested one as it hydrates — the same thing that happens today,
 * minus the 404.
 */
export const prerender = true;
