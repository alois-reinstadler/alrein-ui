<script lang="ts">
	import { base } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
</script>

<svelte:head><title>Badge · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Badge</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Badges. §3.4 erlaubt Gradient, Glow (nur
		statuskritisch) und Shimmer (ausgelöst). Kein Tilt, kein Magnet — ein Badge ist ein Etikett,
		kein Gegenstand, den man aufhebt.
	</p>
</header>

<Section title="Unverändert gegenüber shadcn-svelte" note="Alle sechs Varianten von oben bleiben.">
	<Row label="Varianten">
		{#each variants as variant (variant)}
			<Badge {variant}>{variant}</Badge>
		{/each}
	</Row>
	<Row label="Als Link">
		<Badge href="{base}/">anklickbar</Badge>
	</Row>
</Section>

<Section
	title="Effekte"
	note="Glow ist auf destructive beschränkt. Ein glühendes „Neu“ ist Dekoration; ein glühendes „Zahlung fehlgeschlagen“ ist ein Signal — und die Matrix bezahlt nur für das zweite."
>
	<Row label="gradient">
		<Badge gradient>Aktion</Badge>
	</Row>
	<Row label="glow (statuskritisch)">
		<Badge variant="destructive" glow>Zahlung fehlgeschlagen</Badge>
	</Row>
	<Row label="shimmer (ausgelöst)">
		<Badge shimmer>Neu</Badge>
		<Badge variant="ghost" shimmer>ghost + shimmer</Badge>
	</Row>
</Section>
