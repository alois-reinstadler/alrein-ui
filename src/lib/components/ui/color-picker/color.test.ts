import { describe, expect, it } from 'vitest';
import {
	formatHex,
	formatOklch,
	hslToRgb,
	inSrgbGamut,
	oklchToRgb,
	parseHex,
	rgbToHsl,
	rgbToOklch,
	type Rgb
} from './color.js';

/**
 * A26 chose an internal converter over `culori`, so the arithmetic has to earn
 * that on its own. These check the two things that matter: that a round trip is
 * lossless to within float noise, and that the absolute values agree with
 * independently published references rather than merely with themselves.
 */

const roundTrip = (rgb: Rgb) => oklchToRgb(rgbToOklch(rgb));

const SAMPLES: Rgb[] = [
	{ r: 0, g: 0, b: 0, a: 1 },
	{ r: 1, g: 1, b: 1, a: 1 },
	{ r: 1, g: 0, b: 0, a: 1 },
	{ r: 0, g: 1, b: 0, a: 1 },
	{ r: 0, g: 0, b: 1, a: 1 },
	{ r: 0.29, g: 0.486, b: 0.349, a: 1 },
	{ r: 0.5, g: 0.25, b: 0.75, a: 0.4 }
];

/*
 * The bound that means something. A channel is quantised to 8 bits on the way to
 * a screen, so one representable step is 1/255 ≈ 0.0039. Anything below that is
 * invisible by construction, and asking for float-exact equality through two
 * cube roots and two gamma curves would be asking the arithmetic to be something
 * it is not. The measured worst case is ~9e-7, roughly a four-thousandth of a
 * step, so the margin here is generous rather than tuned to pass.
 */
const ONE_EIGHT_BIT_STEP = 1 / 255;

describe('sRGB ↔ OKLCH round trip', () => {
	it.each(SAMPLES)('survives %o well inside one 8-bit step', (rgb) => {
		const back = roundTrip(rgb);
		expect(Math.abs(back.r - rgb.r)).toBeLessThan(ONE_EIGHT_BIT_STEP / 100);
		expect(Math.abs(back.g - rgb.g)).toBeLessThan(ONE_EIGHT_BIT_STEP / 100);
		expect(Math.abs(back.b - rgb.b)).toBeLessThan(ONE_EIGHT_BIT_STEP / 100);
		expect(back.a).toBe(rgb.a);
	});

	it('holds across a sweep of the cube, not just the corners', () => {
		let worst = 0;
		for (let r = 0; r <= 1.0001; r += 0.05) {
			for (let g = 0; g <= 1.0001; g += 0.05) {
				for (let b = 0; b <= 1.0001; b += 0.05) {
					const back = roundTrip({ r, g, b, a: 1 });
					worst = Math.max(worst, Math.abs(back.r - r), Math.abs(back.g - g), Math.abs(back.b - b));
				}
			}
		}
		// ~9e-7 in practice; the assertion is the visible bound, not the measured one.
		expect(worst).toBeLessThan(ONE_EIGHT_BIT_STEP / 100);
	});

	/*
	 * The channels held fixed here are `64/255` and `192/255` rather than round
	 * decimals, and that is deliberate: `0.5 * 255` is exactly `127.5`, an exact
	 * rounding tie that any perturbation flips. `Math.round` at a tie is unstable
	 * under a 1e-7 nudge no matter how good the arithmetic is, so a test built on
	 * one measures the tie, not the converter. Values that come from real 8-bit
	 * levels can never land on a tie.
	 */
	it('never survives a round trip as a different 8-bit colour', () => {
		const byte = (channel: number) => Math.round(channel * 255);
		const held = [64 / 255, 192 / 255];
		for (let value = 0; value < 256; value += 1) {
			for (const rgb of [
				{ r: value / 255, g: held[0], b: held[1], a: 1 },
				{ r: held[0], g: value / 255, b: held[1], a: 1 },
				{ r: held[1], g: held[0], b: value / 255, a: 1 }
			]) {
				const back = roundTrip(rgb);
				expect(byte(back.r)).toBe(byte(rgb.r));
				expect(byte(back.g)).toBe(byte(rgb.g));
				expect(byte(back.b)).toBe(byte(rgb.b));
			}
		}
	});
});

