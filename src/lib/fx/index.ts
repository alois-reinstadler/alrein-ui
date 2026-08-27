export { default as FxScope } from './fx-scope.svelte';
export { FxContext, getFxContext, setFxContext, type FxDensity, type FxLevel } from './context.svelte.js';
export {
	CAPABILITIES,
	POINTER_TRACKED,
	allows,
	warnIfOverBudget,
	type Capability,
	type CapabilityRow,
	type FxComponent,
	type FxEffect
} from './capabilities.js';
export { glow, type GlowOptions } from './glow.js';
export { tilt, type TiltOptions } from './tilt.js';
export { magnet, type MagnetOptions } from './magnet.js';
export { press, type PressOptions } from './press.js';
export { shimmer, type ShimmerOptions } from './shimmer.js';
export { track, type PointerEffect, type Reactive } from './pointer.svelte.js';
