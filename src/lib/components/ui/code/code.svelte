<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	/**
	 * alrein-ui Code. New — shadcn-svelte has no equivalent.
	 *
	 * §5 splits vuesax's `code` and `vs-code` into `Code` (this) and `CodeWindow`
	 * (window chrome around this). §3.4 has no row for Code, so **no decorative
	 * effects**: a syntax highlighter's job is to make the code readable, and
	 * anything painted over it works against that.
	 *
	 * ## The un-highlighted render is the real one (A27)
	 *
	 * On the server, and on the client until Shiki has loaded, this renders a
	 * plain escaped `<pre><code>`. That is not a fallback in the apologetic sense
	 * — the code is readable, selectable and copyable from first paint, and stays
	 * that way if the highlighter never arrives at all. Highlighting is an
	 * enhancement layered on afterwards.
	 *
	 * Shiki is imported with a dynamic `import()` from `shiki/bundle/web` with an
	 * explicit language allowlist, so a page with no code block downloads nothing.
	 */
	export const codeVariants = tv({
		slots: {
			root: "group/code relative overflow-hidden rounded-lg border bg-muted/40 text-sm",
			pre: "overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed",
			copy: "absolute top-2 right-2 opacity-0 transition-opacity duration-fast ease-fx-out group-hover/code:opacity-100 focus-visible:opacity-100",
			caption:
				"flex items-center justify-between gap-2 border-b bg-muted/60 px-4 py-2 font-mono text-xs text-muted-foreground",
		},
		variants: {
			variant: {
				default: {},
				/** No border, no background — for inline documentation blocks. */
				minimal: { root: "rounded-none border-0 bg-transparent", pre: "px-0" },
			},
		},
		defaultVariants: { variant: "default" },
	});

	export type CodeVariants = VariantProps<typeof codeVariants>;
	export type CodeVariant = NonNullable<CodeVariants["variant"]>;

	export type CodeProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		code: string;
		/** One of `LANGUAGES`. Anything else renders un-highlighted rather than failing. */
		lang?: string;
		variant?: CodeVariant;
		/** A filename or label above the block. */
		caption?: string;
		/** Show the copy button. Uses the async clipboard API and degrades silently. */
		copyable?: boolean;
		/** Line numbers, rendered by CSS counters so they stay unselectable. */
		lineNumbers?: boolean;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import { cn } from "$lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { highlight } from "./highlight.js";

	let {
		ref = $bindable(null),
		code,
		lang = "text",
		variant = "default",
		caption,
		copyable = true,
		lineNumbers = false,
		class: className,
		...restProps
	}: CodeProps = $props();

	const classes = $derived(codeVariants({ variant }));

	/** `undefined` until Shiki has produced something; the escaped `<pre>` shows meanwhile. */
	let highlighted = $state<string | undefined>(undefined);
	let copied = $state(false);

	/*
	 * An `$effect` because highlighting is genuinely asynchronous work triggered
	 * by a value change — there is no `$derived` shape for "await this". It
	 * re-runs when the code or the language changes, and the `stale` guard means a
	 * fast edit cannot have an older highlight land on top of a newer one.
	 */
	$effect(() => {
		const source = code;
		const language = lang;
		let stale = false;
		highlight(source, language).then((html) => {
			if (!stale) highlighted = html ?? undefined;
		});
		return () => {
			stale = true;
		};
	});

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
		} catch {
			// Clipboard access can be denied, and there is nothing useful to say
			// about it. The code is selectable; the user has another way.
		}
	}
</script>

<div
	bind:this={ref}
	data-slot="code"
	data-variant={variant}
	data-lang={lang}
	class={cn(classes.root(), className)}
	{...restProps}
>
	{#if caption}
		<div data-slot="code-caption" class={classes.caption()}>
			<span>{caption}</span>
			<span class="uppercase opacity-60">{lang}</span>
		</div>
	{/if}

	{#if highlighted}
		<!--
			The only `innerHTML`-shaped thing in the library, and it is unavoidable:
			a highlighter's output *is* HTML. It is safe because the string comes
			from Shiki's own serialiser, which escapes the source text it was given
			— never from user input reaching the DOM unescaped, which is the failure
			`F13` names. The un-highlighted branch below escapes explicitly, so the
			path that runs before Shiki loads is provably safe on its own.
		-->
		<div
			data-slot="code-content"
			data-highlighted="true"
			class={cn(classes.pre(), lineNumbers && "code-line-numbers")}
		>
			{@html highlighted}
		</div>
	{:else}
		<!--
			Plain text interpolation, not `{@html escapeHtml(...)}`. Svelte escapes
			`{code}` already, and routing it through `@html` to un-escape a string we
			just escaped would be strictly more dangerous for identical output. The
			exported `escapeHtml` stays for consumers rendering this markup
			themselves outside Svelte.
		-->
		<pre
			data-slot="code-content"
			class={cn(classes.pre(), lineNumbers && "code-line-numbers")}><code>{code}</code></pre>
	{/if}

	{#if copyable}
		<Button
			data-slot="code-copy"
			variant="ghost"
			size="icon-sm"
			class={classes.copy()}
			aria-label={copied ? "Kopiert" : "Code kopieren"}
			onclick={copy}
		>
			{#if copied}<CheckIcon />{:else}<CopyIcon />{/if}
		</Button>
	{/if}
</div>

<style>
	/*
	 * Line numbers as CSS counters on Shiki's own `.line` spans.
	 *
	 * Counters rather than rendered text for one reason that matters: a number
	 * emitted through `content` is not selectable, so copying a block copies the
	 * code and not "1 2 3 4" down the left margin. Every hand-rolled line-number
	 * implementation that renders real text gets this wrong.
	 *
	 * `:global` because the lines come from `{@html}` and Svelte's scoping only
	 * reaches elements it compiled. A scoped `<style>` block is safe here in a way
	 * it is not in the upstream supersets — this component is new, so there is no
	 * byte-identical class attribute for the hash to disturb.
	 */
	.code-line-numbers :global(code) {
		counter-reset: line;
	}

	.code-line-numbers :global(.line)::before {
		counter-increment: line;
		content: counter(line);
		display: inline-block;
		width: 2.5ch;
		margin-right: 1.25ch;
		text-align: right;
		color: var(--muted-foreground);
		user-select: none;
	}
</style>
