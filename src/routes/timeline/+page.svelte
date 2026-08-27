<script lang="ts">
	import { Timeline } from '$lib/components/ui/timeline/index.js';
	import Section from '$lib/demo/section.svelte';

	const order = [
		{ title: 'Bestellung eingegangen', description: 'Drei Artikel, 148,90 €', time: '09:12' },
		{ title: 'Zahlung bestätigt', description: 'Kreditkarte', time: '09:14', tone: 'success' as const },
		{ title: 'Im Lager kommissioniert', time: '10:03' },
		{ title: 'Versandt', description: 'Post AT, Sendung 4711', time: '11:40' },
		{ title: 'Zugestellt', time: '—' }
	];

	const tasks = [
		{ title: 'Entwurf abgenommen', time: 'Mo', done: true },
		{ title: 'Umsetzung', time: 'Di' },
		{ title: 'Abnahme', time: 'Do', tone: 'warning' as const }
	];
</script>

<svelte:head><title>Timeline · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Timeline</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §5 fasst <code>timeline-compact</code> zu
		<code>variant="compact"</code> zusammen. <strong>Keine dekorativen Effekte</strong>: §3.4 hat
		keine Zeile für Timeline, und das ist richtig — eine Zeitleiste ist ein Protokoll dessen, was
		passiert ist, und Hervorhebung auf einem vergangenen Ereignis hebt nichts Handlungsfähiges
		hervor.
	</p>
</header>

<Section
	title="Fortschritt zwischen zwei Markierungen"
	note="progress ist ein gebrochener Index. 3 füllt bis zur vierten Markierung, 3.5 hält genau dazwischen. Das Zwischenhalten ist der einzige Grund, warum die Quelle hier überhaupt misst — und es ist es wert. Die Füllung ist ein scaleY von oben, kein animiertes height: die Quelle animiert die Höhe über 620 ms, §1 verbietet das, und das Bild ist dasselbe."
>
	<div class="grid gap-8 sm:grid-cols-2">
		<div>
			<p class="mb-3 text-xs font-medium text-muted-foreground">progress = 3</p>
			<Timeline entries={order} progress={3} />
		</div>
		<div>
			<p class="mb-3 text-xs font-medium text-muted-foreground">progress = 3.5 — hält dazwischen</p>
			<Timeline entries={order} progress={3.5} />
		</div>
	</div>
</Section>

<Section title='variant="compact"' note="Ein dichterer Rhythmus ohne Beschreibungen — eine Dichte, keine andere Komponente.">
	<div class="grid gap-8 sm:grid-cols-2">
		<Timeline entries={order} variant="compact" progress={2} />
		<Timeline entries={tasks} variant="compact" progress={0} />
	</div>
</Section>

<Section
	title="Erledigt"
	note="Die Quelle streicht den Titel eines erledigten Eintrags durch. Das ist eine semantische Behauptung — „das war eine Aufgabe und sie ist fertig“ —, keine Gestaltung, also ist es hier optional statt geerbt."
>
	<Timeline entries={tasks} progress={0.5} />
</Section>

<Section title="Was ein Typfehler ist">
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Timeline glow />      <Timeline gradient />    <Timeline shimmer />
<Timeline tilt />      <Timeline magnet />`}</code
		></pre>
</Section>
