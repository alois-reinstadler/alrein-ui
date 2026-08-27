<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	const laender = [
		{ value: 'at', label: 'Österreich' },
		{ value: 'de', label: 'Deutschland' },
		{ value: 'ch', label: 'Schweiz' },
		{ value: 'it', label: 'Italien' }
	];

	let land = $state('at');
	let zustand = $state('');
	const labelOf = (value: string) => laender.find((l) => l.value === value)?.label;
</script>

<svelte:head><title>Select · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Select</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset des shadcn-svelte-Selects, alle elf Dateien intakt.
		<strong>Kein Glow und kein Höhen-Morph</strong> — siehe A13 und A14. Die Quelle animiert das
		Menü über 560 ms in der Höhe und hat den Glow standardmäßig an; beides ist hier abgelehnt, nicht
		vergessen.
	</p>
</header>

<Section title="Unverändert gegenüber shadcn-svelte">
	<Row label="Standard">
		<Select.Root type="single" bind:value={land}>
			<Select.Trigger class="w-56">{labelOf(land) ?? 'Land wählen'}</Select.Trigger>
			<Select.Content>
				{#each laender as land (land.value)}
					<Select.Item value={land.value} label={land.label}>{land.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</Row>
	<Row label="Größen und Zustände">
		<Select.Root type="single">
			<Select.Trigger size="sm" class="w-40">klein</Select.Trigger>
			<Select.Content>
				<Select.Item value="a" label="A">A</Select.Item>
			</Select.Content>
		</Select.Root>
		<Select.Root type="single" disabled>
			<Select.Trigger class="w-40">deaktiviert</Select.Trigger>
			<Select.Content><Select.Item value="a" label="A">A</Select.Item></Select.Content>
		</Select.Root>
	</Row>
</Section>

<Section
	title="Semantische Zustände und Ladezustand"
	note="Wie bei Input: der Zustand wird als data-field-state veröffentlicht, nicht als data-state — bits-ui besitzt data-state=&quot;open|closed&quot; auf dem Auslöser bereits. loading blockiert durch bits-ui hindurch statt daran vorbei: unsere Handler laufen zuerst und stoppen die Kette per preventDefault, ohne dass irgendwo disabled steht. Tab und Escape bleiben aktiv, sonst würde ein ladendes Feld zur Fokusfalle."
>
	<Row label="Zustände">
		{#each ['danger', 'warn', 'success'] as state (state)}
			<Select.Root type="single" bind:value={zustand}>
				<Select.Trigger state={state as 'danger'} class="w-36">{state}</Select.Trigger>
				<Select.Content><Select.Item value="a" label="A">A</Select.Item></Select.Content>
			</Select.Root>
		{/each}
	</Row>
	<Row label="loading">
		<Select.Root type="single">
			<Select.Trigger loading class="w-56">wird geladen…</Select.Trigger>
			<Select.Content><Select.Item value="a" label="A">A</Select.Item></Select.Content>
		</Select.Root>
	</Row>
</Section>

<Section
	title="Schwebendes Label"
	note="Ein <button> hat gar keinen :placeholder-shown-Zustand, kann das Label über diesen Weg also nie zum Schweben bringen — der Auslöser übernimmt stattdessen die Feld-id und legt seinen eigenen Rand ab, weil das fieldset ihn besitzt."
>
	<div class="max-w-md">
		<Field.Floating label="Land">
			<Select.Root type="single" bind:value={land}>
				<Select.Trigger>{labelOf(land) ?? ''}</Select.Trigger>
				<Select.Content>
					{#each laender as land (land.value)}
						<Select.Item value={land.value} label={land.label}>{land.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</Field.Floating>
	</div>
</Section>
