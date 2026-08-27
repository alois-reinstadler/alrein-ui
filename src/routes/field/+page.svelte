<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import Section from '$lib/demo/section.svelte';

	const states = ['default', 'danger', 'warn', 'success'] as const;
</script>

<svelte:head><title>Field · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Field</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Fields. Zwei Ergänzungen: semantische Zustände und das
		schwebende Label. Alle Teilkomponenten — Label, Description, Error, Content, Group, Set, Legend,
		Separator, Title — bleiben unverändert.
	</p>
</header>

<Section
	title="Zustände"
	note="danger bildet auf shadcns eigenes --destructive ab; für warn und success gibt es bei shadcn keine Entsprechung, also sind das neue Tokens — genau der Fall, den A9 erlaubt. Sie liegen im --color-*-Namensraum, verhalten sich also wie jede andere shadcn-Farbe: text-warning, border-success/40 und so weiter."
>
	<div class="grid gap-6 sm:grid-cols-2">
		{#each states as state (state)}
			<Field.Field {state}>
				<Field.Label for="f-{state}">Rechnungsadresse</Field.Label>
				<Input id="f-{state}" placeholder="Straße und Hausnummer" />
				<Field.Description>state="{state}"</Field.Description>
			</Field.Field>
		{/each}
	</div>
	<p class="text-xs text-muted-foreground">
		Der Zustand färbt Label und Beschreibung und veröffentlicht <code>data-state</code>. Er greift
		bewusst nicht selbst in den Rand des Steuerelements — Steuerelemente melden sich mit
		<code>group-data-[state=*]/field:</code> an. So bleibt jedes Element Herr über seine eigene
		Fläche, statt dass die Gruppe mit einem Nachfahrenselektor hindurchgreift.
	</p>
</Section>

<Section
	title="Ausrichtung (unverändert)"
	note="vertical, horizontal und responsive kommen unverändert von upstream."
>
	<div class="grid gap-4">
		<Field.Field orientation="horizontal" class="max-w-md">
			<Checkbox id="f-h" />
			<Field.Content>
				<Field.Label for="f-h">Newsletter abonnieren</Field.Label>
				<Field.Description>Höchstens einmal im Monat.</Field.Description>
			</Field.Content>
		</Field.Field>
	</div>
</Section>

<Section
	title="Schwebendes Label"
	note="Ein echtes <fieldset> mit einer <legend> der Höhe 0. Die max-width der legend animiert und schneidet dabei eine echte Lücke in den oberen Rand — kein undurchsichtiges Label über dem Rand, das auf jeder nicht einfarbigen Fläche bräche. Die Höhe 0 ist der tragende Teil: ohne sie nimmt die legend am Blocklayout des fieldsets teil und der Rand springt."
>
	<div class="grid max-w-md gap-4">
		<Field.Floating label="Vollständiger Name">
			<Input />
		</Field.Floating>
		<Field.Floating label="E-Mail" state="danger">
			<Input type="email" />
		</Field.Floating>
	</div>
	<p class="text-xs text-muted-foreground">
		Die Beschriftung wird zweimal gerendert: die Kopie in der <code>legend</code> ist unsichtbar und
		<code>aria-hidden</code> und reserviert nur die Breite der Lücke; die sichtbare Kopie ist ein
		echtes <code>&lt;label&gt;</code>, auf das das Steuerelement zeigt. Die id dafür wandert über
		Kontext, damit man kein <code>for</code>/<code>id</code>-Paar von Hand verdrahten muss.
	</p>
</Section>
