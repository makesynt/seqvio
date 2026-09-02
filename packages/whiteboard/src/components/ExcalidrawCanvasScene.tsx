/**
 * Official Excalidraw canvas output with Seqvio-controlled reveal timing.
 *
 * Rendering is delegated to @excalidraw/excalidraw. Seqvio never rebuilds the
 * element geometry; it only composites official prefix canvases over time.
 */
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  exportToCanvas,
  getCommonBounds,
  restore,
} from "@excalidraw/excalidraw";
import { useCurrentFrame } from "../hooks/useCurrentFrame";

export interface ExcalidrawElementTiming {
  id: string;
  start: number;
  duration: number;
  group?: string;
}

export interface ExcalidrawCanvasSceneProps {
  document: Record<string, unknown>;
  timings: ExcalidrawElementTiming[];
  width: number;
  height: number;
  background?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface OfficialLayers {
  canvases: HTMLCanvasElement[];
  elements: any[];
  bounds: [number, number, number, number];
}

const EXCALIDRAW_EXPORT_PADDING = 10;

declare global {
  interface Window {
    __seqvio_excalidrawReadyById?: Map<string, Promise<void>>;
  }
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function absolutePoints(element: any): Array<[number, number]> {
  if (!Array.isArray(element.points)) return [];
  const points = element.points.map(
    (point: number[]) =>
      [
        Number(element.x || 0) + Number(point?.[0] || 0),
        Number(element.y || 0) + Number(point?.[1] || 0),
      ] as [number, number],
  );
  const angle = Number(element.angle || 0);
  if (!angle || points.length === 0) return points;
  const cx = Number(element.x || 0) + Number(element.width || 0) / 2;
  const cy = Number(element.y || 0) + Number(element.height || 0) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(([x, y]: [number, number]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  });
}

function tracePartialPolyline(
  context: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  progress: number,
): void {
  if (points.length < 2) return;
  const lengths = points
    .slice(1)
    .map((point, index) =>
      Math.hypot(point[0] - points[index][0], point[1] - points[index][1]),
    );
  const target =
    lengths.reduce((sum, length) => sum + length, 0) * clamp01(progress);
  let consumed = 0;
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 0; index < lengths.length; index += 1) {
    const segment = lengths[index];
    if (consumed + segment <= target) {
      context.lineTo(points[index + 1][0], points[index + 1][1]);
      consumed += segment;
      continue;
    }
    const local = segment <= 0 ? 1 : clamp01((target - consumed) / segment);
    context.lineTo(
      points[index][0] + (points[index + 1][0] - points[index][0]) * local,
      points[index][1] + (points[index + 1][1] - points[index][1]) * local,
    );
    break;
  }
  context.stroke();
}

function shapeOutline(element: any): Array<[number, number]> {
  const x = Number(element.x || 0);
  const y = Number(element.y || 0);
  const width = Number(element.width || 0);
  const height = Number(element.height || 0);
  if (element.type === "ellipse") {
    return Array.from({ length: 65 }, (_, index) => {
      const angle = (index / 64) * Math.PI * 2;
      return [
        x + width / 2 + (Math.cos(angle) * width) / 2,
        y + height / 2 + (Math.sin(angle) * height) / 2,
      ];
    });
  }
  if (element.type === "diamond") {
    return [
      [x + width / 2, y],
      [x + width, y + height / 2],
      [x + width / 2, y + height],
      [x, y + height / 2],
      [x + width / 2, y],
    ];
  }
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x, y],
  ];
}

