<script lang="ts">
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group/index.js';
	import Section from '$lib/demo/section.svelte';

	let plan = $state('pro');
	let plain = $state('b');
	let effects = $state('glow');
</script>

<svelte:head><title>RadioGroup · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">RadioGroup</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-RadioGroup. §5 fasst <code>radio</code>,
		<code>radio-card</code>, <code>radio-group</code> und <code>radio-group-cards</code> zu einer
		Komponente mit <code>variant="card"</code> zusammen. Vier getrennte Komponenten sind der Weg zu
		vier uneinheitlichen Implementierungen derselben Pfeiltastenbedienung — die ohnehin von bits-ui
		kommt.
	</p>
</header>

<Section
	title="Der Federweg am Punkt"
	note="Dieselbe Mechanik wie die Häkchen-Markierung, und der zweite der beiden Orte, an denen §2 eine überschwingende Kurve erlaubt."
>
	<RadioGroup bind:value={plain} class="flex flex-row gap-6">
		{#each ['a', 'b', 'c'] as value (value)}
			<label class="flex items-center gap-2 text-sm">
				<RadioGroupItem {value} />
				Option {value.toUpperCase()}
			</label>
		{/each}
	</RadioGroup>
</Section>

<Section
	title='variant="card"'
	note="Die Gruppe veröffentlicht ihren Wert an ihre Elemente. Ein Element muss wissen, ob es gewählt ist, bevor es rendert — sonst kann es die ◐-Bedingung „selected“ aus §3.4 nicht auflösen — und bits-ui gibt checked nur innerhalb des children-Snippets heraus. Der Vergleich gegen den veröffentlichten Wert hält eine einzige Quelle der Wahrheit."
>
	<RadioGroup bind:value={plan} class="grid gap-3 sm:grid-cols-3">
		<RadioGroupItem value="frei" variant="card">
			{#snippet label()}Frei{/snippet}
			{#snippet description()}0 € pro Monat{/snippet}
		</RadioGroupItem>
		<RadioGroupItem value="pro" variant="card" gradient glow>
			{#snippet label()}Pro{/snippet}
			{#snippet description()}20 € pro Monat. Gradient und Glow nur im gewählten Zustand.{/snippet}
		</RadioGroupItem>
		<RadioGroupItem value="team" variant="card" tilt>
			{#snippet label()}Team{/snippet}
			{#snippet description()}60 € pro Monat. Mit Tilt.{/snippet}
		</RadioGroupItem>
	</RadioGroup>
</Section>

<Section
	title="Nur Tilt, ohne Auswahleffekte"
	note="Tilt ist in §3.4 uneingeschränkt erlaubt und hängt nicht am gewählten Zustand — es signalisiert „ein Gegenstand, den man aufheben kann“, nicht „gewählt“. §3.5: kein Effekt darf alleiniger Träger eines Zustands sein."
>
	<RadioGroup bind:value={effects} class="grid gap-3 sm:grid-cols-2">
		<RadioGroupItem value="glow" variant="card" tilt>
			{#snippet label()}Erste{/snippet}
		</RadioGroupItem>
		<RadioGroupItem value="tilt" variant="card" tilt>
			{#snippet label()}Zweite{/snippet}
		</RadioGroupItem>
	</RadioGroup>
</Section>
