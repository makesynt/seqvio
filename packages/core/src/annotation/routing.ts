import type { TargetRect } from './AnnotationLayer';

export interface RoutePoint {
  x: number;
  y: number;
}

export interface SafeLabelPlacement extends RoutePoint {
  width: number;
  height: number;
  position: 'above' | 'below' | 'right' | 'left';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function center(rect: TargetRect): RoutePoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function routeConnector(
  from: TargetRect,
  to: TargetRect,
  width: number,
  height: number,
  margin = 24,
): RoutePoint[] {
  const a = center(from);
  const b = center(to);
  const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const corridor = horizontal
    ? clamp(Math.min(from.y, to.y) - 18, margin, Math.max(margin, height - margin))
    : clamp(Math.min(from.x, to.x) - 18, margin, Math.max(margin, width - margin));
  const points = horizontal
    ? [a, { x: a.x, y: corridor }, { x: b.x, y: corridor }, b]
    : [a, { x: corridor, y: a.y }, { x: corridor, y: b.y }, b];
  return points.map((point) => ({
    x: clamp(point.x, margin, Math.max(margin, width - margin)),
    y: clamp(point.y, margin, Math.max(margin, height - margin)),
  }));
}

function overlaps(a: TargetRect, b: TargetRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function resolveSafeLabelPlacement(
  target: TargetRect,
  labelWidth: number,
  labelHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  occupied: TargetRect[] = [],
  margin = 18,
): SafeLabelPlacement {
  const rawCandidates: SafeLabelPlacement[] = [
    { x: target.x + target.width / 2 - labelWidth / 2, y: target.y - labelHeight - 14, width: labelWidth, height: labelHeight, position: 'above' },
    { x: target.x + target.width / 2 - labelWidth / 2, y: target.y + target.height + 14, width: labelWidth, height: labelHeight, position: 'below' },
    { x: target.x + target.width + 14, y: target.y + target.height / 2 - labelHeight / 2, width: labelWidth, height: labelHeight, position: 'right' },
    { x: target.x - labelWidth - 14, y: target.y + target.height / 2 - labelHeight / 2, width: labelWidth, height: labelHeight, position: 'left' },
  ];
  const inBounds = rawCandidates.filter((candidate) =>
    candidate.x >= margin && candidate.y >= margin &&
    candidate.x + candidate.width <= canvasWidth - margin &&
    candidate.y + candidate.height <= canvasHeight - margin
  );
  const ordered = [...inBounds, ...rawCandidates.filter((candidate) => !inBounds.includes(candidate))];
  const candidates: SafeLabelPlacement[] = ordered.map((candidate) => ({
    ...candidate,
    x: clamp(candidate.x, margin, Math.max(margin, canvasWidth - labelWidth - margin)),
    y: clamp(candidate.y, margin, Math.max(margin, canvasHeight - labelHeight - margin)),
  }));
  return candidates.find((candidate) => !occupied.some((rect) => overlaps(candidate, rect))) ?? candidates[0];
}

export function routeGuidedPath(rects: TargetRect[], width: number, height: number, margin = 24): RoutePoint[] {
  if (rects.length === 0) return [];
  const points: RoutePoint[] = [center(rects[0])];
  for (let index = 1; index < rects.length; index++) {
    points.push(...routeConnector(rects[index - 1], rects[index], width, height, margin).slice(1));
  }
  return points;
}
