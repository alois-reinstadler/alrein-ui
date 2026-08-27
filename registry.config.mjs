/**
 * The registry, declared rather than transcribed.
 *
 * `registry.json` is **generated** from this file by `pnpm registry:gen`. The
 * previous attempt hand-maintained a 53 KB `registry.json` across 63 items, and
 * every file added to a component was a second edit someone had to remember —
 * which is how items end up shipping the wrong file set (SPEC.md §8, and the
 * `motion.css` omission caught by the consumer smoke test).
 *
 * Here a component names its directory and the generator lists what is in it, so
 * a new file is picked up by existing.
 *
 * ## The two things that are easy to get wrong
 *
 * **`registryDependencies`**: a plain name always resolves to the *official*
 * shadcn-svelte registry. A dependency on one of our own items must be written
 * `local:<name>`. Getting this wrong silently installs upstream components.
 *
 * **`target`**: a `registry:ui` item targets `<name>/<file>`, relative to the
 * consumer's `ui` alias — that is what makes it overwrite the upstream component
 * *in place* rather than landing in a parallel namespace. Everything else targets
 * `~/…`, the project root.
 */

/** Files that exist for our CI only and must never ship to a consumer. */
export const NEVER_SHIP = [
	/\.types\.ts$/, // @ts-expect-error contracts — our regression tests, not API
	/\.call-sites\.svelte$/, // ditto, for markup
	/\.test\.ts$/,
	/\.spec\.ts$/
];

