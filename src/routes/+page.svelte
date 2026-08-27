<script lang="ts">
	import { base } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { FxScope } from '$lib/fx/index.js';
	import { CAPABILITIES, type FxEffect } from '$lib/fx/capabilities.js';
	import { byPhase } from '$lib/demo/nav.js';
	import Section from '$lib/demo/section.svelte';

	const effects: FxEffect[] = ['gradient', 'glow', 'shimmer', 'tilt', 'magnet'];
	const componentNames = Object.keys(CAPABILITIES) as (keyof typeof CAPABILITIES)[];
	const groups = byPhase();

	function cell(component: keyof typeof CAPABILITIES, effect: FxEffect): string {
		const value = (CAPABILITIES[component] as Record<string, unknown>)[effect];
		if (value === undefined) return '—';
		return value === true ? '●' : `◐ ${value}`;
	}
</script>

<svelte:head><title>alrein-ui</title></svelte:head>

<header class="mb-10">
	<h1 class="cn-font-heading text-2xl font-medium">alrein-ui</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Eine shadcn-Registry, kein npm-Paket. Jede Komponente überschreibt die gleichnamige
		shadcn-svelte-Datei am selben Pfad mit einem echten Superset — gleicher Importpfad, gleiche
		API, plus eine disziplinierte Effektschicht.
	</p>
	<p class="mt-3 max-w-3xl text-sm text-muted-foreground">
		Der Regler oben gilt für die gesamte Dokumentation und bleibt beim Navigieren erhalten. Beim
		Umschalten auf <strong>Aus</strong> darf sich kein Element auch nur um ein Pixel verschieben — Effekte
		fassen ausschließlich Transform, Filter, Deckkraft und Hintergrund an.
	</p>
</header>

<Section
	title="Bestand"
	note="Was gebaut ist und was noch aussteht. Diese Liste ist die Quelle für die Navigation links, damit eine geplante Komponente sichtbar fehlt statt still zu verschwinden."
>
	{#each groups as group (group.phase)}
		<div>
			<h3 class="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Phase {group.phase} — {group.title}
			</h3>
			<ul class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each group.entries as entry (entry.slug)}
					<li class="flex items-start gap-2 rounded-lg border p-3">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								{#if entry.status === 'shipped'}
									<a href="{base}/{entry.slug}" class="text-sm font-medium hover:underline">
										{entry.name}
									</a>
								{:else}
									<span class="text-sm font-medium text-muted-foreground">{entry.name}</span>
								{/if}
								{#if entry.status === 'planned'}
									<Badge variant="outline">geplant</Badge>
								{:else if entry.origin === 'new'}
									<Badge variant="secondary">neu</Badge>
								{/if}
							</div>
							<p class="mt-1 text-xs text-muted-foreground">{entry.summary}</p>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</Section>

<Section
	title="Verschachtelte Bereiche"
	note='data-fx="off" ist klebrig: ein verschachtelter Bereich kann Effekte darin nicht wieder einschalten (§3.2, Schritt 1). Der rechte Kasten fordert „ausdrucksstark" an und bleibt trotzdem dunkel.'
>
	<div class="grid gap-4 sm:grid-cols-2">
		<FxScope level="expressive" class="block rounded-lg border p-4">
			<p class="mb-3 text-xs font-medium text-muted-foreground">Bereich: ausdrucksstark</p>
			<Button>Primär</Button>
		</FxScope>
		<FxScope level="off" class="block rounded-lg border p-4">
			<p class="mb-3 text-xs font-medium text-muted-foreground">
				Bereich: aus, darin ein Bereich, der „ausdrucksstark" verlangt
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
	<p class="text-xs text-muted-foreground">
		Nicht aufgeführte Komponenten dürfen gar keine dekorativen Effekte — Input, Textarea, Select,
		Tooltip, Popover und Dialog stehen absichtlich nicht in der Tabelle, nicht aus Versehen.
	</p>
</Section>
