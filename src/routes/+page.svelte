<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { FxScope } from '$lib/fx/index.js';
	import { CAPABILITIES, type FxEffect } from '$lib/fx/capabilities.js';
	import type { FxDensity, FxLevel } from '$lib/fx/context.svelte.js';
	import FxControls from '$lib/demo/fx-controls.svelte';
	import Row from '$lib/demo/row.svelte';
	import Section from '$lib/demo/section.svelte';

	let level = $state<FxLevel>('calm');
	let density = $state<FxDensity>('default');
	let dark = $state(false);

	const buttonVariants = ['default', 'secondary', 'outline', 'destructive', 'ghost', 'link'] as const;
	const buttonSizes = ['xs', 'sm', 'default', 'lg'] as const;
	const iconSizes = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;
	const badgeVariants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

	const effects: FxEffect[] = ['gradient', 'glow', 'shimmer', 'tilt', 'magnet'];
	const componentNames = Object.keys(CAPABILITIES) as (keyof typeof CAPABILITIES)[];

	function cell(component: keyof typeof CAPABILITIES, effect: FxEffect): string {
		const value = (CAPABILITIES[component] as Record<string, unknown>)[effect];
		if (value === undefined) return '—';
		return value === true ? '●' : `◐ ${value}`;
	}
</script>

<svelte:head><title>alrein-ui · Phase 0</title></svelte:head>

<FxControls bind:level bind:density bind:dark />

<!--
	One scope wraps the whole demo, which is the point: nothing below passes an
	effect level, and every effect still resolves through SPEC.md §3.2. Switch the
	control above and watch the same markup change behaviour without changing a
	single prop.
