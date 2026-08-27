<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const variants = ['default', 'secondary', 'outline', 'destructive', 'ghost', 'link'] as const;
	const sizes = ['xs', 'sm', 'default', 'lg'] as const;
	const iconSizes = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;
</script>

<svelte:head><title>Button · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Button</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Buttons. §3.4 erlaubt Gradient (nur primär), Glow
		(primär/akzent), Shimmer (ausgelöst), Tilt (ab Größe md) und Magnet (nur ausdrucksstark).
	</p>
</header>

<Section
	title="Unverändert gegenüber shadcn-svelte"
	note="Diese Zeilen enthalten keine einzige alrein-Prop. Sie müssen auf jeder Effektstufe identisch aussehen. Druckfeedback ist die Ausnahme: es ist laut §3.1 immer aktiv und degradiert bei „Aus“ auf Farbe und Deckkraft."
>
	<Row label="Varianten">
		{#each variants as variant (variant)}
			<Button {variant}>{variant}</Button>
		{/each}
	</Row>
	<Row label="Größen">
		{#each sizes as size (size)}
			<Button {size}>{size}</Button>
		{/each}
	</Row>
	<Row label="Icon-Größen">
		{#each iconSizes as size (size)}
			<Button {size} aria-label={size}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</Button>
		{/each}
	</Row>
	<Row label="Zustände">
		<Button disabled>deaktiviert</Button>
		<Button href="/">als Link</Button>
		<Button href="/" disabled>Link deaktiviert</Button>
	</Row>
</Section>

<Section
	title="Effekte"
	note="Jeder Effekt hier ist pro Instanz angefordert. Bei „Ruhig“ gilt genau das Angeforderte; bei „Ausdrucksstark“ glüht der Primärbutton zusätzlich von selbst, und Magnet wird überhaupt erst verfügbar."
>
	<Row label="gradient (nur primär)">
		<Button gradient>Jetzt starten</Button>
		<Button variant="secondary" gradient>sekundär + gradient</Button>
	</Row>
	<Row label="glow (primär/akzent)">
		<Button glow>Hauptaktion</Button>
		<Button variant="secondary" glow>sekundär</Button>
	</Row>
	<Row label="shimmer (ausgelöst)">
		<Button shimmer>Zeigen</Button>
		<Button variant="ghost" shimmer>ghost + shimmer</Button>
	</Row>
	<Row label="tilt (ab Größe md)">
		<Button tilt size="lg">Kippen</Button>
		<Button tilt size="sm">zu klein — bleibt aus</Button>
	</Row>
	<Row label="magnet (nur ausdrucksstark)">
		<Button magnet size="lg">Unübersehbar</Button>
	</Row>
	<Row label="explizit abgeschaltet">
		<Button glow={false}>glow={'{false}'} schlägt jede Voreinstellung</Button>
	</Row>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.5 verlangt, dass widersprüchliche Kombinationen Typfehler sind, keine Kommentare. Diese Zeilen lassen sich nicht schreiben — sie stehen hier als Text, weil sie sich nicht kompilieren ließen."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Button variant="ghost" gradient />   ← eine transparente Fläche hat nichts zu bemalen
<Button variant="ghost" glow />       ← und nichts, woraus sie glühen könnte
<Button variant="link" glow />        ← ebenso
<Button parallax />                   ← kein Effekt, den die Matrix vergibt`}</code
		></pre>
</Section>