export const registry = {
	name: 'alrein-ui',
	homepage: 'https://alois-reinstadler.github.io/alrein-ui',
	aliases: {
		lib: '$lib',
		ui: '$lib/components/ui',
		components: '$lib/components',
		utils: '$lib/utils',
		hooks: '$lib/hooks'
	},
	items: [
		{
			name: 'theme',
			type: 'registry:theme',
			title: 'alrein-ui Theme',
			description:
				'Motion scale and effect tokens for alrein-ui. Adds the --transition-duration-*, --ease-fx-*, --fx-* and semantic state values on top of the shadcn-svelte token set, plus the `sq` squircle utility, and wires the stylesheet into your app.css. Every other alrein-ui item depends on this.',
			dir: 'src/lib/styles/alrein',
			rootTarget: 'src/lib/styles/alrein',
			css: { '@import "./lib/styles/alrein/index.css"': {} }
		},
		{
			name: 'fx',
			type: 'registry:lib',
			title: 'alrein-ui Effect System',
			description:
				'The singleton pointer engine, the five effect attachments, the capability matrix from SPEC.md §3.4 and the FxContext/FxScope policy layer implementing the §3.2 resolution order. One requestAnimationFrame and one pointermove listener serve the whole page.',
			dir: 'src/lib/fx',
			rootTarget: 'src/lib/fx',
			registryDependencies: ['local:theme']
		},
		{
			name: 'motion',
			type: 'registry:lib',
			title: 'alrein-ui Motion Primitives',
			description:
				'A correct CSS cubic-bezier solver, eight transition primitives as Svelte transition functions, and the shared FLIP MorphIndicator. The CSS half ships with the theme item; both read the same motion tokens so they cannot drift.',
			dir: 'src/lib/motion',
			rootTarget: 'src/lib/motion',
			registryDependencies: ['local:theme']
		},

		// Phase 0 — the three proof components.
		ui('button', 'alrein-ui Button', 'A strict superset of the shadcn-svelte Button. Every upstream variant, size and prop is unchanged; adds always-on press feedback plus gradient, glow, shimmer, tilt and magnet where SPEC.md §3.4 permits them. Overwrites the upstream file in place.'),
		ui('badge', 'alrein-ui Badge', 'A strict superset of the shadcn-svelte Badge. All six upstream variants unchanged; adds gradient, glow (status-critical only) and a triggered shimmer.'),
		ui('card', 'alrein-ui Card', 'A strict superset of the shadcn-svelte Card. All seven sub-components untouched; the root adds variant=hero, interactive, gradient, glow and tilt. Keeps overflow-hidden and uses an inner clipped glow so a first-child image still gets rounded corners.'),

		// Phase 1 — form controls. §3.4 grants Input, Textarea and Select no
		// decorative effects at all, so those three depend on `theme` but not `fx`.
		ui('field', 'alrein-ui Field', 'A strict superset of the shadcn-svelte Field. Adds semantic state (danger/warn/success) and the notched floating label, which is the one structural feature the vuesax form controls have that shadcn has no equivalent for.', { fx: false }),
		ui('input', 'alrein-ui Input', 'A strict superset of the shadcn-svelte Input. Adds semantic state, a loading state that blocks interaction without disabling, and floating-label support. No decorative effects — §3.4 withholds them from form fields.', { fx: false, deps: ['local:field', 'local:spinner'] }),
		ui('textarea', 'alrein-ui Textarea', 'A strict superset of the shadcn-svelte Textarea. Adds semantic state, loading, floating-label support and an optional character counter.', { fx: false, deps: ['local:field', 'local:spinner'] }),
		ui('select', 'alrein-ui Select', 'A strict superset of the shadcn-svelte Select, all eleven files intact. Adds semantic state and loading on the trigger. No glow and no height-animating menu morph — see amendments A13 and A14.', { fx: false, deps: ['local:field', 'local:spinner'] }),
		ui('checkbox', 'alrein-ui Checkbox', 'A strict superset of the shadcn-svelte Checkbox. The mark gains the toggle-thumb spring, and variant="card" adds the selectable card presentation with gradient, glow and tilt.'),
		ui('radio-group', 'alrein-ui RadioGroup', 'A strict superset of the shadcn-svelte RadioGroup. The dot gains the toggle-thumb spring, and variant="card" adds the selectable card presentation. Collapses vuesax radio, radio-card, radio-group and radio-group-cards into one component.'),
		ui('spinner', 'alrein-ui Spinner', 'New — shadcn-svelte has no equivalent. §5 collapses vuesax spinner-grid and spinner-comet into one component with variant="arc" | "grid" | "comet". Speed is a first-class axis; the loop slows under reduced motion rather than stopping, because a frozen spinner claims the work has finished.', { fx: false }),

		// Phase 2 — feedback and display.
		ui('button-group', 'alrein-ui ButtonGroup', 'A strict superset of the shadcn-svelte ButtonGroup. Its §3.4 row constrains its children rather than itself: buttons in a group may be painted and may not move. Enforced through the existing density scope, set on the group\'s own element because an FxScope wrapper would break the joined-edge selectors.'),
		ui('alert', 'alrein-ui Alert', 'A strict superset of the shadcn-svelte Alert. All sub-components intact; adds ghost, warning and success variants plus gradient, glow (danger/warn only) and a shimmer that runs once on mount.'),
		ui('avatar', 'alrein-ui Avatar', 'A strict superset of the shadcn-svelte Avatar, all six sub-components intact. Adds size, presence, a loading shimmer, a fallback gradient and tilt at size >= lg. The presence glow is never the only signal of state.'),
		ui('tooltip', 'alrein-ui Tooltip', 'A strict superset of the shadcn-svelte Tooltip. §3.4 grants it no effects at all; the extension is motion only, moved onto the shared data-[state] utilities so it reads the same tokens as everything else.', { fx: false }),
		ui('skeleton', 'alrein-ui Skeleton', 'A strict superset of the shadcn-svelte Skeleton. Adds the loading shimmer — the one place the idle loop belongs — and a Group that runs a single light across every bone instead of one per element.'),
		ui('chip', 'alrein-ui Chip', 'New — shadcn-svelte has no equivalent. Selectable and removable, with a real focusable remove button. §3.4 grants ghost and gradient and nothing else, because chips travel in packs.'),
		ui('rating', 'alrein-ui Rating', 'New — shadcn-svelte has no equivalent. Built on bits-ui RatingGroup so arrow keys, form association and announcement come for free. Adds variant="emoji", half steps and a value display. No decorative effects.', { fx: false }),
		// Phase 3 — navigation and structure.
		ui('steps', 'alrein-ui Steps', 'New — shadcn-svelte has no equivalent. §5 collapses vuesax steps and steps-arrow into one component with a variant. Renders an ordered list rather than a row of buttons, because clicking a pending step does nothing and nothing unresponsive belongs in the tab order. §3.4 grants gradient on the active step and nothing else.'),
		ui('timeline', 'alrein-ui Timeline', 'New — shadcn-svelte has no equivalent. §5 collapses timeline-compact into a variant. progress is a fractional index, so the rail fill can stop between two markers, which is the only thing worth measuring here. No decorative effects — §3.4 has no row for Timeline.', { fx: false }),
		ui('switch', 'alrein-ui Switch', 'A strict superset of the shadcn-svelte Switch. The thumb gains the toggle-thumb spring and a label snippet renders beside it as part of the same control.')
	]
};

/**
 * A component that overwrites its upstream shadcn-svelte counterpart in place.
 *
 * @param options.fx   whether it imports `$lib/fx`. Form fields do not (§3.4).
 * @param options.deps extra `local:` dependencies beyond theme and fx.
 */
function ui(name, title, description, options = {}) {
	const { fx = true, deps = [] } = options;
	return {
		name,
		type: 'registry:ui',
		title,
		description,
		dir: `src/lib/components/ui/${name}`,
		// Relative to the consumer's `ui` alias — this is what makes it overwrite
		// in place rather than land beside the upstream component.
		uiTarget: name,
		dependencies: ['tailwind-variants'],
		registryDependencies: ['local:theme', ...(fx ? ['local:fx'] : []), ...deps]
	};
}
