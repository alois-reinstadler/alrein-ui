<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let standard = $state('uebersicht');
	let line = $state('aktivitaet');
	let chrome = $state('entwurf');
	let gooey = $state('monat');
	let vertical = $state('konto');
	let manual = $state('erste');
</script>

<svelte:head><title>Tabs · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Tabs</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-Tabs. Alle ARIA-Verdrahtung kommt von bits-ui: Panels,
		<code>aria-controls</code>, <code>aria-labelledby</code>, Pfeiltasten, Home und Ende. Neu sind
		der gemeinsame <code>MorphIndicator</code> und die beiden Varianten, die §5 nennt.
	</p>
</header>

<Section
	title="Der Indikator wandert, statt zu wachsen"
	note="Die Quelle animiert Breite und Position des Indikators gemeinsam auf einer überschwingenden Feder. §1 verbietet jede Animation des Layoutkastens, also ist dasselbe als FLIP ausgedrückt: Der Indikator sitzt sofort auf dem neuen Kasten, und nur seine Transformation läuft vom alten zurück. Damit bewegen sich ausschließlich translateX und scaleX — beides Malerei, kein Umbruch."
>
	<Tabs.Root bind:value={standard} class="w-full max-w-xl">
		<Tabs.List>
			<Tabs.Trigger value="uebersicht">Übersicht</Tabs.Trigger>
			<Tabs.Trigger value="rechnungen">Rechnungen</Tabs.Trigger>
			<Tabs.Trigger value="einstellungen">Einstellungen</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="uebersicht">
			<p class="text-sm text-muted-foreground">
				Die drei Reiter sind absichtlich unterschiedlich breit. Genau dort entsteht der
				<code>scaleX</code>-Anteil, den ein reines <code>translateX</code> nicht abdecken kann.
			</p>
		</Tabs.Content>
		<Tabs.Content value="rechnungen">
			<p class="text-sm text-muted-foreground">
				Das aktive Label wird umgefärbt. Die Fenstermaske der Quelle — eine gegenläufig
				verschobene Kopie der Beschriftungsleiste — ist mit A19 abgelehnt.
			</p>
		</Tabs.Content>
		<Tabs.Content value="einstellungen">
			<p class="text-sm text-muted-foreground">
				Der Indikator trägt <code>aria-hidden</code>. Den Zustand meldet
				<code>aria-selected</code> am Reiter, und zwar genau einmal.
			</p>
		</Tabs.Content>
	</Tabs.Root>
</Section>

<Section
	title='variant="line"'
	note="Die Unterstreichung ist derselbe Indikator, nur anders bemalt: ein 2 px hoher Balken als Pseudoelement am Indikatorkasten. Ein 2 px hoher Balken hat keinen Radius, der unter scaleX verzerren könnte — deshalb ist das die unkomplizierteste der vier Varianten."
>
	<Tabs.Root bind:value={line} class="w-full max-w-xl">
		<Tabs.List variant="line">
			<Tabs.Trigger value="aktivitaet">Aktivität</Tabs.Trigger>
			<Tabs.Trigger value="mitglieder">Mitglieder</Tabs.Trigger>
			<Tabs.Trigger value="protokoll">Protokoll</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="aktivitaet">
			<p class="text-sm text-muted-foreground">Aktivität der letzten sieben Tage.</p>
		</Tabs.Content>
		<Tabs.Content value="mitglieder">
			<p class="text-sm text-muted-foreground">Vierzehn Mitglieder, zwei Einladungen offen.</p>
		</Tabs.Content>
		<Tabs.Content value="protokoll">
			<p class="text-sm text-muted-foreground">Änderungsprotokoll, absteigend nach Zeit.</p>
		</Tabs.Content>
	</Tabs.Root>
</Section>

<Section
	title='variant="chrome"'
	note="Die Browser-Reiter-Form: ein Schlitten auf einer Lippe. Die Quelle integriert dafür zwei Federlöser beim Laden des Moduls und baut je einen Keyframe pro Schritt, weil eine CSS-Transition beide Kanten nur mit einer Kurve interpolieren kann — was den Zug gerade kaputt macht. Unter FLIP ist das gratis: translateX und scaleX sind bereits zwei getrennt gekrümmte Kanten."
>
	<Tabs.Root bind:value={chrome} class="w-full max-w-2xl">
		<Tabs.List variant="chrome">
			<Tabs.Trigger value="entwurf">Entwurf</Tabs.Trigger>
			<Tabs.Trigger value="vorschau">Vorschau</Tabs.Trigger>
			<Tabs.Trigger value="veroeffentlichung">Veröffentlichung</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="entwurf">
			<p class="text-sm text-muted-foreground">
				Die Schulterrundungen der Quelle sind feste Pseudoelemente. Unter <code>scaleX</code>
				würden sie stauchen, und dagegen hilft nur ein gegenskaliertes echtes Kind. Genau das
				trägt <code>MorphIndicator</code> jetzt: Kinder mit
				<code>data-morph-counter-scale</code> bekommen den Kehrwert seiner eigenen Skalierung,
				also behalten die beiden Schultern ihre Größe über die ganze Fahrt.
			</p>
		</Tabs.Content>
		<Tabs.Content value="vorschau">
			<p class="text-sm text-muted-foreground">
				Die Lippe ist der untere Rand der Leiste; der Schlitten deckt das eine Pixel, das er
				überlappt, mit einem Pseudoelement ab. So lesen sich beide als eine Fläche.
			</p>
		</Tabs.Content>
		<Tabs.Content value="veroeffentlichung">
			<p class="text-sm text-muted-foreground">Freigabe erst nach Prüfung durch zwei Personen.</p>
		</Tabs.Content>
	</Tabs.Root>
