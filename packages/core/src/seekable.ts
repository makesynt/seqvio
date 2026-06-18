/**
 * Seekable animation adapter interface.
 *
 * Allows external animation libraries (GSAP, Lottie, Three.js, CSS animations)
 * to be driven by the Seqvio render clock. On each frame the renderer calls
 * flushSeekables(frame, fps) and every registered adapter is seeked to the
 * corresponding time in seconds.
 */

import { useEffect } from 'react';

export interface SeekableAdapter {
  id: string;
  /** Called once per frame with the current time in seconds and frame index. */
  seek(timeSeconds: number, frame: number): void;
  /**
   * Set to true if the adapter needs an extra rAF after seek before the DOM
   * is ready to capture (e.g. Three.js renderers, Lottie). GSAP is false —
   * it applies properties synchronously.
   */
  requiresRaf?: boolean;
}

const registry = new Map<string, SeekableAdapter>();

export function registerSeekable(adapter: SeekableAdapter): void {
  registry.set(adapter.id, adapter);
}

export function unregisterSeekable(id: string): void {
  registry.delete(id);
}

/**
 * Called by the renderer runtime after timeline.seekToFrame() on every frame.
 * Returns true if any adapter declared requiresRaf, so the runtime can add an
 * extra rAF before screenshotting.
 */
export function flushSeekables(frame: number, fps: number): boolean {
  const timeSeconds = frame / Math.max(1, fps);
  let needsExtraRaf = false;
  for (const adapter of registry.values()) {
    adapter.seek(timeSeconds, frame);
    if (adapter.requiresRaf) needsExtraRaf = true;
  }
  return needsExtraRaf;
}

/**
 * React hook: registers/unregisters a SeekableAdapter for the lifetime of the
 * component. Re-registers when the adapter reference changes.
 */
export function useSeekable(adapter: SeekableAdapter): void {
  useEffect(() => {
    registerSeekable(adapter);
    return () => unregisterSeekable(adapter.id);
  }, [adapter]);
}

/**
 * Convenience helper for GSAP timelines. Wraps a paused GSAP timeline as a
 * SeekableAdapter. GSAP is an optional peer — the caller must have it installed.
 *
 * Usage:
 *   const tl = gsap.timeline({ paused: true }).to(...);
 *   useSeekable(gsapSeekable(tl, 'my-gsap-anim'));
 */
export function gsapSeekable(
  gsapTimeline: { seek(time: number): void },
  id: string
): SeekableAdapter {
  return {
    id,
    seek(timeSeconds) {
      gsapTimeline.seek(timeSeconds);
    },
    requiresRaf: false,
  };
}
