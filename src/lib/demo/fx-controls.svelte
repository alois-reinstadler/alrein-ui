<script lang="ts">
	import type { FxDensity, FxLevel } from '$lib/fx/context.svelte.js';

	let {
		level = $bindable('calm'),
		density = $bindable('default'),
		dark = $bindable(false)
	}: { level: FxLevel; density: FxDensity; dark: boolean } = $props();

	const levels: { value: FxLevel; label: string; hint: string }[] = [
		{ value: 'off', label: 'Aus', hint: 'Nichts Dekoratives. Druckfeedback nur über Farbe und Deckkraft.' },
		{ value: 'calm', label: 'Ruhig', hint: 'Standard. Effekte nur dort, wo sie pro Instanz angefordert werden.' },
		{
			value: 'expressive',
			label: 'Ausdrucksstark',
			hint: 'Komponenten mit fxDefault leuchten von selbst: Primärbutton glüht, Card kippt. Magnet wird verfügbar.'
		}
	];

	const densities: { value: FxDensity; label: string; hint: string }[] = [
		{ value: 'default', label: 'Normal', hint: '' },
		{ value: 'list', label: 'Liste', hint: 'Glow, Tilt und Magnet abgeschaltet.' },
		{ value: 'table', label: 'Tabelle', hint: 'Glow, Tilt und Magnet abgeschaltet.' }
	];

	// The `dark` class belongs on <html>, which is where shadcn's dark variant looks.
	$effect(() => {
		document.documentElement.classList.toggle('dark', dark);
	});

	const hint = $derived(
		[
			levels.find((entry) => entry.value === level)?.hint,
			densities.find((entry) => entry.value === density)?.hint
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div
	data-slot="fx-controls"
	class="sticky top-0 z-50 flex flex-wrap items-center gap-x-6 gap-y-3 border-b bg-background/85 px-6 py-4 backdrop-blur-sm"
>
	<fieldset class="flex items-center gap-2">
		<legend class="sr-only">Effektstufe</legend>
		<span class="text-xs font-medium text-muted-foreground">Effektstufe</span>
		{#each levels as entry (entry.value)}
			<label
				class="cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors duration-fast ease-fx-out has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
			>
				<input type="radio" bind:group={level} value={entry.value} class="sr-only" />
				{entry.label}
			</label>
		{/each}
	</fieldset>

	<fieldset class="flex items-center gap-2">
		<legend class="sr-only">Dichte</legend>
		<span class="text-xs font-medium text-muted-foreground">Dichte</span>
		{#each densities as entry (entry.value)}
			<label
				class="cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors duration-fast ease-fx-out has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
			>
				<input type="radio" bind:group={density} value={entry.value} class="sr-only" />
				{entry.label}
			</label>
		{/each}
	</fieldset>

	<label class="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
		<input type="checkbox" bind:checked={dark} class="size-3.5 accent-primary" />
		Dunkel
	</label>

	{#if hint}
		<p class="basis-full text-xs text-muted-foreground">{hint}</p>
	{/if}
</div>
