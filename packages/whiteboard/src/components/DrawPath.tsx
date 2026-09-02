import React, { useEffect, useMemo, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";
import {
  getAngleOnPath,
  getPointOnPath,
  useOptionalDrawRegistry,
} from "../context/DrawRegistry";
import { useDrawAnimationProgress } from "../hooks/useDrawAnimationProgress";
import { calculateStrokeDashoffset } from "../utils/animationUtils";
import { resolvePathLength } from "../utils/strokePathUtils";
import {
  hashRoughSeed,
  roughCircle,
  roughPathFromSvg,
  roughRectangle,
  roughSvgLayers,
} from "../utils/roughPath";
import { useWhiteboardTheme } from "../theme";
import { areSerializablePropsEqual } from "../utils/propEquality";
import type { Point, DrawOptions } from "../types";

export interface DrawPathProps extends DrawOptions {
  points: Point[];
  id?: string;
  fillRule?: "nonzero" | "evenodd";
  roughness?: number;
  bowing?: number;
  seed?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  fillStyle?: "solid" | "hachure" | "cross-hatch" | "zigzag";
  opacity?: number;
  roughGeometry?: "rectangle" | "ellipse" | "diamond";
  freehand?: boolean;
}

const DrawPathComponent: React.FC<DrawPathProps> = ({
  points,
  id,
  start = 0,
  duration,
  easing = "ease-out",
  strokeColor: strokeColorProp,
  strokeWidth: strokeWidthProp,
  fillColor = "none",
  fillRule = "nonzero",
  roughness = 0,
  bowing = 1,
  seed,
  strokeStyle = "solid",
  fillStyle = "solid",
  opacity = 1,
  roughGeometry,
  freehand = false,
  annotationId,
}) => {
  const theme = useWhiteboardTheme();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const registry = useOptionalDrawRegistry();
  const strokeColor = strokeColorProp ?? theme.colors.ink;
  const strokeWidth = strokeWidthProp ?? theme.strokeWidth;
  const drawId =
    id ?? `path-${points.map((point) => `${point.x},${point.y}`).join(";")}`;
  const cleanPath = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }, [points]);
  const freehandPath = useMemo(() => {
    if (!freehand || points.length === 0) return "";
    const outline = getStroke(points.map((p) => [p.x, p.y]), {
      size: strokeWidth * 4.25,
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.56,
      easing: (t: number) => Math.sin((t * Math.PI) / 2),
      last: true,
    }) as number[][];
    if (!outline.length) return cleanPath;
    const midpoint = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const parts: Array<string | number[]> = ["M", outline[0], "Q"];
    outline.forEach((point, index) => {
      parts.push(midpoint(point, outline[(index + 1) % outline.length]));
      if (index === outline.length - 1) parts.push("L", outline[0], "Z");
    });
    return parts.map((part) => (Array.isArray(part) ? `${part[0]} ${part[1]}` : part)).join(" ");
  }, [freehand, points, strokeWidth, cleanPath]);
  const path = useMemo(() => {
    if (freehand) return freehandPath;
    if (roughness <= 0) return cleanPath;
    const style = {
      roughness,
      bowing,
      seed: seed ?? hashRoughSeed(drawId),
      stroke: strokeColor,
      strokeWidth,
      strokeStyle,
      fillStyle,
    };
    if (roughGeometry === "rectangle" && points.length >= 4) {
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      return roughRectangle(
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
        style,
      );
    }
    if (roughGeometry === "ellipse" && points.length > 8) {
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      return roughCircle(
        {
          x: (Math.min(...xs) + Math.max(...xs)) / 2,
          y: (Math.min(...ys) + Math.max(...ys)) / 2,
        },
        Math.max(
          Math.max(...xs) - Math.min(...xs),
          Math.max(...ys) - Math.min(...ys),
        ),
        style,
      );
    }
    return roughPathFromSvg(cleanPath, style);
  }, [cleanPath, freehand, freehandPath, roughness, bowing, seed, drawId, roughGeometry, points, strokeColor, strokeWidth, strokeStyle, fillStyle]);
  const bounds = useMemo(() => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return {
      x: xs.length ? Math.min(...xs) : 0,
      y: ys.length ? Math.min(...ys) : 0,
      width: xs.length ? Math.max(...xs) - Math.min(...xs) : 0,
      height: ys.length ? Math.max(...ys) - Math.min(...ys) : 0,
    };
  }, [points]);
  const roughLayers = useMemo(() => {
    if (roughness <= 0) return [];
    return roughSvgLayers(
      roughGeometry === "rectangle"
        ? "rectangle"
        : roughGeometry === "ellipse"
          ? "ellipse"
      : roughGeometry === "diamond"
        ? "diamond"
        : "path",
      cleanPath,
      bounds,
      {
        roughness,
        bowing,
        seed: seed ?? hashRoughSeed(drawId),
        stroke: strokeColor,
        strokeWidth,
        strokeStyle,
        fillStyle,
      },
      fillColor,
    );
  }, [roughness, roughGeometry, cleanPath, bounds, bowing, seed, drawId, strokeColor, strokeWidth, strokeStyle, fillStyle, fillColor]);
  const progress = useDrawAnimationProgress(drawId, start, duration, easing);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [path]);

  useEffect(() => {
    if (!registry || !pathRef.current) return;
    registry.registerDraw({
      id: drawId,
      start,
      duration,
      easing,
      strokeWidth,
      pathElement: pathRef.current,
      getPointAtProgress: (t) =>
        pathRef.current
          ? getPointOnPath(pathRef.current, t)
          : (points[0] ?? { x: 0, y: 0 }),
      getAngleAtProgress: (t) =>
        pathRef.current ? getAngleOnPath(pathRef.current, t) : 0,
    });
    return () => registry.unregisterDraw(drawId);
  }, [registry, drawId, start, duration, easing, strokeWidth, points]);

  const effectivePathLength = resolvePathLength(pathRef.current, pathLength);
  const fillOpacity =
    fillColor === "none" ? 0 : Math.max(0, (progress - 0.8) / 0.2);
  const safeId = drawId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const maskId = `draw-mask-${safeId}`;
  const patternId = `draw-fill-${safeId}`;
  const dashArray =
    strokeStyle === "dashed"
      ? `8 ${8 + strokeWidth}`
      : strokeStyle === "dotted"
        ? `1.5 ${6 + strokeWidth}`
        : undefined;
  const fill = fillColor === "none" ? "none" : fillColor;
  return (
    <svg
      className="seqvio-drawable"
      data-annotation-target={annotationId}
      data-seqvio-draw-start={start}
      data-seqvio-draw-end={start + duration}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      width="100%"
      height="100%"
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
          <path
            d={path}
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={effectivePathLength || undefined}
            strokeDashoffset={calculateStrokeDashoffset(
              progress,
              effectivePathLength,
            )}
          />
        </mask>
      </defs>
      {roughLayers.length > 0 ? roughLayers.map((layer, index) => {
        const isOutline = layer.stroke === strokeColor || fill === "none";
        return (
          <path
            key={`${drawId}-rough-${index}`}
            ref={isOutline && index === roughLayers.findIndex((candidate) => candidate.stroke === layer.stroke) ? pathRef : undefined}
            d={layer.d}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            fill={layer.fill}
            opacity={(isOutline ? 1 : fillOpacity) * Math.max(0, Math.min(1, opacity))}
            strokeLinecap="round"
            strokeLinejoin="round"
            mask={isOutline ? `url(#${maskId})` : undefined}
          />
        );
      }) : fill !== "none" && (
        <path
          d={cleanPath}
          stroke="none"
          fill={fill}
          fillOpacity={fillOpacity * Math.max(0, Math.min(1, opacity))}
          fillRule={fillRule}
        />
      )}
      {roughLayers.length === 0 && <path
        ref={pathRef}
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={freehand ? strokeColor : "none"}
        fillOpacity={freehand ? Math.max(0, Math.min(1, progress)) : 0}
        opacity={Math.max(0, Math.min(1, opacity))}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashArray}
        mask={`url(#${maskId})`}
      />}
    </svg>
  );
};

export const DrawPath = React.memo(
  DrawPathComponent,
  areSerializablePropsEqual,
);
DrawPath.displayName = "DrawPath";
export default DrawPath;
