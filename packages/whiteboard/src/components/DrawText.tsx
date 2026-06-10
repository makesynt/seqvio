/**
 * DrawText – Virgil SVG (Latin) or Long Cang / optional light rough CJK when handDrawn.
 */

import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DrawTextProps } from '../types';
import { useOptionalDrawRegistry } from '../context/DrawRegistry';
import { useDrawAnimationProgress } from '../hooks/useDrawAnimationProgress';
import { splitStrokeWashProgress } from '../utils/drawProgress';
import { getTextRevealMetrics } from '../utils/textReveal';
import { pickHandwritingFontFamily } from '../utils/handwritingFontForText';
import {
  hasCjk,
  textToRoughHandPathSync,
  textToSvgPathsSync,
} from '../utils/textPath';
import {
  boundsFromSvgTextElement,
  estimateTextBounds,
  TextBounds,
} from '../utils/textBounds';
import { hashRoughSeed } from '../utils/roughPath';
import { getTextStrokeWidth, useWhiteboardTheme } from '../theme';

export const DrawText: React.FC<DrawTextProps> = ({
  text,
  font: fontProp,
  fontSize = 48,
  fontWeight = 'normal',
  position = { x: 100, y: 100 },
  align = 'left',
  start = 0,
  duration,
  easing = 'ease-out',
  strokeColor: strokeColorProp,
  strokeWidth: strokeWidthProp,
  fillColor: fillColorProp,
  fillDelay = 0.25,
  textRender: textRenderProp,
}) => {
  const theme = useWhiteboardTheme();
  const pathRef = useRef<SVGPathElement>(null);
  const svgTextRef = useRef<SVGTextElement>(null);
  const clipId = useId().replace(/:/g, '');
  const drawId = useId();
  const registry = useOptionalDrawRegistry();
  const progress = useDrawAnimationProgress(drawId, start, duration, easing);

  const strokeColor = strokeColorProp ?? theme.colors.ink;
  const strokeWidth =
    strokeWidthProp ?? getTextStrokeWidth(fontSize, theme);
  const textRender = textRenderProp ?? theme.textRender;

  const textRoughness = theme.textRoughness ?? 0;
  const useLightRoughCjk =
    theme.handDrawn === true && hasCjk(text) && textRoughness > 0;
  const useHandDrawnSvgText = theme.handDrawn === true && !useLightRoughCjk;
  const fontFamily = useHandDrawnSvgText
    ? pickHandwritingFontFamily(text)
    : (fontProp ?? theme.fontFamily);

  // Content-based seed (text + size + position), not drawId — see DrawShape for
  // why tree-position-dependent seeds make hand-drawn output non-deterministic
  // under edits.
  const roughStyle = useMemo(
    () => ({
      roughness: (theme.roughness ?? 1.25) * textRoughness * 0.9,
      bowing: (theme.bowing ?? 1.1) * textRoughness * 0.55,
      seed: hashRoughSeed(`text:${text}:${fontSize}:${position.x}:${position.y}`),
    }),
    [theme.roughness, theme.bowing, textRoughness, text, fontSize, position.x, position.y]
  );

  const useStrokeWash =
    textRender === 'stroke-wash' && fillColorProp === undefined;
  const useSolidFill =
    textRender === 'fill' || fillColorProp !== undefined;
  const useStrokeOutline = textRender === 'stroke' && fillColorProp === undefined;

  const pathSplit = useStrokeWash
    ? splitStrokeWashProgress(progress, fillDelay)
    : null;
  const revealProgress = pathSplit?.stroke ?? progress;
  const washProgress = pathSplit?.wash ?? 0;

  const legacyFillProgress = Math.max(0, (progress - fillDelay) / (1 - fillDelay));
  const washFillProgress = pathSplit ? washProgress : legacyFillProgress;

  const solidFillColor = fillColorProp ?? strokeColor;

  const estimatedBounds = useMemo(
    () => estimateTextBounds(text, fontSize, position, align),
    [text, fontSize, position.x, position.y, align]
  );
  const [svgBounds, setSvgBounds] = useState<TextBounds | null>(
    useHandDrawnSvgText ? estimatedBounds : null
  );

  const textPaths = useMemo(() => {
    if (useLightRoughCjk) {
      return textToRoughHandPathSync(
        text,
        { fontSize, position, align },
        roughStyle
      );
    }
    if (!useHandDrawnSvgText) {
      return textToSvgPathsSync(text, { fontSize, position, align });
    }
    return null;
  }, [
    useLightRoughCjk,
    useHandDrawnSvgText,
    text,
    fontSize,
    position,
    align,
    roughStyle,
  ]);

  useLayoutEffect(() => {
    if (!useHandDrawnSvgText) return;
    setSvgBounds(
      boundsFromSvgTextElement(svgTextRef.current, estimatedBounds)
    );
  }, [
    useHandDrawnSvgText,
    text,
    fontSize,
    position.x,
    position.y,
    align,
    fontWeight,
    fontFamily,
    estimatedBounds,
  ]);

  const bounds =
    useHandDrawnSvgText && svgBounds
      ? svgBounds
      : textPaths?.bounds ?? (useLightRoughCjk ? estimatedBounds : null);
  const revealMetrics =
    bounds != null
      ? getTextRevealMetrics(bounds, revealProgress, position.y)
      : null;

  useEffect(() => {
    if (!registry || bounds == null) return;

    registry.registerDraw({
      id: drawId,
      start,
      duration,
      easing,
      strokeWidth,
      washTailFraction: useStrokeWash ? fillDelay : undefined,
      followPath: false,
      pathElement: useHandDrawnSvgText ? null : pathRef.current,
      getPointAtProgress: (t) =>
        getTextRevealMetrics(bounds, t, position.y).pen,
      getAngleAtProgress: (t) =>
        getTextRevealMetrics(bounds, t, position.y).angleDeg,
    });

    return () => registry.unregisterDraw(drawId);
  }, [
    registry,
    drawId,
    start,
    duration,
    easing,
    strokeWidth,
    fillDelay,
    fillColorProp,
    useStrokeWash,
    useHandDrawnSvgText,
    bounds,
    position.x,
    position.y,
  ]);

  useEffect(() => {
    if (registry && pathRef.current) {
      registry.updateDrawPath(drawId, pathRef.current);
    }
  }, [registry, drawId, textPaths?.pathD]);

  const pathPaint = (() => {
    if (useSolidFill) {
      return {
        fill: solidFillColor,
        fillOpacity: 1,
        stroke: useLightRoughCjk ? strokeColor : ('none' as const),
        strokeWidth: useLightRoughCjk
          ? Math.max(0.75, strokeWidth * 0.28)
          : 0,
      };
    }
    if (useStrokeWash) {
      const shouldWash = washFillProgress > 0;
      return {
        fill: shouldWash ? solidFillColor : ('none' as const),
        fillOpacity: shouldWash ? washFillProgress * theme.textWashOpacity : 0,
        stroke: strokeColor,
        strokeWidth,
      };
    }
    return {
      fill: 'none' as const,
      fillOpacity: 0,
      stroke: strokeColor,
      strokeWidth,
    };
  })();

  const svgTextPaint = useSolidFill
    ? {
        fill: solidFillColor,
        fillOpacity: 1,
        stroke: 'none' as const,
        strokeWidth: 0,
      }
    : {
        fill: 'none' as const,
        fillOpacity: 0,
        stroke: strokeColor,
        strokeWidth,
      };

  if (useHandDrawnSvgText && revealMetrics) {
    const { clip } = revealMetrics;

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
        <defs>
          <clipPath id={clipId}>
            <rect
              x={clip.x}
              y={clip.y}
              width={clip.width}
              height={clip.height}
            />
          </clipPath>
        </defs>
        <text
          ref={svgTextRef}
          x={position.x}
          y={position.y}
          clipPath={`url(#${clipId})`}
          textAnchor={
            align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
          }
          style={{
            fontSize: `${fontSize}px`,
            fontFamily,
            fontWeight,
            fill: svgTextPaint.fill,
            fillOpacity: svgTextPaint.fillOpacity,
            stroke: svgTextPaint.stroke,
            strokeWidth: svgTextPaint.strokeWidth,
            paintOrder: useStrokeOutline ? 'stroke fill' : undefined,
          }}
        >
          {text}
        </text>
      </svg>
    );
  }

  if (textPaths?.pathD && revealMetrics) {
    const { clip } = revealMetrics;

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
        <defs>
          <clipPath id={clipId}>
            <rect
              x={clip.x}
              y={clip.y}
              width={clip.width}
              height={clip.height}
            />
          </clipPath>
        </defs>
        <path
          ref={pathRef}
          d={textPaths.pathD}
          clipPath={`url(#${clipId})`}
          fill={pathPaint.fill}
          fillOpacity={pathPaint.fillOpacity}
          stroke={pathPaint.stroke}
          strokeWidth={pathPaint.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const visibleLength = Math.floor(text.length * revealProgress);
  const visibleText = text.substring(0, visibleLength);

  const fallbackFill = useSolidFill
    ? solidFillColor
    : useStrokeWash && washFillProgress > 0
      ? solidFillColor
      : 'none';
  const fallbackFillOpacity = useSolidFill
    ? 1
    : useStrokeWash
      ? washFillProgress * theme.textWashOpacity
      : 0;
  const fallbackStroke = useStrokeOutline || useStrokeWash ? strokeColor : 'none';
  const fallbackStrokeWidth = useStrokeOutline || useStrokeWash ? strokeWidth : 0;

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
      <text
        x={position.x}
        y={position.y}
        textAnchor={
          align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
        }
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          fontWeight,
          fill: fallbackFill,
          fillOpacity: fallbackFillOpacity,
          stroke: fallbackStroke,
          strokeWidth: fallbackStrokeWidth,
        }}
      >
        {visibleText}
      </text>
    </svg>
  );
};

DrawText.displayName = 'DrawText';

export default DrawText;
