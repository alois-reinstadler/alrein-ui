<script lang="ts">
	import { UploadArea, UploadState } from '$lib/components/ui/upload-area/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Section from '$lib/demo/section.svelte';

	const plain = new UploadState();

	/*
	 * Progress is advanced by a button rather than by a timer, and that is not
	 * only to keep `bans:check` quiet: it demonstrates the actual design point.
	 * The component owns selection, validation and bookkeeping; **the caller owns
	 * the transport** and reports progress in. In a real app this call sits in an
	 * XHR `progress` handler or a streamed `fetch` reader.
	 */
	function advance(step = 0.25) {
		for (const entry of plain.items) {
			if (entry.status === "complete" || entry.status === "error") continue;
			plain.setProgress(entry.id, entry.progress + step);
		}
	}

	const restricted = new UploadState({ accept: 'image/*', maxSize: 1024 });
	const effects = new UploadState();
</script>

<svelte:head><title>UploadArea · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">UploadArea</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §5 setzt UploadArea und den
		Button-Fortschrittszustand auf eine gemeinsame <code>UploadState</code>-Klasse: eine
		Ablagefläche und ein hochladender Button sind dieselbe Zustandsmaschine in anderer Kleidung.
	</p>
</header>

<Section
	title="Das Eingabefeld ist die Steuerung, die Fläche ist die Zugabe"
	note="Ein echtes <input type=&quot;file&quot;> macht die Arbeit; Ziehen und Ablegen liegt obendrauf. Das umschließende <label> macht die ganze Fläche zum Klickziel — ohne einen einzigen Klick-Handler — und Tastaturnutzer erreichen das Eingabefeld auf dem gewöhnlichen Weg. Eine Ablagefläche, die nur eine Ablagefläche ist, schließt jeden Tastaturnutzer aus, und das ist der häufigste Weg, diese Komponente falsch zu bauen."
>
	<UploadArea upload={plain} hint="Beliebige Dateien. Fortschritt wird unten von Hand gemeldet." />
</Section>

<Section
	title="Prüfung erzeugt sichtbare Einträge, keine Stille"
	note="Eine abgelehnte Datei wird trotzdem zu einem Eintrag — mit Begründung. Sie still fallen zu lassen, lässt jemanden zusehen, wie nichts passiert, und rätseln, welche Datei das Problem war. Die Prüfung steht ausgeschrieben statt dem Eingabefeld überlassen: ein Browser lässt eine .exe bereitwillig auf eine Fläche fallen, deren Input accept=&quot;image/*&quot; sagt, denn der Ablageweg führt nie durch den Input."
>
	<UploadArea upload={restricted} accept="image/*" hint="Nur Bilder, höchstens 1 kB — zum Ausprobieren der Ablehnung." />
</Section>

<Section
	title="Die drei Effekte, die §3.4 erlaubt"
	note="Jeder trägt ein eigenes Signal. Glow feuert nur, solange eine Datei über der Fläche schwebt — es ist die Antwort auf „passiert etwas, wenn ich jetzt loslasse?“, und das ist der einzige Moment im Leben der Komponente, in dem diese Frage offen ist. Shimmer ist die Ladeschleife, wird bei reduzierter Bewegung also langsamer statt anzuhalten (A17). Tilt ist die ruhende Zusage: „das ist ein Gegenstand, auf den man etwas fallen lassen kann.“ Der Glow benutzt hier 220 px statt der Button-Voreinstellung von 180 (A23)."
>
	<UploadArea upload={effects} glow shimmer hint="Eine Datei darüberziehen, um den Glow zu sehen." />
</Section>

<Section
	title="Der geteilte Zustand"
	note="Die Klasse führt Auswahl, Prüfung, Fortschritt und Status — den Transport führt die Anwendung. fetch, XHR mit Fortschrittsereignissen, ein fortsetzbarer Client, eine Warteschlange: eine Komponente, die das für einen entscheidet, ist eine Komponente, gegen die man kämpft."
>
	<div class="flex flex-wrap items-center gap-3">
		<Button size="sm" onclick={() => advance()}>Fortschritt melden (+25 %)</Button>
		<Button variant="outline" size="sm" onclick={() => plain.clear()}>Liste leeren</Button>
		<span class="text-sm text-muted-foreground">
			Status: <code>{plain.status}</code> · Fortschritt: {Math.round(plain.progress * 100)}%
		</span>
	</div>
	<p class="text-xs text-muted-foreground">
		Der Gesamtfortschritt ist der Mittelwert, nicht nach Bytes gewichtet. Ein Balken, der bei 4 %
		stehen bleibt, während eine große Datei lädt und neun kleine schon fertig sind, sagt weniger
		als einer, der sich stetig bewegt. Gewichtet ist genauer und weniger informativ.
	</p>
</Section>

<Section
	title="Dieselbe Zustandsmaschine, andere Kleidung"
	note="Das ist die zweite Hälfte der §5-Zeile: derselbe UploadState, hier als Button-Fortschritt statt als Fläche. Beide lesen dieselben zwei Werte — status und progress — und können deshalb gar nicht uneins darüber werden, was „lädt hoch“ bedeutet. Der Button bleibt anklickbar: einen Upload abzubrechen ist eine berechtigte Handlung, also ist Fortschritt kein deaktivierter Zustand."
>
	<div class="flex flex-wrap items-center gap-3">
		<Button progress={plain.status === 'idle' ? null : plain.progress}>
			{#if plain.status === 'uploading'}
				Lädt hoch … {Math.round(plain.progress * 100)} %
			{:else if plain.status === 'complete'}
				Hochgeladen
			{:else if plain.status === 'error'}
				Fehlgeschlagen
			{:else}
				Noch nichts ausgewählt
			{/if}
		</Button>
		<Button variant="outline" size="sm" onclick={() => advance()}>Fortschritt melden (+25 %)</Button>
	</div>
</Section>

<Section title="Was ein Typfehler ist">
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<UploadArea gradient />   ← §3.4 gibt UploadArea keinen Gradient
<UploadArea magnet />     ← Magnet ist für isolierte Aufforderungen;
                             eine Ablagefläche ist eine Fläche, kein Ziel`}</code
		></pre>
</Section>
