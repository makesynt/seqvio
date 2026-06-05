/**
 * SVG Path Utilities
 */

import { Point, PathInfo } from '../types';
import { textToSvgPathsSync } from './textPath';

export function textToPath(
  text: string,
  fontSize: number = 48,
  _fontWeight: string | number = 'normal'
): PathInfo {
  const result = textToSvgPathsSync(text, {
    fontSize,
    position: { x: 0, y: fontSize },
  });

  if (result) {
    return {
      path: result.pathD,
      length: result.totalLength,
      bounds: result.bounds,
    };
  }

  const width = text.length * fontSize * 0.6;
  const height = fontSize * 1.2;
  return {
    path: `M 0 ${fontSize} L ${width} ${fontSize}`,
    length: width,
    bounds: { x: 0, y: 0, width, height },
  };
}

export function getPointAtLength(
  pathElement: SVGPathElement,
  length: number
): Point {
  const point = pathElement.getPointAtLength(length);
  return { x: point.x, y: point.y };
}

export function getAngleBetweenPoints(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
}

export function getPathLength(pathElement: SVGPathElement): number {
  return pathElement.getTotalLength();
}

export function createArrowPath(from: Point, to: Point): string {
  const headLength = 15;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  const arrowHead1 = {
    x: to.x - headLength * Math.cos(angle - Math.PI / 6),
    y: to.y - headLength * Math.sin(angle - Math.PI / 6),
  };

  const arrowHead2 = {
    x: to.x - headLength * Math.cos(angle + Math.PI / 6),
    y: to.y - headLength * Math.sin(angle + Math.PI / 6),
  };

  return `
    M ${from.x} ${from.y}
    L ${to.x} ${to.y}
    M ${arrowHead1.x} ${arrowHead1.y}
    L ${to.x} ${to.y}
    L ${arrowHead2.x} ${arrowHead2.y}
  `;
}

export function createCirclePath(center: Point, radius: number): string {
  return `
    M ${center.x - radius} ${center.y}
    A ${radius} ${radius} 0 1 0 ${center.x + radius} ${center.y}
    A ${radius} ${radius} 0 1 0 ${center.x - radius} ${center.y}
  `;
}

export function createRoundedRectanglePath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 10
): string {
  const r = Math.min(radius, width / 2, height / 2);
  return `
    M ${x + r} ${y}
    L ${x + width - r} ${y}
    Q ${x + width} ${y} ${x + width} ${y + r}
    L ${x + width} ${y + height - r}
    Q ${x + width} ${y + height} ${x + width - r} ${y + height}
    L ${x + r} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - r}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    Z
  `;
}

export function createRectanglePath(
  x: number,
  y: number,
  width: number,
  height: number,
  roughness: number = 0,
  borderRadius: number = 0
): string {
  if (roughness === 0 && borderRadius > 0) {
    return createRoundedRectanglePath(x, y, width, height, borderRadius);
  }

  if (roughness === 0) {
    return `
      M ${x} ${y}
      L ${x + width} ${y}
      L ${x + width} ${y + height}
      L ${x} ${y + height}
      Z
    `;
  }

  const r = roughness;
  return `
    M ${x + rand(r)} ${y + rand(r)}
    L ${x + width + rand(r)} ${y + rand(r)}
    L ${x + width + rand(r)} ${y + height + rand(r)}
    L ${x + rand(r)} ${y + height + rand(r)}
    Z
  `;
}

export function createUnderlinePath(
  x: number,
  y: number,
  length: number
): string {
  return `M ${x} ${y} L ${x + length} ${y}`;
}

function rand(max: number): number {
  return (Math.random() - 0.5) * max;
}

export function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;

  return path;
}
