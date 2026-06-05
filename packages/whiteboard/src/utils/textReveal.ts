/**
 * Left-to-right clip reveal for text — pen tracks the reveal edge (not outline path length).
 */

import { Point } from '../types';

export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextRevealClip {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextRevealMetrics {
  clip: TextRevealClip;
  pen: Point;
  /** Degrees, slightly tilted like handwriting */
  angleDeg: number;
}

/**
 * Reveal text by expanding a clip rect LTR within glyph bounds.
 * Pen sits on the leading (right) edge at approx. baseline height.
 */
export function getTextRevealMetrics(
  bounds: TextBounds,
  strokeProgress: number,
  baselineY: number
): TextRevealMetrics {
  const t = Math.max(0, Math.min(1, strokeProgress));
  const clipWidth = bounds.width * t;

  return {
    clip: {
      x: bounds.x,
      y: bounds.y,
      width: clipWidth,
      height: bounds.height,
    },
    pen: {
      x: bounds.x + clipWidth,
      y: baselineY,
    },
    angleDeg: -8,
  };
}
