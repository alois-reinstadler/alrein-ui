<script lang="ts">
	import { CodeWindow } from '$lib/components/ui/code/index.js';
	import Section from '$lib/demo/section.svelte';

	const svelte = `<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
<\/script>

<Button glow>Hauptaktion</Button>`;
</script>

<svelte:head><title>CodeWindow · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">CodeWindow</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Derselbe Codeblock mit Fensterrahmen. Bewusst ein <em>Wrapper</em> statt einer zweiten
		Implementierung — Hervorhebung, Kopierknopf, Rückfall und Zeilennummern bleiben an einer
		Stelle.
	</p>
</header>

<Section title="Mit Titelleiste">
	<CodeWindow code={svelte} lang="svelte" title="App.svelte" lineNumbers />
</Section>

<Section
	title="Ohne Ampel"
	note="Die drei Punkte sind dekorativ und als solche markiert: sie tragen keine Information, die ein Screenreader braucht, und sie anzusagen wäre Lärm. Ihre Farben sind die semantischen Zustandstokens, keine erfundenen — sie ziehen also bei einem Themenwechsel mit (A9)."
>
	<CodeWindow code="pnpm build" lang="bash" title="terminal" traffic={false} />
</Section>
