<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { FxScope } from '$lib/fx/index.js';
	import Section from '$lib/demo/section.svelte';

	const steps = [
		{
			n: 1,
			rule: 'data-fx="off" irgendwo in der Vorfahrenkette',
			effect: 'tot, kein Überschreiben möglich',
			why: 'Wer Effekte abschaltet, meint es. Ein verschachtelter Bereich darf das nicht rückgängig machen.'
		},
		{
			n: 2,
			rule: 'prefers-reduced-motion: reduce',
			effect: 'zeigerverfolgte Effekte tot, Schleifen aus, Transformdauern auf 1 ms',
			why: 'Deckkraft-Übergänge bleiben bei ~100 ms. Sie ganz zu entfernen wirkt kaputt, nicht ruhig.'
		},
		{
			n: 3,
			rule: '(pointer: coarse)',
			effect: 'Glow, Tilt, Magnet tot',
			why: 'Ohne feinen Zeiger gibt es nichts zu verfolgen.'
		},
		{
			n: 4,
			rule: 'Fähigkeitsmatrix §3.4',
			effect: 'die Prop existiert gar nicht erst',
			why: 'Kein Laufzeitfehler, sondern ein Kompilierfehler. Die Bedingungen der ◐-Felder wertet die Komponente aus.'
		},
		{
			n: 5,
			rule: 'FxScope density="list" | "table"',
			effect: 'Glow, Tilt, Magnet herabgestuft; Gradient und Shimmer überleben',
			why: 'Ein zeigerverfolgter Effekt in jeder Tabellenzeile ist Rauschen, kein Signal.'
		},
		{
			n: 6,
			rule: 'Prop pro Instanz',
			effect: 'schlägt die Voreinstellung — in beide Richtungen',
			why: 'glow={false} schaltet auch das ab, was „ausdrucksstark" von selbst angezündet hätte.'
		},
		{
			n: 7,
			rule: 'Voreinstellung der Stufe',
			effect: 'nur „ausdrucksstark" zündet fxDefault-Komponenten von selbst an',
			why: '„Ruhig" ist die Voreinstellung und zündet grundsätzlich nichts an.'
		}
	];
</script>

<svelte:head><title>Effektsystem · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Effektsystem</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Ein Effekt ist keine Dekoration, sondern ein Signal. Trägt er keine Bedeutung, wird er nicht
		ausgeliefert. Sieben Effekte, eine Auflösungskette, ein einziger Zeiger-Loop für die ganze
		Seite.
	</p>
</header>

<Section
	title="Auflösungsreihenfolge (§3.2)"
	note="Jeder Effekt läuft durch diese Kette. Das erste Veto gewinnt. Die Reihenfolge steht genau einmal im Code — als reine Funktion in resolution.ts, mit 40 Tests, einer je Schritt."
