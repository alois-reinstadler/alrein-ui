<!--
	Call-site contract for Rating, checked by `svelte-check`. Rating has no variant
	generic — §3.4 gives it no effect props, so there is nothing to condition — but
	the markup path still has to be exercised, in particular `bind:value` and the
	bits-ui props that pass straight through. Nothing renders this file.
-->
<script lang="ts">
	import { Rating } from './index.js';

	let score = $state(3);
	let half = $state(2.5);
</script>

<Rating bind:value={score} />
<Rating bind:value={half} allowHalf showValue />
<Rating value={3.7} readonly showValue />
<Rating variant="emoji" bind:value={score} />
<Rating variant="emoji" size="sm" max={3} />
<Rating max={10} size="sm" state="warn" />
<Rating disabled value={0} />

<!-- bits-ui's own surface stays reachable: this is a superset of RatingGroup.Root. -->
<Rating name="zufriedenheit" required onValueChange={() => {}} />
<Rating orientation="vertical" aria-label="Bewertung des Produkts" />
