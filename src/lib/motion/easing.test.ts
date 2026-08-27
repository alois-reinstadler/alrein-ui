import { describe, expect, it } from 'vitest';
import {
	blurAmount,
	cubicBezier,
	duration,
	easeFxIn,
	easeFxOut,
	easeFxSpring,
	fadeDuration,
	scaleFrom,
	slideDistance
} from './easing.js';

/**
 * These run under Node with no `document`, which exercises the SSR fallback path
 * as a side effect: if a token reader ever throws or returns `NaN` on the
 * server, a component that starts a transition during hydration breaks, and this
 * is where that shows up.
 */

/**
 * An independent parametric reference. Sampling the curve by walking `t` and
 * emitting `(x(t), y(t))` pairs has nothing in common with the solver's
 * Newton–Raphson search for `t` given `x`, so agreement between them is real
 * evidence rather than the same arithmetic twice.
 */
function parametricReference(x1: number, y1: number, x2: number, y2: number, samples = 4000) {
	const axis = (t: number, a1: number, a2: number) => {
		const c = 3 * a1;
		const b = 3 * (a2 - a1) - c;
		const a = 1 - c - b;
		return ((a * t + b) * t + c) * t;
	};
	const points: { x: number; y: number }[] = [];
	for (let i = 0; i <= samples; i += 1) {
		const t = i / samples;
		points.push({ x: axis(t, x1, x2), y: axis(t, y1, y2) });
	}
	/** Linear interpolation between the two bracketing samples. */
	return (x: number): number => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let low = 0;
		let high = points.length - 1;
		while (high - low > 1) {
			const mid = (low + high) >> 1;
			if (points[mid].x < x) low = mid;
			else high = mid;
		}
		const a = points[low];
		const b = points[high];
		const span = b.x - a.x;
		return span === 0 ? a.y : a.y + ((x - a.x) / span) * (b.y - a.y);
	};
}

const CURVES: { name: string; points: [number, number, number, number] }[] = [
	{ name: 'ease-fx-out', points: [0.22, 1, 0.36, 1] },
	{ name: 'ease-fx-in', points: [0.4, 0, 1, 1] },
	{ name: 'ease-fx-spring', points: [0.34, 1.56, 0.64, 1] }
];

describe('cubicBezier — the solver', () => {
	it.each(CURVES)('$name matches an independent parametric reference', ({ points }) => {
		const solve = cubicBezier(...points);
		const reference = parametricReference(...points);
		let worst = 0;
		for (let i = 0; i <= 1000; i += 1) {
			const x = i / 1000;
			worst = Math.max(worst, Math.abs(solve(x) - reference(x)));
		}
		// The reference itself is piecewise-linear over 4000 samples, so its own
		// interpolation error dominates this bound.
		expect(worst).toBeLessThan(1e-4);
	});

	it.each(CURVES)('$name is pinned at both ends', ({ points }) => {
		const solve = cubicBezier(...points);
		expect(solve(0)).toBe(0);
		expect(solve(1)).toBe(1);
	});

	/**
	 * The bug this whole module exists to avoid. A CSS easing curve maps
	 * x (time) → y (progress); evaluating the *y* polynomial at `t = time`
	 * conflates the parameter with the input and is simply a different curve.
	 * For `ease-fx-out` at a quarter of the way through it is wrong by a fifth of
	 * the animation.
	 */
	it('is not the naive y(t) sampling', () => {
		const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1];
		const naive = (t: number) => {
			const c = 3 * y1;
			const b = 3 * (y2 - y1) - c;
			const a = 1 - c - b;
			return ((a * t + b) * t + c) * t;
		};
		const correct = cubicBezier(x1, y1, x2, y2)(0.25);
		expect(correct).toBeCloseTo(0.7649, 3);
		expect(naive(0.25)).toBeCloseTo(0.5781, 3);
		expect(Math.abs(correct - naive(0.25))).toBeGreaterThan(0.18);
	});

	it('an ease-out curve is monotonic and front-loaded', () => {
		const solve = cubicBezier(0.22, 1, 0.36, 1);
		let previous = 0;
		for (let i = 1; i <= 200; i += 1) {
			const value = solve(i / 200);
			expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
			previous = value;
		}
		// More than half the distance covered in the first fifth of the time.
		expect(solve(0.2)).toBeGreaterThan(0.5);
	});

	it('the spring curve overshoots, which is the whole point of restricting it', () => {
		const solve = cubicBezier(0.34, 1.56, 0.64, 1);
		let peak = 0;
		for (let i = 0; i <= 1000; i += 1) peak = Math.max(peak, solve(i / 1000));
		expect(peak).toBeGreaterThan(1);
		// …and still lands exactly on target.
		expect(solve(1)).toBe(1);
	});

	it('clamps out-of-range input rather than extrapolating', () => {
		const solve = cubicBezier(0.22, 1, 0.36, 1);
		expect(solve(-0.5)).toBe(0);
		expect(solve(1.5)).toBe(1);
	});
});

describe('the exported token easings', () => {
	it.each([
		['easeFxOut', easeFxOut],
		['easeFxIn', easeFxIn],
		['easeFxSpring', easeFxSpring]
	])('%s is a usable easing without a document', (_name, easing) => {
		expect(easing(0)).toBe(0);
		expect(easing(1)).toBe(1);
		expect(Number.isFinite(easing(0.5))).toBe(true);
	});
});

describe('token readers fall back safely with no document', () => {
	it('mirrors the motion scale in SPEC.md §2', () => {
		expect(duration('instant')).toBe(80);
		expect(duration('fast')).toBe(120);
		expect(duration('base')).toBe(180);
		expect(duration('slow')).toBe(240);
	});

	it('exit is faster than enter, which is what the scale is for', () => {
		expect(duration('fast')).toBeLessThan(duration('base'));
		expect(duration('base')).toBeLessThan(duration('slow'));
	});

	it('the geometry readers return finite numbers', () => {
		for (const value of [fadeDuration(), slideDistance(), scaleFrom(), blurAmount()]) {
			expect(Number.isFinite(value)).toBe(true);
			expect(value).toBeGreaterThan(0);
		}
	});
});
