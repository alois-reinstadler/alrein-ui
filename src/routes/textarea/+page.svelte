<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let note = $state('');
	let bio = $state('Kurzer Text, der mitgezählt wird.');
</script>

<svelte:head><title>Textarea · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Textarea</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-Textarea, inklusive
		<code>field-sizing-content</code>. Dieselben Zustände wie Input, plus ein Zeichenzähler. Keine
		dekorativen Effekte — §3.4.
	</p>
</header>

<Section title="Unverändert gegenüber shadcn-svelte">
	<Row label="Standard">
		<Textarea placeholder="Notiz" class="max-w-md" />
	</Row>
	<Row label="Zustände">
		<Textarea disabled placeholder="deaktiviert" class="max-w-48" />
		<Textarea readonly value="schreibgeschützt" class="max-w-48" />
	</Row>
</Section>

<Section title="Semantische Zustände">
	<Row label="explizit">
		<Textarea state="danger" placeholder="danger" class="max-w-40" />
		<Textarea state="warn" placeholder="warn" class="max-w-40" />
		<Textarea state="success" placeholder="success" class="max-w-40" />
	</Row>
	<Row label="vom Field geerbt">
		<Field.Field state="success" class="max-w-md">
			<Field.Label for="ta-geerbt">Beschreibung</Field.Label>
			<Textarea id="ta-geerbt" placeholder="Beschreibung" />
			<Field.Description>Gespeichert.</Field.Description>
		</Field.Field>
	</Row>
</Section>

<Section
	title="Zeichenzähler"
	note="Nur mit maxlength; ohne maxlength rendert counter gar nichts. aria-live=&quot;polite&quot;, damit die Ansage nicht bei jedem Tastendruck dazwischenfunkt, und text-destructive am Limit."
>
	<div class="grid max-w-md gap-4">
		<Textarea counter maxlength={120} bind:value={bio} placeholder="Kurzbiografie" />
		<Textarea counter placeholder="ohne maxlength — kein Zähler" />
	</div>
</Section>

<Section title="Ladezustand und schwebendes Label">
	<div class="grid max-w-md gap-4">
		<Textarea loading value="wird gespeichert…" />
		<Field.Floating label="Anmerkung">
			<Textarea bind:value={note} />
		</Field.Floating>
	</div>
</Section>
