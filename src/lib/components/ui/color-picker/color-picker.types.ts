/**
 * Type-level contract for ColorPicker (SPEC.md §3.5, §7.4).
 *
 * §3.4 has no row for ColorPicker, which by the matrix's own convention means
 * no decorative effects at all — and here the reason is unusually sharp. A
 * colour picker's entire job is to show a colour accurately. A glow, a gradient
 * or a shimmer over it is not emphasis; it is a lie about the value.
 */
import type { ColorPickerProps } from './color-picker.svelte';

const basic: ColorPickerProps = {};
const compact: ColorPickerProps = { variant: 'compact', value: '#4a7c59' };
const ring: ColorPickerProps = { variant: 'ring', alpha: true };
const slider: ColorPickerProps = { variant: 'slider' };
const palette: ColorPickerProps = { variant: 'palette', palette: ['#4a7c59', '#0a0a0a'] };
const swatches: ColorPickerProps = { variant: 'swatches', onValueChange: () => {} };

// @ts-expect-error §3.4 grants ColorPicker no glow
const glowing: ColorPickerProps = { glow: true };
// @ts-expect-error a gradient over a colour picker misreports the value
const gradient: ColorPickerProps = { gradient: true };
// @ts-expect-error §3.4 grants ColorPicker no shimmer
const shimmering: ColorPickerProps = { shimmer: true };
// @ts-expect-error a tilted colour surface is a colour surface you cannot judge
const tilted: ColorPickerProps = { tilt: true };
// @ts-expect-error §3.4 grants ColorPicker no magnet
const magnetic: ColorPickerProps = { magnet: true };

export {
	basic,
	compact,
	ring,
	slider,
	palette,
	swatches,
	glowing,
	gradient,
	shimmering,
	tilted,
	magnetic
};
