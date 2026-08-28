<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const people = ['AR', 'MK', 'LS', 'TB', 'JW'];
</script>

<svelte:head><title>Avatar · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Avatar</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Avatars. Alle sechs Teilkomponenten bleiben. §3.4 erlaubt
		Gradient (nur Fallback-Hintergrund), Glow (nur bei Präsenz), Shimmer (Laden) und Tilt (ab Größe
		lg). Kein Magnet.
	</p>
</header>

<Section title="Unverändert gegenüber shadcn-svelte">
	<Row label="Bild und Fallback">
		<Avatar.Root>
			<Avatar.Image src="https://i.pravatar.cc/80?img=12" alt="Anna Reiter" />
			<Avatar.Fallback>AR</Avatar.Fallback>
		</Avatar.Root>
		<Avatar.Root>
			<Avatar.Fallback>MK</Avatar.Fallback>
		</Avatar.Root>
	</Row>
</Section>

<Section
	title="Präsenz"
	note="§3.5 greift hier hart: der Glow darf niemals das alleinige Signal sein. Der Punkt trägt den Zustand und ein sr-only-Text benennt ihn; der Glow hebt nur hervor — und er ist bei reduzierter Bewegung, auf grobem Zeiger und bei data-fx=&quot;off&quot; vollständig weg. Der Zustand bleibt in allen drei Fällen ablesbar."
>
	<Row label="Zustände">
		{#each ['online', 'busy', 'away', 'offline'] as presence (presence)}
			<Avatar.Root presence={presence as 'online'}>
				<Avatar.Fallback>{presence.slice(0, 2).toUpperCase()}</Avatar.Fallback>
			</Avatar.Root>
		{/each}
	</Row>
	<Row label="mit Glow">
		<Avatar.Root presence="online" glow size="lg">
			<Avatar.Fallback>AR</Avatar.Fallback>
		</Avatar.Root>
	</Row>
</Section>

<Section
	title="Tilt ab Größe lg"
	note="Die ◐-Bedingung aus §3.4. Ein 32-px-Avatar hat zu wenig Fläche, als dass 6° Neigung als Objekt statt als Wackeln gelesen würden. Die Quelle wendet hier zusätzlich den 3D-Druck an — abgelehnt (A10, A20): perspective() erzeugt einen Container-Block für position: fixed, und Avatare tragen routinemäßig Tooltips."
>
	<Row label="Größen">
		{#each ['sm', 'default', 'lg', 'xl'] as size (size)}
			<Avatar.Root size={size as 'lg'}>
				<Avatar.Fallback>{size.slice(0, 2).toUpperCase()}</Avatar.Fallback>
			</Avatar.Root>
		{/each}
	</Row>
</Section>

<Section
	title="Laden"
	note="Der Shimmer hier ist die Ladeschleife, nicht der ausgelöste Aufmerksamkeitsstrich — und bei reduzierter Bewegung wird sie langsamer statt anzuhalten (A17)."
>
	<Row label="shimmer">
		<Avatar.Root shimmer size="lg"><Avatar.Fallback>…</Avatar.Fallback></Avatar.Root>
	</Row>
</Section>

<Section
	title="AvatarGroup"
	note="Die Kinder bekommen laut §3.4 nur Gradient und Shimmer. Ein aufgefächerter Stapel überlappender Kreise ist der letzte Ort, an dem ein zeigerverfolgter Effekt hingehört. Die grid-Variante der Quelle animiert dafür gap und margin — abgelehnt (Layout-Inventar Zeile 4); die Basis fächert bereits mit translateX, und das wird wiederverwendet."
>
	<Row label="Stapel">
		<Avatar.Group>
			{#each people.slice(0, 4) as person (person)}
				<Avatar.Root><Avatar.Fallback>{person}</Avatar.Fallback></Avatar.Root>
			{/each}
			<Avatar.GroupCount>+12</Avatar.GroupCount>
		</Avatar.Group>
	</Row>
</Section>

<Section title="Was ein Typfehler ist">
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Avatar magnet />   ← Magnet ist für isolierte Handlungsaufforderungen;
                       ein Avatar ist weder isoliert noch eine Aufforderung`}</code
		></pre>
</Section>
