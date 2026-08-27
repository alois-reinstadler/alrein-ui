<script lang="ts" module>
	import { tv } from "tailwind-variants";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";
	import type { FieldState } from "$lib/components/ui/field/field.svelte";

	/**
	 * alrein-ui Input — a strict superset of the shadcn-svelte Input.
	 *
	 * The `base` string below is the upstream class list, verbatim. Upstream
	 * repeats it once per branch of the `type === "file"` test; here it is written
	 * once and both branches read it, so the rendered `class` is byte-identical
	 * while the source has a single place to diff against
	 * `git show 4cab28f:src/lib/components/ui/input/input.svelte`.
	 *
	 * **There are no effect props.** SPEC.md §3.4 gives Input, Textarea and Select
	 * no decorative effects at all, and §3.5 says why glow in particular is
	 * withheld: on a form field it competes with the focus ring and users read it
	 * as an error state. Nothing here imports `$lib/fx`. The extension is entirely
	 * structural — `state`, `loading`, and floating-label adoption.
	 */
	export const inputVariants = tv({
		base: "h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
		variants: {
			/*
			 * The per-control override. `danger` maps to shadcn's own `--destructive`;
			 * `warn` and `success` use the `--warning` / `--success` tokens, which are
			 * registered in the `--color-*` namespace and so behave like any other
			 * shadcn colour (A9).
			 *
			 * Setting `state="danger"` deliberately does **not** set `aria-invalid` —
			 * see the note on `FieldState`. A warning is not an invalid value, and a
			 * screen reader must not be told otherwise.
			 */
			state: {
				default: "",
				danger:
					"border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
				warn: "border-warning focus-visible:border-warning focus-visible:ring-warning/50",
				success: "border-success focus-visible:border-success focus-visible:ring-success/50",
			},
			/*
			 * The inherited path: `<Field state="success"><Input /></Field>`. `Field`
			 * already publishes `data-state` and marks itself `group/field`, so this
			 * needs no context and no JavaScript.
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
			 * Inside `<Field.Floating>` the surrounding `<fieldset>` owns the border,
			 * the background and the focus ring — it has to, because the notch in the
			 * top border is cut by its `<legend>`. A second border and a second ring
			 * drawn by the control would sit inside the first one.
			 *
			 * `px-0` because the fieldset already carries `px-2.5`, which is what the
			 * floating label's `start-2.5` is measured against; keeping the control's
			 * own padding would offset the text from its label by exactly one padding.
			 */
			floating: {
				true: "border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent",
				false: "",
			},
			/*
			 * Room for the spinner. Not an animation and not an effect — a control
			 * that grew a trailing affordance has less room for text, the same way
			 * `has-data-[icon=inline-end]:pr-2` works on Button.
			 */
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

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type InputExtensions = {
		/**
		 * Per-control state colour. Matches `Field`'s own `state`, and is overridden
		 * by nothing — an explicit value here wins over an enclosing `<Field state>`.
		 *
		 * `danger` does not imply `aria-invalid`. Pass `aria-invalid` yourself when
		 * the value really is invalid.
		 */
		state?: FieldState;
		/**
		 * Busy, but not disabled. The control keeps full opacity, keeps focus and
		 * keeps submitting its value — it goes **read-only** rather than disabled,
		 * because a disabled field is omitted from the form payload and a field that
		 * is merely waiting on a request has not stopped being part of the form.
		 * `aria-busy="true"` is what tells assistive tech the difference.
		 */
		loading?: boolean;
	};

	export type InputProps = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	> &
		InputExtensions;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getFloatingFieldId } from "$lib/components/ui/field/floating-context.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		id,
		placeholder,
		readonly,
		state,
		loading,
		...restProps
	}: InputProps = $props();

	/*
	 * `undefined` outside a floating field, which is the signal to change nothing.
	 * A getter, so a field whose `for` changes does not leave a stale id behind.
	 */
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
	 * The float is driven by `:not(:placeholder-shown)`, so a floating control
	 * with no placeholder never reports itself as empty and the label sits on top
	 * of the user's text. A single space is the standard workaround and it is set
	 * here rather than asked of the consumer.
	 */
	const controlPlaceholder = $derived(isFloating ? (placeholder ?? " ") : placeholder);

	/*
	 * The spinner needs a positioned ancestor, and the only honest place for one
	 * is a wrapper element. Upstream `<Input>` renders a bare `<input>`, and
	 * several things depend on that: `InputGroup` selects its control with
	 * `[&>input]:pr-1.5` and `has-[>input]`, and in a flex row the `<input>` is
	 * itself the flex item. So the wrapper appears **only** on instances that
	 * opted into `loading` at all — including `loading={false}` — and never on an
	 * upstream call site, which still renders a bare `<input>`.
	 *
	 * Keying it on `loading !== undefined` rather than on the current value is
	 * also what keeps focus through a toggle: switching branches of an `{#if}`
	 * destroys and recreates the `<input>`, which would blur the field and drop
	 * the caret exactly when the user is waiting on a request.
	 */
	const hasWrapper = $derived(loading !== undefined);

	const classes = $derived(
		cn(
			inputVariants({
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
	element in the file, including the `<input>`, and the rendered class list of
	an upstream call site has to stay byte-identical.
-->
{#snippet spinner()}
	<svg
		data-slot="input-spinner"
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		class={cn(
			"pointer-events-none absolute top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground [animation-duration:var(--fx-shimmer-duration)]",
			isFloating ? "end-0" : "end-2.5"
		)}
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="22 35" />
	</svg>
{/snippet}

{#snippet control()}
	{#if type === "file"}
		<input
			bind:this={ref}
			data-slot={dataSlot}
			data-state={state}
			data-loading={loading ? "" : undefined}
			class={classes}
			type="file"
			id={controlId}
			placeholder={controlPlaceholder}
			readonly={loading || readonly}
			aria-busy={loading ? "true" : undefined}
			bind:files
			bind:value
			{...restProps}
		/>
	{:else}
		<input
			bind:this={ref}
			data-slot={dataSlot}
			data-state={state}
			data-loading={loading ? "" : undefined}
			class={classes}
			{type}
			id={controlId}
			placeholder={controlPlaceholder}
			readonly={loading || readonly}
			aria-busy={loading ? "true" : undefined}
			bind:value
			{...restProps}
		/>
	{/if}
{/snippet}

{#if hasWrapper}
	<div data-slot="input-wrapper" data-loading={loading ? "" : undefined} class="relative flex w-full min-w-0 items-center">
		{@render control()}
		{#if loading}
			{@render spinner()}
		{/if}
	</div>
{:else}
	{@render control()}
{/if}
