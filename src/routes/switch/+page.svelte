<script lang="ts">
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let plain = $state(false);
	let labelled = $state(true);
	let small = $state(false);
</script>

<svelte:head><title>Switch · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Switch</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Switches. §5 fasst vuesax'
		<code>switch-dot</code> und <code>switch-label</code> zu einer Komponente mit
		<code>label</code>-Snippet zusammen.
	</p>
</header>

<Section
	title="Der Federweg am Daumen"
	note="Der Daumen ist ein Umschaltdaumen — zusammen mit dem Druckfeedback einer von genau zwei Orten, an denen §2 eine überschwingende Kurve erlaubt. Das Überschwingen ist es, was einen Schalter einrasten statt gleiten lässt. Die Spurfarbe läuft über dieselbe Dauer auf ease-fx-out und kommt dadurch einen Hauch nach dem Daumen an."
>
	<Row label="Größen">
		<Switch bind:checked={plain} />
		<Switch size="sm" bind:checked={small} />
	</Row>
	<Row label="Zustände">
		<Switch disabled />
		<Switch disabled checked />
	</Row>
</Section>

<Section
	title="label-Snippet"
	note="Das Label steht neben der Spur, nicht darin: eine 32 px breite Spur um einen 16 px großen Daumen lässt ~14 px frei, in die nichts Lesbares passt — und die Spur zu verbreitern wäre ein Effekt, der die Layoutgröße ändert (§1). Beides zusammen liegt in einem <label>, also ist die ganze Zeile ein Klickziel. Kein Klick-Handler: ein <button> ist ein beschriftbares Element, der Browser leitet den Klick also selbst weiter und leitet einen Klick, der auf dem Button begann, gerade nicht weiter — kein doppeltes Umschalten."
>
	<div class="flex flex-col gap-3">
		<Switch bind:checked={labelled}>
			{#snippet label()}Benachrichtigungen{/snippet}
		</Switch>
		<Switch size="sm">
			{#snippet label()}Wöchentliche Zusammenfassung{/snippet}
		</Switch>
		<Switch disabled>
			{#snippet label()}Nicht verfügbar{/snippet}
		</Switch>
	</div>
</Section>