function applyRevealMask(
  context: CanvasRenderingContext2D,
  element: any,
  progress: number,
  originX: number,
  originY: number,
): void {
  const p = clamp01(progress);
  context.save();
  context.translate(-originX, -originY);
  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(18, Number(element.strokeWidth || 2) * 8);

  if (["line", "arrow", "freedraw"].includes(element.type)) {
    tracePartialPolyline(context, absolutePoints(element), p);
    if (element.type === "arrow" && p > 0.82) {
      const points = absolutePoints(element);
      const end = points[points.length - 1];
      if (end) {
        context.beginPath();
        context.arc(
          end[0],
          end[1],
          Math.max(28, context.lineWidth * 1.6),
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    }
  } else if (["rectangle", "ellipse", "diamond"].includes(element.type)) {
    tracePartialPolyline(context, shapeOutline(element), Math.min(1, p / 0.78));
    if (p > 0.78) {
      const fillProgress = (p - 0.78) / 0.22;
      context.globalAlpha = fillProgress;
      context.fillRect(
        Number(element.x || 0) - 20,
        Number(element.y || 0) - 20,
        Number(element.width || 0) + 40,
        Number(element.height || 0) + 40,
      );
    }
  } else {
    const [x1, y1, x2, y2] = getCommonBounds([element] as any);
    context.fillRect(
      x1 - 8,
      y1 - 8,
      Math.max(1, (x2 - x1 + 16) * p),
      y2 - y1 + 16,
    );
  }
  context.restore();
}

export const ExcalidrawCanvasScene: React.FC<ExcalidrawCanvasSceneProps> = ({
  document: excalidrawDocument,
  timings,
  width,
  height,
  background,
  className,
  style,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyId = useId();
  const documentJson = useMemo(
    () => JSON.stringify(excalidrawDocument),
    [excalidrawDocument],
  );
  const timingsJson = useMemo(() => JSON.stringify(timings), [timings]);
  const [layers, setLayers] = useState<OfficialLayers | null>(null);

  useEffect(() => {
    let cancelled = false;
    let resolveReady!: () => void;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    window.__seqvio_excalidrawReadyById ??= new Map();
    window.__seqvio_excalidrawReadyById.set(readyId, ready);

    void (async () => {
      try {
        const raw = JSON.parse(documentJson) as any;
        const restored = restore(
          {
            elements: raw.elements ?? [],
            appState: raw.appState ?? {},
            files: raw.files ?? {},
          },
          null,
          null,
          { refreshDimensions: false, repairBindings: true },
        );
        const elements = restored.elements.filter(
          (element: any) => !element.isDeleted,
        );
        const orderedTimings = JSON.parse(
          timingsJson,
        ) as ExcalidrawElementTiming[];
        const groupOrder = new Map<string, number>();
        orderedTimings.forEach((timing) => {
          const key = timing.group ?? timing.id;
          if (!groupOrder.has(key)) groupOrder.set(key, groupOrder.size);
        });
        const timingOrder = new Map(
          orderedTimings.map((timing) => [
            timing.id,
            groupOrder.get(timing.group ?? timing.id)!,
          ]),
        );
        const bounds = getCommonBounds(elements as any) as [
          number,
          number,
          number,
          number,
        ];
        const canvases: HTMLCanvasElement[] = [];
        for (
          let visibleCount = 0;
          visibleCount <= groupOrder.size;
          visibleCount += 1
        ) {
          const stage = elements.map((element: any) => {
            const index = timingOrder.get(element.id);
            return index === undefined || index < visibleCount
              ? element
              : { ...element, opacity: 0 };
          });
          canvases.push(
            await exportToCanvas({
              elements: stage as any,
              appState: {
                ...restored.appState,
                exportBackground: true,
                viewBackgroundColor:
                  background ??
                  restored.appState.viewBackgroundColor ??
                  "#ffffff",
              } as any,
              files: restored.files as any,
              exportPadding: EXCALIDRAW_EXPORT_PADDING,
            }),
          );
        }
        if (!cancelled) setLayers({ canvases, elements, bounds });
      } finally {
        resolveReady();
      }
    })();

    return () => {
      cancelled = true;
      window.__seqvio_excalidrawReadyById?.delete(readyId);
      resolveReady();
    };
  }, [background, documentJson, readyId, timingsJson]);

  useLayoutEffect(() => {
    const output = canvasRef.current;
    if (!output || !layers) return;
    const context = output.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = background ?? "#ffffff";
    context.fillRect(0, 0, width, height);

    const source = layers.canvases[0];
    const scale = Math.min(width / source.width, height / source.height);
    const drawWidth = source.width * scale;
    const drawHeight = source.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    const parsedTimings = JSON.parse(timingsJson) as ExcalidrawElementTiming[];
    const groupKeys = [
      ...new Set(parsedTimings.map((timing) => timing.group ?? timing.id)),
    ];
    const completed = groupKeys.filter((group) => {
      const timing = parsedTimings.find(
        (candidate) => (candidate.group ?? candidate.id) === group,
      )!;
      return frame >= timing.start + timing.duration;
    }).length;
    context.drawImage(
      layers.canvases[Math.min(completed, layers.canvases.length - 1)],
      offsetX,
      offsetY,
      drawWidth,
      drawHeight,
    );

    const activeIndex = parsedTimings.findIndex(
      (timing) =>
        frame >= timing.start && frame < timing.start + timing.duration,
    );
    if (activeIndex < 0) return;
    const timing = parsedTimings[activeIndex];
    const activeGroup = timing.group ?? timing.id;
    const activeGroupMembers = parsedTimings.filter(
      (candidate) => (candidate.group ?? candidate.id) === activeGroup,
    );
    const activeGroupIndex = groupKeys.indexOf(activeGroup);
    if (activeGroupIndex + 1 >= layers.canvases.length) return;
    const progress = clamp01(
      (frame - timing.start) / Math.max(1, timing.duration),
    );
    const temp = document.createElement("canvas");
    temp.width = source.width;
    temp.height = source.height;
    const tempContext = temp.getContext("2d");
    if (!tempContext) return;
    tempContext.drawImage(layers.canvases[activeGroupIndex + 1], 0, 0);
    // Build one union mask so grouped elements reveal together while each
    // shape still preserves its own official outline/hand-drawn geometry.
    const mask = document.createElement("canvas");
    mask.width = source.width;
    mask.height = source.height;
    const maskContext = mask.getContext("2d");
    if (!maskContext) return;
    for (const member of activeGroupMembers) {
      const element = layers.elements.find(
        (candidate) => candidate.id === member.id,
      );
      if (element) {
        applyRevealMask(
          maskContext,
          element,
          progress,
          layers.bounds[0] - EXCALIDRAW_EXPORT_PADDING,
          layers.bounds[1] - EXCALIDRAW_EXPORT_PADDING,
        );
      }
    }
    tempContext.globalCompositeOperation = "destination-in";
    tempContext.drawImage(mask, 0, 0);
    context.drawImage(temp, offsetX, offsetY, drawWidth, drawHeight);
  }, [background, frame, height, layers, timingsJson, width]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-seqvio-excalidraw="official"
      width={width}
      height={height}
      style={{ display: "block", width, height, ...style }}
    />
  );
};

export default ExcalidrawCanvasScene;
