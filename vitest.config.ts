import { defineConfig } from 'vitest/config';

/**
 * Node environment, no DOM. The one piece of logic worth unit-testing at this
 * stage — the SPEC.md §3.2 resolution chain — was deliberately extracted into a
 * pure function (`src/lib/fx/resolution.ts`) so it needs neither jsdom nor a
 * browser. Component-level behaviour is covered by svelte-check, the type
 * contracts in `*.types.ts`, `check-bans`, `check-layout-safety` and
 * `consumer-smoke`.
 */
export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
