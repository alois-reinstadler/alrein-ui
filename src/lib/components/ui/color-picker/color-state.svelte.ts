import {
	formatHex,
	formatOklch,
	inSrgbGamut,
	oklchToRgb,
	parseHex,
	rgbToHsl,
	rgbToOklch,
	type Oklch,
	type Rgb
} from './color.js';

/**
 * The one piece of state every ColorPicker skin shares (SPEC.md §5).
 *
 * Six skins, one state class. Building six pickers is how you get six subtly
 * different answers to "what happens when the user types an invalid hex", and
 * the previous attempt shipped exactly that kind of divergence across its own
 * families (§8, `F1`).
 *
 * **OKLCH is the stored form.** Every other representation is derived on read
 * and parsed on write, so there is no second copy to drift out of sync — which
 * is the bug every colour picker has: you drag the hue slider, the hex field
 * rounds to 8 bits, the rounded hex is read back as the source of truth, and the
 * hue you were dragging quietly moves under your finger. Storing the widest
 * representation and narrowing only at the boundary makes that impossible.
 */
export class ColorState {
	#oklch: Oklch = $state({ l: 0.6, c: 0.1, h: 150, a: 1 });

	constructor(initial?: string | Oklch) {
		if (initial) this.set(initial);
	}

	/** The stored value. Assigning normalises hue into 0–360 and clamps the rest. */
	get oklch(): Oklch {
		return this.#oklch;
	}

	set oklch(next: Oklch) {
		this.#oklch = {
			l: Math.min(1, Math.max(0, next.l)),
			c: Math.max(0, next.c),
			h: ((next.h % 360) + 360) % 360,
			a: Math.min(1, Math.max(0, next.a))
		};
	}

	get rgb(): Rgb {
		return oklchToRgb(this.#oklch);
	}

	set rgb(next: Rgb) {
		this.oklch = rgbToOklch(next);
	}

	/** Always 6 or 8 digits with a leading `#`. Narrows to 8-bit — see the class note. */
	get hex(): string {
		return formatHex(this.rgb);
	}

	set hex(next: string) {
		const parsed = parseHex(next);
		// An unparseable hex leaves the colour alone rather than resetting it. A
		// field the user is halfway through typing is not an instruction to
		// discard what they had.
		if (parsed) this.rgb = parsed;
	}

	/** A CSS `oklch()` string — the lossless form, and what a consumer should store. */
	get css(): string {
		return formatOklch(this.#oklch);
	}

	get hsl(): { h: number; s: number; l: number; a: number } {
		return rgbToHsl(this.rgb);
	}

	/**
	 * Whether sRGB can actually show this colour.
	 *
	 * The picker draws the boundary from this instead of clipping quietly. A
	 * handle that keeps moving while the colour stops changing is the single most
	 * confusing thing a wide-gamut picker can do.
	 */
	get inGamut(): boolean {
		return inSrgbGamut(this.#oklch);
	}

	/** Perceptual lightness, 0–1. */
	get lightness(): number {
		return this.#oklch.l;
	}
	set lightness(value: number) {
		this.oklch = { ...this.#oklch, l: value };
	}

	get chroma(): number {
		return this.#oklch.c;
	}
	set chroma(value: number) {
		this.oklch = { ...this.#oklch, c: value };
	}

	get hue(): number {
		return this.#oklch.h;
	}
	set hue(value: number) {
		this.oklch = { ...this.#oklch, h: value };
	}

	get alpha(): number {
		return this.#oklch.a;
	}
	set alpha(value: number) {
		this.oklch = { ...this.#oklch, a: value };
	}

	/** Accepts a hex string, a CSS `oklch()` string, or an `Oklch` object. */
	set(value: string | Oklch): void {
		if (typeof value !== 'string') {
			this.oklch = value;
			return;
		}
		const parsed = parseHex(value);
		if (parsed) {
			this.rgb = parsed;
			return;
		}
		const oklch = parseOklchString(value);
		if (oklch) this.oklch = oklch;
	}

	/**
	 * A readable foreground for this colour.
	 *
	 * OKLCH's `l` is perceptual, which is exactly what this question needs — the
	 * usual sRGB luminance formula gets it wrong for saturated yellows and cyans.
	 * 0.6 is the crossover where black and white are about equally legible.
	 */
	get contrastingInk(): string {
		return this.#oklch.l > 0.6 ? 'oklch(0 0 0)' : 'oklch(1 0 0)';
	}
}

const OKLCH_STRING = /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)%?\s*)?\)$/i;

/** Parses the subset of `oklch()` this component emits. `null` for anything else. */
export function parseOklchString(input: string): Oklch | null {
	const match = OKLCH_STRING.exec(input.trim());
	if (!match) return null;
	const isPercent = input.includes('%');
	const l = Number.parseFloat(match[1]);
	return {
		l: isPercent ? l / 100 : l,
		c: Number.parseFloat(match[2]),
		h: Number.parseFloat(match[3]),
		a: match[4] === undefined ? 1 : Number.parseFloat(match[4])
	};
}
