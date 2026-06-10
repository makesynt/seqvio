/**
 * Media contract for the renderer.
 *
 * These types and the duration-resolution logic are owned by @seqvio/core —
 * the single source of truth. This module re-exports them so existing renderer
 * imports keep working without maintaining a parallel (and previously drifting)
 * copy of the same definitions.
 */

export type {
  WordTiming,
  CaptionCue,
  NarrationCue,
  AudioTrackKind,
  AudioTrackSpec,
  CompositionAudioManifest,
  RenderableMeta,
} from '@seqvio/core';

export {
  framesToMs,
  msToFrames,
  resolveNarrationCueTimes,
  resolveCompositionDurationFrames,
  getActiveCaption,
} from '@seqvio/core';
