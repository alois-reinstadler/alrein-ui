<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Section from '$lib/demo/section.svelte';
</script>

<svelte:head><title>Card · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Card</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-Card. Alle sieben Teilkomponenten sind unverändert; die
		Wurzel bekommt variant="hero", interactive, gradient, glow und tilt dazu. Glow ist bei Card
		bewusst die innen beschnittene Variante, damit overflow-hidden erhalten bleibt (A6).
	</p>
</header>

<Section title="Varianten und Effekte">
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title>Unverändert</Card.Title>
				<Card.Description>Keine alrein-Prop. Sieht auf jeder Stufe gleich aus.</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-muted-foreground">
					Header, Title, Description, Content, Footer und Action existieren weiterhin.
				</p>
			</Card.Content>
			<Card.Footer>
				<Button size="sm" variant="outline">Öffnen</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root interactive glow>
			<Card.Header>
				<Card.Title>Interaktiv mit Glow</Card.Title>
				<Card.Description>Glow verlangt interactive — sonst verspricht es nichts.</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-muted-foreground">Zeiger bewegen, um die Verfolgung zu sehen.</p>
			</Card.Content>
		</Card.Root>

		<Card.Root variant="hero" gradient>
			<Card.Header>
				<Card.Title>Hero mit Verlauf</Card.Title>
				<Card.Description class="text-primary-foreground/80">
					Beide Stopps sind aus --fx-tint gemischt, nie ein festes Hex-Paar.
				</Card.Description>
			</Card.Header>
			<Card.Content><p>Ein Themenwechsel färbt das hier automatisch um.</p></Card.Content>
		</Card.Root>

		<Card.Root tilt size="sm">
			<Card.Header><Card.Title>Tilt</Card.Title></Card.Header>
			<Card.Content>
				<p class="text-muted-foreground">
					Maximal 6°. Keine Karte mit schwebender UI darf kippen — das Portal würde sich am
					transformierten Vorfahren ausrichten und daneben landen.
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root interactive>
			<Card.Header><Card.Title>Nur Druckfeedback</Card.Title></Card.Header>
			<Card.Content><p class="text-muted-foreground">interactive ohne glow.</p></Card.Content>
		</Card.Root>
	</div>
</Section>

<Section
	title="Das Budget in Aktion (§3.5)"
	note="Auf „Ausdrucksstark“ kippt Card laut §3.3 von selbst — und genau dann meldet die Engine in der Konsole, dass §3.5 ein kippendes Element pro Fläche erlaubt. Dichte „Liste“ schaltet es wieder ab. Konsole öffnen und den Regler umschalten."
>
	<div class="grid gap-3 sm:grid-cols-3">
		{#each [1, 2, 3, 4, 5, 6] as index (index)}
			<Card.Root size="sm">
				<Card.Header><Card.Title>Karte {index}</Card.Title></Card.Header>
			</Card.Root>
		{/each}
	</div>
</Section>
