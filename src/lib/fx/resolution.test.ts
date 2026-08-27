import { describe, expect, it } from 'vitest';
import { inheritLevel, resolveEffect, type FxEnvironment } from './resolution.js';
import { CAPABILITIES, POINTER_TRACKED, type FxEffect } from './capabilities.js';

/**
 * SPEC.md §3.2, step by step. Each `describe` below is one numbered step of the
 * resolution order, and the cases are written to fail if the steps are ever
 * reordered — which is the failure mode that matters, because the order is what
 * makes `off` unoverridable and `calm` genuinely calm.
 */

const base: FxEnvironment = {
	level: 'calm',
	density: 'default',
	reducedMotion: false,
	pointerFine: true
};

const env = (overrides: Partial<FxEnvironment> = {}): FxEnvironment => ({ ...base, ...overrides });

const ALL_EFFECTS: FxEffect[] = ['gradient', 'glow', 'shimmer', 'tilt', 'magnet'];
const STATIC_EFFECTS = ALL_EFFECTS.filter((effect) => !POINTER_TRACKED.has(effect));

describe('step 1 — data-fx="off" is dead, with no override possible', () => {
	it.each(ALL_EFFECTS)('vetoes %s even when the prop asks for it', (effect) => {
		expect(resolveEffect(effect, true, env({ level: 'off' }))).toBe(false);
	});

	it('vetoes even at expressive with a declared default', () => {
		expect(resolveEffect('glow', true, env({ level: 'off' }), { fxDefault: true })).toBe(false);
	});

	it('is sticky through nesting: expressive inside off stays off', () => {
		expect(inheritLevel('off', 'expressive')).toBe('off');
		expect(inheritLevel('off', 'calm')).toBe('off');
		expect(inheritLevel('off', undefined)).toBe('off');
	});

	it('does not make every level sticky — only off', () => {
		expect(inheritLevel('expressive', 'calm')).toBe('calm');
		expect(inheritLevel('calm', 'expressive')).toBe('expressive');
		expect(inheritLevel('calm', 'off')).toBe('off');
		expect(inheritLevel('expressive', undefined)).toBe('expressive');
	});
});

describe('step 2 — prefers-reduced-motion kills pointer-tracked effects', () => {
	it.each([...POINTER_TRACKED])('vetoes %s', (effect) => {
		expect(resolveEffect(effect, true, env({ reducedMotion: true, level: 'expressive' }))).toBe(false);
	});

	it.each(STATIC_EFFECTS)('leaves %s alone — it is a surface treatment, not motion', (effect) => {
		expect(resolveEffect(effect, true, env({ reducedMotion: true }))).toBe(true);
	});
});

describe('step 3 — a coarse pointer has nothing to track', () => {
	it.each([...POINTER_TRACKED])('vetoes %s', (effect) => {
		expect(resolveEffect(effect, true, env({ pointerFine: false, level: 'expressive' }))).toBe(false);
	});

	it.each(STATIC_EFFECTS)('leaves %s alone', (effect) => {
		expect(resolveEffect(effect, true, env({ pointerFine: false }))).toBe(true);
	});
});

describe('step 4 — the capability matrix, including the ◐ condition', () => {
	it('vetoes when the component says the condition is unmet', () => {
		expect(resolveEffect('gradient', true, env(), { available: false })).toBe(false);
	});

	it('runs after the pointer vetoes, so an unmet condition cannot resurrect anything', () => {
		expect(resolveEffect('glow', true, env({ reducedMotion: true }), { available: true })).toBe(false);
	});
});

describe('step 5 — density scope', () => {
	it.each([...POINTER_TRACKED])('downgrades %s off in a list', (effect) => {
		expect(resolveEffect(effect, true, env({ density: 'list', level: 'expressive' }))).toBe(false);
	});

	it.each([...POINTER_TRACKED])('downgrades %s off in a table', (effect) => {
		expect(resolveEffect(effect, true, env({ density: 'table', level: 'expressive' }))).toBe(false);
	});

	it.each(STATIC_EFFECTS)('lets %s survive a dense scope', (effect) => {
		expect(resolveEffect(effect, true, env({ density: 'table' }))).toBe(true);
	});
});

describe('step 6 — the per-instance prop beats the preset in both directions', () => {
	it('turns an effect on that the preset would not have', () => {
		expect(resolveEffect('glow', true, env({ level: 'calm' }))).toBe(true);
	});

	it('turns an effect off that the preset would have lit', () => {
		expect(resolveEffect('glow', false, env({ level: 'expressive' }), { fxDefault: true })).toBe(false);
	});

	it('treats undefined as "no answer", not as false', () => {
		expect(resolveEffect('glow', undefined, env({ level: 'expressive' }), { fxDefault: true })).toBe(true);
	});
});

describe('step 7 — the preset default', () => {
	it('calm never lights anything up on its own', () => {
		for (const effect of ALL_EFFECTS) {
			expect(resolveEffect(effect, undefined, env({ level: 'calm' }), { fxDefault: true })).toBe(false);
		}
	});

	it('expressive lights up only what declares a default', () => {
		expect(resolveEffect('glow', undefined, env({ level: 'expressive' }), { fxDefault: true })).toBe(true);
		expect(resolveEffect('glow', undefined, env({ level: 'expressive' }), { fxDefault: false })).toBe(false);
	});
});

describe('§3.5 — magnet is expressive-only regardless of the prop', () => {
	it('refuses at calm even when explicitly requested', () => {
		expect(resolveEffect('magnet', true, env({ level: 'calm' }))).toBe(false);
	});

	it('allows at expressive', () => {
		expect(resolveEffect('magnet', true, env({ level: 'expressive' }))).toBe(true);
	});
});

describe('the default posture is calm', () => {
	it('nothing is on when nothing is asked for', () => {
		for (const effect of ALL_EFFECTS) {
			expect(resolveEffect(effect, undefined, env())).toBe(false);
		}
	});
});

describe('the capability matrix matches SPEC.md §3.4', () => {
	it('withholds tilt and magnet from Badge — a badge is a label', () => {
		expect('tilt' in CAPABILITIES.badge).toBe(false);
		expect('magnet' in CAPABILITIES.badge).toBe(false);
	});

	it('gives magnet to Button alone', () => {
		const withMagnet = Object.entries(CAPABILITIES)
			.filter(([, row]) => 'magnet' in row)
			.map(([name]) => name);
		expect(withMagnet).toEqual(['button']);
	});

	it('withholds every effect from form fields by not listing them at all', () => {
		for (const name of ['input', 'textarea', 'select', 'tooltip', 'popover', 'dialog']) {
			expect(name in CAPABILITIES).toBe(false);
		}
	});

	it('gives Card no ghost, no shimmer and no magnet', () => {
		expect(Object.keys(CAPABILITIES.card).sort()).toEqual(['glow', 'gradient', 'tilt']);
	});
});