</Section>

<Section
	title='variant="gooey"'
	note="Der Klecks ist derselbe Indikator in einer gefilterten Schicht: feGaussianBlur weicht die Kanten auf, feColorMatrix drückt sie wieder hart. Der Filter liegt auf einem eigenen Wrapper und nicht auf der Leiste, sonst würde er die Beschriftungen mitverwischen. §5: gooey ist nicht die Standardvariante und fällt unter prefers-reduced-motion auf chrome zurück — der Filter ist ein DOM-Knoten, den keine Media Query abschalten kann."
>
	<Tabs.Root bind:value={gooey} class="w-full max-w-xl">
		<Tabs.List variant="gooey">
			<Tabs.Trigger value="tag">Tag</Tabs.Trigger>
			<Tabs.Trigger value="woche">Woche</Tabs.Trigger>
			<Tabs.Trigger value="monat">Monat</Tabs.Trigger>
			<Tabs.Trigger value="jahr">Jahr</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="tag">
			<p class="text-sm text-muted-foreground">Tagesansicht.</p>
		</Tabs.Content>
		<Tabs.Content value="woche">
			<p class="text-sm text-muted-foreground">Wochenansicht, Montag bis Sonntag.</p>
		</Tabs.Content>
		<Tabs.Content value="monat">
			<p class="text-sm text-muted-foreground">Monatsansicht mit Kalenderraster.</p>
		</Tabs.Content>
		<Tabs.Content value="jahr">
			<p class="text-sm text-muted-foreground">Jahresansicht, zwölf Kacheln.</p>
		</Tabs.Content>
	</Tabs.Root>
</Section>

<Section
	title="Senkrecht, und die Aktivierungsart"
	note="Bei senkrechter Ausrichtung folgt der Indikator der Y-Achse; die andere Skalierung bleibt exakt 1. Die Ausrichtung steuert auch den Tastensatz — das macht bits-ui, nicht wir. activationMode='manual' trennt Fokus von Auswahl: sinnvoll, sobald ein Panel teuer ist."
>
	<div class="grid w-full gap-8 lg:grid-cols-2">
		<Tabs.Root bind:value={vertical} orientation="vertical" class="w-full">
			<Tabs.List variant="line">
				<Tabs.Trigger value="konto">Konto</Tabs.Trigger>
				<Tabs.Trigger value="sicherheit">Sicherheit</Tabs.Trigger>
				<Tabs.Trigger value="benachrichtigungen">Benachrichtigungen</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="konto">
				<p class="text-sm text-muted-foreground">Name, Adresse, Sprache.</p>
			</Tabs.Content>
			<Tabs.Content value="sicherheit">
				<p class="text-sm text-muted-foreground">Zwei Faktoren, Sitzungen, Wiederherstellung.</p>
			</Tabs.Content>
			<Tabs.Content value="benachrichtigungen">
				<p class="text-sm text-muted-foreground">Wöchentliche Zusammenfassung ist aktiv.</p>
			</Tabs.Content>
		</Tabs.Root>

		<Tabs.Root bind:value={manual} activationMode="manual" class="w-full">
			<Tabs.List>
				<Tabs.Trigger value="erste">Erste</Tabs.Trigger>
				<Tabs.Trigger value="zweite">Zweite</Tabs.Trigger>
				<Tabs.Trigger value="dritte">Dritte</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="erste">
				<p class="text-sm text-muted-foreground">
					Mit den Pfeiltasten wandert hier nur der Fokus. Erst Eingabe oder Leertaste wählt aus.
				</p>
			</Tabs.Content>
			<Tabs.Content value="zweite">
				<p class="text-sm text-muted-foreground">Zweites Panel.</p>
			</Tabs.Content>
			<Tabs.Content value="dritte">
				<p class="text-sm text-muted-foreground">Drittes Panel.</p>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.4 gibt Tabs ghost — und ghost ist laut §3.1 eine Variante, kein Effekt; hier ist es die transparente Leiste von line und chrome. Die fünf dekorativen Effekte existieren als Props schlicht nicht. Das Cursorlicht auf den Buchstaben und die Wassertropfen-Enthüllung der Quelle sind beide ein zeigerverfolgter Glow unter anderem Namen (A20)."
>
	<Row label="Abgelehnt">
		<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
				>{`<Tabs.List gradient />              ← §3.4 gibt Tabs keinen Gradient
<Tabs.List glow />                  ← das Cursorlicht der Quelle ist genau das
<Tabs.List shimmer />               ← eine Dauerschleife ist Laden, oder Migräne
<Tabs.List tilt />                  ← verankert jedes Portal am falschen Kasten
<Tabs.List magnet />                ← Magnet nie in der Anwendungsverkleidung
<Tabs.List variant="neon" />        ← §5 nennt zwei Zusatzvarianten, nicht sechs`}</code
			></pre>
	</Row>
</Section>
