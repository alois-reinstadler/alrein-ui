<script lang="ts">
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { collapse } from '$lib/motion/transitions.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	/* Dismissal is consumer-owned state — that is the whole point of the decision below. */
	let plainVisible = $state(true);
	let collapsingVisible = $state(true);
	/* Shimmer sweeps once on mount, so showing it twice means mounting it twice. */
	let shimmerRun = $state(0);
</script>

<svelte:head><title>Alert · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Alert</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Alerts. <code>default</code> und
		<code>destructive</code> sind unverändert, <code>Alert.Title</code>,
		<code>Alert.Description</code> und <code>Alert.Action</code> ebenso. Neu sind die Schweregrade
		<code>warning</code>
		und <code>success</code>, die transparente Variante <code>ghost</code>, ein Schließen-Knopf und
		die drei Effekte, die §3.4 dem Alert zugesteht: Gradient, Glow bei danger/warn und ein
		einmaliger Shimmer beim Einblenden.
	</p>
</header>

<Section
	title="Die Schweregrade"
	note="destructive bleibt die Gefahr und bleibt bei --destructive. warning und success benutzen die --warning- und --success-Token, die A9 genau hier erlaubt, weil shadcn kein Äquivalent hat. Alle vier teilen dieselbe Form: Fläche neutral, Ton auf Titel und Symbol, Beschreibung eine Stufe leiser."
>
	<div class="grid gap-3">
		<Alert.Root>
			<InfoIcon />
			<Alert.Title>Neue Version verfügbar</Alert.Title>
			<Alert.Description>Version 2.4 steht bereit. Die Aktualisierung dauert etwa eine Minute.</Alert.Description>
		</Alert.Root>

		<Alert.Root variant="destructive">
			<CircleAlertIcon />
			<Alert.Title>Zahlung fehlgeschlagen</Alert.Title>
			<Alert.Description>Die hinterlegte Karte wurde abgelehnt. Bitte ein anderes Zahlungsmittel hinterlegen.</Alert.Description>
		</Alert.Root>

		<Alert.Root variant="warning">
			<TriangleAlertIcon />
			<Alert.Title>Kontingent fast erschöpft</Alert.Title>
			<Alert.Description>92 % des monatlichen Kontingents sind verbraucht. Noch 6 Tage bis zur Zurücksetzung.</Alert.Description>
		</Alert.Root>

		<Alert.Root variant="success">
			<CircleCheckIcon />
			<Alert.Title>Entwurf gespeichert</Alert.Title>
			<Alert.Description>Alle Änderungen sind gesichert. Der Entwurf ist ab sofort für das Team sichtbar.</Alert.Description>
		</Alert.Root>

		<Alert.Root variant="ghost">
			<InfoIcon />
			<Alert.Title>Hinweis ohne Fläche</Alert.Title>
			<Alert.Description>ghost ist laut §3.1 eine Variante, kein Effekt — eine durchsichtige Fläche für den beiläufigen Hinweis.</Alert.Description>
		</Alert.Root>
	</div>
</Section>

<Section
	title="role: status statt alert, außer bei Gefahr"
	note="Die Quelle setzt role=alert bedingungslos. Das ist ein assertiver Live-Bereich: „Ihr Entwurf wurde gespeichert“ unterbricht eine Screenreader-Nutzerin mitten im Satz. Nur destructive bekommt hier role=alert, alles andere role=status. Das ist die einzige Stelle, an der dieses Superset eine Upstream-Vorgabe ändert statt ergänzt — und role steht vor den durchgereichten Props: wer das alte Verhalten will, schreibt es hin."
>
	<Row label="Im Markup">
		<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
				>{`<Alert.Root variant="destructive">   →  role="alert"    (assertiv)
<Alert.Root variant="warning">      →  role="status"   (höflich)
<Alert.Root variant="success">      →  role="status"
<Alert.Root role="alert">           →  role="alert"    (Consumer gewinnt)`}</code
			></pre>
	</Row>
</Section>

<Section
	title="Alert.Action und Alert.Title bleiben, wie sie sind"
	note="Die drei Teilkomponenten sind unveränderte Upstream-Dateien. Alert.Action ist absolut positioniert und reserviert über has-data-[slot=alert-action]:pr-18 seinen eigenen Platz — das gilt weiterhin."
