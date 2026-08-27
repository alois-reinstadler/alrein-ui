<!--
	Call-site contract for Button, checked by `svelte-check`.

	`button.types.ts` checks the props *type*; this checks the path that actually
	matters — markup, where the variant generic is inferred from the attribute
	rather than written. Every line below must compile. The forbidden
	combinations (`variant="ghost"` with `gradient` or `glow`) are compile errors
	and so cannot be written down here; `button.types.ts` pins those with
	`@ts-expect-error`.

	Nothing renders this. It exists to be type-checked.
-->
<script lang="ts">
	import { Button } from './index.js';
	import type { ButtonVariant } from './button.svelte';

	let dynamic: ButtonVariant = $state('secondary');
</script>

<!-- Upstream call sites, unchanged. -->
<Button>plain</Button>
<Button variant="destructive" size="sm">destructive</Button>
<Button variant="ghost" size="icon">ghost icon</Button>
<Button variant="link" href="/x">link</Button>
<Button variant="outline" size="icon-xs">xs</Button>
<Button variant={dynamic}>dynamic variant</Button>
<Button disabled>disabled</Button>

<!-- alrein additions on painted surfaces. -->
<Button glow>glow</Button>
<Button gradient tilt>gradient + tilt</Button>
<Button variant="secondary" glow gradient={false}>secondary glow</Button>
<Button magnet size="lg">magnet</Button>

<!-- Effects that survive a transparent surface. -->
<Button variant="ghost" shimmer>ghost + shimmer</Button>
<Button variant="link" tilt>link + tilt</Button>
