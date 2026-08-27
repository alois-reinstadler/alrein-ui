import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

/**
 * Node environment, no DOM.
 *
 * The Svelte plugin is here for one reason: `.svelte.ts` modules are **runes
 * modules**, so `$state` in `color-state.svelte.ts` is a compiler construct
 * rather than a function. Without the plugin they load as plain TypeScript and
 * fail at the first rune with `$state is not defined`.
 *
 * Everything tested here is deliberately DOM-free — the §3.2 resolution chain,
 * the cubic-bezier solver, the OKLCH converter and the colour state class were
 * all written as pure modules so they could be. Component behaviour is covered
 * by svelte-check, the `*.types.ts` contracts, `check-bans`,
 * `check-layout-safety`, `check-ssr` and `consumer-smoke`.
 */
export default defineConfig({
	plugins: [svelte({ compilerOptions: { runes: true } })],
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
