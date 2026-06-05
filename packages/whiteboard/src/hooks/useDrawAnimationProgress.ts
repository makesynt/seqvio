/**
 * Frame progress for a registered draw, respecting single-pen serialization.
 */

import { useCurrentFrame } from './useCurrentFrame';
import { useOptionalDrawRegistry } from '../context/DrawRegistry';
import { calculateProgress } from '../utils/animationUtils';

export function useDrawAnimationProgress(
  drawId: string,
  start: number,
  duration: number,
  easing: string = 'ease-out'
): number {
  const frame = useCurrentFrame();
  const registry = useOptionalDrawRegistry();
  const effectiveStart = registry?.getEffectiveStart(drawId, start) ?? start;
  return calculateProgress(frame, effectiveStart, duration, easing);
}
