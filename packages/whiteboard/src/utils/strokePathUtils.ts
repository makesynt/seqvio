/**
 * Stroke path geometry – align pen tip with visible stroke-dash head (round caps).
 */

import { Point } from '../types';

export function resolvePathLength(
  pathElement: SVGPathElement | null,
  fallback = 0
): number {
  if (!pathElement) return fallback;
  const length = pathElement.getTotalLength();
  return length > 0 ? length : fallback;
}

/**
 * Point and tangent angle at the visible stroke head for dashoffset animation.
 * Offsets slightly along the tangent so the nib meets the round line cap.
 */
export function getStrokeHeadOnPath(
  pathElement: SVGPathElement,
  progress: number,
  strokeWidth = 2
): { point: Point; angleDeg: number } {
  const length = pathElement.getTotalLength();
  if (length <= 0) {
    return { point: { x: 0, y: 0 }, angleDeg: 0 };
  }

  const t = Math.max(0, Math.min(1, progress));
  const headDist = Math.min(length, t * length);
  const point = pathElement.getPointAtLength(headDist);

  const delta = Math.max(0.5, length * 0.008);
  const pBefore = pathElement.getPointAtLength(Math.max(0, headDist - delta));
  const pAfter = pathElement.getPointAtLength(Math.min(length, headDist + delta));
  const angleRad = Math.atan2(pAfter.y - pBefore.y, pAfter.x - pBefore.x);

  const capOffset = Math.min(strokeWidth * 0.35, delta * 2);
  const tipX = point.x + Math.cos(angleRad) * capOffset;
  const tipY = point.y + Math.sin(angleRad) * capOffset;

  return {
    point: { x: tipX, y: tipY },
    angleDeg: (angleRad * 180) / Math.PI,
  };
}

export function lerpAngleDegrees(
  current: number,
  target: number,
  factor: number
): number {
  let delta = target - current;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return current + delta * factor;
}
