<script lang="ts">
	import * as Skeleton from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';
</script>

<svelte:head><title>Skeleton · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Skeleton</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Skeletons. §3.4 gibt Skeleton
		<strong>Shimmer und sonst nichts</strong> — und es ist die einzige Komponente aus Phase 2, bei
		der die Quelle nichts anwendet, was die Matrix nicht ohnehin erlaubt.
	</p>
</header>

<Section
	title="Unverändert gegenüber shadcn-svelte"
	note="Upstream ist ein div mit rounded-md, bg-muted und animate-pulse. Alle drei sind weiterhin die Voreinstellung."
>
	<Row label="ohne Props">
		<Skeleton.Root class="h-4 w-32" />
		<Skeleton.Root class="size-10 rounded-full" />
	</Row>
</Section>

<Section
	title="Der Dauerschimmer — der einzige Ort, an dem er hingehört"
	note="§3.5 teilt Shimmer in zwei. Die schleifende Form bedeutet ausschließlich „lädt“, und sie ist reines CSS: kein JavaScript, keine Attachment, nichts. Ein Skeleton ist der Ladezustand, also ist die Schleife hier ehrlich — und überall sonst Migräne."
>
	<Row label="shimmer">
		<Skeleton.Root shimmer class="h-4 w-48" />
		<Skeleton.Root shimmer class="size-10 rounded-full" />
	</Row>
	<Row label="beides">
		<Skeleton.Root shimmer pulse class="h-4 w-48" />
	</Row>
	<p class="text-xs text-muted-foreground">
		Ohne Props ist <code>pulse</code> an und <code>shimmer</code> aus — das ist upstream. Mit
		<code>shimmer</code> geht <code>pulse</code> von selbst aus: eine Schleife pro Element, außer
		man verlangt ausdrücklich beide.
	</p>
</Section>

<Section
	title="Ein Licht für die ganze Gruppe"
	note="Die beste strukturelle Idee aus Phase 2. Statt jedem Knochen sein eigenes Licht zu geben, läuft ein einziges Licht über die gesamte Gruppe — eine Container-Query plus cqw-Maßangaben. Links laufen die Lichter unabhängig und die Karte wirkt wie fünf Dinge; rechts wirkt sie wie ein Ding, das lädt."
>
	<div class="grid gap-4 sm:grid-cols-2">
		<Card.Root>
			<Card.Header><Card.Title class="text-sm">Einzeln</Card.Title></Card.Header>
			<Card.Content class="flex gap-3">
				<Skeleton.Root shimmer class="size-10 shrink-0 rounded-full" />
				<div class="flex flex-1 flex-col gap-2">
					<Skeleton.Root shimmer class="h-3 w-24" />
					<Skeleton.Root shimmer class="h-3 w-full" />
					<Skeleton.Root shimmer class="h-3 w-4/5" />
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header><Card.Title class="text-sm">Als Gruppe</Card.Title></Card.Header>
			<Card.Content>
				<Skeleton.Group class="flex gap-3" label="Profil wird geladen">
					<Skeleton.Root shimmer class="size-10 shrink-0 rounded-full" />
					<div class="flex flex-1 flex-col gap-2">
						<Skeleton.Root shimmer class="h-3 w-24" />
						<Skeleton.Root shimmer class="h-3 w-full" />
						<Skeleton.Root shimmer class="h-3 w-4/5" />
					</div>
				</Skeleton.Group>
			</Card.Content>
		</Card.Root>
	</div>
</Section>

<Section
	title="Reduzierte Bewegung (A17)"
	note="Die Schleife wird langsamer, nicht angehalten: --fx-shimmer-duration geht von 900 ms auf 3 s. Ein stillstehendes Skeleton behauptet, der Inhalt sei da. In dieser Datei steht kein einziger reduced-motion-Zweig und es darf auch keiner hinein — die Ausnahme lebt genau an einer Stelle, im Token, und jede Ladeanzeige der Bibliothek erbt sie."
>
	<Row label="dieselbe Komponente"><Skeleton.Root shimmer class="h-4 w-48" /></Row>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="Ein Skeleton ist ein Platzhalter für Inhalt, den es noch nicht gibt. Es gibt nichts hervorzuheben, nichts aufzuheben und keine Absicht zu signalisieren."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Skeleton glow />      <Skeleton gradient />
<Skeleton tilt />      <Skeleton magnet />`}</code
		></pre>
</Section>
