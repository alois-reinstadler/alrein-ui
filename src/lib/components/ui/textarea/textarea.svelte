<script lang="ts" module>
	import { tv } from "tailwind-variants";
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import type { WithElementRef, WithoutChildren } from "$lib/utils.js";
	import type { FieldState } from "$lib/components/ui/field/field.svelte";

	/**
	 * alrein-ui Textarea — a strict superset of the shadcn-svelte Textarea.
	 *
	 * The `base` string below is the upstream class list, verbatim, including
	 * `field-sizing-content` — the browser-native autosize the vuesax source
	 * hand-rolled with a `scrollHeight` write on every input. Diff against
	 * `git show 4cab28f:src/lib/components/ui/textarea/textarea.svelte`.
	 *
	 * **There are no effect props.** SPEC.md §3.4 gives Input, Textarea and Select
	 * no decorative effects, and §3.5 forbids glow on a form field outright: it
	 * competes with the focus ring and reads as an error state. Nothing here
	 * imports `$lib/fx`. The extension is structural — `state`, `loading`, the
	 * character counter, and floating-label adoption.
	 */
	export const textareaVariants = tv({
		base: "rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
		variants: {
			/*
			 * The per-control override, identical in meaning to Input's. `danger` maps
			 * to shadcn's own `--destructive`; `warn` and `success` use the
			 * `--warning` / `--success` tokens registered in the `--color-*` namespace.
			 *
			 * `state="danger"` does **not** set `aria-invalid` — see `FieldState`.
			 */
			state: {
				default: "",
				danger:
					"border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
				warn: "border-warning focus-visible:border-warning focus-visible:ring-warning/50",
				success: "border-success focus-visible:border-success focus-visible:ring-success/50",
			},
			/*
			 * Inherited from an enclosing `<Field state>` through the `group/field`
			 * marker and `data-state` that `Field` already publishes — no context, no
			 * JavaScript.
			 *
			 * They are withheld when the control has a `state` of its own: a
			 * `group-data-*` variant carries an extra attribute selector and so
			 * outranks a plain utility regardless of source order, which would let the
			 * group quietly beat the explicit prop. Resolving that precedence here,
			 * where it is visible, is the honest fix.
			 *
			 * Otherwise they are emitted unconditionally, because `Field` publishes
			 * its state as CSS state only — a `data-state` attribute and a
			 * `group/field` marker, no context — so nothing can tell the control at
			 * render time that it is inside a Field. Outside one the classes match
			 * nothing: the class list of an upstream call site grows, but no upstream
			 * class is changed or dropped and the rendered result is identical.
			 */
			inherit: {
				true: "group-data-[state=danger]/field:border-destructive group-data-[state=danger]/field:focus-visible:border-destructive group-data-[state=danger]/field:focus-visible:ring-destructive/20 dark:group-data-[state=danger]/field:focus-visible:ring-destructive/40 group-data-[state=warn]/field:border-warning group-data-[state=warn]/field:focus-visible:border-warning group-data-[state=warn]/field:focus-visible:ring-warning/50 group-data-[state=success]/field:border-success group-data-[state=success]/field:focus-visible:border-success group-data-[state=success]/field:focus-visible:ring-success/50",
				false: "",
			},
			/*
			 * Inside `<Field.Floating>` the `<fieldset>` owns the border, background
			 * and focus ring — it must, because the notch in the top border is cut by
			 * its `<legend>`. `px-0` because the fieldset's own `px-2.5` is what the
			 * floating label's `start-2.5` is measured against.
			 */
			floating: {
				true: "border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent",
				false: "",
			},
			/** Room for the trailing spinner. A state, not an effect. */
			loading: {
				true: "pe-8",
				false: "",
			},
		},
		defaultVariants: {
			state: "default",
			inherit: false,
			floating: false,
			loading: false,
		},
	});

	type TextareaExtensions = {
		/**
		 * Per-control state colour, matching `Field`'s own `state`. An explicit
		 * value wins over an enclosing `<Field state>`.
		 *
		 * `danger` does not imply `aria-invalid`. Pass `aria-invalid` yourself when
		 * the value really is invalid.
		 */
		state?: FieldState;
		/**
		 * Busy, but not disabled: full opacity, keeps focus, still submits. The
		 * control goes **read-only** rather than disabled, because a disabled field
		 * is dropped from the form payload and a field waiting on a request has not
		 * stopped being part of the form. `aria-busy="true"` carries the meaning.
		 */
		loading?: boolean;
		/**
		 * Renders `123 / 500` under the field. Opt-in, and inert without a
		 * `maxlength` — a counter with no limit to count against is decoration.
		 */
		counter?: boolean;
	};

	export type TextareaProps = WithoutChildren<WithElementRef<HTMLTextareaAttributes>> &
		TextareaExtensions;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getFloatingFieldId } from "$lib/components/ui/field/floating-context.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		id,
		placeholder,
		readonly,
		maxlength,
		state,
		loading,
		counter,
		...restProps
	}: TextareaProps = $props();

	/* `undefined` outside a floating field — the signal to change nothing. */
	const floatingId = getFloatingFieldId();
	const isFloating = floatingId !== undefined;

	/*
	 * An explicit `id` always wins; the field's id is only a default. Note that
	 * `Field.Floating` renders its `<label for>` from its own id, so if you set
	 * an `id` here you must also give the field a matching `for` — otherwise the
	 * label points at an element that no longer exists.
	 */
	const controlId = $derived(id ?? floatingId?.());

	/*
	 * The float is driven by `:not(:placeholder-shown)`. Without a placeholder the
	 * control never reports itself as empty and the label stays down over the
	 * user's text, so a single space is supplied here rather than asked of the
	 * consumer.
	 */
	const controlPlaceholder = $derived(isFloating ? (placeholder ?? " ") : placeholder);

	const count = $derived(String(value ?? "").length);
	const hasCounter = $derived(counter === true && maxlength != null);
	const atLimit = $derived(maxlength != null && count >= maxlength);

	/*
	 * A wrapper is needed to hang the spinner off (it needs a positioned ancestor)
	 * and to put the counter under the field. Upstream renders a bare
	 * `<textarea>`, and things depend on that — `InputGroup` selects its control
	 * with `has-[>textarea]:h-auto`, and in a flex row the `<textarea>` is itself
	 * the flex item — so the wrapper appears only on instances that opted into
	 * `loading` or `counter` at all; an upstream call site still renders a bare
	 * `<textarea>`.
	 *
	 * Keying it on `!== undefined` rather than on the current value is also what
	 * keeps focus through a `loading` toggle: switching branches of an `{#if}`
	 * destroys and recreates the `<textarea>`, blurring the field and dropping the
	 * caret exactly when the user is waiting on a request.
	 */
	const hasWrapper = $derived(loading !== undefined || counter !== undefined);

	const classes = $derived(
		cn(
			textareaVariants({
				state: state ?? "default",
				inherit: state === undefined && !isFloating,
				floating: isFloating,
				loading: loading === true,
			}),
			className
		)
	);
