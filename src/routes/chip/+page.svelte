<script lang="ts">
	import { Chip } from '$lib/components/ui/chip/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const variants = ['soft', 'solid', 'outline', 'ghost'] as const;
	let filters = $state(['Wien', 'Graz', 'Linz', 'Salzburg']);
	let selected = $state(true);

	function remove(name: string) {
		filters = filters.filter((entry) => entry !== name);
	}
</script>

<svelte:head><title>Chip · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Chip</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §3.4 erlaubt Chip
		<strong>Ghost und Gradient und sonst nichts</strong>: kein Glow, kein Shimmer, kein Tilt, kein
		Magnet. Chips treten in Rudeln auf, und genau das ist der Grund.
	</p>
</header>

<Section title="Varianten und Größen">
	<Row label="Varianten">
		{#each variants as variant (variant)}
			<Chip {variant}>{variant}</Chip>
		{/each}
	</Row>
	<Row label="Größen">
		<Chip size="sm">klein</Chip>
		<Chip>Standard</Chip>
	</Row>
	<Row label="mit Punkt">
		<Chip dot>Aktiv</Chip>
		<Chip variant="outline" dot>Entwurf</Chip>
	</Row>
</Section>

<Section
	title="Auswählbar"
	note="Mit selectable wird der Beschriftungsbereich ein echter <button> mit aria-pressed. Ohne selectable bleibt der Chip ein <span> und hält sich auf ehrliche Weise aus der Tab-Reihenfolge heraus: indem er nicht interaktiv ist. Auswahl ist ein Zustand, kein Effekt — §3.5 verbietet, dass ein Effekt der alleinige Träger eines Zustands ist."
>
	<Row label="Umschalten">
		<Chip selectable bind:selected>Nur verfügbare</Chip>
		<Chip selectable variant="outline">Mit Bildern</Chip>
	</Row>
</Section>

<Section
	title="Entfernbar"
	note="Der Entfernen-Knopf ist ein echter, fokussierbarer Button mit eigenem Namen. Die Quelle setzt hier tabIndex = -1, macht ihn also nur mit der Maus erreichbar — A15: dieser Mangel wird nicht geerbt. Der Chip entfernt sich außerdem nicht selbst; das tut die Liste, der er gehört."
>
	<Row label="Filter">
		{#each filters as filter (filter)}
			<Chip removable onremove={() => remove(filter)} removeLabel="Filter {filter} entfernen">
				{filter}
			</Chip>
		{/each}
		{#if filters.length === 0}
			<span class="text-sm text-muted-foreground">Alle entfernt — Seite neu laden.</span>
		{/if}
	</Row>
</Section>

<Section title="Gradient" note="Der einzige Effekt, den die Matrix Chip zugesteht.">
	<Row label="gradient">
		<Chip gradient>Empfohlen</Chip>
		<Chip variant="solid" gradient>Aktion</Chip>
	</Row>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="ghost und outline sind transparente Flächen — die eine hat nichts zu bemalen, die andere verlöre den Rand, für den sie existiert."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Chip variant="ghost" gradient />     <Chip variant="outline" gradient />
<Chip glow />    <Chip shimmer />    <Chip tilt />    <Chip magnet />`}</code
		></pre>
</Section>
