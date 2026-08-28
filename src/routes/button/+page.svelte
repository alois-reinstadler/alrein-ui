<script lang="ts">
	import { base } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const variants = ['default', 'secondary', 'outline', 'destructive', 'ghost', 'link'] as const;
	const sizes = ['xs', 'sm', 'default', 'lg'] as const;
	const iconSizes = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;

	/*
	 * Advanced by a click rather than a timer — `bans:check` forbids the timer,
	 * and the design point is the same one UploadArea makes: the component keeps
	 * the bookkeeping, the caller owns the transport and reports progress in.
	 */
	let uploaded = $state(0);
	const percent = $derived(Math.round(uploaded * 100));
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
		<Button href="{base}/">als Link</Button>
		<Button href="{base}/" disabled>Link deaktiviert</Button>
	</Row>
</Section>

<Section
	title="Varianten mit Nachdruck"
	note="A31. Gradient, Glow und Shimmer waren Effekt-Props und sind jetzt Varianten — es sind Flächenbehandlungen, die man wählt, keine Bewegungen, die der Zeiger treibt. Alle drei bauen auf primär auf: sie sind Nachdruck auf der Hauptaktion, und ein Gradient-CTA, der zugleich sekundär ist, will niemand. Weil sie Varianten sind, schaltet „Aus“ sie nicht ab — was sich weiterhin nach Zeiger und nach reduzierter Bewegung richtet, ist die Bewegung darin: Glow folgt nur dort, wo es einen Zeiger gibt, und der Shimmer-Durchlauf geht bei reduzierter Bewegung auf 0 ms."
>
	<Row label="variant">
		<Button variant="gradient">Jetzt starten</Button>
		<Button variant="glow">Hauptaktion</Button>
		<Button variant="shimmer">Zeigen</Button>
	</Row>
	<Row label="in jeder Größe">
		<Button variant="gradient" size="sm">klein</Button>
		<Button variant="glow" size="lg">groß</Button>
		<Button variant="gradient" size="icon" aria-label="Aktion"><span aria-hidden="true">→</span></Button>
	</Row>
</Section>

<Section
	title="Der einzige Effekt, der übrig ist"
	note="Magnet bleibt ein Boolean, weil er wirklich ein Effekt ist: zeigergetrieben, nur bei „Ausdrucksstark“ verfügbar, und er kombiniert sich mit jeder Variante. Zeigerverfolgendes Kippen hat Button nicht mehr — das gehört jetzt allein der Card. Was ein Button stattdessen tut, steht im nächsten Abschnitt."
>
	<Row label="magnet (nur ausdrucksstark)">
		<Button magnet size="lg">Unübersehbar</Button>
		<Button variant="gradient" magnet size="lg">gradient + magnet</Button>
	</Row>
</Section>

<Section
	title="Druckfeedback kippt in 3D"
	note="A10a. Die Quelle skaliert einen Button beim Druck nicht flach herunter, sondern kippt ihn zum Druckpunkt hin. Immer an, kein Prop — Druckfeedback ist laut §3.1 nie opt-in. Die Perspektive entsteht nur, solange :active gilt, und nie auf [aria-haspopup]: genau die Auslöser, deren Portal sich sonst an einem transformierten Vorfahren verankern würde. Bei „Aus“ und bei reduzierter Bewegung geht der Winkel auf 0°. Mit der Tastatur ausgelöst kippt nichts — es gibt keinen Druckpunkt, zu dem hin gekippt werden könnte."
>
	<Row label="in eine Ecke drücken">
		<Button size="lg">oben links drücken</Button>
		<Button variant="outline" size="lg">unten rechts drücken</Button>
	</Row>
	<Row label="in jeder Größe, ohne Prop">
		<Button size="xs">xs</Button>
		<Button size="lg" variant="outline">lg</Button>
		<Button size="icon" aria-label="Kippen"><span aria-hidden="true">→</span></Button>
	</Row>
</Section>

<Section
	title="Fortschritt"
	note="§5 verlangt für die Upload-Zeile UploadArea und einen Button-Fortschrittszustand auf einer geteilten UploadState-Klasse. Der Balken ist ein Kind, kein Pseudoelement: ::before gehört der Glow-Variante, ::after dem Druckfeedback, und background-image gehört den Gradient- und Shimmer-Varianten. Animiert wird allein die background-size — Malerei, nie der Layoutkasten. Und es ist kein Effekt: „Aus“ schaltet ihn nicht ab, denn §3.5 verbietet, dass ein Zustand an etwas hängt, das sich abschalten lässt."
>
	<Row label="determiniert (0–1)">
		<Button progress={uploaded}>
			{uploaded >= 1 ? 'Fertig' : `Lädt hoch … ${percent} %`}
		</Button>
		<Button variant="outline" progress={uploaded}>outline</Button>
		<Button variant="secondary" progress={uploaded} size="lg">groß</Button>
	</Row>
	<Row label="steuern">
		<Button variant="outline" size="sm" onclick={() => (uploaded = Math.min(1, uploaded + 0.25))}>
			+25 %
		</Button>
		<Button variant="ghost" size="sm" onclick={() => (uploaded = 0)}>zurücksetzen</Button>
		<span class="text-sm text-muted-foreground">
			<code>aria-busy</code> ist gesetzt, der Balken selbst ist <code>aria-hidden</code> — die
			Prozentzahl steht schon in der Beschriftung, und sie zweimal vorzulesen ist Lärm.
		</span>
	</Row>
	<Row label="mit der Glow-Variante zusammen">
		<Button variant="glow" progress={uploaded}>Hauptaktion</Button>
	</Row>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.5 verlangt, dass widersprüchliche Kombinationen Typfehler sind, keine Kommentare. Seit A31 sind die alten Widersprüche gar nicht mehr darstellbar statt nur zurückgewiesen: „ghost und zugleich gradient“ lässt sich nicht schreiben, weil beides dasselbe Feld ist. Diese Zeilen stehen als Text hier, weil sie sich nicht kompilieren ließen."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Button gradient />                   ← gradient ist eine Variante, kein Prop (A31)
<Button glow />                       ← ebenso
<Button tilt />                       ← Zeiger-Tilt gehört der Card (A31)
<Button variant="neon" />             ← die Variantenliste ist geschlossen
<Button parallax />                   ← kein Effekt, den die Matrix vergibt`}</code
		></pre>
</Section>
