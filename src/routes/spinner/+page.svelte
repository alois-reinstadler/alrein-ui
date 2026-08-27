<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const variants = ['arc', 'grid', 'comet'] as const;
	const sizes = ['sm', 'default', 'lg', 'xl'] as const;
	const speeds = ['slow', 'normal', 'fast'] as const;
</script>

<svelte:head><title>Spinner · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Spinner</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §5 fasst <code>spinner-grid</code> und
		<code>spinner-comet</code> zu einer Komponente mit <code>variant</code> zusammen.
		<strong>Keine dekorativen Effekte</strong>: §3.4 hat gar keine Zeile für Spinner, und das ist
		richtig — ein Spinner ist eine Statusanzeige, und ihn zu schmücken konkurriert mit dem, was er
		sagt.
	</p>
</header>

<Section title="Varianten">
	<Row label="arc · grid · comet">
		{#each variants as variant (variant)}
			<Spinner {variant} size="lg" />
		{/each}
	</Row>
</Section>

<Section title="Größen" note="Aus shadcns Skala (A9). Nichts hier erfindet eine Höhe.">
	<Row label="sm → xl">
		{#each sizes as size (size)}
			<Spinner {size} />
		{/each}
	</Row>
</Section>

<Section
	title="Geschwindigkeit"
	note="Eine erstklassige Achse, und aus gutem Grund: ein dreifacher Punkthüpfer und ein Kegelschwenk wirken bei gleicher Dauer nicht gleich schnell. Jede Stufe multipliziert dasselbe Schleifen-Token, statt eine eigene Dauer zu deklarieren — so erreicht reduzierte Bewegung alle von einer Stelle aus."
>
	<Row label="slow · normal · fast">
		{#each speeds as speed (speed)}
			<Spinner {speed} size="lg" />
		{/each}
	</Row>
</Section>

<Section
	title="Reduzierte Bewegung (A17)"
	note="Die Schleife wird langsamer, nicht angehalten: --fx-spin-duration geht von 900 ms auf 2400 ms. Ein stillstehender Spinner behauptet, die Arbeit sei fertig — und „ruhig“ ist nicht dasselbe wie „unwahr“. Die Quelle kommt unabhängig zum selben Schluss. Zum Prüfen prefers-reduced-motion in den Entwicklerwerkzeugen einschalten: es dreht sich weiter, nur bedächtiger."
>
	<Row label="dieselbe Komponente">
		<Spinner size="lg" />
	</Row>
</Section>

<Section
	title="overlay"
	note="Füllt den nächsten positionierten Vorfahren mit einem weichgezeichneten Schleier. Der Vertrag lautet: das Elternelement muss position: relative sein — sonst entkommt der Schleier zum Viewport. Die Quelle liefert das ohne den Hinweis aus, und genau so landet man bei einem seitenfüllenden Overlay."
>
	<div class="grid gap-4 sm:grid-cols-2">
		<Card.Root class="relative">
			<Card.Header>
				<Card.Title>Umsatz</Card.Title>
				<Card.Description>Wird neu berechnet…</Card.Description>
			</Card.Header>
			<Card.Content><p class="text-muted-foreground">Inhalt liegt darunter.</p></Card.Content>
			<Spinner overlay label="Umsatz wird geladen" />
		</Card.Root>
		<Card.Root>
			<Card.Header><Card.Title>Ohne Overlay</Card.Title></Card.Header>
			<Card.Content><p class="text-muted-foreground">Zum Vergleich.</p></Card.Content>
		</Card.Root>
	</div>
</Section>

<Section
	title="Barrierefreiheit"
	note="role=&quot;status&quot; mit aria-live=&quot;polite&quot; an der Wurzel und aria-hidden am Glyphen. Diese Kombination sagt das Label einmal an und niemals die eigene Geometrie. Der sichtbare Text ist sr-only statt gar nicht vorhanden, damit der Name aus echtem Inhalt kommt und nicht aus einem aria-label, das eine Übersetzungspipeline übersieht."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Spinner label="Rechnung wird erstellt" />`}</code
		></pre>
</Section>