>
	<ol class="flex flex-col gap-3">
		{#each steps as step (step.n)}
			<li class="grid gap-1 rounded-lg border p-4 sm:grid-cols-[2rem_1fr]">
				<span class="text-sm font-medium text-muted-foreground">{step.n}.</span>
				<div>
					<p class="text-sm font-medium">{step.rule}</p>
					<p class="mt-0.5 text-sm text-muted-foreground">→ {step.effect}</p>
					<p class="mt-1.5 text-xs text-muted-foreground">{step.why}</p>
				</div>
			</li>
		{/each}
	</ol>
</Section>

<Section
	title="Schritt 1 in Aktion — „aus“ ist klebrig"
	note="Der rechte Kasten enthält einen Bereich, der ausdrücklich „ausdrucksstark“ verlangt. Er bleibt trotzdem dunkel, und zwar schon serverseitig: pnpm ssr:check prüft genau das."
>
	<div class="grid gap-4 sm:grid-cols-2">
		<FxScope level="expressive" class="block rounded-lg border p-4">
			<p class="mb-3 text-xs font-medium text-muted-foreground">Bereich: ausdrucksstark</p>
			<Button>Primär — glüht von selbst</Button>
		</FxScope>
		<FxScope level="off" class="block rounded-lg border p-4">
			<p class="mb-3 text-xs font-medium text-muted-foreground">
				Bereich: aus, darin ein Bereich, der „ausdrucksstark“ verlangt
			</p>
			<!-- data-ssr-check is a hook for `pnpm ssr:check`: it asserts that this
			     scope, nested inside an `off` one, still resolves to `off` (§3.2 step 1).
			     Inferring nesting from document order was wrong the moment a sibling
			     scope appeared later on the page. -->
			<FxScope level="expressive" class="contents" data-ssr-check="sticky-off">
				<Button glow>bleibt dunkel</Button>
			</FxScope>
		</FxScope>
	</div>
</Section>

<Section
	title="Schritt 5 in Aktion — Dichte"
	note="Derselbe Kartenstapel, einmal normal und einmal in einem Bereich mit density=&quot;list&quot;. Gradient überlebt, Tilt und Glow nicht. Auf „Ausdrucksstark“ umschalten, um den Unterschied zu sehen."
>
	<div class="grid gap-4 sm:grid-cols-2">
		<div>
			<p class="mb-2 text-xs font-medium text-muted-foreground">Dichte: normal</p>
			<div class="grid gap-2">
				{#each [1, 2] as index (index)}
					<Card.Root size="sm" interactive glow>
						<Card.Header><Card.Title>Zeile {index}</Card.Title></Card.Header>
					</Card.Root>
				{/each}
			</div>
		</div>
		<FxScope density="list" class="block">
			<p class="mb-2 text-xs font-medium text-muted-foreground">Dichte: Liste</p>
			<div class="grid gap-2">
				{#each [1, 2] as index (index)}
					<Card.Root size="sm" interactive glow>
						<Card.Header><Card.Title>Zeile {index}</Card.Title></Card.Header>
					</Card.Root>
				{/each}
			</div>
		</FxScope>
	</div>
</Section>

<Section
	title="Das Budget (§3.5)"
	note="Höchstens zwei dekorative Effekte auf einem Element. Höchstens ein glühendes und ein kippendes Element pro sichtbarer Fläche. Im Entwicklungsmodus zählt die Engine mit und meldet Überschreitungen in der Konsole — das ist die einzige Regel, die verhindert, dass die Bibliothek wie ein Dribbble-Shot von 2011 aussieht."
>
	<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
		<li>
			<strong class="text-foreground">Glow</strong> tritt über den Rand hinaus — nie in einem eng
			beschnittenen Elternteil, und nie auf einem Formularfeld: dort konkurriert es mit dem Fokusring
			und wird als Fehlerzustand gelesen.
		</li>
		<li>
			<strong class="text-foreground">Tilt</strong> erzeugt einen Container-Block für
			<code>position: fixed</code>. Keine Komponente mit schwebender UI darf kippen — das Portal
			richtet sich sonst am transformierten Vorfahren aus.
		</li>
		<li>
			<strong class="text-foreground">Shimmer</strong> als Dauerschleife bedeutet ausschließlich
			„lädt“. Dekoratives Aufblitzen ist ausgelöst und endlich.
		</li>
		<li>
			<strong class="text-foreground">Gradient</strong> wird aus <code>--fx-tint</code> gemischt,
			nie aus einem festen Hex-Paar — sonst bricht das Theming beim ersten Akzentwechsel.
		</li>
		<li>
			<strong class="text-foreground">Magnet</strong> ist für isolierte Handlungsaufforderungen.
			Nie in der Anwendungsschale, nie in einem Formular, nie in einer Liste.
		</li>
		<li>
			<strong class="text-foreground">Kein Effekt</strong> darf der alleinige Träger eines Zustands
			sein, den Fokusring verändern oder die Layoutgröße ändern. Das Letzte wird von
			<code>pnpm layout:check</code> maschinell geprüft.
		</li>
	</ul>
</Section>
