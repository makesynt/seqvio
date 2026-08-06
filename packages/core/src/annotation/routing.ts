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

export interface LabelPlacementRequest {
  id: string;
  target: TargetRect;
  width: number;
  height: number;
}

export interface PlacedLabel extends SafeLabelPlacement {
  id: string;
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
  obstacles: TargetRect[] = [],
): RoutePoint[] {
  const a = center(from);
  const b = center(to);
  const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const corridorValues = horizontal
    ? [Math.min(from.y, to.y) - 18, Math.max(from.y + from.height, to.y + to.height) + 18, margin, height - margin]
    : [Math.min(from.x, to.x) - 18, Math.max(from.x + from.width, to.x + to.width) + 18, margin, width - margin];
  const routes = [...new Set(corridorValues.map((value) => horizontal
    ? clamp(value, margin, Math.max(margin, height - margin))
    : clamp(value, margin, Math.max(margin, width - margin))))].map((corridor) => {
      const points = horizontal
        ? [a, { x: a.x, y: corridor }, { x: b.x, y: corridor }, b]
        : [a, { x: corridor, y: a.y }, { x: corridor, y: b.y }, b];
      return points.map((point) => ({ x: clamp(point.x, margin, Math.max(margin, width - margin)), y: clamp(point.y, margin, Math.max(margin, height - margin)) }));
    });
  const score = (points: RoutePoint[]) => {
    let hits = 0;
    let length = 0;
    for (let index = 1; index < points.length; index++) {
      const start = points[index - 1];
      const end = points[index];
      length += Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
      hits += obstacles.filter((obstacle) => segmentIntersectsRect(start, end, obstacle, 8)).length;
    }
    return hits * 1_000_000 + length;
  };
  return routes.sort((left, right) => score(left) - score(right))[0] ?? [a, b];
}

function overlaps(a: TargetRect, b: TargetRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function overlapArea(a: TargetRect, b: TargetRect): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function segmentIntersectsRect(start: RoutePoint, end: RoutePoint, rect: TargetRect, padding = 0): boolean {
  const left = rect.x - padding;
  const right = rect.x + rect.width + padding;
  const top = rect.y - padding;
  const bottom = rect.y + rect.height + padding;
  if (start.x === end.x) return start.x >= left && start.x <= right && Math.max(start.y, end.y) >= top && Math.min(start.y, end.y) <= bottom;
  if (start.y === end.y) return start.y >= top && start.y <= bottom && Math.max(start.x, end.x) >= left && Math.min(start.x, end.x) <= right;
  return false;
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

export function resolveSafeLabelPlacements(
  requests: LabelPlacementRequest[],
  canvasWidth: number,
  canvasHeight: number,
  obstacles: TargetRect[] = [],
  margin = 18,
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  for (const request of requests) {
    const { target, width, height } = request;
    const offsets = [0, 1, -1, 2, -2].map((step) => step * (height + 8));
    const raw = offsets.flatMap<SafeLabelPlacement>((offset) => [
      { x: target.x + target.width / 2 - width / 2 + offset, y: target.y - height - 14, width, height, position: 'above' },
      { x: target.x + target.width / 2 - width / 2 + offset, y: target.y + target.height + 14, width, height, position: 'below' },
      { x: target.x + target.width + 14, y: target.y + target.height / 2 - height / 2 + offset, width, height, position: 'right' },
      { x: target.x - width - 14, y: target.y + target.height / 2 - height / 2 + offset, width, height, position: 'left' },
    ]);
    const candidates = raw.map((candidate) => ({
      ...candidate,
      x: clamp(candidate.x, margin, Math.max(margin, canvasWidth - width - margin)),
      y: clamp(candidate.y, margin, Math.max(margin, canvasHeight - height - margin)),
    })).filter((candidate, index, all) => all.findIndex((item) => item.x === candidate.x && item.y === candidate.y) === index);
    const occupied: TargetRect[] = [...obstacles, ...placed];
    const score = (candidate: SafeLabelPlacement) => {
      const collision = occupied.reduce((sum, rect) => sum + overlapArea(candidate, rect), 0);
      const distance = Math.abs(candidate.x + width / 2 - (target.x + target.width / 2)) + Math.abs(candidate.y + height / 2 - (target.y + target.height / 2));
      return collision * 1_000_000 + distance;
    };
    const choice = candidates.sort((left, right) => score(left) - score(right))[0]
      ?? resolveSafeLabelPlacement(target, width, height, canvasWidth, canvasHeight, occupied, margin);
    placed.push({ id: request.id, ...choice });
  }
  return placed;
}

export function routeGuidedPath(rects: TargetRect[], width: number, height: number, margin = 24, obstacles: TargetRect[] = []): RoutePoint[] {
  if (rects.length === 0) return [];
  const points: RoutePoint[] = [center(rects[0])];
  for (let index = 1; index < rects.length; index++) {
    points.push(...routeConnector(rects[index - 1], rects[index], width, height, margin, obstacles).slice(1));
  }
  return points;
}
