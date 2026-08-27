<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';
</script>

<svelte:head><title>Accordion · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Accordion</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Accordions — alle vier Teilkomponenten, gleiche Namen,
		gleiche Props. Neu sind <code>variant="ghost"</code>, Gradient am Kopf, Glow am Auslöser und
		das Aufklappen aus A21: <code>grid-template-rows: 0fr ↔ 1fr</code> statt einer gemessenen
		Höhe.
	</p>
</header>

<Section
	title="Das Aufklappen misst nichts"
	note="Eine animierte Höhe muss die Höhe kennen. Das heißt messen, das heißt ein transitionend-Listener und ein Timer als Absicherung — und es geht kaputt, sobald sich der Inhalt im offenen Zustand ändert. 0fr → 1fr braucht nichts davon: das 1fr löst das Layout in jedem Frame neu auf. Der Überschwinger der Vorlage (1.8, in einem Skin 2.2) ist abgelehnt: er öffnet das Panel höher als seinen eigenen Inhalt und lässt es zurückfallen."
>
	<Accordion.Root type="single" class="max-w-xl">
		<Accordion.Item value="messung">
			<Accordion.Trigger>Warum kein gemessenes height?</Accordion.Trigger>
			<Accordion.Content>
				<p>
					Weil die Messung veraltet. Ein Bild, das im offenen Panel nachlädt, lässt das Panel in der
					falschen Höhe stehen — bis zum nächsten Umschalten.
				</p>
				<p>
					Dieses Panel enthält absichtlich zwei Absätze unterschiedlicher Länge. Beide Zustände
					stimmen, ohne dass irgendwo eine Zahl gespeichert wird.
				</p>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="carveout">
			<Accordion.Trigger>Ist das nicht F11?</Accordion.Trigger>
			<Accordion.Content>
				<p>
					Nein — es ist die A16-Ausnahme. Die Layoutänderung <em>ist</em> die Animation, keine
					Dekoration darüber. <code>check-layout-safety</code> führt <code>.fx-collapse</code>
					namentlich mit derselben Begründung, und die Quelldatei sagt es ebenfalls.
				</p>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="a11y">
			<Accordion.Trigger disabled>Deaktiviert</Accordion.Trigger>
			<Accordion.Content>
				<p>Nicht erreichbar.</p>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</Section>

<Section
	title='type="multiple"'
	note="Mehrere Panels gleichzeitig offen. Der Fall, den die Vorlage nicht sauber löst: schließt man eines, während ein anderes öffnet, laufen beide Höhen gegeneinander. Mit 0fr ↔ 1fr ist das kein Sonderfall, sondern zwei unabhängige Transitionen im selben Grid."
>
	<Accordion.Root type="multiple" value={['eins']} class="max-w-xl">
		<Accordion.Item value="eins">
			<Accordion.Trigger>Erster Abschnitt</Accordion.Trigger>
			<Accordion.Content><p>Beim Laden bereits offen — ohne Einblendanimation.</p></Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="zwei">
			<Accordion.Trigger>Zweiter Abschnitt</Accordion.Trigger>
			<Accordion.Content><p>Beide gleichzeitig öffnen und wieder schließen.</p></Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</Section>

<Section
	title='variant="ghost"'
	note="§3.1 nennt ghost eine Variante, keinen Effekt. Die Trennlinien verschwinden, dafür bekommt jeder Kopf eine eigene Hover-Fläche — sonst hätte die Zeile kein Signal mehr, dass sie ein Ziel ist. Auf einer transparenten Fläche gibt es nichts zu bemalen, deshalb sind Gradient und Glow dort nicht verfügbar: die Variante reist über den Kontext zum Auslöser und wird dort als ◐-Bedingung ausgewertet."
>
	<Accordion.Root type="single" variant="ghost" class="max-w-xl">
		<Accordion.Item value="a">
			<Accordion.Trigger>Ohne Trennlinie</Accordion.Trigger>
			<Accordion.Content><p>Der Kopf trägt seine eigene Fläche.</p></Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="b">
			<Accordion.Trigger gradient>Gradient wird hier ignoriert</Accordion.Trigger>
			<Accordion.Content><p>Kein Typfehler, sondern eine Laufzeitbedingung — die Variante steht an der Wurzel, der Effekt am Auslöser.</p></Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</Section>

<Section
	title="Gradient am Kopf, Glow am Auslöser"
	note="§3.4 gibt dem Accordion genau diese zwei — und beide nur oben. Die Vorlage legt ihre Glow-Schicht auf das ganze Item und beleuchtet damit auch das offene Panel; das ist zurückgeschraubt. Der Radius ist 220px statt der 180px aus dem Token (A23): --fx-glow-radius ist eine Button-Größe, eine Kopfzeile ist breiter."
>
	<Row label="Hinweis">
		<p class="text-xs text-muted-foreground">
			Die Effektstufe steht oben in der Leiste. Auf <code>Aus</code> und bei Dichte
			<code>Liste</code> ist der Glow tot, der Gradient bleibt.
		</p>
	</Row>
	<Accordion.Root type="single" class="max-w-xl">
		<Accordion.Item value="gradient">
			<Accordion.Trigger gradient>Gradient</Accordion.Trigger>
			<Accordion.Content>
				<p>Statische Flächenbehandlung, aus --fx-tint gemischt. Kein festes Farbpaar.</p>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="glow">
			<Accordion.Trigger glow>Glow — mit dem Zeiger über die Zeile fahren</Accordion.Trigger>
			<Accordion.Content>
				<p>
					Zeigerverfolgt, über die einzelne rAF-Schleife der Bibliothek. Bei
					<code>data-fx="off"</code>, bei reduzierter Bewegung und auf groben Zeigern tot.
				</p>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.4 gibt dem Accordion kein Shimmer, kein Tilt und kein Magnet. Die Props existieren nicht — und Gradient und Glow existieren nur am Auslöser, nie an der Wurzel, weil das Panel nichts davon abbekommen soll."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Accordion.Trigger shimmer />        ← Shimmer gehört zu Ladezuständen
<Accordion.Trigger tilt />           ← Tilt bildet einen Containing Block
<Accordion.Trigger magnet />         ← Magnet nie in der Anwendungschrome
<Accordion.Root gradient />          ← Gradient nur am Kopf
<Accordion.Root glow />              ← Glow nur am Auslöser`}</code
		></pre>
</Section>
