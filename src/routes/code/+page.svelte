<script lang="ts">
	import { Code, LANGUAGES } from '$lib/components/ui/code/index.js';
	import Section from '$lib/demo/section.svelte';

	const ts = `import { Button } from '$lib/components/ui/button/index.js';

// Bei data-fx="calm" glüht nichts, solange man nicht fragt.
export function primary(label: string) {
	return { label, glow: true } as const;
}`;

	const css = `@utility fx-glow {
	position: relative;
	isolation: isolate;
}`;
</script>

<svelte:head><title>Code · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Code</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Neu — shadcn-svelte hat keine Entsprechung. §5 teilt vuesax' <code>code</code> und
		<code>vs-code</code> in <strong>Code</strong> und <strong>CodeWindow</strong> auf.
		<strong>Keine dekorativen Effekte</strong>: ein Syntaxhervorheber existiert, damit Code lesbar
		wird, und alles, was darübergemalt wird, arbeitet dagegen.
	</p>
</header>

<Section
	title="Die nicht hervorgehobene Darstellung ist die echte (A27)"
	note="Serverseitig und clientseitig bis Shiki geladen ist, rendert das ein einfaches, korrekt maskiertes <pre><code>. Das ist kein Notbehelf: der Code ist ab dem ersten Frame lesbar, markierbar und kopierbar — und bleibt es, falls der Hervorheber nie ankommt. Shiki kommt per dynamischem import() aus shiki/bundle/web mit einer expliziten Sprachliste; eine Seite ohne Codeblock lädt nichts davon."
>
	<Code code={ts} lang="typescript" caption="src/lib/example.ts" />
</Section>

<Section
	title="Zeilennummern"
	note="Als CSS-Zähler auf Shikis eigenen .line-Spans, nicht als gerenderter Text. Der Grund ist praktisch: eine über content ausgegebene Zahl ist nicht markierbar, ein Kopiervorgang kopiert also den Code und nicht „1 2 3 4“ am linken Rand. Jede handgebaute Zeilennummerierung, die echten Text rendert, macht genau das falsch."
>
	<Code code={css} lang="css" lineNumbers caption="fx.css" />
</Section>

<Section title="Varianten" note="minimal lässt Rahmen und Hintergrund weg — für Fließtext-Dokumentation.">
	<Code code="pnpm dlx shadcn-svelte@latest add button" lang="bash" variant="minimal" />
</Section>

<Section
	title="Sprachen"
	note="Bewusst kurz. Eine Sprache hinzuzufügen ist eine bewusste Handlung mit einem Download daran — und genau das ist der Punkt: eine offene Liste ist der Weg, auf dem aus einer 40-KB-Komponente eine 2-MB-Komponente wird, ohne dass jemand es entschieden hätte. Eine nicht unterstützte Sprache rendert unhervorgehoben statt zu scheitern."
>
	<p class="font-mono text-xs text-muted-foreground">{LANGUAGES.join(' · ')}</p>
	<Code code="? unbekannte Sprache" lang="brainfuck" caption="rendert trotzdem" />
</Section>

<Section title="Was ein Typfehler ist">
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Code glow />    <Code gradient />    <Code shimmer />
<Code tilt />    <Code magnet />`}</code
		></pre>
</Section>