-->
<FxScope {level} {density} class="block">
	<header class="border-b px-6 py-10">
		<h1 class="cn-font-heading text-2xl font-medium">alrein-ui</h1>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			Phase 0 — Fundament plus Button, Card und Badge als echte Supersets der shadcn-svelte
			Komponenten. Jede Variante oben ist unverändert; die Effekte kommen additiv dazu.
		</p>
		<p class="mt-3 max-w-3xl text-sm text-muted-foreground">
			Beim Umschalten auf <strong>Aus</strong> darf sich kein Element auch nur um ein Pixel
			verschieben — Effekte fassen ausschließlich Transform, Filter, Deckkraft und Hintergrund an.
		</p>
	</header>

	<Section
		title="Button — Varianten und Größen (unverändert gegenüber shadcn-svelte)"
		note="Diese Zeilen enthalten keine einzige alrein-Prop. Sie müssen auf jeder Effektstufe identisch aussehen. Druckfeedback ist die Ausnahme: es ist laut §3.1 immer aktiv und degradiert bei „Aus“ auf Farbe."
	>
		<Row label="Varianten">
			{#each buttonVariants as variant (variant)}
				<Button {variant}>{variant}</Button>
			{/each}
		</Row>
		<Row label="Größen">
			{#each buttonSizes as size (size)}
				<Button {size}>{size}</Button>
			{/each}
		</Row>
		<Row label="Icon-Größen">
			{#each iconSizes as size (size)}
				<Button {size} aria-label={size}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</Button>
			{/each}
		</Row>
		<Row label="Zustände">
			<Button disabled>deaktiviert</Button>
			<Button href="/">als Link</Button>
			<Button href="/" disabled>Link deaktiviert</Button>
		</Row>
	</Section>

	<Section
		title="Button — Effekte"
		note="Jeder Effekt hier ist pro Instanz angefordert. Bei „Ruhig“ gilt genau das Angeforderte; bei „Ausdrucksstark“ glüht der Primärbutton zusätzlich von selbst, und Magnet wird überhaupt erst verfügbar."
	>
		<Row label="gradient (nur primär)">
			<Button gradient>Jetzt starten</Button>
			<Button variant="secondary" gradient>sekundär + gradient</Button>
		</Row>
		<Row label="glow (primär/akzent)">
			<Button glow>Hauptaktion</Button>
			<Button variant="secondary" glow>sekundär</Button>
		</Row>
		<Row label="shimmer (ausgelöst)">
			<Button shimmer>Zeigen</Button>
			<Button variant="ghost" shimmer>ghost + shimmer</Button>
		</Row>
		<Row label="tilt (ab Größe md)">
			<Button tilt size="lg">Kippen</Button>
			<Button tilt size="sm">zu klein — bleibt aus</Button>
		</Row>
		<Row label="magnet (nur ausdrucksstark)">
			<Button magnet size="lg">Unübersehbar</Button>
		</Row>
		<Row label="explizit abgeschaltet">
			<Button glow={false}>glow={'{false}'} schlägt jede Voreinstellung</Button>
		</Row>
	</Section>

	<Section
		title="Card"
		note="Alle sieben Teilkomponenten sind unverändert. Die Wurzel bekommt variant=hero, interactive, gradient, glow und tilt dazu. Glow ist bei Card bewusst die innen beschnittene Variante, damit overflow-hidden erhalten bleibt (A6)."
	>
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
						Maximal 6°. Kein Element mit schwebender UI darf kippen — das Portal würde sich am
						transformierten Vorfahren ausrichten.
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root interactive>
				<Card.Header><Card.Title>Nur Druckfeedback</Card.Title></Card.Header>
				<Card.Content><p class="text-muted-foreground">interactive ohne glow.</p></Card.Content>
			</Card.Root>
		</div>

		<div>
			<p class="mb-3 text-xs font-medium text-muted-foreground">
				Sechs Karten in einem Raster. Auf „Ausdrucksstark“ kippt Card laut §3.3 von selbst — und
				genau dann meldet die Engine in der Konsole, dass §3.5 ein kippendes Element pro Fläche
				erlaubt. Dichte „Liste“ schaltet es wieder ab.
			</p>
			<div class="grid gap-3 sm:grid-cols-3">
				{#each [1, 2, 3, 4, 5, 6] as index (index)}
					<Card.Root size="sm">
						<Card.Header><Card.Title>Karte {index}</Card.Title></Card.Header>
					</Card.Root>
				{/each}
			</div>
		</div>
	</Section>

	<Section
		title="Badge"
		note="Alle sechs Varianten von oben bleiben. Glow ist auf destructive beschränkt — die Matrix bezahlt nur für „Zahlung fehlgeschlagen“, nicht für „Neu“."
	>
		<Row label="Varianten">
			{#each badgeVariants as variant (variant)}
				<Badge {variant}>{variant}</Badge>
			{/each}
		</Row>
		<Row label="Effekte">
			<Badge gradient>Aktion</Badge>
			<Badge variant="destructive" glow>Zahlung fehlgeschlagen</Badge>
			<Badge shimmer>Neu</Badge>
			<Badge variant="ghost" shimmer>ghost + shimmer</Badge>
		</Row>
		<Row label="Als Link">
			<Badge href="/">anklickbar</Badge>
		</Row>
	</Section>

	<Section
		title="Verschachtelte Bereiche"
		note="data-fx=off ist klebrig: ein verschachtelter Bereich kann Effekte darin nicht wieder einschalten (§3.2, Schritt 1). Der rechte Kasten fordert „ausdrucksstark“ an und bleibt trotzdem dunkel."
	>
		<div class="grid gap-4 sm:grid-cols-2">
			<FxScope level="expressive" class="block rounded-lg border p-4">
				<p class="mb-3 text-xs font-medium text-muted-foreground">Bereich: ausdrucksstark</p>
				<Button>Primär</Button>
			</FxScope>
			<FxScope level="off" class="block rounded-lg border p-4">
				<p class="mb-3 text-xs font-medium text-muted-foreground">
					Bereich: aus, darin ein Bereich, der „ausdrucksstark“ verlangt
				</p>
				<FxScope level="expressive" class="contents">
					<Button glow>bleibt dunkel</Button>
				</FxScope>
			</FxScope>
		</div>
	</Section>

	<Section
		title="Fähigkeitsmatrix (§3.4)"
		note="Direkt aus CAPABILITIES gerendert, also ist die veröffentlichte Matrix dieselbe, die zur Laufzeit gilt. ● erlaubt · ◐ erlaubt unter Bedingung · — verboten, die Prop existiert nicht."
	>
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-xs">
				<thead>
					<tr class="border-b">
						<th class="py-2 pr-4 font-medium">Komponente</th>
						{#each effects as effect (effect)}
							<th class="py-2 pr-4 font-medium">{effect}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each componentNames as component (component)}
						<tr class="border-b last:border-0">
							<td class="py-1.5 pr-4 font-mono">{component}</td>
							{#each effects as effect (effect)}
								<td class="py-1.5 pr-4 text-muted-foreground">{cell(component, effect)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Section>
</FxScope>
