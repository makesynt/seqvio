/**
 * Frame progress for a registered draw, respecting single-pen serialization.
 */

import { useCallback } from 'react';
import { useFrameValue } from './useCurrentFrame';
import { useOptionalDrawRegistry } from '../context/DrawRegistry';
import { calculateProgress } from '../utils/animationUtils';

type ProgressSelection = number | { frame: number; progress: number };

function shouldUseOptimizedProgress(): boolean {
  if (typeof window === 'undefined') return false;
  const mode = (window as unknown as { __seqvio_whiteboardOptimize?: string })
    .__seqvio_whiteboardOptimize;
  return mode === 'react-static' || mode === 'bitmap-layer';
}

export function useDrawAnimationProgress(
  drawId: string,
  start: number,
  duration: number,
  easing: string = 'ease-out'
): number {
  const registry = useOptionalDrawRegistry();
  const optimized = shouldUseOptimizedProgress();
  const selector = useCallback(
    (frame: number): ProgressSelection => {
      const effectiveStart = registry?.getEffectiveStart(drawId, start) ?? start;
      const progress = calculateProgress(frame, effectiveStart, duration, easing);
      return optimized ? progress : { frame, progress };
    },
    [registry, drawId, start, duration, easing, optimized]
  );

  const progress = useFrameValue(
    selector,
    useCallback(
      (left: ProgressSelection, right: ProgressSelection) =>
        optimized ? Object.is(left, right) : false,
      [optimized]
    )
  );

  return typeof progress === 'number' ? progress : progress.progress;
}
