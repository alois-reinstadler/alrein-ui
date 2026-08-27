/**
 * Colour conversions for ColorPicker.
 *
 * **OKLCH is the internal space** (SPEC.md §5), matching Tailwind v4 and
 * shadcn-svelte, with conversion at the boundary. A26 settles the dependency
 * question: this is a registry, so a dependency here is one every consumer
 * inherits for a component most of them will not install. These conversions are
 * well-defined matrix arithmetic rather than a judgement call, so they are
 * written out with their sources cited.
 *
 * Why OKLCH rather than HSL as the working space: in HSL, holding lightness
 * fixed and sweeping hue produces wildly different *perceived* brightness — a
 * yellow at `hsl(60 100% 50%)` is far lighter than a blue at `hsl(240 100% 50%)`.
 * A picker built on HSL therefore has a lightness slider that does not mean
 * lightness. OKLab was constructed to fix exactly that.
 *
 * References:
 * - OKLab matrices — Björn Ottosson, "A perceptual color space for image
 *   processing" (2020).
 * - sRGB transfer function — IEC 61966-2-1.
 */

export interface Oklch {
	/** Perceptual lightness, 0–1. */
	l: number;
	/** Chroma, 0 to about 0.37 for in-gamut sRGB. */
	c: number;
	/** Hue in degrees, 0–360. */
	h: number;
	/** Alpha, 0–1. */
	a: number;
}

export interface Rgb {
	/** 0–1, gamma-encoded sRGB. */
	r: number;
	g: number;
	b: number;
	a: number;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/* -------------------------------------------------------------------------- */
/* sRGB transfer function (IEC 61966-2-1)                                     */
/* -------------------------------------------------------------------------- */

function toLinear(channel: number): number {
	return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function toGamma(channel: number): number {
	return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

/* -------------------------------------------------------------------------- */
/* OKLab (Ottosson 2020)                                                      */
/* -------------------------------------------------------------------------- */

export function rgbToOklch({ r, g, b, a }: Rgb): Oklch {
	const lr = toLinear(r);
	const lg = toLinear(g);
	const lb = toLinear(b);

	// Linear sRGB → LMS, then the cube root that makes the space perceptual.
	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

	// LMS → OKLab.
	const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

	// OKLab → OKLCH: the a/b plane in polar form.
	const c = Math.hypot(okA, okB);
	let h = (Math.atan2(okB, okA) * 180) / Math.PI;
	if (h < 0) h += 360;

	// A greyscale colour has no meaningful hue; report 0 rather than the arctangent
	// of two rounding errors, which would make the hue slider jitter at c ≈ 0.
	return { l: okL, c, h: c < 1e-6 ? 0 : h, a };
}

export function oklchToRgb({ l: okL, c, h, a }: Oklch): Rgb {
	const radians = (h * Math.PI) / 180;
	const okA = c * Math.cos(radians);
	const okB = c * Math.sin(radians);

	const l = (okL + 0.3963377774 * okA + 0.2158037573 * okB) ** 3;
	const m = (okL - 0.1055613458 * okA - 0.0638541728 * okB) ** 3;
	const s = (okL - 0.0894841775 * okA - 1.291485548 * okB) ** 3;

	return {
		r: clamp(toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
		g: clamp(toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
		b: clamp(toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
		a
	};
}

/**
 * Whether an OKLCH colour survives a round trip through sRGB unclamped.
 *
 * OKLCH can name colours sRGB cannot show — high chroma at extreme lightness in
 * particular. The picker uses this to draw the gamut boundary rather than
 * silently clipping and leaving the user dragging a handle that stops changing
 * anything.
 */
export function inSrgbGamut({ l: okL, c, h }: Oklch): boolean {
	const radians = (h * Math.PI) / 180;
	const okA = c * Math.cos(radians);
	const okB = c * Math.sin(radians);
	const l = (okL + 0.3963377774 * okA + 0.2158037573 * okB) ** 3;
	const m = (okL - 0.1055613458 * okA - 0.0638541728 * okB) ** 3;
	const s = (okL - 0.0894841775 * okA - 1.291485548 * okB) ** 3;
	const epsilon = 1e-4;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	].every((channel) => channel >= -epsilon && channel <= 1 + epsilon);
}

/* -------------------------------------------------------------------------- */
/* Boundary formats                                                           */
/* -------------------------------------------------------------------------- */

const HEX = /^#?([0-9a-f]{3,8})$/i;

/** Parses `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa`. `null` for anything else. */
export function parseHex(input: string): Rgb | null {
	const match = HEX.exec(input.trim());
	if (!match) return null;
	let digits = match[1];
	if (digits.length === 3 || digits.length === 4) {
		digits = [...digits].map((digit) => digit + digit).join('');
	}
	if (digits.length !== 6 && digits.length !== 8) return null;
	const value = Number.parseInt(digits, 16);
	const hasAlpha = digits.length === 8;
	return {
		r: ((value >>> (hasAlpha ? 24 : 16)) & 0xff) / 255,
		g: ((value >>> (hasAlpha ? 16 : 8)) & 0xff) / 255,
		b: ((value >>> (hasAlpha ? 8 : 0)) & 0xff) / 255,
		a: hasAlpha ? (value & 0xff) / 255 : 1
	};
}

export function formatHex({ r, g, b, a }: Rgb): string {
	const byte = (channel: number) =>
		Math.round(clamp(channel) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a) : ''}`;
}

/**
 * A CSS `oklch()` string.
 *
 * Emitted in the working space rather than converted to hex, so a colour the
 * picker can represent but sRGB cannot is not silently flattened on the way out.
 * Consumers on browsers without `oklch()` should read `hex` instead.
 */
export function formatOklch({ l, c, h, a }: Oklch): string {
	const parts = `${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)}`;
	return a < 1 ? `oklch(${parts} / ${a.toFixed(3)})` : `oklch(${parts})`;
}

/** HSL, for the boundary only — never as a working space. See the module note. */
export function rgbToHsl({ r, g, b, a }: Rgb): { h: number; s: number; l: number; a: number } {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const lightness = (max + min) / 2;
	const delta = max - min;
	if (delta === 0) return { h: 0, s: 0, l: lightness, a };

	const saturation = delta / (1 - Math.abs(2 * lightness - 1));
	let hue: number;
	if (max === r) hue = ((g - b) / delta) % 6;
	else if (max === g) hue = (b - r) / delta + 2;
	else hue = (r - g) / delta + 4;
	hue *= 60;
	if (hue < 0) hue += 360;
	return { h: hue, s: saturation, l: lightness, a };
}

export function hslToRgb({ h, s, l, a }: { h: number; s: number; l: number; a: number }): Rgb {
	const chroma = (1 - Math.abs(2 * l - 1)) * s;
	const segment = (((h % 360) + 360) % 360) / 60;
	const second = chroma * (1 - Math.abs((segment % 2) - 1));
	const [r, g, b] =
		segment < 1
			? [chroma, second, 0]
			: segment < 2
				? [second, chroma, 0]
				: segment < 3
					? [0, chroma, second]
					: segment < 4
						? [0, second, chroma]
						: segment < 5
							? [second, 0, chroma]
							: [chroma, 0, second];
	const match = l - chroma / 2;
	return { r: r + match, g: g + match, b: b + match, a };
}
