/**
 * DrawIcon — animated reveal of a built-in line icon.
 *
 * Reuses the same stroke-dashoffset reveal as DrawShape (so icons "draw" in like
 * everything else) and the DrawRegistry/single-pen scheduling, but sources its
 * geometry from the icons.ts library instead of generated shape paths. Multiple
 * sub-paths (e.g. the two strokes of an X) reveal in sequence so a multi-stroke
 * icon still reads as one pen motion.
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DrawIconProps } from '../types';
import {
  getAngleOnPath,
  getPointOnPath,
  useOptionalDrawRegistry,
} from '../context/DrawRegistry';
import { useDrawAnimationProgress } from '../hooks/useDrawAnimationProgress';
import { calculateStrokeDashoffset } from '../utils/animationUtils';
import { ICON_PATHS, isIconName } from './icons';
import { useWhiteboardTheme } from '../theme';

const ICON_VIEWBOX = 24;

export const DrawIcon: React.FC<DrawIconProps> = ({
  name,
  position = { x: 100, y: 100 },
  size = 64,
  start = 0,
  duration,
  easing = 'ease-out',
  strokeColor: strokeColorProp,
  strokeWidth: strokeWidthProp,
}) => {
  const theme = useWhiteboardTheme();
  const groupRef = useRef<SVGGElement>(null);
  const [subPathLengths, setSubPathLengths] = useState<number[]>([]);
  const drawId = useId();
  const registry = useOptionalDrawRegistry();

  const strokeColor = strokeColorProp ?? theme.colors.ink;
  // Stroke width is authored in the 24px icon space, so scale it down to keep a
  // consistent visual weight regardless of rendered size.
  const strokeWidth = strokeWidthProp ?? theme.strokeWidthBold ?? 3;
  const scaledStrokeWidth = (strokeWidth * ICON_VIEWBOX) / size;

  const paths = useMemo<string[]>(
    () => (isIconName(name) ? ICON_PATHS[name] : []),
    [name]
  );

  const progress = useDrawAnimationProgress(drawId, start, duration, easing);

  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    setSubPathLengths(
      pathRefs.current.map((el) => (el ? el.getTotalLength() : 0))
    );
  }, [paths, size, position.x, position.y]);

  // Register with the draw registry so the pen follows the icon and single-pen
  // scheduling serializes it with neighbouring drawables.
  useEffect(() => {
    if (!registry) return;
    registry.registerDraw({
      id: drawId,
      start,
      duration,
      easing,
      strokeWidth,
      pathElement: pathRefs.current[0] ?? null,
      getPointAtProgress: (t) => {
        const el = pathRefs.current[0];
        if (el) return getPointOnPath(el, t);
        return position;
      },
      getAngleAtProgress: (t) => {
        const el = pathRefs.current[0];
        if (el) return getAngleOnPath(el, t);
        return 0;
      },
    });
    return () => registry.unregisterDraw(drawId);
  }, [registry, drawId, start, duration, easing, strokeWidth, position.x, position.y]);

  if (paths.length === 0) {
    // Unknown icon name: render nothing rather than throwing, so a bad name in
    // generated IR degrades gracefully.
    return null;
  }

  const scale = size / ICON_VIEWBOX;

  // Distribute the single 0..1 progress across the sub-paths in order, so a
  // multi-stroke icon draws stroke-by-stroke.
  const totalLength = subPathLengths.reduce((sum, len) => sum + len, 0) || 1;
  let consumed = 0;

  return (
    <svg
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
      width="100%"
      height="100%"
    >
      <g
        ref={groupRef}
        transform={`translate(${position.x}, ${position.y}) scale(${scale})`}
      >
        {paths.map((d, index) => {
          const length = subPathLengths[index] ?? 0;
          const segmentStart = consumed / totalLength;
          const segmentEnd = (consumed + length) / totalLength;
          consumed += length;

          const span = Math.max(1e-6, segmentEnd - segmentStart);
          const localProgress = Math.max(
            0,
            Math.min(1, (progress - segmentStart) / span)
          );
          const dashoffset = calculateStrokeDashoffset(localProgress, length);

          return (
            <path
              key={index}
              ref={(el) => {
                pathRefs.current[index] = el;
              }}
              d={d}
              stroke={strokeColor}
              strokeWidth={scaledStrokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={length || undefined}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </g>
    </svg>
  );
};

DrawIcon.displayName = 'DrawIcon';

export default DrawIcon;
