<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let name = $state('');
	let mail = $state('anna@example.at');
</script>

<svelte:head><title>Input · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Input</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Inputs. <strong>Keine dekorativen Effekte</strong> — §3.4
		gibt Formularfeldern nichts, und §3.5 sagt warum: ein Glow im Fokus konkurriert mit dem
		Fokusring und wird als Fehlerzustand gelesen.
	</p>
</header>

<Section title="Unverändert gegenüber shadcn-svelte">
	<Row label="Standard">
		<Input placeholder="Vorname" class="max-w-64" />
	</Row>
	<Row label="Typen">
		<Input type="email" placeholder="E-Mail" class="max-w-64" />
		<Input type="password" placeholder="Passwort" class="max-w-48" />
	</Row>
	<Row label="Datei">
		<Input type="file" class="max-w-64" />
	</Row>
	<Row label="Zustände">
		<Input disabled placeholder="deaktiviert" class="max-w-48" />
		<Input readonly value="schreibgeschützt" class="max-w-48" />
		<Input aria-invalid="true" placeholder="aria-invalid" class="max-w-48" />
	</Row>
</Section>

<Section
	title="Semantische Zustände"
	note="Die vuesax-Steuerelemente führen danger, warn und success als vollwertige Zustände; shadcn kennt nur das binäre data-[invalid]. danger nutzt shadcns eigenes --destructive — es gibt kein --danger-Synonym. Wichtig: state=&quot;danger&quot; setzt kein aria-invalid, denn eine Warnung ist kein ungültiger Wert, und beides zu vermengen würde einen Screenreader anlügen."
>
	<Row label="explizit">
		<Input state="danger" placeholder="danger" class="max-w-40" />
		<Input state="warn" placeholder="warn" class="max-w-40" />
		<Input state="success" placeholder="success" class="max-w-40" />
	</Row>
	<Row label="vom Field geerbt">
		<Field.Field state="warn" class="max-w-64">
			<Field.Label for="geerbt">Rechnungsadresse</Field.Label>
			<Input id="geerbt" placeholder="Straße und Hausnummer" />
			<Field.Description>Der Zustand färbt Label und Beschreibung mit.</Field.Description>
		</Field.Field>
	</Row>
</Section>

<Section
	title="Ladezustand"
	note="loading blockiert die Eingabe, ohne disabled zu setzen: volle Deckkraft, der Fokus bleibt, aria-busy ist gesetzt, und weil das Feld readonly statt disabled ist, wird sein Wert weiterhin abgeschickt."
>
	<Row label="loading">
		<Input loading value="wird geprüft…" class="max-w-64" />
	</Row>
</Section>

<Section
	title="Schwebendes Label"
	note="Ein echtes <fieldset> mit einer <legend> der Höhe 0, deren max-width animiert und dabei eine echte Lücke in den oberen Rand schneidet. Kein undurchsichtiger Hintergrund hinter dem Label — der bräche auf jeder nicht einfarbigen Fläche. Ganz ohne JavaScript: „gefüllt“ ist :is(input,textarea):not(:placeholder-shown), „fokussiert“ ist :focus-within."
>
	<div class="grid max-w-md gap-4">
		<Field.Floating label="Vollständiger Name">
			<Input bind:value={name} />
		</Field.Floating>
		<Field.Floating label="E-Mail">
			<Input type="email" bind:value={mail} />
		</Field.Floating>
		<Field.Floating label="Mit Fehlerzustand" state="danger">
			<Input />
		</Field.Floating>
	</div>
	<p class="text-xs text-muted-foreground">
		Das zweite Feld ist vorbefüllt, das erste nicht — das Label steht also nur dort oben, wo es
		hingehört. Die erste Fassung dieser Datei hatte die Bedingung als
		<code>:has(:not(:placeholder-shown))</code>, was auf die <code>legend</code> und das
		<code>label</code> selbst zutrifft und deshalb immer wahr war.
	</p>
</Section>
