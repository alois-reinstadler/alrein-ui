/**
 * Type-level contract for ButtonGroup (SPEC.md §3.5, §7.4).
 *
 * ButtonGroup's row in §3.4 is unusual: it constrains its **children**, not
 * itself. `ghost ● · gradient ● · glow — · shimmer — · tilt — · magnet —` means
 * a button in a group may be painted and may not move.
 *
 * That is a runtime constraint, not a type one, and deliberately so: the same
 * `<Button glow>` is legal on its own and downgraded inside a group, so the
 * props cannot be typed away without making Button's type depend on where it is
 * rendered. It is enforced through the §3.2 density scope, and asserted by
 * server-rendering a grouped and an ungrouped button and comparing their classes.
 *
 * What *is* checkable here is that the group itself takes no effect props — it
 * is a layout container and has no surface of its own.
 */
import type { ComponentProps } from 'svelte';
import type ButtonGroup from './button-group.svelte';

type Props = ComponentProps<typeof ButtonGroup>;

const upstream: Props = {};
const vertical: Props = { orientation: 'vertical' };

// @ts-expect-error the group is a layout container with no surface to glow from
const glowing: Props = { glow: true };
// @ts-expect-error likewise for gradient — the children are painted, not the group
const gradient: Props = { gradient: true };
// @ts-expect-error a joined row of buttons is precisely what must not tilt
const tilted: Props = { tilt: true };

export { upstream, vertical, glowing, gradient, tilted };