>
	<Alert.Root variant="warning">
		<TriangleAlertIcon />
		<Alert.Title>Sitzung läuft ab</Alert.Title>
		<Alert.Description>Die Anmeldung endet in 4 Minuten.</Alert.Description>
		<Alert.Action>
			<Button variant="outline" size="sm">Verlängern</Button>
		</Alert.Action>
	</Alert.Root>
</Section>

<Section
	title="Verwerfen — und warum das Entfernen nicht animiert wird"
	note="Die Quelle misst die Höhe, fixiert sie inline, erzwingt ein Reflow und animiert dann height auf 0, mit padding, margin und border-width auf derselben 440-ms-Antizipationskurve. Das ist F11 und F12 zugleich, und §2 erlaubt Überschwingen nur bei Druckfeedback und Umschaltdaumen. A21 (grid-template-rows 0fr↔1fr) wäre der erlaubte Ersatz — aber nur dort, wo das Element montiert bleibt. Ein auf 0fr geschrumpfter Alert steht weiter im DOM, weiter im Accessibility-Baum und ist weiter ein Live-Bereich; genau das ist der Mangel, den das Digest der Quelle vorwirft. Also: onDismiss plus Zustand beim Consumer, und das Entfernen passiert sofort."
>
	<Row label="Ohne Animation">
		{#if plainVisible}
			<Alert.Root variant="success" dismissible onDismiss={() => (plainVisible = false)} class="max-w-lg">
				<CircleCheckIcon />
				<Alert.Title>Export abgeschlossen</Alert.Title>
				<Alert.Description>Die Datei liegt unter „Downloads“. Der Alert verschwindet ohne Umschweife.</Alert.Description>
			</Alert.Root>
		{:else}
			<Button variant="outline" size="sm" onclick={() => (plainVisible = true)}>Wieder einblenden</Button>
		{/if}
	</Row>

	<Row label="Mit collapse">
		{#if collapsingVisible}
			<!--
				Wer die Kollapsbewegung will, besitzt sie selbst — eine Zeile auf einer
				Hülle, die man auch wirklich aushängen kann. `collapse` trägt die
				A16-Ausnahme (die Layoutänderung *ist* die Animation) und sagt das in
				der eigenen Quelle. Der Alert selbst animiert keine Layout-Eigenschaft.
			-->
			<div transition:collapse class="max-w-lg">
				<Alert.Root variant="success" dismissible onDismiss={() => (collapsingVisible = false)}>
					<CircleCheckIcon />
					<Alert.Title>Export abgeschlossen</Alert.Title>
					<Alert.Description>Dieselbe Komponente, in einer Hülle mit transition:collapse.</Alert.Description>
				</Alert.Root>
			</div>
		{:else}
			<Button variant="outline" size="sm" onclick={() => (collapsingVisible = true)}>Wieder einblenden</Button>
		{/if}
	</Row>
</Section>

<Section
	title="Die drei Effekte, die §3.4 zulässt"
	note="Gradient ohne Bedingung, Glow nur bei danger und warn, Shimmer einmalig beim Einblenden. Der Ton bestimmt den Farbton: --fx-tint zeigt auf --destructive, --warning oder --success, damit ein roter Alert nicht blau glüht. Die Effekte sind an data-fx gebunden — der Schalter oben rechts schaltet sie scharf. Bei calm passiert nur, was ausdrücklich verlangt wurde; bei expressive glüht ein Schweregrad-Alert von selbst."
>
	<Row label="Gradient">
		<Alert.Root gradient class="max-w-lg">
			<InfoIcon />
			<Alert.Title>Auf Pro umsteigen</Alert.Title>
			<Alert.Description>Aus --fx-tint berechnete Stopps, nie ein fest verdrahtetes Farbpaar.</Alert.Description>
		</Alert.Root>
	</Row>

	<Row label="Glow, danger">
		<Alert.Root variant="destructive" glow class="max-w-lg">
			<CircleAlertIcon />
			<Alert.Title>Speicher voll</Alert.Title>
			<Alert.Description>Radius 240 px statt der 180 px des Buttons — A23, ein Alert ist breiter als ein Knopf.</Alert.Description>
		</Alert.Root>
	</Row>

	<Row label="Glow, warn">
		<Alert.Root variant="warning" glow class="max-w-lg">
			<TriangleAlertIcon />
			<Alert.Title>Zertifikat läuft ab</Alert.Title>
			<Alert.Description>Zeigerverfolgt, also aus bei grobem Zeiger und bei reduzierter Bewegung.</Alert.Description>
		</Alert.Root>
	</Row>

	<Row label="Glow, sonst">
		<Alert.Root variant="success" glow class="max-w-lg">
			<CircleCheckIcon />
			<Alert.Title>Kein Glow, und das ist kein Fehler</Alert.Title>
			<Alert.Description>
				Die Prop existiert, §3.4 gibt sie aber nur danger und warn. Die Bedingung wertet die
				Komponente aus und reicht sie als available weiter.
			</Alert.Description>
		</Alert.Root>
	</Row>

	<Row label="Shimmer">
		{#key shimmerRun}
			<Alert.Root variant="success" shimmer class="max-w-lg">
				<CircleCheckIcon />
				<Alert.Title>Einmal beim Einblenden</Alert.Title>
				<Alert.Description>Kein Dauerlauf — der gehört dem Ladezustand, also dem Skeleton (§3.5).</Alert.Description>
			</Alert.Root>
		{/key}
		<Button variant="outline" size="sm" onclick={() => (shimmerRun += 1)}>Neu einblenden</Button>
	</Row>

	<Row label="Zwei zusammen">
		<Alert.Root variant="destructive" glow shimmer class="max-w-lg">
			<CircleAlertIcon />
			<Alert.Title>Das Budget ist zwei</Alert.Title>
			<Alert.Description>§3.5 deckelt ein Element bei zwei dekorativen Effekten. Ein dritter gäbe es hier ohnehin nicht.</Alert.Description>
		</Alert.Root>
	</Row>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.5 verlangt, dass die Ausschlüsse Typfehler sind und keine Kommentare. Geprüft wird das in alert.types.ts mit @ts-expect-error — wird eine dieser Zeilen je gültig, kompiliert die Datei nicht mehr."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Alert.Root tilt />                       ← §3.4 gibt dem Alert kein Tilt
<Alert.Root magnet />                     ← Magnet nur für isolierte CTAs
<Alert.Root variant="ghost" gradient />   ← durchsichtige Fläche, nichts zu malen
<Alert.Root variant="ghost" glow />       ← nichts, woraus es glühen könnte
<Alert.Root variant="danger" />           ← der Tonsatz ist geschlossen`}</code
		></pre>
</Section>

<Section
	title="Was aus der Quelle nicht übernommen wurde"
	note="Auf Aktenlage abgelehnt statt stillschweigend weggelassen — wer die Shadow-CSS liest, findet all das und hält es sonst für vergessen."
>
	<ul class="max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
		<li>
			<strong class="text-foreground">Fest eingebaute Symbole je Ton.</strong> Die Quelle hält drei
			SVG-Sätze montiert und schaltet sie per <code>display</code>. Upstream nimmt das Symbol als
			direktes Kind und richtet es mit <code>has-[&gt;svg]:grid-cols-[auto_1fr]</code> aus; ein
			eingebautes Symbol würde diesen Selektor bekämpfen.
		</li>
		<li>
			<strong class="text-foreground">Der Selbstverwerfer mit Countdown.</strong> Verhalten der
			banner- und toast-Skins. §5 kennt keinen Toast, und jede Umsetzung braucht einen Timer, der
			eine CSS-Dauer dupliziert (<code>F12</code>). Das Pausieren beim Überfahren ist echte
			Bedienqualität und gehört wieder auf den Tisch, sobald es einen Toast gibt.
		</li>
		<li>
			<strong class="text-foreground">Der neon-Conic-Ring (4,4 s) und der inline-Punktpuls (1,8 s).</strong>
			Dauerschleifen auf einem Ruhezustand. §3.5: eine Dauerschleife bedeutet Laden — oder sie ist Migräne.
		</li>
		<li>
			<strong class="text-foreground">Das „Nachbarlicht“.</strong> Eine zweite, zeigerunabhängige
			Näherungsmaschine, die über <code>--lit-*</code> die Farbe <em>anderer</em> Elemente auf dieses
			wirft. A20 lehnt sie bibliotheksweit ab; §3.1 hat keinen Eintrag und §3.4 keine Zeile dafür.
		</li>
		<li>
			<strong class="text-foreground">Glow auf jedem Ton.</strong> §3.4 sagt danger/warn — und das
			wird ausgewertet, nicht angenommen.
		</li>
	</ul>
</Section>
