<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";
	import type { WithElementRef } from "$lib/utils.js";
	import type { UploadItem, UploadState } from "./upload.svelte.js";

	/**
	 * alrein-ui UploadArea. New — shadcn-svelte has no equivalent.
	 *
	 * §3.4 grants it `glow` on drag-over, `shimmer` while uploading and `tilt`.
	 * Each carries a distinct signal, which is what §3.1 asks of an effect:
	 *
	 * - **glow** fires only while a file is over the zone. It is the answer to
	 *   "will letting go here do anything?", and it is the one moment in the
	 *   component's life when that question is live.
	 * - **shimmer** is the *loading loop*, not the triggered sweep, so it slows
	 *   under reduced motion rather than stopping (A17) — a frozen upload
	 *   indicator claims the transfer finished.
	 * - **tilt** is the resting affordance: "this is an object you can drop
	 *   something onto".
	 *
	 * ## The input is the control; the zone is an enhancement
	 *
	 * A real `<input type="file">` does the work. Drag and drop is layered on top,
	 * and the label wrapping the input makes the whole zone a click target without
	 * a single click handler. A dropzone that is only a dropzone excludes every
	 * keyboard user, and that is the most common way this component is got wrong.
	 */
	export const uploadAreaVariants = tv({
		slots: {
			root: "relative flex w-full flex-col gap-3",
			zone: "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-6 py-10 text-center transition-colors duration-base ease-fx-out has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
			hint: "text-xs text-muted-foreground",
			list: "flex flex-col gap-2",
			item: "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
			bar: "relative h-1 w-full overflow-hidden rounded-full bg-muted",
			/* scaleX from the left — never an animated width (§1). */
			fill: "absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-base ease-fx-out",
		},
		variants: {
			dragging: { true: { zone: "border-primary bg-primary/5" } },
		},
	});

	export type UploadAreaVariants = VariantProps<typeof uploadAreaVariants>;

	export type UploadAreaProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** The shared state. Create it with `new UploadState({ … })` so the caller owns transport. */
		upload: UploadState;
		accept?: string;
		multiple?: boolean;
		/** "Highest-intent target": fires only while a file hovers the zone. */
		glow?: boolean;
		/** The loading loop while anything is uploading. */
		shimmer?: boolean;
		label?: string;
		hint?: string;
		/** Replaces the default row rendering. */
		item?: Snippet<[UploadItem]>;
	};
</script>

<script lang="ts">
	import UploadIcon from "@lucide/svelte/icons/upload";
	import XIcon from "@lucide/svelte/icons/x";
	import { cn } from "$lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { formatBytes } from "./upload.svelte.js";

	let {
		ref = $bindable(null),
		upload,
		accept,
		multiple = true,
		glow,
		shimmer,
		label = "Dateien hierher ziehen oder auswählen",
		hint,
		item,
		class: className,
		...restProps
	}: UploadAreaProps = $props();

	const fx = getFxContext();

	/*
	 * A counter rather than a boolean. `dragenter`/`dragleave` fire for every
	 * child element the pointer crosses, so a boolean flickers off the moment the
	 * file passes over the icon inside the zone. Counting entries and exits is the
	 * only reliable way to know whether the file is still somewhere inside.
	 */
	let dragDepth = $state(0);
	const dragging = $derived(dragDepth > 0);

	/* §3.4's `◐ drag-over`: glow is only available while a file is over the zone. */
	const useGlow = $derived(fx.resolve("glow", glow, { available: dragging }));
	const uploading = $derived(upload.status === "uploading");
	const useShimmer = $derived(fx.resolve("shimmer", shimmer, { available: uploading }));

	const classes = $derived(uploadAreaVariants({ dragging }));

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragDepth = 0;
		const files = event.dataTransfer?.files;
		if (files?.length) upload.add(files);
	}
</script>

<div bind:this={ref} data-slot="upload-area" class={cn(classes.root(), className)} {...restProps}>
	<!--
		A `<label>` wrapping a real file input: the whole zone is a click target
		with no click handler, and keyboard users reach the input the ordinary way.
		The drag handlers are layered on the same element.
	-->
	<label
		data-slot="upload-area-zone"
		data-dragging={dragging ? "" : undefined}
		data-uploading={uploading ? "" : undefined}
		class={cn(
			classes.zone(),
			useGlow && "fx-glow",
			useShimmer && "fx-shimmer-loading"
		)}
		ondragenter={() => (dragDepth += 1)}
		ondragleave={() => (dragDepth = Math.max(0, dragDepth - 1))}
		ondragover={(event) => event.preventDefault()}
		ondrop={onDrop}
		{@attach useGlow ? glowEffect({ radius: 220 }) : undefined}
	>
		<input
			data-slot="upload-area-input"
			type="file"
			{accept}
			{multiple}
			class="sr-only"
			onchange={(event) => {
				const files = event.currentTarget.files;
				if (files?.length) upload.add(files);
				// Clearing lets the same file be chosen twice in a row, which
				// otherwise fires no change event at all.
				event.currentTarget.value = "";
			}}
		/>
		<UploadIcon class="size-6 text-muted-foreground" aria-hidden="true" />
		<span data-slot="upload-area-label" class="text-sm font-medium">{label}</span>
		{#if hint}
			<span data-slot="upload-area-hint" class={classes.hint()}>{hint}</span>
		{/if}
	</label>

	{#if upload.items.length > 0}
		<ul data-slot="upload-area-list" class={classes.list()}>
			{#each upload.items as entry (entry.id)}
				<li data-slot="upload-area-item" data-status={entry.status} class={classes.item()}>
					{#if item}
						{@render item(entry)}
					{:else}
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-2">
								<span class="truncate font-medium">{entry.file.name}</span>
								<span class="shrink-0 text-xs text-muted-foreground tabular-nums">
									{formatBytes(entry.file.size)}
								</span>
							</div>
							{#if entry.status === "error"}
								<p class="mt-1 text-xs text-destructive">{entry.error}</p>
							{:else}
								<div
									data-slot="upload-area-progress"
									class={cn(classes.bar(), "mt-1.5")}
									role="progressbar"
									aria-valuenow={Math.round(entry.progress * 100)}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label="Fortschritt für {entry.file.name}"
								>
									<div class={classes.fill()} style="scale: {entry.progress} 1"></div>
								</div>
							{/if}
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="{entry.file.name} entfernen"
							onclick={() => upload.remove(entry.id)}
						>
							<XIcon />
						</Button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
