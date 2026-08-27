<script lang="ts">
	import { collapse, crossfade, fade, blurFade, scale, scaleFade, slide, stagger, staggerDelay } from './transitions.js';
	import { cubicBezier, duration, easeFxIn, easeFxOut, easeFxSpring, fadeDuration } from './easing.js';

	const [send, receive] = crossfade({ fallback: fade });
	let open = $state(false);
	const rows = ['a', 'b', 'c'];
	const probe = [duration('base'), fadeDuration(), staggerDelay(3, { count: 10 }), cubicBezier(0, 0, 1, 1)(0.5)];
	const eases = [easeFxOut, easeFxIn, easeFxSpring];
</script>

<pre>{probe.join()}{eases.length}</pre>

{#if open}
	<div transition:fade></div>
	<div transition:blurFade={{ amount: 6, easing: easeFxOut }}></div>
	<div in:slide={{ direction: 'left' }} out:slide={{ exitDuration: 'instant' }}></div>
	<div transition:scale={{ origin: 'top left' }}></div>
	<div transition:scaleFade={{ opacity: 0.2, start: 0.9 }}></div>
	<div transition:collapse={{ fade: false }}></div>
	<div in:receive={{ key: 'x' }} out:send={{ key: 'x' }}></div>
{/if}

{#each rows as row, i (row)}
	<div transition:stagger={{ index: i, count: rows.length, transition: slide }}>{row}</div>
{/each}
