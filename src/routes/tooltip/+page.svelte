<script lang="ts">
	import CircleHelpIcon from '@lucide/svelte/icons/circle-question-mark';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const sides = [
		{ side: 'top', label: 'oben' },
		{ side: 'right', label: 'rechts' },
		{ side: 'bottom', label: 'unten' },
		{ side: 'left', label: 'links' }
	] as const;

	let controlled = $state(false);
</script>

<svelte:head><title>Tooltip · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Tooltip</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Tooltips. §3.4 gibt dem Tooltip in allen sechs Spalten
		nichts — keinen Gradient, kein Glow, keinen Shimmer, kein Tilt, keinen Magnet. Die Erweiterung
		besteht deshalb aus Bewegung und Struktur: die <code>data-[state]</code>-Utilities aus
		<code>motion.css</code>
		statt des <code>tw-animate-css</code>-Bündels, und ein Ursprungspunkt, der tatsächlich funktioniert.
	</p>
</header>

<Tooltip.Provider>
	<Section
		title="Alle vier Seiten"
		note="Position, Umklappen, Verzögerung, Escape und die gesamte ARIA-Verdrahtung gehören bits-ui und bleiben bei bits-ui (F14). Die Quelle hat all das handgeschrieben — und dabei die Escape-Behandlung, die WAI-ARIA verlangt, schlicht ausgelassen."
	>
		<Row label="side">
			{#each sides as placement (placement.side)}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" size="sm" {...props}>{placement.label}</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side={placement.side} sideOffset={6}>
						Erscheint {placement.label}
					</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</Row>

		<Row label="Nur Symbol">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon-sm" aria-label="Hilfe" {...props}>
							<CircleHelpIcon />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content sideOffset={6}>Ein echter Knopf, ein Tabstopp.</Tooltip.Content>
			</Tooltip.Root>
			<p class="text-xs text-muted-foreground">
				Die Quelle setzt <code>tabIndex = 0</code> bedingungslos auf die Auslöser-Hülle; um einen Knopf
				gewickelt ergibt das zwei Tabstopps. Hier ist der Auslöser der Knopf selbst.
			</p>
		</Row>
	</Section>

	<Section
		title="Die Bewegung kommt aus denselben Token wie alles andere"
		note="Upstream animiert mit tw-animate-css: animate-in, fade-in-0, zoom-in-95, dazu vier data-[side=…]:slide-in-from-…-2. Das ist eine zweite Bewegungsskala neben unserer, mit eigenen Dauern und eigener Kurve, und nichts hält die beiden im Gleichschritt. fx-scale-fade ist dieselbe Form aus --transition-duration-* und --ease-fx-*, also 180 ms hinein und 120 ms hinaus, und fällt unter prefers-reduced-motion mit allen anderen Flächen zusammen — aus einer einzigen :root-Überschreibung."
	>
		<Row label="Ursprungspunkt">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" {...props}>Skaliert aus dem Auslöser</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content sideOffset={6}>
					--fx-transform-origin zeigt auf --bits-floating-transform-origin.
				</Tooltip.Content>
			</Tooltip.Root>
			<p class="max-w-lg text-xs text-muted-foreground">
				Upstream benutzt <code>origin-(--bits-tooltip-content-transform-origin)</code>. Diese Variable
				setzt bits-ui 2.19 nirgends — der Name lautet <code>--bits-floating-transform-origin</code>.
				Eine undefinierte Custom Property macht <code>transform-origin</code> ungültig, also zoomt
				jeder Upstream-Tooltip aus seiner eigenen Mitte. Dieser hier nicht, auch nicht nach einem
				Umklappen, von dem eine feste <code>data-[side=top]</code>-Klasse nichts wissen kann.
			</p>
		</Row>

		<Row label="Ein- und Ausgang">
			<p class="max-w-3xl text-xs text-muted-foreground">
				Die Hausregel lautet: eine Stufe schneller hinaus als hinein, weil niemand aufs Schließen
				warten will (§2). Die Quelle dreht das um — 320 ms hinein gegen 360 ms hinaus — und sie hat
				dafür einen Grund: ihr Ausgang <em>weicht zurück</em>, er skaliert erst auf 1,05 hoch, bevor
				er auf 0,6 zusammenfällt. Das ist eine Antizipationskurve, und §2 erlaubt Überschwingen nur
				bei Druckfeedback und Umschaltdaumen. Ohne die Antizipation kaufen die zusätzlichen 40 ms
				nichts mehr ein. Also gilt die Hausregel.
			</p>
		</Row>
	</Section>

	<Section
		title="Verzögerung, und der warme Zustand"
		note="Die auffälligste Eigenschaft der Quelle ist ihr warmer Zustand: steht schon ein Tooltip offen, öffnet der nächste ohne Verzögerung. Sie erkauft das mit einem geteilten DOM-Singleton. bits-ui erreicht dasselbe Verhalten mit delayDuration und skipDelayDuration auf dem Provider — pro Instanz eigener Inhalt, kein wanderndes Element."
	>
		<Row label="Provider">
			<Tooltip.Provider delayDuration={120} skipDelayDuration={300}>
				{#each ['Speichern', 'Duplizieren', 'Archivieren'] as action (action)}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" {...props}>{action}</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content sideOffset={6}>{action}, sofort beim zweiten Ziel.</Tooltip.Content>
					</Tooltip.Root>
				{/each}
			</Tooltip.Provider>
		</Row>

		<Row label="Gesteuert">
			<Tooltip.Root bind:open={controlled}>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" {...props}>Ziel</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content sideOffset={6}>Offen, weil der Zustand es sagt.</Tooltip.Content>
			</Tooltip.Root>
			<Button variant="secondary" size="sm" onclick={() => (controlled = !controlled)}>
				{controlled ? 'Schließen' : 'Öffnen'}
			</Button>
		</Row>
	</Section>

	<Section
		title="Reicher Inhalt"
		note="Upstream bringt die kbd-Klassen bereits mit; sie bleiben unverändert. Weil jeder Tooltip seine eigene Instanz ist, überlebt ein Snippet-Inhalt samt Ereignisbehandlung — beim Singleton der Quelle tat er das nicht."
	>
		<Row label="Mit Tastenkürzel">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" {...props}>Speichern</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content sideOffset={6}>
					Entwurf sichern
					<kbd data-slot="kbd" class="ml-1 bg-background/20 px-1.5 py-0.5 font-mono text-[0.625rem]">
						⌘S
					</kbd>
				</Tooltip.Content>
			</Tooltip.Root>
		</Row>
	</Section>

	<Section
		title="Was ein Typfehler ist"
		note="§3.4 gibt dem Tooltip nichts, also existiert keine der fünf Effekt-Props. Geprüft wird das in tooltip.types.ts mit @ts-expect-error — wird eine dieser Zeilen je gültig, kompiliert die Datei nicht mehr."
	>
		<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
				>{`<Tooltip.Content gradient />   ← §3.4: leere Zeile, alle sechs Spalten
<Tooltip.Content glow />       ← und §3.5 deckelt ein leuchtendes Element pro Fläche
<Tooltip.Content shimmer />
<Tooltip.Content tilt />       ← §3.5 verbietet Tilt an allem, was schwebende UI trägt
<Tooltip.Content magnet />
<Tooltip.Trigger glow />       ← der Auslöser ist das Element, das er umschließt`}</code
			></pre>
	</Section>

	<Section
		title="Was aus der Quelle nicht übernommen wurde"
		note="Auf Aktenlage abgelehnt statt stillschweigend weggelassen."
	>
		<ul class="max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
			<li>
				<strong class="text-foreground">Der wandernde Singleton-Tooltip.</strong> Ein geteilter
				DOM-Knoten an <code>document.body</code>, referenzgezählt, der zwischen Auslösern umzieht und
				dabei <code>width</code> und <code>height</code> auf einer 1,46er-Feder überblendet — mit
				Inline-Styles, die ein 440-ms-Timeout wieder aufräumt. Das ist <code>F11</code>,
				<code>F12</code>
				und <code>F13</code> in einer Komponente; der Vorgängerversuch kopierte zusätzlich
				<code>innerHTML</code>
				zwischen Knoten, was jede Ereignisbehandlung zerstört und eine XSS-Fläche öffnet. Zeile 5 der
				Layout-Inventur sagt es knapp: Tooltips pro Instanz haben nichts zu morphen.
			</li>
			<li>
				<strong class="text-foreground">Der 8-px-Blur beim Ein- und Ausgang.</strong> Kein Effekt —
				§17 hält ausdrücklich fest, dass das die von §4 gedeckte <code>blurFade</code>-Primitive ist,
				und <code>motion.css</code> liefert sie als <code>fx-blur-fade</code>. Benutzt wird sie hier
				trotzdem nicht: die Skalierung trägt die Richtung schon, und 4 px Unschärfe auf 12-px-Text in
				180 ms lesen sich als Matsch, nicht als Weichheit. Wer anderer Meinung ist, tauscht eine Klasse.
			</li>
			<li>
				<strong class="text-foreground"><code>backdrop-filter</code></strong> auf den Skins
				<code>fluent</code>
				(12 px) und <code>glass</code> (16 px plus Sättigung). Eine Flächenbehandlung ohne Zeile in der
				Matrix — und eine Kompositor-Ebene pro Tooltip.
			</li>
			<li>
				<strong class="text-foreground">Der +30-%-Pop des Pfeils</strong> (420 ms, 0 → 1,3 → 0,92 → 1)
				und <strong class="text-foreground">der gesamte glow-Skin</strong> (ruhender Halo plus
				620-ms-Flare). Überschwingen außerhalb seiner zwei erlaubten Mechaniken, und ein Glow auf einer
				Komponente, der §3.4 kein Glow gibt.
			</li>
		</ul>
	</Section>
</Tooltip.Provider>
