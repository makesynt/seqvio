/**
 * useCurrentFrame Hook
 *
 * Frame state now lives in @seqvio/core (style-agnostic infrastructure).
 * These re-exports preserve the existing @seqvio/whiteboard public API while
 * the single source of truth is core. See packages/core/src/frame.ts.
 */

export {
  useCurrentFrame,
  useFPS,
  setGlobalFrame,
  getGlobalFrame,
} from '@seqvio/core';
