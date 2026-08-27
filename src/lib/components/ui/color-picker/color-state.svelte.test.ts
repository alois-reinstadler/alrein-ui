import { describe, expect, it } from 'vitest';
import { ColorState, parseOklchString } from './color-state.svelte.js';

/**
 * The behaviour worth pinning is not "does it store a number" but the two ways
 * a colour picker usually goes wrong: narrowing on every read so the value
 * drifts, and discarding what the user had when they type something invalid.
 */

describe('OKLCH is the stored form, so nothing drifts', () => {
	it('does not lose precision by round-tripping through hex on every change', () => {
		const colour = new ColorState({ l: 0.6234567, c: 0.1234567, h: 149.7531, a: 1 });
		// Reading hex narrows to 8 bits; that must not write back.
		for (let i = 0; i < 50; i += 1) void colour.hex;
		expect(colour.lightness).toBeCloseTo(0.6234567, 7);
		expect(colour.chroma).toBeCloseTo(0.1234567, 7);
		expect(colour.hue).toBeCloseTo(149.7531, 7);
	});

	it('keeps the hue while dragging chroma to zero and back', () => {
		const colour = new ColorState({ l: 0.5, c: 0.15, h: 275, a: 1 });
		colour.chroma = 0;
		colour.chroma = 0.15;
		// Via hex this would be lost: a grey has no hue to recover.
		expect(colour.hue).toBe(275);
	});
});

describe('normalisation on write', () => {
	it('wraps hue into 0–360 in both directions', () => {
		const colour = new ColorState();
		colour.hue = 420;
		expect(colour.hue).toBeCloseTo(60, 10);
		colour.hue = -30;
		expect(colour.hue).toBeCloseTo(330, 10);
	});

	it('clamps lightness and alpha, and floors chroma at zero', () => {
		const colour = new ColorState();
		colour.lightness = 5;
		expect(colour.lightness).toBe(1);
		colour.lightness = -5;
		expect(colour.lightness).toBe(0);
		colour.alpha = 2;
		expect(colour.alpha).toBe(1);
		colour.chroma = -1;
		expect(colour.chroma).toBe(0);
	});
});

describe('an unparseable hex leaves the colour alone', () => {
	it.each(['', '#', 'nope', '#12', '#gg0000'])('ignores %s', (input) => {
		const colour = new ColorState('#4a7c59');
		const before = colour.hex;
		colour.hex = input;
		expect(colour.hex).toBe(before);
	});

	it('accepts a valid hex', () => {
		const colour = new ColorState('#4a7c59');
		colour.hex = '#ff0000';
		expect(colour.hex).toBe('#ff0000');
	});

	/*
	 * The reason this matters: a field the user is halfway through typing is not
	 * an instruction to discard what they had. `#4a7` is a real colour, `#4a7c`
	 * is not, and `#4a7c5` is not either — a picker that resets on each of those
	 * is unusable.
	 */
	it('survives the intermediate states of typing a six-digit hex', () => {
		const colour = new ColorState('#000000');
		const typed = ['#', '#4', '#4a', '#4a7', '#4a7c', '#4a7c5', '#4a7c59'];
		for (const partial of typed) colour.hex = partial;
		expect(colour.hex).toBe('#4a7c59');
	});
});

describe('construction and set()', () => {
	it('accepts hex', () => {
		expect(new ColorState('#ff0000').hex).toBe('#ff0000');
	});

	it('accepts a CSS oklch string', () => {
		const colour = new ColorState('oklch(62.79% 0.2577 29.23)');
		expect(colour.lightness).toBeCloseTo(0.6279, 4);
		expect(colour.hue).toBeCloseTo(29.23, 2);
	});

	it('round-trips its own css output', () => {
		const colour = new ColorState('#4a7c59');
		const round = new ColorState(colour.css);
		expect(round.hex).toBe(colour.hex);
	});

	it('ignores an unparseable string rather than throwing', () => {
		const colour = new ColorState('#4a7c59');
		colour.set('rgb(1, 2, 3)');
		expect(colour.hex).toBe('#4a7c59');
	});
});

describe('parseOklchString', () => {
	it('handles the percentage and unit forms', () => {
		expect(parseOklchString('oklch(50% 0.1 200)')!.l).toBeCloseTo(0.5, 6);
		expect(parseOklchString('oklch(0.5 0.1 200)')!.l).toBeCloseTo(0.5, 6);
	});

	it('handles the alpha form', () => {
		expect(parseOklchString('oklch(50% 0.1 200 / 0.5)')!.a).toBe(0.5);
		expect(parseOklchString('oklch(50% 0.1 200)')!.a).toBe(1);
	});

	it.each(['', 'oklch()', 'hsl(1 2 3)', 'oklch(a b c)'])('rejects %s', (input) => {
		expect(parseOklchString(input)).toBeNull();
	});
});

describe('gamut and contrast', () => {
	it('reports a wide-gamut colour as out of sRGB', () => {
		const colour = new ColorState({ l: 0.6, c: 0.37, h: 150, a: 1 });
		expect(colour.inGamut).toBe(false);
	});

	it('picks ink by perceptual lightness, which is the point of using OKLCH', () => {
		// A saturated yellow: the usual sRGB luminance formula also gets this one
		// right, but it gets saturated cyan wrong, and OKLCH gets both right.
		expect(new ColorState('#ffff00').contrastingInk).toBe('oklch(0 0 0)');
		expect(new ColorState('#00ffff').contrastingInk).toBe('oklch(0 0 0)');
		expect(new ColorState('#000080').contrastingInk).toBe('oklch(1 0 0)');
		expect(new ColorState('#4a7c59').contrastingInk).toBe('oklch(1 0 0)');
	});
});
