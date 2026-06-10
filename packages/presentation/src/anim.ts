/**
 * Small frame-driven animation helper shared by presentation components.
 *
 * Depends only on @seqvio/core for frame state — the whole point of the P0-1
 * decoupling is that a style package needs core and nothing else (no whiteboard,
 * no renderer). This is the proof.
 */

import { useCurrentFrame } from '@seqvio/core';

export type Easing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

const easingFns: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/** Eased 0..1 progress for a window starting at `start` lasting `duration` frames. */
export function useReveal(
  start: number,
  duration: number,
  easing: Easing = 'ease-out'
): number {
  const frame = useCurrentFrame();
  if (duration <= 0) return frame >= start ? 1 : 0;
  const raw = Math.max(0, Math.min(1, (frame - start) / duration));
  return easingFns[easing](raw);
}
