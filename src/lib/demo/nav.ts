/**
 * The docs navigation, and the single place that records what has shipped.
 *
 * `phase` is the SPEC.md §6 phase a component belongs to; `status` is whether it
 * is actually built. The overview page renders the whole inventory from this, so
 * a component that is planned but not written shows up as planned rather than
 * quietly missing — the demo is an acceptance criterion (§7.11) and a demo that
 * silently omits things is worse than no demo.
 */
export type ComponentStatus = 'shipped' | 'planned';

export interface NavEntry {
	/** Route segment, and the registry item name. */
	slug: string;
	/** Display name, as a consumer would import it. */
	name: string;
	phase: 0 | 1 | 2 | 3 | 4;
	status: ComponentStatus;
	/** Whether this overwrites an upstream shadcn-svelte component or is new. */
	origin: 'extends' | 'new';
	summary: string;
}

export const NAV: NavEntry[] = [
	// Phase 0 — foundation + proof
	{ slug: 'button', name: 'Button', phase: 0, status: 'shipped', origin: 'extends', summary: 'Alle Upstream-Varianten plus Gradient, Glow, Shimmer, Tilt und Magnet.' },
	{ slug: 'card', name: 'Card', phase: 0, status: 'shipped', origin: 'extends', summary: 'Alle sieben Teilkomponenten plus hero-Variante, interactive, Glow und Tilt.' },
	{ slug: 'badge', name: 'Badge', phase: 0, status: 'shipped', origin: 'extends', summary: 'Alle sechs Varianten plus Gradient, Glow bei destructive und Shimmer.' },

	// Phase 1 — form controls
	{ slug: 'input', name: 'Input', phase: 1, status: 'shipped', origin: 'extends', summary: 'Zustände, Ladezustand und schwebendes Label. Keine Effekte — §3.4.' },
	{ slug: 'textarea', name: 'Textarea', phase: 1, status: 'shipped', origin: 'extends', summary: 'Wie Input, plus Zeichenzähler.' },
	{ slug: 'checkbox', name: 'Checkbox', phase: 1, status: 'shipped', origin: 'extends', summary: 'Feder am Häkchen, plus variant="card".' },
	{ slug: 'radio-group', name: 'RadioGroup', phase: 1, status: 'shipped', origin: 'extends', summary: 'Feder am Punkt, plus variant="card".' },
	{ slug: 'switch', name: 'Switch', phase: 1, status: 'shipped', origin: 'extends', summary: 'Feder am Daumen, plus label-Snippet.' },
	{ slug: 'select', name: 'Select', phase: 1, status: 'shipped', origin: 'extends', summary: 'Zustände und Ladezustand. Kein Glow, kein Morph — A13, A14.' },
	{ slug: 'field', name: 'Field', phase: 1, status: 'shipped', origin: 'extends', summary: 'Zustandssemantik danger/warn/success und das schwebende Label.' },

	// Phase 2 — feedback/display
	{ slug: 'alert', name: 'Alert', phase: 2, status: 'planned', origin: 'extends', summary: 'Gradient, Glow bei danger/warn, Shimmer einmalig beim Einblenden.' },
	{ slug: 'avatar', name: 'Avatar', phase: 2, status: 'planned', origin: 'extends', summary: 'Präsenzzustand, Ladeschimmer, Tilt ab Größe lg. Plus AvatarGroup.' },
	{ slug: 'chip', name: 'Chip', phase: 2, status: 'planned', origin: 'new', summary: 'Ghost und Gradient.' },
	{ slug: 'spinner', name: 'Spinner', phase: 2, status: 'shipped', origin: 'new', summary: 'variant="arc" | "grid" | "comet", plus Geschwindigkeit und Overlay.' },
	{ slug: 'tooltip', name: 'Tooltip', phase: 2, status: 'planned', origin: 'extends', summary: 'Keine Effekte — §3.4 gibt Tooltip nichts.' },
	{ slug: 'rating', name: 'Rating', phase: 2, status: 'planned', origin: 'new', summary: 'Plus variant="emoji".' },
	{ slug: 'skeleton', name: 'Skeleton', phase: 2, status: 'planned', origin: 'extends', summary: 'Der einzige Ort für den Dauerschimmer.' },

	// Phase 3 — navigation/structure
	{ slug: 'tabs', name: 'Tabs', phase: 3, status: 'planned', origin: 'extends', summary: 'variant="gooey" | "chrome", beide auf MorphIndicator.' },
	{ slug: 'steps', name: 'Steps', phase: 3, status: 'planned', origin: 'new', summary: 'variant="line" | "arrow".' },
	{ slug: 'accordion', name: 'Accordion', phase: 3, status: 'planned', origin: 'extends', summary: 'Gradient nur am Kopf, Glow am Auslöser.' },
	{ slug: 'breadcrumb', name: 'Breadcrumb', phase: 3, status: 'planned', origin: 'extends', summary: 'Ghost.' },
	{ slug: 'pagination', name: 'Pagination', phase: 3, status: 'planned', origin: 'extends', summary: 'variant="full" | "compact".' },
	{ slug: 'sidebar', name: 'Sidebar', phase: 3, status: 'planned', origin: 'extends', summary: 'Ghost, plus MorphIndicator.' },
	{ slug: 'timeline', name: 'Timeline', phase: 3, status: 'planned', origin: 'new', summary: 'variant="compact".' },

	// Phase 4 — complex
	{ slug: 'color-picker', name: 'ColorPicker', phase: 4, status: 'planned', origin: 'new', summary: 'Sechs Skins auf einer gemeinsamen ColorState-Klasse.' },
	{ slug: 'code', name: 'Code', phase: 4, status: 'planned', origin: 'new', summary: 'Plus CodeWindow mit Fensterrahmen.' },
	{ slug: 'upload-area', name: 'UploadArea', phase: 4, status: 'planned', origin: 'new', summary: 'Glow beim Ziehen, Schimmer beim Hochladen, Tilt.' }
];

export const PHASE_TITLES: Record<0 | 1 | 2 | 3 | 4, string> = {
	0: 'Fundament',
	1: 'Formulare',
	2: 'Rückmeldung & Anzeige',
	3: 'Navigation & Struktur',
	4: 'Komplex'
};

export function byPhase(): { phase: 0 | 1 | 2 | 3 | 4; title: string; entries: NavEntry[] }[] {
	const phases: (0 | 1 | 2 | 3 | 4)[] = [0, 1, 2, 3, 4];
	return phases.map((phase) => ({
		phase,
		title: PHASE_TITLES[phase],
		entries: NAV.filter((entry) => entry.phase === phase)
	}));
}
