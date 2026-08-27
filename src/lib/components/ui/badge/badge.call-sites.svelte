<!--
	Call-site contract for Badge, checked by `svelte-check`. See
	`../button/button.call-sites.svelte` for why this exists alongside
	`badge.types.ts`. Nothing renders it.
-->
<script lang="ts">
	import { Badge } from './index.js';
	import type { BadgeVariant } from './badge.svelte';

	let dynamic: BadgeVariant = $state('secondary');
</script>

<!-- Upstream call sites, unchanged. -->
<Badge>plain</Badge>
<Badge variant="secondary">secondary</Badge>
<Badge variant="destructive">destructive</Badge>
<Badge variant="outline">outline</Badge>
<Badge variant="ghost">ghost</Badge>
<Badge variant="link" href="/x">link</Badge>
<Badge variant={dynamic}>dynamic variant</Badge>

<!-- alrein additions the matrix allows. -->
<Badge gradient>promo</Badge>
<Badge variant="destructive" glow>payment failed</Badge>
<Badge shimmer>new</Badge>
<Badge variant="ghost" shimmer>ghost + shimmer</Badge>
