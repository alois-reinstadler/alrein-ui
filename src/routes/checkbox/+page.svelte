<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let plain = $state(false);
	let indeterminate = $state(true);
	let cardBasic = $state(false);
	let cardEffects = $state(true);
	let cardTilt = $state(false);
</script>

<svelte:head><title>Checkbox · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Checkbox</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-Checkbox. §5 fasst <code>checkbox</code> und
		<code>checkbox-card</code> zu einer Komponente mit <code>variant="card"</code> zusammen — getrennt
		gebaut hätte man zwei uneinheitliche Implementierungen derselben Tastaturbedienung, die ohnehin
		von bits-ui kommt.
	</p>
</header>

<Section
	title="Der Federweg am Häkchen"
	note="Upstream rendert die Markierung mit transition-none, sie erscheint also schlagartig. Hier skaliert sie mit leichtem Überschwingen aus dem Nichts — das ist es, was das Häkchen so lesen lässt, als lande es in der Box. Zusammen mit dem Druckfeedback ist der Umschaltdaumen der einzige weitere Ort, an dem §2 eine überschwingende Kurve erlaubt."
>
	<Row label="Zustände">
		<label class="flex items-center gap-2 text-sm">
			<Checkbox bind:checked={plain} /> anklicken und zusehen
		</label>
		<label class="flex items-center gap-2 text-sm">
			<Checkbox bind:indeterminate /> unbestimmt
		</label>
		<label class="flex items-center gap-2 text-sm text-muted-foreground">
			<Checkbox disabled /> deaktiviert
		</label>
		<label class="flex items-center gap-2 text-sm text-muted-foreground">
			<Checkbox disabled checked /> deaktiviert, gewählt
		</label>
	</Row>
</Section>

<Section
	title='variant="card"'
	note="Die Karte ist ein echtes <label>, also ist die ganze Fläche das Klickziel — ohne eine Zeile Klickbehandlung und ohne eine role, die man danach ehrlich halten müsste. §3.4 erlaubt der Karte Gradient und Glow im gewählten Zustand und Tilt uneingeschränkt."
>
	<div class="grid gap-3 sm:grid-cols-2">
		<Checkbox variant="card" bind:checked={cardBasic}>
			{#snippet label()}Basis{/snippet}
			{#snippet description()}Ohne Effekte. Nur Druckfeedback.{/snippet}
		</Checkbox>

		<Checkbox variant="card" bind:checked={cardEffects} gradient glow>
			{#snippet label()}Gradient und Glow{/snippet}
			{#snippet description()}Beide nur, solange gewählt — eine ungewählte Karte verspricht nichts.{/snippet}
		</Checkbox>

		<Checkbox variant="card" bind:checked={cardTilt}>
			{#snippet label()}Tilt{/snippet}
			{#snippet description()}Maximal 6°, aus dem Token --fx-tilt-max.{/snippet}
		</Checkbox>

		<Checkbox variant="card" disabled>
			{#snippet label()}Deaktiviert{/snippet}
			{#snippet description()}has-disabled greift auf die ganze Karte durch.{/snippet}
		</Checkbox>
	</div>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.4 gibt einer nackten Checkbox gar keine dekorativen Effekte — eine 16-px-Box hat nichts, woraus sie glühen könnte, und nichts zum Kippen. Die Props existieren auf der Standardvariante schlicht nicht."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Checkbox />                      ← Kartenexklusiv
<Checkbox glow />                      ← Kartenexklusiv
<Checkbox variant="card" shimmer />    ← Shimmer gehört zu Ladezuständen
<Checkbox variant="card" magnet />     ← Magnet nie in einem Formular`}</code
		></pre>
</Section>
