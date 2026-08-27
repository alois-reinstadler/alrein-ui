<script lang="ts">
	import { Steps } from '$lib/components/ui/steps/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Section from '$lib/demo/section.svelte';

	const checkout = [
		{ label: 'Warenkorb', description: 'Drei Artikel' },
		{ label: 'Adresse', description: 'Lieferung' },
		{ label: 'Zahlung', description: 'Karte oder Rechnung' },
		{ label: 'Bestätigung' }
	];

	let current = $state(1);
</script>

<svelte:head><title>Steps · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Steps</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §5 fasst <code>steps</code> und
		<code>steps-arrow</code> zu einer Komponente mit <code>variant</code> zusammen. §3.4 erlaubt
		<strong>Gradient am aktiven Schritt und sonst nichts</strong>.
	</p>
</header>

<Section
	title="Die Choreografie"
	note="Vor und zurück schalten. Die gestaffelten Verzögerungen sind die eigentliche Choreografie — feuert man Verbinder, Ring und Markierung gleichzeitig, wirkt es als Blitz. Rückwärts kehrt sich die Reihenfolge um, nicht die Animation: der Verbinder am anderen Ende leert sich zuerst, und genau das lässt es wie Rückgängigmachen wirken statt wie Zurückspulen."
>
	<Steps steps={checkout} value={current} />
	<div class="flex gap-2">
		<Button
			variant="outline"
			size="sm"
			disabled={current === 0}
			onclick={() => (current = Math.max(0, current - 1))}>Zurück</Button
		>
		<Button
			size="sm"
			disabled={current === checkout.length}
			onclick={() => (current = Math.min(checkout.length, current + 1))}>Weiter</Button
		>
		<span class="self-center text-xs text-muted-foreground">Schritt {current + 1}</span>
	</div>
</Section>

<Section title="Ausrichtung und Varianten">
	<div class="grid gap-8 lg:grid-cols-2">
		<div>
			<p class="mb-3 text-xs font-medium text-muted-foreground">vertikal</p>
			<Steps steps={checkout} value={2} orientation="vertical" />
		</div>
		<div>
			<p class="mb-3 text-xs font-medium text-muted-foreground">variant="arrow"</p>
			<Steps steps={checkout.slice(0, 3)} value={1} variant="arrow" />
		</div>
	</div>
</Section>

<Section
	title="Gradient am aktiven Schritt"
	note="Die ◐-Bedingung aus §3.4: nur der aktuelle Schritt wird bemalt. Die Quelle legt zusätzlich einen box-shadow-Glow auf die bar-Variante und 4-px-Ringe auf aktive Markierungen — beides ist doppelt draußen: §3.4 gibt Steps keinen Glow, und §3.5 verbietet jeden Effekt, der mit dem echten Fokusring konkurriert."
>
	<Steps steps={checkout} value={2} gradient />
</Section>

<Section
	title="Nicht interaktiv, und zwar absichtlich"
	note="Ein Klick auf einen ausstehenden oder aktiven Schritt tut in der Quelle nichts. „Auf jeden Schritt klicken, um dorthin zu springen“ ist eine andere Produktentscheidung, kein fehlendes Feature — also rendert das hier eine geordnete Liste statt einer Reihe von Buttons und legt nichts in die Tab-Reihenfolge, das nicht reagieren würde. Jeder Schritt trägt seinen Status zusätzlich als sr-only-Text, weil Farbe und Häkchen beide rein visuell sind (§3.5)."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Steps glow />    <Steps shimmer />    <Steps tilt />    <Steps magnet />`}</code
		></pre>
</Section>
