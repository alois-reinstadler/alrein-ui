<script lang="ts">
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let page = $state(4);
	let wide = $state(1);
	let compact = $state(3);
</script>

<svelte:head><title>Pagination · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Pagination</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-Pagination. Der aktive Knopf ist jetzt derselbe
		<code>MorphIndicator</code>, den auch Tabs benutzt (A18), und
		<code>variant="compact"</code> fasst die zweite Skin aus §5 mit ein.
	</p>
</header>

<Section
	title="Der Indikator ist derselbe wie bei Tabs"
	note="Die Quelle animiert Breite und Position gemeinsam auf einer Feder und nimmt den Überschwinger an der ersten und letzten Seite zurück. Als FLIP entfällt beides: Weil jeder Seitenknopf size-9 ist, ist der Skalierungsfaktor zwischen zweien exakt 1 und die Bewegung ein reines translateX. Genau deshalb ist hier auch die Radiusverzerrung nicht zu sehen, die A19 für die Reiterleiste beschreibt."
>
	<Pagination.Root count={100} perPage={10} bind:page>
		{#snippet children({ pages, currentPage })}
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.Previous />
				</Pagination.Item>
				{#each pages as item (item.key)}
					{#if item.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link page={item} isActive={currentPage === item.value} />
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.Next />
				</Pagination.Item>
			</Pagination.Content>
		{/snippet}
	</Pagination.Root>
</Section>

<Section
	title="Tastatur — was bits-ui bereits liefert"
	note="A24 nennt die fehlende Tastaturbedienung die größte Zugänglichkeitslücke der Phase 3 und verweist ausdrücklich auf bits-ui. Dort ist sie: ein gemeinsamer Tastenhandler für Seitenknöpfe und beide Pfeile, mit Links/Rechts beziehungsweise Hoch/Runter je nach Ausrichtung und Textrichtung, dazu Pos1, Ende und optional loop. Kein Wanderindex — den braucht es hier nicht, weil das Fenster aus Ellipsen die Zahl der Knöpfe deckelt."
>
	<Row label="loop, 240 Einträge">
		<Pagination.Root count={240} perPage={10} loop bind:page={wide}>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.Previous />
					</Pagination.Item>
					{#each pages as item (item.key)}
						{#if item.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link page={item} isActive={currentPage === item.value} />
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.Next />
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	</Row>
	<Row label="Was gezählt wird">
		<p class="max-w-3xl text-sm text-muted-foreground">
			Vierundzwanzig Seiten, aber höchstens sieben Seitenknöpfe plus zwei Pfeile — neun
			Tabulatorstopps, unabhängig von der Gesamtzahl. In der Quelle gibt es keine Ellipse: dort
			ist jede Seite ein echter Knopf in einer verschobenen Spur, und eine Hundertseitenliste
			sind hundert Stopps. Die Lücke folgt also aus dem Entwurf, nicht aus der Tastatur.
		</p>
	</Row>
</Section>

<Section
	title='variant="compact"'
	note="Die zweite Skin aus §5, ohne die Zahlenwalze der Quelle. Zeile 20 der Layout-Inventur lehnt sie ab, und der Ersatz ist der Grund: tabular-nums plus eine in ch reservierte Breite lässt die Anzeige nie ihre Größe ändern, also bleibt nichts zu animieren. Damit verschwindet zugleich die einzige Stelle in Phase 2/3, die einen transitionend-Zuhörer mit Zeitgeber-Rückfall brauchte (A22)."
>
	<Row label="Kompakt">
		<Pagination.Root count={120} perPage={10} variant="compact" bind:page={compact}>
			<Pagination.Previous />
			<Pagination.Status />
			<Pagination.Next />
		</Pagination.Root>
	</Row>
	<Row label="Eigene Beschriftung">
		<Pagination.Root count={57} perPage={10} variant="compact" bind:page={compact}>
			<Pagination.Previous />
			<Pagination.Status>
				{#snippet children({ page: current, totalPages })}
					Seite {current} von {totalPages}
				{/snippet}
			</Pagination.Status>
			<Pagination.Next />
		</Pagination.Root>
	</Row>
</Section>

<Section
	title="Zugänglichkeit, die nicht geerbt wird"
	note="Zwei Dinge stehen hier anders als in der Quelle beziehungsweise als upstream. Erstens: aria-current='page' bleibt am Knopf, der Indikator trägt aria-hidden — §3.5 verbietet einer dekorativen Schicht, alleiniger Träger eines Zustands zu sein, und ebenso, ein zweiter zu sein. Zweitens: upstream setzt aria-hidden auf die Ellipse und legt den Nur-für-Screenreader-Text hinein, wo ihn niemand mehr hört. Das aria-hidden sitzt jetzt am Symbol."
>
	<Row label="Ellipse">
		<Pagination.Ellipsis />
		<p class="max-w-xl text-sm text-muted-foreground">
			Optisch unverändert, aber die Lücke im Seitenlauf wird wieder angesagt.
		</p>
	</Row>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.4 teilt Pagination die Zeile mit Tabs: ghost und sonst nichts. Ghost ist auch hier keine Prop, sondern schon da — jede nicht aktuelle Seite rendert bereits die ghost-Variante des Buttons. Das --lit-Licht auf den Pfeilen, das Cursorlicht auf den Ziffern und der gooey-Filter der Quelle sind dieselbe Zeile, dreimal."
>
	<Row label="Abgelehnt">
		<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
				>{`<Pagination.Root gradient />           ← §3.4 gibt Pagination keinen Gradient
<Pagination.Root glow />               ← das Licht auf den Pfeilen ist genau das
<Pagination.Root shimmer />            ← eine Dauerschleife ist Laden, oder Migräne
<Pagination.Root tilt />               ← der 3D-Druck der Quelle ist mit A10 abgelehnt
<Pagination.Root magnet />             ← Magnet nie in der Anwendungsverkleidung
<Pagination.Link glow />               ← eine Seite unter Gleichen ist kein Zielpunkt
<Pagination.Root variant="ink" />      ← ink, dots, segments und gooey sind nicht portiert`}</code
			></pre>
	</Row>
</Section>
