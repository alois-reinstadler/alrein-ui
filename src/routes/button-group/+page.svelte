<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';
</script>

<svelte:head><title>ButtonGroup · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">ButtonGroup</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-ButtonGroup. Ihre Zeile in §3.4 ist ungewöhnlich: sie
		beschränkt die <em>Kinder</em>, nicht sich selbst.
	</p>
</header>

<Section title="Unverändert gegenüber shadcn-svelte">
	<Row label="horizontal">
		<ButtonGroup.Root>
			<Button variant="outline">Links</Button>
			<Button variant="outline">Mitte</Button>
			<Button variant="outline">Rechts</Button>
		</ButtonGroup.Root>
	</Row>
	<Row label="vertikal">
		<ButtonGroup.Root orientation="vertical">
			<Button variant="outline">Oben</Button>
			<Button variant="outline">Unten</Button>
		</ButtonGroup.Root>
	</Row>
</Section>

<Section
	title="Die Beschränkung"
	note="§3.4 liest sich als „ghost ● · gradient ● · glow — · shimmer — · tilt — · magnet —“. Als Regel statt als Tabelle gelesen heißt das: Buttons in einer Gruppe dürfen bemalt werden und dürfen sich nicht bewegen. Und genau das tut ein Dichtebereich — die Gruppe braucht also keinen eigenen Mechanismus, sondern den, den es schon gibt."
>
	<div class="flex flex-col gap-4">
		<Row label="einzeln">
			<Button gradient shimmer glow>gradient + shimmer + glow</Button>
		</Row>
		<Row label="dieselben Props, gruppiert">
			<ButtonGroup.Root>
				<Button gradient shimmer glow>bleibt gradient</Button>
				<Button variant="outline">Zweiter</Button>
			</ButtonGroup.Root>
		</Row>
	</div>
	<p class="text-xs text-muted-foreground">
		Der gruppierte Button behält Gradient und verliert Shimmer, Glow und Tilt — aufgelöst über
		dieselbe Kette aus §3.2 wie alles andere. Der Grund, warum die Regel stimmt: Glow bedeutet „das
		absichtsstärkste Ziel auf dieser Fläche“ (§3.1), und eine Buttongruppe ist eine Menge
		Gleichrangiger. Drei glühende Gleichrangige sind keine Hervorhebung.
	</p>
</Section>

<Section
	title="Warum die Gruppe selbst der Bereich ist"
	note="Nicht Mikro-Optimierung, sondern Korrektheit. <FxScope> rendert ein div mit display: contents, und display: contents entfernt ein Element aus dem Boxbaum, aber nicht aus dem Selektorbaum. Ein Wrapper hätte also jede der `> [data-slot]`-Regeln oben außer Kraft gesetzt und die Gruppe in Einzelbuttons zerfallen lassen. Die Gruppe setzt den Kontext daher an ihrem eigenen Element."
>
	<Row label="Trenner und Text">
		<ButtonGroup.Root>
			<Button variant="outline">Speichern</Button>
			<ButtonGroup.Separator />
			<Button variant="outline" aria-label="Weitere Optionen">⋯</Button>
		</ButtonGroup.Root>
	</Row>
</Section>
