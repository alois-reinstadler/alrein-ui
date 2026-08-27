<script lang="ts">
	import { ColorPicker } from '$lib/components/ui/color-picker/index.js';
	import Section from '$lib/demo/section.svelte';

	let brand = $state('#4a7c59');
	let css = $state('oklch(62.00% 0.1400 250)');
	let withAlpha = $state('#4a7c59');
</script>

<svelte:head><title>ColorPicker · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">ColorPicker</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §5 fasst die sechs vuesax-Picker zu einer
		Komponente mit <code>variant</code> zusammen, alle auf einer geteilten
		<code>ColorState</code>-Klasse. Sechs getrennte Picker sind der Weg zu sechs verschiedenen
		Antworten auf „was passiert, wenn jemand ein ungültiges Hex tippt“.
	</p>
</header>

<Section
	title="OKLCH ist die gespeicherte Form"
	note="Jede andere Darstellung wird beim Lesen abgeleitet und beim Schreiben geparst — es gibt also keine zweite Kopie, die auseinanderlaufen könnte. Das ist der Fehler, den jeder Farbwähler hat: man zieht den Ton-Regler, das Hex-Feld rundet auf 8 Bit, das gerundete Hex wird als Wahrheit zurückgelesen, und der Ton wandert unter dem Finger weg. Hier nicht: Buntheit auf 0 ziehen und wieder hoch, und der Ton steht noch."
>
	<div class="flex flex-wrap items-start gap-8">
		<div>
			<p class="mb-2 text-xs font-medium text-muted-foreground">variant="default"</p>
			<ColorPicker bind:value={brand} />
			<p class="mt-2 font-mono text-xs text-muted-foreground">{brand}</p>
		</div>
		<div>
			<p class="mb-2 text-xs font-medium text-muted-foreground">gibt oklch() zurück</p>
			<ColorPicker bind:value={css} />
			<p class="mt-2 font-mono text-xs text-muted-foreground">{css}</p>
		</div>
	</div>
	<p class="text-xs text-muted-foreground">
		Der Rückgabewert behält die Form, in der er hereinkam: wer ein Hex übergibt, bekommt ein Hex
		zurück, wer <code>oklch()</code> übergibt, bekommt <code>oklch()</code>. Die Speicherung des
		Aufrufers bleibt dadurch stabil.
	</p>
</Section>

<Section
	title="Die sechs Skins"
	note="Alle auf derselben ColorState. Die Regler sind in jeder Variante dieselben nativen <input type=&quot;range&quot;>: Tastaturbedienung, Formularanbindung und Ansage kommen gratis, und weil Regler und Darstellung dieselbe Quelle lesen, können sie nicht auseinanderlaufen."
>
	<div class="flex flex-wrap items-start gap-8">
		{#each ['compact', 'slider', 'ring'] as variant (variant)}
			<div>
				<p class="mb-2 text-xs font-medium text-muted-foreground">variant="{variant}"</p>
				<ColorPicker variant={variant as 'ring'} />
			</div>
		{/each}
	</div>
	<div class="flex flex-wrap items-start gap-8">
		{#each ['palette', 'swatches'] as variant (variant)}
			<div>
				<p class="mb-2 text-xs font-medium text-muted-foreground">variant="{variant}"</p>
				<ColorPicker variant={variant as 'palette'} />
			</div>
		{/each}
	</div>
	<p class="text-xs text-muted-foreground">
		Die Standardpalette liegt gleichmäßig um den OKLCH-Tonkreis bei konstanter Helligkeit und
		Buntheit — die Felder wirken deshalb gleich hell. Genau dafür ist OKLCH da: in HSL wäre ein
		Gelb bei <code>l: 50%</code> dramatisch heller als ein Blau daneben.
	</p>
</Section>

<Section
	title="Deckkraft und Farbraum"
	note="OKLCH kann Farben benennen, die sRGB nicht zeigen kann. Der Picker sagt das mit einem Warnzeichen, statt still abzuschneiden und jemanden einen Griff ziehen zu lassen, der nichts mehr ändert. Buntheit ganz nach rechts ziehen, um es zu sehen."
>
	<ColorPicker bind:value={withAlpha} alpha />
</Section>

<Section
	title="Barrierefreiheit"
	note="Die Fläche und der Ring sind aria-hidden, und zwar mit Absicht: ein zweiachsiges Farbfeld hat keine ehrliche ARIA-Form. Die Quelle setzt role=&quot;slider&quot; auf so eine Fläche, was aus demselben Grund ungültig ist, den A24 bei Rating benennt. Tastaturnutzer verlieren nichts — die Regler tun exakt dasselbe. Das Ziehen benutzt setPointerCapture statt eines Dokument-Listeners: keine globalen pointermove-Handler (F9), nichts aufzuräumen, und über den Rand hinausziehen funktioniert von selbst."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<ColorPicker glow />       <ColorPicker gradient />
<ColorPicker shimmer />    <ColorPicker tilt />     <ColorPicker magnet />`}</code
		></pre>
</Section>
