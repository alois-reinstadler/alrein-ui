<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { FxScope } from '$lib/fx/index.js';
	import type { FxDensity, FxLevel } from '$lib/fx/context.svelte.js';
	import FxControls from '$lib/demo/fx-controls.svelte';
	import { byPhase } from '$lib/demo/nav.js';

	let { children } = $props();

	/*
	 * The effect level lives in the layout, not in a page, so it survives
	 * navigation. Comparing two components at `expressive` is the point of the
	 * demo, and a control that resets on every click cannot do that.
	 *
	 * `?fx=` and `?density=` seed it. That is not a convenience: it is what makes
	 * the level checkable without a browser. `pnpm ssr:check` fetches each page at
	 * each level and asserts what may and may not appear in the markup, which
	 * covers part of acceptance criterion §7.7 in CI rather than by eye.
	 */
	function initialLevel(): FxLevel {
		const requested = page.url.searchParams.get('fx');
		return requested === 'off' || requested === 'expressive' || requested === 'calm'
			? requested
			: 'calm';
	}

	function initialDensity(): FxDensity {
		const requested = page.url.searchParams.get('density');
		return requested === 'list' || requested === 'table' ? requested : 'default';
	}

	let level = $state<FxLevel>(initialLevel());
	let density = $state<FxDensity>(initialDensity());
	let dark = $state(false);

	const groups = byPhase();
	const current = $derived(page.url.pathname.replace(base, '').replace(/^\/|\/$/g, ''));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<FxControls bind:level bind:density bind:dark />

<div class="mx-auto flex w-full max-w-7xl gap-8 px-6">
	<nav aria-label="Komponenten" class="hidden w-52 shrink-0 py-8 lg:block">
		<a
			href="{base}/"
			class="block cn-font-heading text-lg font-medium"
			aria-current={current === '' ? 'page' : undefined}>alrein-ui</a
		>
		<a
			href="{base}/fx"
			aria-current={current === 'fx' ? 'page' : undefined}
			class="mt-2 mb-6 block rounded-md px-2 py-1 text-sm transition-colors duration-fast ease-fx-out hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-medium"
			>Effektsystem</a
		>
		{#each groups as group (group.phase)}
			<p class="mt-5 mb-1.5 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
				{group.phase}. {group.title}
			</p>
			<ul class="flex flex-col">
				{#each group.entries as entry (entry.slug)}
					<li>
						{#if entry.status === 'shipped'}
							<a
								href="{base}/{entry.slug}"
								aria-current={current === entry.slug ? 'page' : undefined}
								class="block rounded-md px-2 py-1 text-sm transition-colors duration-fast ease-fx-out hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-medium"
							>
								{entry.name}
							</a>
						{:else}
							<span class="block px-2 py-1 text-sm text-muted-foreground/50" title="Noch nicht gebaut">
								{entry.name}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/each}
	</nav>

	<!--
		One scope around the whole docs body. Nothing inside passes an effect level,
		and every effect still resolves through SPEC.md §3.2 — switching the control
		above changes behaviour without changing a single prop anywhere below.
	-->
	<FxScope {level} {density} class="min-w-0 flex-1 py-8">
		{@render children()}
	</FxScope>
</div>
