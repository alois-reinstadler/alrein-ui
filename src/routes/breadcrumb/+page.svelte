<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';
</script>

<svelte:head><title>Breadcrumb · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Breadcrumb</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Breadcrumbs — alle sieben Teilkomponenten unverändert.
		§3.4 gibt der Komponente <code>ghost</code> und sonst nichts, also ist die Liste der
		abgelehnten Effekte hier länger als die der übernommenen.
	</p>
</header>

<Section
	title="Der Standardpfad"
	note="Unverändert gegenüber Upstream, bis auf zwei Dinge, die man nicht sieht: jeder Krümel hat jetzt ein Druckfeedback (§3.1 — Druck ist nie optional) und ein Klickziel, das bis auf die 24-px-Daumengrenze aufgepolstert und mit gleich großem negativem Rand wieder eingeholt wird. Genau der Trick aus der Vorlage, unverändert übernommen: treffbar, ohne die Zeile zu verschieben."
>
	<Row label="Pfad">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/">Start</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/projekte">Projekte</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Quartalsabschluss</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</Row>

	<Row label="Mit Ellipse">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/">Start</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Ellipsis />
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/projekte">Projekte</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Quartalsabschluss</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</Row>
</Section>

<Section
	title='variant="ghost"'
	note="§3.1 nennt ghost eine Variante, keinen Effekt: durchsichtig im Ruhezustand, getönt beim Überfahren. Dasselbe Kästchen, das oben unsichtbar das Klickziel bildet, wird hier sichtbar — der negative Rand fällt weg, die Polsterung bleibt. Die Variante steht an der Wurzel und reist über den Kontext zu den Krümeln, damit ein Pfad nicht mit sich selbst uneins sein kann."
>
	<Row label="Ghost">
		<Breadcrumb.Root variant="ghost">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/">Start</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/projekte">Projekte</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/projekte/2026">2026</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Quartalsabschluss</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</Row>
</Section>

<Section
	title="Der letzte Krümel ist kein Link"
	note="Upstream rendert ihn als role=&quot;link&quot; mit aria-disabled=&quot;true&quot;. Ein Screenreader sagt dann „Link, abgeblendet“ über etwas, das weder ein Link noch fokussierbar ist — und aria-disabled beschreibt nichts. Übrig bleibt aria-current=&quot;page&quot; auf einem schlichten span. Das ist die einzige Stelle in diesen drei Komponenten, an der das Superset ein Upstream-Attribut ändert statt ergänzt; wer die alte Auszeichnung will, schreibt sie hin und bekommt sie zurück."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Breadcrumb.Page>Quartalsabschluss</Breadcrumb.Page>
→ <span data-slot="breadcrumb-page" aria-current="page">…</span>

<Breadcrumb.Page role="link" aria-disabled="true">…</Breadcrumb.Page>
→ Upstream-Auszeichnung, unverändert verfügbar`}</code
		></pre>
</Section>

<Section
	title="Was abgelehnt ist"
	note="Die Vorlage hat vier Signaturen am Breadcrumb, und alle vier fallen weg. Der Krümel ist im Original im Wesentlichen sein Druck — und dieser Druck ist genau die beiden Mechaniken, die A10 und A11 bereits abgelehnt haben, gleichzeitig angewendet."
>
	<ul class="max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
		<li>
			<strong class="text-foreground">Der 3D-Druck</strong> — perspective(420px), rotateX ≤12°,
			rotateY ≤9°, scale(0.93). A10/A20: <code>perspective()</code> bildet einen Containing Block
			für <code>position: fixed</code>, und Druck ist immer an. Jeder Krümel, der je ein Menü oder
			einen Tooltip trägt, würde sein Portal falsch verankern.
		</li>
		<li>
			<strong class="text-foreground">Die 620-ms-Feder mit 1.15 Spitze</strong> beim Loslassen. A11
			— dritte Fundstelle derselben Mechanik. §2 erlaubt Überschwingen bei Druckfeedback und
			Umschaltdaumen, nicht bei 620 ms.
		</li>
		<li>
			<strong class="text-foreground">Die 1820-ms-„Wassertropfen“-Textenthüllung.</strong> A20. Sie
			liest <code>textContent</code> und geht bei jedem reichhaltigen Label still kaputt.
		</li>
		<li>
			<strong class="text-foreground">Das Cursorlicht auf den Buchstaben</strong> (120 px Radius,
			auch auf den Trennzeichen). A20 — das ist ein Glow, und §3.4 gibt Breadcrumb keinen.
		</li>
		<li>
			<strong class="text-foreground">Der collapse-Skin</strong>, der versteckte Krümel an Ort und
			Stelle ausklappt: zählt statt zu messen, ist einwegverriegelt und läuft ohne die
			Abschneideregel für den letzten Krümel sofort über. shadcns eigene Antwort —
			<code>Breadcrumb.Ellipsis</code> öffnet ein Menü — ist die zusammensetzbare, und §5 listet für
			Breadcrumb keine Überlaufstrategie.
		</li>
	</ul>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.4 gibt Breadcrumb genau eine Zelle: ghost. Die übrigen fünf sind Striche, also existieren die Props nicht — weder an der Wurzel noch am einzelnen Krümel."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Breadcrumb.Root gradient />         ← kein Gradient
<Breadcrumb.Root glow />             ← das Cursorlicht ist ein Glow
<Breadcrumb.Root shimmer />          ← Shimmer gehört zu Ladezuständen
<Breadcrumb.Root tilt />             ← ein Krümel ist nichts zum Aufheben
<Breadcrumb.Root magnet />           ← Magnet nie in der Navigation
<Breadcrumb.Link variant="ghost" />  ← ghost steht an der Wurzel`}</code
		></pre>
</Section>
