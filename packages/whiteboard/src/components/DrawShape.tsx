/**
 * DrawShape Component – SVG stroke animation with optional roughjs hand-drawn paths
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DrawShapeProps } from '../types';
import {
  getAngleOnPath,
  getPointOnPath,
  useOptionalDrawRegistry,
} from '../context/DrawRegistry';
import { useDrawAnimationProgress } from '../hooks/useDrawAnimationProgress';
import { calculateStrokeDashoffset } from '../utils/animationUtils';
import { resolvePathLength } from '../utils/strokePathUtils';
import {
  createArrowPath,
  createCirclePath,
  createRectanglePath,
  createRoundedRectanglePath,
  createUnderlinePath,
} from '../utils/pathUtils';
import {
  hashRoughSeed,
  roughArrow,
  roughCircle,
  roughLine,
  roughRectangle,
  roughRoundedRectangle,
  roughStarPath,
  roughUnderline,
} from '../utils/roughPath';
import { useWhiteboardTheme } from '../theme';

function createStarPath(center: { x: number; y: number }, size: number): string {
  const points = 5;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  let starPath = '';

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    starPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  return `${starPath} Z`;
}

function isRectType(type: DrawShapeProps['type']): boolean {
  return type === 'rectangle' || type === 'rounded-rectangle';
}

export const DrawShape: React.FC<DrawShapeProps> = ({
  type,
  position = { x: 100, y: 100 },
  size = 100,
  from,
  to,
  start = 0,
  duration,
  easing = 'ease-out',
  strokeColor: strokeColorProp,
  strokeWidth: strokeWidthProp,
  fillColor: fillColorProp,
  fillDelay = 0.3,
  roughness: roughnessProp,
  borderRadius: borderRadiusProp,
}) => {
  const theme = useWhiteboardTheme();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const drawId = useId();
  const registry = useOptionalDrawRegistry();

  const strokeColor = strokeColorProp ?? theme.colors.ink;
  const strokeWidth = strokeWidthProp ?? theme.strokeWidthBold;
  const borderRadius =
    borderRadiusProp ??
    (type === 'rounded-rectangle' ? theme.defaultBorderRadius : 0);

  const handDrawn = theme.handDrawn === true;
  const roughness =
    roughnessProp ?? theme.roughness ?? (handDrawn ? 1.25 : 0);
  const bowing = theme.bowing ?? 1.1;

  const progress = useDrawAnimationProgress(drawId, start, duration, easing);

  const geometryKey = useMemo(
    () =>
      JSON.stringify({
        type,
        position,
        size,
        from,
        to,
        borderRadius,
      }),
    [type, position, size, from, to, borderRadius]
  );

  // Seed the rough generator from the shape's own geometry, NOT from drawId
  // (React useId is tree-position dependent, so inserting an element earlier
  // would silently change the hand-drawn appearance of every later element).
  // Content-based seeding makes a shape's look depend only on the shape itself.
  const roughStyle = useMemo(
    () => ({
      roughness: handDrawn ? Math.max(0.5, roughness) : roughness,
      bowing,
      seed: hashRoughSeed(`shape:${geometryKey}`),
    }),
    [handDrawn, roughness, bowing, geometryKey]
  );

  const path = useMemo(() => {
    if (handDrawn) {
      switch (type) {
        case 'arrow': {
          const a = from ?? position;
          const b = to ?? { x: position.x + 100, y: position.y };
          return roughArrow(a, b, roughStyle);
        }
        case 'circle': {
          const diameter = typeof size === 'number' ? size : size.width;
          return roughCircle(position, diameter, roughStyle);
        }
        case 'rounded-rectangle': {
          const width = typeof size === 'number' ? size : size.width;
          const height = typeof size === 'number' ? size : size.height;
          return roughRoundedRectangle(
            position.x,
            position.y,
            width,
            height,
            borderRadius,
            roughStyle
          );
        }
        case 'rectangle': {
          const width = typeof size === 'number' ? size : size.width;
          const height = typeof size === 'number' ? size : size.height;
          return roughRectangle(
            position.x,
            position.y,
            width,
            height,
            roughStyle
          );
        }
        case 'line': {
          const a = from ?? position;
          const b = to ?? { x: position.x + 100, y: position.y };
          return roughLine(a, b, roughStyle);
        }
        case 'underline': {
          const length = typeof size === 'number' ? size : size.width;
          return roughUnderline(position.x, position.y, length, roughStyle);
        }
        case 'star': {
          const starSize = typeof size === 'number' ? size : size.width;
          return roughStarPath(position, starSize, roughStyle);
        }
        default:
          return '';
      }
    }

    switch (type) {
      case 'arrow':
        if (from && to) return createArrowPath(from, to);
        return createArrowPath(position, { x: position.x + 100, y: position.y });
      case 'circle': {
        const radius = typeof size === 'number' ? size / 2 : size.width / 2;
        return createCirclePath(position, radius);
      }
      case 'rounded-rectangle': {
        const width = typeof size === 'number' ? size : size.width;
        const height = typeof size === 'number' ? size : size.height;
        return createRoundedRectanglePath(
          position.x,
          position.y,
          width,
          height,
          borderRadius
        );
      }
      case 'rectangle': {
        const width = typeof size === 'number' ? size : size.width;
        const height = typeof size === 'number' ? size : size.height;
        return createRectanglePath(
          position.x,
          position.y,
          width,
          height,
          0,
          borderRadius
        );
      }
      case 'line':
        if (from && to) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
        return `M ${position.x} ${position.y} L ${position.x + 100} ${position.y}`;
      case 'underline': {
        const length = typeof size === 'number' ? size : size.width;
        return createUnderlinePath(position.x, position.y, length);
      }
      case 'star':
        return createStarPath(position, typeof size === 'number' ? size : size.width);
      default:
        return '';
    }
  }, [handDrawn, type, position, size, from, to, borderRadius, roughStyle]);

  const useShapeWash =
    fillColorProp === undefined &&
    theme.shapeFillDefault === 'wash' &&
    isRectType(type);
  const resolvedFillColor = fillColorProp ?? (useShapeWash ? theme.shapeWashFill : 'none');

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [path]);

  useEffect(() => {
    if (!registry) return;

    registry.registerDraw({
      id: drawId,
      start,
      duration,
      easing,
      strokeWidth,
      pathElement: pathRef.current,
      getPointAtProgress: (t) => {
        if (pathRef.current) {
          return getPointOnPath(pathRef.current, t);
        }
        return position;
      },
      getAngleAtProgress: (t) => {
        if (pathRef.current) {
          return getAngleOnPath(pathRef.current, t);
        }
        return 0;
      },
    });

    return () => registry.unregisterDraw(drawId);
  }, [registry, drawId, start, duration, easing, strokeWidth, position.x, position.y]);

  useEffect(() => {
    if (registry && pathRef.current) {
      registry.updateDrawPath(drawId, pathRef.current);
    }
  }, [registry, drawId, path, pathLength]);

  const effectivePathLength = resolvePathLength(pathRef.current, pathLength);
  const strokeDashoffset = calculateStrokeDashoffset(progress, effectivePathLength);
  const fillProgress = Math.max(0, (progress - fillDelay) / (1 - fillDelay));
  const shouldFill = resolvedFillColor !== 'none' && fillProgress > 0;
  const fillOpacity = shouldFill
    ? useShapeWash
      ? fillProgress * theme.shapeWashOpacity
      : fillProgress
    : 0;

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'visible',
      }}
      width="100%"
      height="100%"
    >
      <path
        ref={pathRef}
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={shouldFill ? resolvedFillColor : 'none'}
        fillOpacity={fillOpacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={effectivePathLength || undefined}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};

DrawShape.displayName = 'DrawShape';

export default DrawShape;
