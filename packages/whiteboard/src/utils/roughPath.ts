/**
 * Excalidraw-style hand-drawn paths via roughjs (seeded for stable video frames).
 */

import { RoughGenerator } from 'roughjs/bin/generator';
import type { Options } from 'roughjs/bin/core';
import { Point } from '../types';
import {
  createArrowPath,
  createRoundedRectanglePath,
  createUnderlinePath,
} from './pathUtils';

let generator: RoughGenerator | null = null;

function getGenerator(): RoughGenerator {
  if (!generator) {
    generator = new RoughGenerator();
  }
  return generator;
}

export interface RoughStyle {
  roughness: number;
  bowing: number;
  seed: number;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  fillStyle?: 'solid' | 'hachure' | 'cross-hatch' | 'zigzag';
}

export function hashRoughSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2_147_483_647 || 1;
}

function roughOptions(style: RoughStyle, fill?: string): Options {
  const strokeWidth = style.strokeWidth ?? 1;
  return {
    roughness: style.roughness,
    bowing: style.bowing,
    seed: style.seed,
    stroke: style.stroke ?? '#000',
    strokeWidth: style.strokeStyle && style.strokeStyle !== 'solid' ? strokeWidth + 0.5 : strokeWidth,
    strokeLineDash:
      style.strokeStyle === 'dashed'
        ? [strokeWidth * 8, strokeWidth * 6]
        : style.strokeStyle === 'dotted'
          ? [strokeWidth, strokeWidth * 3]
          : undefined,
    fill: fill && fill !== 'transparent' ? fill : undefined,
    fillStyle: style.fillStyle,
    // Match Excalidraw's shape.ts: non-solid strokes avoid overlaid dashes,
    // while solid strokes retain RoughJS's characteristic multi-stroke.
    disableMultiStroke: style.strokeStyle !== undefined && style.strokeStyle !== 'solid',
    fillWeight: strokeWidth / 2,
    hachureGap: strokeWidth * 4,
    preserveVertices: style.roughness < 1,
  };
}

export interface RoughSvgLayer {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

function drawableToLayers(
  gen: RoughGenerator,
  drawable: ReturnType<RoughGenerator['line']>
): RoughSvgLayer[] {
  return gen.toPaths(drawable).map((path) => ({
    d: path.d,
    stroke: path.stroke,
    strokeWidth: path.strokeWidth,
    fill: path.fill,
  }));
}

export function roughSvgLayers(
  geometry: 'path' | 'rectangle' | 'ellipse' | 'diamond',
  pathD: string,
  bounds: { x: number; y: number; width: number; height: number },
  style: RoughStyle,
  fill?: string,
): RoughSvgLayer[] {
  const gen = getGenerator();
  const options = roughOptions(style, fill);
  const drawable =
    geometry === 'rectangle'
      ? gen.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, options)
      : geometry === 'ellipse'
        ? gen.ellipse(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
            bounds.width,
            bounds.height,
            { ...options, curveFitting: 1 },
          )
        : geometry === 'diamond'
          ? gen.polygon(
              [
                [bounds.x + bounds.width / 2, bounds.y],
                [bounds.x + bounds.width, bounds.y + bounds.height / 2],
                [bounds.x + bounds.width / 2, bounds.y + bounds.height],
                [bounds.x, bounds.y + bounds.height / 2],
              ],
              options,
            )
          : gen.path(pathD, { ...options, preserveVertices: true });
  return drawableToLayers(gen, drawable);
}

function drawableToPathD(gen: RoughGenerator, drawable: ReturnType<RoughGenerator['line']>): string {
  const paths = gen.toPaths(drawable);
  if (paths.length === 0) {
    return '';
  }
  return paths.map((p) => p.d).join(' ');
}

export function roughLine(
  from: Point,
  to: Point,
  style: RoughStyle
): string {
  const gen = getGenerator();
  const drawable = gen.line(from.x, from.y, to.x, to.y, roughOptions(style));
  return drawableToPathD(gen, drawable);
}

export function roughRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  style: RoughStyle
): string {
  const gen = getGenerator();
  const drawable = gen.rectangle(x, y, width, height, roughOptions(style));
  return drawableToPathD(gen, drawable);
}

export function roughCircle(
  center: Point,
  diameter: number,
  style: RoughStyle
): string {
  const gen = getGenerator();
  // roughjs circle(x, y, diameter) takes the CENTER coordinates
  const drawable = gen.circle(center.x, center.y, diameter, roughOptions(style));
  return drawableToPathD(gen, drawable);
}

export function roughPathFromSvg(
  pathD: string,
  style: RoughStyle
): string {
  const gen = getGenerator();
  const drawable = gen.path(pathD, roughOptions(style));
  return drawableToPathD(gen, drawable);
}

export function roughRoundedRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  style: RoughStyle
): string {
  const d = createRoundedRectanglePath(x, y, width, height, radius);
  return roughPathFromSvg(d, style);
}

export function roughArrow(from: Point, to: Point, style: RoughStyle): string {
  return roughPathFromSvg(createArrowPath(from, to), style);
}

export function roughUnderline(
  x: number,
  y: number,
  length: number,
  style: RoughStyle
): string {
  return roughPathFromSvg(createUnderlinePath(x, y, length), style);
}

export function roughStarPath(center: Point, size: number, style: RoughStyle): string {
  const points = 5;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  let d = '';

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  return roughPathFromSvg(`${d} Z`, style);
}