describe('absolute values agree with published references', () => {
	/*
	 * From Ottosson's own worked examples. Checking against an outside source is
	 * the point — a round trip only proves the two directions are inverses, which
	 * they would be even if both matrices were wrong in the same way.
	 */
	it('white is L=1, C=0', () => {
		const white = rgbToOklch({ r: 1, g: 1, b: 1, a: 1 });
		expect(white.l).toBeCloseTo(1, 5);
		expect(white.c).toBeCloseTo(0, 5);
	});

	it('black is L=0', () => {
		expect(rgbToOklch({ r: 0, g: 0, b: 0, a: 1 }).l).toBeCloseTo(0, 6);
	});

	it('sRGB red lands near L=0.628, C=0.258, H=29.2', () => {
		const red = rgbToOklch({ r: 1, g: 0, b: 0, a: 1 });
		expect(red.l).toBeCloseTo(0.6279, 3);
		expect(red.c).toBeCloseTo(0.2577, 3);
		expect(red.h).toBeCloseTo(29.23, 1);
	});

	it('sRGB green lands near L=0.866, H=142.5', () => {
		const green = rgbToOklch({ r: 0, g: 1, b: 0, a: 1 });
		expect(green.l).toBeCloseTo(0.8664, 3);
		expect(green.h).toBeCloseTo(142.5, 1);
	});

	/*
	 * The reason OKLCH is the working space rather than HSL: in HSL, yellow and
	 * blue at the same `l` differ enormously in perceived lightness, so a
	 * lightness slider built on it does not mean lightness.
	 */
	it('yellow and blue at equal HSL lightness differ hugely in perceived lightness', () => {
		const yellow = rgbToOklch(hslToRgb({ h: 60, s: 1, l: 0.5, a: 1 }));
		const blue = rgbToOklch(hslToRgb({ h: 240, s: 1, l: 0.5, a: 1 }));
		expect(yellow.l - blue.l).toBeGreaterThan(0.4);
	});
});

describe('greyscale has no hue to report', () => {
	it.each([0, 0.25, 0.5, 0.75, 1])('grey at %s reports hue 0 rather than arctangent noise', (level) => {
		const grey = rgbToOklch({ r: level, g: level, b: level, a: 1 });
		expect(grey.c).toBeLessThan(1e-6);
		expect(grey.h).toBe(0);
	});
});

describe('gamut detection', () => {
	it('accepts a colour sRGB can show', () => {
		expect(inSrgbGamut(rgbToOklch({ r: 0.29, g: 0.486, b: 0.349, a: 1 }))).toBe(true);
	});

	it('rejects a chroma sRGB cannot reach', () => {
		expect(inSrgbGamut({ l: 0.6, c: 0.37, h: 150, a: 1 })).toBe(false);
	});

	it('rejects high chroma at extreme lightness', () => {
		expect(inSrgbGamut({ l: 0.99, c: 0.2, h: 30, a: 1 })).toBe(false);
		expect(inSrgbGamut({ l: 0.02, c: 0.2, h: 30, a: 1 })).toBe(false);
	});
});

describe('hex at the boundary', () => {
	it.each([
		['#fff', { r: 1, g: 1, b: 1, a: 1 }],
		['#000000', { r: 0, g: 0, b: 0, a: 1 }],
		['#ff0000', { r: 1, g: 0, b: 0, a: 1 }],
		['4a7c59', { r: 0x4a / 255, g: 0x7c / 255, b: 0x59 / 255, a: 1 }]
	])('parses %s', (input, expected) => {
		const parsed = parseHex(input as string);
		expect(parsed).not.toBeNull();
		expect(parsed!.r).toBeCloseTo((expected as Rgb).r, 6);
		expect(parsed!.g).toBeCloseTo((expected as Rgb).g, 6);
		expect(parsed!.b).toBeCloseTo((expected as Rgb).b, 6);
		expect(parsed!.a).toBeCloseTo((expected as Rgb).a, 6);
	});

	it('parses the alpha forms', () => {
		expect(parseHex('#ff000080')!.a).toBeCloseTo(128 / 255, 4);
		expect(parseHex('#f008')!.a).toBeCloseTo(0x88 / 255, 4);
	});

	it.each(['', '#', 'nope', '#gg0000', '#12345'])('rejects %s', (input) => {
		expect(parseHex(input)).toBeNull();
	});

	it('formats without an alpha pair when opaque', () => {
		expect(formatHex({ r: 1, g: 0, b: 0, a: 1 })).toBe('#ff0000');
		expect(formatHex({ r: 1, g: 0, b: 0, a: 0.5 })).toMatch(/^#ff0000[0-9a-f]{2}$/);
	});

	it('survives a hex round trip exactly', () => {
		for (const hex of ['#4a7c59', '#0a0a0a', '#fafafa', '#123456']) {
			expect(formatHex(parseHex(hex)!)).toBe(hex);
		}
	});
});

describe('formatOklch', () => {
	it('emits a parseable CSS colour', () => {
		expect(formatOklch({ l: 0.5, c: 0.1, h: 200, a: 1 })).toBe('oklch(50.00% 0.1000 200.00)');
	});

	it('includes alpha only when it is not 1', () => {
		expect(formatOklch({ l: 0.5, c: 0.1, h: 200, a: 0.5 })).toContain('/');
		expect(formatOklch({ l: 0.5, c: 0.1, h: 200, a: 1 })).not.toContain('/');
	});
});

describe('HSL at the boundary', () => {
	it.each(SAMPLES)('survives a round trip for %o', (rgb) => {
		const back = hslToRgb(rgbToHsl(rgb));
		expect(back.r).toBeCloseTo(rgb.r, 6);
		expect(back.g).toBeCloseTo(rgb.g, 6);
		expect(back.b).toBeCloseTo(rgb.b, 6);
	});
});
