/**
 * Type-level contract for UploadArea (SPEC.md §3.5, §7.4).
 *
 * §3.4 grants glow (drag-over), shimmer (uploading) and tilt. It withholds
 * gradient and magnet.
 */
import type { UploadAreaProps } from './upload-area.svelte';
import { UploadState } from './upload.svelte.js';

const upload = new UploadState();

const basic: UploadAreaProps = { upload };
const restricted: UploadAreaProps = { upload, accept: 'image/*', multiple: false };
const withEffects: UploadAreaProps = { upload, glow: true, shimmer: true,  };
const labelled: UploadAreaProps = { upload, label: 'Belege ablegen', hint: 'PDF, höchstens 5 MB' };

// @ts-expect-error §3.4 grants UploadArea no gradient
const gradient: UploadAreaProps = { upload, gradient: true };
// @ts-expect-error magnet is for isolated CTAs; a dropzone is a surface, not a target to chase
const magnetic: UploadAreaProps = { upload, magnet: true };

export { basic, restricted, withEffects, labelled, gradient, magnetic };
