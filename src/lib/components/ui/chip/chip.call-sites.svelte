<!--
	Call-site contract for Chip, checked by `svelte-check`. See
	`../button/button.call-sites.svelte` for why this exists alongside
	`chip.types.ts`: the generic is inferred from the `variant` attribute in
	markup, and that inference path is the one consumers actually use. Nothing
	renders this file.
-->
<script lang="ts">
	import { Chip } from './index.js';
	import type { ChipVariant } from './chip.svelte';

	let dynamic: ChipVariant = $state('outline');
	let selected = $state(false);
</script>

<!-- Every variant and size. -->
<Chip>soft</Chip>
<Chip variant="solid">solid</Chip>
<Chip variant="outline">outline</Chip>
<Chip variant="ghost">ghost</Chip>
<Chip variant={dynamic}>dynamic variant</Chip>
<Chip size="sm" dot>klein, mit Punkt</Chip>

<!-- Selection and removal, on any variant, in either order. -->
<Chip selectable bind:selected>umschaltbar</Chip>
<Chip variant="outline" selectable selected>outline und gewählt</Chip>
<Chip removable onremove={() => {}}>entfernbar</Chip>
<Chip variant="ghost" selectable removable onremove={() => {}} removeLabel="Filter entfernen">
	beides
</Chip>
<Chip disabled selectable removable onremove={() => {}}>deaktiviert</Chip>

<!-- The one effect §3.4 grants, on the variants that paint a surface. -->
<Chip gradient>promo</Chip>
<Chip variant="solid" gradient>promo, solid</Chip>