</script>

<!--
	The busy spinner.

	TODO(phase-2): replace this with `<Spinner />` once Phase 2 ships it. It is
	inline only because that component does not exist yet; the shape — a dashed
	ring turning at the loading-loop duration — is the one Spinner will have, so
	the swap is a deletion.

	The rotation is a *loop*, not a transition, so its duration is
	`--fx-shimmer-duration` (the library's loading-loop token) rather than the
	80/120/180/240 transition scale: a full turn in 120ms is a strobe. Reduced
	motion collapses that token to 0ms in `tokens.css`, which parks the ring
	instead of spinning it, and `aria-busy` carries the meaning either way — so
	there is no second `motion-reduce:` code path to disagree with the token.

	Tailwind's own `spin` keyframes are reused instead of a `<style>` block on
	purpose: a scoped style block makes Svelte stamp its hash class onto every
	element in the file, including the `<textarea>`, and the rendered class list of
	an upstream call site has to stay byte-identical.
-->
{#snippet spinner()}
	<svg
		data-slot="textarea-spinner"
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		class={cn(
			"pointer-events-none absolute top-2 size-4 animate-spin text-muted-foreground [animation-duration:var(--fx-shimmer-duration)]",
			isFloating ? "end-0" : "end-2.5"
		)}
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="22 35" />
	</svg>
{/snippet}

{#snippet control()}
	<textarea
		bind:this={ref}
		data-slot={dataSlot}
		data-state={state}
		data-loading={loading ? "" : undefined}
		class={classes}
		id={controlId}
		placeholder={controlPlaceholder}
		readonly={loading || readonly}
		aria-busy={loading ? "true" : undefined}
		{maxlength}
		bind:value
		{...restProps}></textarea>
{/snippet}

{#if hasWrapper}
	<div data-slot="textarea-wrapper" data-loading={loading ? "" : undefined} class="relative flex w-full min-w-0 flex-col">
		{@render control()}
		{#if loading}
			{@render spinner()}
		{/if}
		{#if hasCounter}
			<!--
				`aria-live="polite"` on the counter, not on the field: the count is the
				only thing that changes, and a live region around the control would
				re-announce the value on every keystroke. `tabular-nums` keeps the
				digits from reflowing as the count crosses a decade.
			-->
			<span
				data-slot="textarea-counter"
				data-state={atLimit ? "at-limit" : undefined}
				aria-live="polite"
				class={cn(
					"mt-1 self-end text-xs tabular-nums",
					atLimit ? "text-destructive" : "text-muted-foreground"
				)}
			>
				{count} / {maxlength}
			</span>
		{/if}
	</div>
{:else}
	{@render control()}
{/if}
