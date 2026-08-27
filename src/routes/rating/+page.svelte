<script lang="ts">
	import { Rating } from '$lib/components/ui/rating/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let stars = $state(3);
	let half = $state(3.5);
	let emoji = $state(4);
</script>

<svelte:head><title>Rating · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Rating</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §3.4 hat keine Zeile für Rating, also
		<strong>gar keine dekorativen Effekte</strong>. Die Erweiterung ist vollständig Struktur und
		Verhalten — und das Verhalten ist hier die eigentliche Arbeit, denn Rating ist ein
		Eingabeelement.
	</p>
</header>

<Section
	title="Tastatur und Screenreader"
	note="Gebaut auf bits-ui RatingGroup, nicht handgeschrieben (F14). Zum Ausprobieren hineintabben und die Pfeiltasten benutzen: Links/Rechts ändern den Wert, Pos1 und Ende springen auf Minimum und Maximum. Die Quelle setzt role=&quot;slider&quot; auf den Container und behält gleichzeitig fokussierbare <button>-Sterne — das ist ungültig (A24), ein Slider hat ein fokussierbares Element mit einem Wert, nicht N Kinder."
>
	<Row label="interaktiv">
		<Rating bind:value={stars} />
		<span class="text-sm text-muted-foreground">Wert: {stars}</span>
	</Row>
</Section>

<Section title="Varianten und Größen">
	<Row label="Größen">
		<Rating value={4} size="sm" readonly />
		<Rating value={4} readonly />
		<Rating value={4} size="lg" readonly />
	</Row>
	<Row label='variant="emoji"'>
		<Rating bind:value={emoji} variant="emoji" />
	</Row>
</Section>

<Section
	title="Halbe Schritte"
	note="Die Füllung ist ein clip-path über dem Stern. Die bars-Variante der Quelle animiert stattdessen die Höhe der Füllung — abgelehnt (Layout-Inventar Zeile 6); scaleY mit transform-origin: bottom oder eben clip-path leistet dasselbe, ohne die Layoutbox anzufassen."
>
	<Row label="allowHalf">
		<Rating bind:value={half} allowHalf />
		<span class="text-sm text-muted-foreground">Wert: {half}</span>
	</Row>
</Section>

<Section title="Zustände">
	<Row label="readonly und disabled">
		<Rating value={5} readonly />
		<Rating value={2} disabled />
	</Row>
	<Row label="mit Wertanzeige">
		<Rating value={4} readonly showValue />
	</Row>
	<Row label="max">
		<Rating value={7} max={10} readonly />
	</Row>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="Die Quelle legt hier zusätzlich Ripples und einen 90-px-Glow auf die Sterne. Beides gibt die Matrix Rating nicht (A20, A23)."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Rating glow />    <Rating gradient />    <Rating shimmer />
<Rating tilt />    <Rating magnet />`}</code
		></pre>
</Section>
