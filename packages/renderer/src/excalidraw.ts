import * as fs from "fs";
import * as path from "path";

export interface ExcalidrawPoint {
  x: number;
  y: number;
}
export interface ExcalidrawImportOptions {
  width?: number;
  height?: number;
  margin?: number;
  drawSpeed?: number;
  minDuration?: number;
  maxDuration?: number;
}
export interface ImportedElement {
  id: string;
  type: "path" | "text" | "image";
  points?: ExcalidrawPoint[];
  text?: string;
  src?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  font?: string;
  strokeColor: string;
  backgroundColor?: string;
  strokeWidth: number;
  roughness?: number;
  bowing?: number;
  seed?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  fillStyle?: "solid" | "hachure" | "cross-hatch" | "zigzag";
  freehand?: boolean;
  roundness?: number;
  opacity?: number;
  roughGeometry?: "rectangle" | "ellipse" | "diamond";
  start: number;
  duration: number;
  arrowhead?: ExcalidrawPoint[];
  /** Semantic reveal group. Elements in one group appear together. */
  revealGroup?: string;
}
export interface ExcalidrawImportReport {
  input: string;
  imported: number;
  skipped: number;
  warnings: Array<{ elementId?: string; type?: string; message: string }>;
  durationFrames: number;
  canvas: { width: number; height: number; background: string };
}
export interface ExcalidrawSourceDocument {
  type: "excalidraw";
  version: number;
  source?: string;
  elements: any[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
}

const SUPPORTED = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "line",
  "arrow",
  "freedraw",
  "text",
  "image",
]);
const finite = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const color = (value: unknown, fallback = "#1e1e1e") =>
  typeof value === "string" &&
  (/^#[0-9a-f]{3,8}$/i.test(value) || value === "transparent")
    ? value
    : fallback;
const esc = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
const resolveStrokeStyle = (value: unknown): ImportedElement["strokeStyle"] =>
  value === "dashed" || value === "dotted" ? value : "solid";
const resolveFillStyle = (value: unknown): ImportedElement["fillStyle"] =>
  value === "hachure" || value === "cross-hatch" || value === "zigzag"
    ? value
    : "solid";
const fontForFamily = (value: unknown): string => {
  if (value === 2) return "Arial, Helvetica, sans-serif";
  if (value === 3) return "Cascadia Mono, monospace";
  return "Virgil";
};

function boundsOf(elements: any[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const boxes = elements
    .filter((element) => !element.isDeleted && SUPPORTED.has(element.type))
    .map((element) => {
      const points = elementPoints(element);
      if (points.length > 0) {
        const left = Math.min(...points.map((point) => point.x));
        const top = Math.min(...points.map((point) => point.y));
        const right = Math.max(...points.map((point) => point.x));
        const bottom = Math.max(...points.map((point) => point.y));
        return { x: left, y: top, width: right - left, height: bottom - top };
      }
      return {
        x: finite(element.x),
        y: finite(element.y),
        width: Math.abs(finite(element.width)),
        height: Math.abs(finite(element.height)),
      };
    });
  if (boxes.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function rectPath(
  x: number,
  y: number,
  width: number,
  height: number,
): ExcalidrawPoint[] {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
    { x, y },
  ];
}
function ellipsePath(
  x: number,
  y: number,
  width: number,
  height: number,
): ExcalidrawPoint[] {
  return Array.from({ length: 49 }, (_, index) => {
    const theta = (index / 48) * Math.PI * 2;
    return {
      x: x + width / 2 + (Math.cos(theta) * width) / 2,
      y: y + height / 2 + (Math.sin(theta) * height) / 2,
    };
  });
}
function diamondPath(
  x: number,
  y: number,
  width: number,
  height: number,
): ExcalidrawPoint[] {
  return [
    { x: x + width / 2, y },
    { x: x + width, y: y + height / 2 },
    { x: x + width / 2, y: y + height },
    { x, y: y + height / 2 },
    { x: x + width / 2, y },
  ];
}
function elementPoints(element: any): ExcalidrawPoint[] {
  let points: ExcalidrawPoint[] = [];
  if (element.type === "freedraw" && Array.isArray(element.points))
    points = element.points.map((point: any) => ({
      x: element.x + finite(point?.[0]),
      y: element.y + finite(point?.[1]),
    }));
  else if (element.type === "line" || element.type === "arrow")
    points = (
      Array.isArray(element.points)
        ? element.points
        : [
            [0, 0],
            [element.width, element.height],
          ]
    ).map((point: any) => ({
      x: element.x + finite(point?.[0]),
      y: element.y + finite(point?.[1]),
    }));
  else if (element.type === "rectangle")
    points = rectPath(element.x, element.y, element.width, element.height);
  else if (element.type === "ellipse")
    points = ellipsePath(element.x, element.y, element.width, element.height);
  else if (element.type === "diamond")
    points = diamondPath(element.x, element.y, element.width, element.height);
  const angle = finite(element.angle);
  if (!angle || points.length === 0) return points;
  const center = {
    x: finite(element.x) + finite(element.width) / 2,
    y: finite(element.y) + finite(element.height) / 2,
  };
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  });
}
function pathLength(points: ExcalidrawPoint[]): number {
  return points
    .slice(1)
    .reduce(
      (total, point, index) =>
        total +
        Math.hypot(point.x - points[index].x, point.y - points[index].y),
      0,
    );
}

function elementBox(element: any): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const points = elementPoints(element);
  if (points.length > 0) {
    return {
      left: Math.min(...points.map((point) => point.x)),
      top: Math.min(...points.map((point) => point.y)),
      right: Math.max(...points.map((point) => point.x)),
      bottom: Math.max(...points.map((point) => point.y)),
    };
  }
  const x = finite(element.x);
  const y = finite(element.y);
  return {
    left: x,
    top: y,
    right: x + finite(element.width),
    bottom: y + finite(element.height),
  };
}

function boxesOverlap(a: any, b: any): boolean {
  const aa = elementBox(a);
  const bb = elementBox(b);
  const intersection =
    Math.max(0, Math.min(aa.right, bb.right) - Math.max(aa.left, bb.left)) *
    Math.max(0, Math.min(aa.bottom, bb.bottom) - Math.max(aa.top, bb.top));
  const areaA = Math.max(1, (aa.right - aa.left) * (aa.bottom - aa.top));
  const areaB = Math.max(1, (bb.right - bb.left) * (bb.bottom - bb.top));
  return intersection / Math.min(areaA, areaB) >= 0.9;
}

/**
 * Derive a presentation order from Excalidraw relationships without changing
 * the document's z-order. Static files do not contain creation timestamps.
 */
function semanticRevealOrder(
  rawElements: any[],
  imported: ImportedElement[],
): ImportedElement[] {
  const valid = rawElements.filter(
    (element) =>
      !element.isDeleted && imported.some((item) => item.id === element.id),
  );
  const byId = new Map(
    valid.map((element, index) => [element.id, { element, index }]),
  );
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    const root = parent.get(id);
    if (!root || root === id) return root ?? id;
    const next = find(root);
    parent.set(id, next);
    return next;
  };
  const union = (a: string, b: string) => {
    if (!byId.has(a) || !byId.has(b)) return;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  for (const item of valid) parent.set(item.id, item.id);
  for (let i = 0; i < valid.length; i += 1) {
    for (let j = i + 1; j < valid.length; j += 1) {
      const a = valid[i];
      const b = valid[j];
      const decoration =
        (a.type === "line" || b.type === "line") &&
        a.type !== "text" &&
        b.type !== "text" &&
        (a.strokeColor === "transparent" || b.strokeColor === "transparent");
      if (decoration && boxesOverlap(a, b)) union(a.id, b.id);
    }
  }
  const groups = new Map<string, any[]>();
  for (const item of valid) {
    const root = find(item.id);
    const list = groups.get(root) ?? [];
    list.push(item);
    groups.set(root, list);
  }
  const groupEntries = [...groups.entries()].map(([key, items]) => ({
    key,
    items: items.sort((a, b) => {
      const aText = a.type === "text" ? 1 : 0;
      const bText = b.type === "text" ? 1 : 0;
      if (aText !== bText) return aText - bText;
      const aDecor =
        a.type === "line" && a.strokeColor === "transparent" ? -1 : 0;
      const bDecor =
        b.type === "line" && b.strokeColor === "transparent" ? -1 : 0;
      return aDecor - bDecor || byId.get(a.id)!.index - byId.get(b.id)!.index;
    }),
    firstIndex: Math.min(...items.map((item) => byId.get(item.id)!.index)),
  }));
  const groupOf = new Map<string, string>();
  for (const group of groupEntries)
    for (const item of group.items) groupOf.set(item.id, group.key);
  const dependencies = new Map(
    groupEntries.map((group) => [group.key, new Set<string>()]),
  );
  for (const group of groupEntries) {
    for (const item of group.items) {
      if (item.type === "text" && typeof item.containerId === "string") {
        const containerGroup = groupOf.get(item.containerId);
        if (containerGroup && containerGroup !== group.key)
          dependencies.get(group.key)!.add(containerGroup);
      }
      if (item.type !== "arrow") continue;
      const targets = [
        item.startBinding?.elementId,
        item.endBinding?.elementId,
      ].filter((target): target is string => typeof target === "string");
      const startGroup = item.startBinding?.elementId
        ? groupOf.get(item.startBinding.elementId)
        : undefined;
      const endGroup = item.endBinding?.elementId
        ? groupOf.get(item.endBinding.elementId)
        : undefined;
      // A source node must exist before its connector leaves it; the target
      // node is revealed after the connector reaches it.
      if (startGroup && startGroup !== group.key)
        dependencies.get(group.key)!.add(startGroup);
      if (endGroup && endGroup !== group.key)
        dependencies.get(endGroup)!.add(group.key);
      // Imported files often omit bindings for hand-drawn connectors. Infer a
      // dependency from each endpoint's nearest non-connector visual group.
      if (targets.length === 0) {
        const points = elementPoints(item);
        const nearestGroup = (point: ExcalidrawPoint | undefined) => {
          if (!point) return undefined;
          let nearest: { key: string; distance: number } | undefined;
          for (const candidate of groupEntries) {
            if (
              candidate.key === group.key ||
              candidate.items.some((entry) => entry.type === "arrow")
            )
              continue;
            const box = elementBox(candidate.items[0]);
            const dx = Math.max(box.left - point.x, 0, point.x - box.right);
            const dy = Math.max(box.top - point.y, 0, point.y - box.bottom);
            const distance = Math.hypot(dx, dy);
            if (!nearest || distance < nearest.distance)
              nearest = { key: candidate.key, distance };
          }
          return nearest && nearest.distance <= 96 ? nearest.key : undefined;
        };
        const source = nearestGroup(points[0]);
        const target = nearestGroup(points[points.length - 1]);
        if (source && source !== group.key)
          dependencies.get(group.key)!.add(source);
        if (target && target !== group.key)
          dependencies.get(target)!.add(group.key);
      }
    }
  }
  const ordered: typeof groupEntries = [];
  const remaining = new Map(groupEntries.map((group) => [group.key, group]));
  while (remaining.size) {
    const ready = [...remaining.values()]
      .filter((group) =>
        [...dependencies.get(group.key)!].every(
          (dependency) => !remaining.has(dependency),
        ),
      )
      .sort((a, b) => a.firstIndex - b.firstIndex);
    const next =
      ready[0] ??
      [...remaining.values()].sort((a, b) => a.firstIndex - b.firstIndex)[0];
    ordered.push(next);
    remaining.delete(next.key);
  }
  const importedById = new Map(imported.map((item) => [item.id, item]));
  return ordered.flatMap((group, groupIndex) =>
    group.items.map((raw) => ({
      ...importedById.get(raw.id)!,
      revealGroup: `group-${groupIndex}`,
    })),
  );
}

export function importExcalidrawFile(
  inputPath: string,
  options: ExcalidrawImportOptions = {},
): {
  elements: ImportedElement[];
  report: ExcalidrawImportReport;
  document: ExcalidrawSourceDocument;
} {
  const resolved = path.resolve(inputPath);
  if (fs.statSync(resolved).size > 25 * 1024 * 1024)
    throw new Error("Excalidraw import refuses files larger than 25 MB.");
  const raw = JSON.parse(fs.readFileSync(resolved, "utf8")) as any;
  if (!raw || raw.type !== "excalidraw" || !Array.isArray(raw.elements))
    throw new Error(
      'Input must be an Excalidraw JSON file with type="excalidraw" and an elements array.',
    );
  if (raw.elements.length > 1000)
    throw new Error("Excalidraw import refuses more than 1000 elements.");
  const width = options.width ?? 1280;
  const height = options.height ?? 720;
  const margin = options.margin ?? 64;
  const bounds = boundsOf(raw.elements);
  const scale = Math.min(
    (width - margin * 2) / bounds.width,
    (height - margin * 2) / bounds.height,
  );
  const tx = (x: number) => Math.round((x - bounds.x) * scale + margin);
  const ty = (y: number) => Math.round((y - bounds.y) * scale + margin);
  const scalePoints = (points: ExcalidrawPoint[]) =>
    points.map((point) => ({ x: tx(point.x), y: ty(point.y) }));
  const drawSpeed = options.drawSpeed ?? 18;
  const minDuration = options.minDuration ?? 18;
  const maxDuration = options.maxDuration ?? 120;
  if (
    ![width, height, margin, drawSpeed, minDuration, maxDuration].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error("Canvas and timing options must be positive numbers.");
  const warnings: ExcalidrawImportReport["warnings"] = [];
  const imported: ImportedElement[] = [];
  let cursor = 0;
  for (const element of raw.elements) {
    if (element.isDeleted) continue;
    if (!SUPPORTED.has(element.type)) {
      warnings.push({
        elementId: element.id,
        type: element.type,
        message: `Unsupported element type "${element.type}" was skipped.`,
      });
      continue;
    }
    const start = cursor;
    const strokeColor = color(element.strokeColor);
    const strokeWidth = Math.max(1, finite(element.strokeWidth, 2) * scale);
    const opacity = Math.max(
      0,
      Math.min(1, finite(element.opacity, 100) / 100),
    );
    if (element.type === "text") {
      if (finite(element.angle) !== 0)
        warnings.push({
          elementId: element.id,
          type: element.type,
          message:
            "Text rotation is not supported in static import and was flattened.",
        });
      const text = String(element.text ?? "").trim();
      if (!text) {
        warnings.push({
          elementId: element.id,
          type: element.type,
          message: "Empty text was skipped.",
        });
        continue;
      }
      const duration = Math.min(
        maxDuration,
        Math.max(minDuration, text.length * 3),
      );
      imported.push({
        id: element.id,
        type: "text",
        text,
        x: tx(element.x),
        y: ty(element.y + finite(element.fontSize, 24)),
        width: Math.max(1, Math.round(finite(element.width, 1) * scale)),
        fontSize: Math.max(10, finite(element.fontSize, 24) * scale),
        textAlign: ["left", "center", "right"].includes(element.textAlign)
          ? element.textAlign
          : "left",
        lineHeight: Math.max(0.8, finite(element.lineHeight, 1.25)),
        font: fontForFamily(element.fontFamily),
        strokeColor,
        strokeWidth,
        opacity,
        start,
        duration,
      });
      cursor += duration + 16;
      continue;
    }
    if (element.type === "image") {
      if (finite(element.angle) !== 0)
        warnings.push({
          elementId: element.id,
          type: element.type,
          message:
            "Image rotation is not supported in static import and was flattened.",
        });
      const file = raw.files?.[element.fileId];
      if (!file?.dataURL || !String(file.dataURL).startsWith("data:image/")) {
        warnings.push({
          elementId: element.id,
          type: element.type,
          message:
            "Image was skipped because its embedded dataURL is missing or not an image.",
        });
        continue;
      }
      if (String(file.dataURL).length > 10 * 1024 * 1024) {
        warnings.push({
          elementId: element.id,
          type: element.type,
          message: "Image was skipped because its embedded data exceeds 10 MB.",
        });
        continue;
      }
      const duration = 36;
      imported.push({
        id: element.id,
        type: "image",
        src: file.dataURL,
        x: tx(element.x),
        y: ty(element.y),
        width: Math.max(1, Math.round(element.width * scale)),
        height: Math.max(1, Math.round(element.height * scale)),
        strokeColor,
        strokeWidth,
        opacity,
        start,
        duration,
      });
      cursor += duration + 16;
      continue;
    }
    const rawPoints = elementPoints(element);
    if (rawPoints.length > 20000) {
      warnings.push({
        elementId: element.id,
        type: element.type,
        message:
          "Path was skipped because it contains more than 20,000 points.",
      });
      continue;
    }
    const points = scalePoints(rawPoints);
    if (points.length < 2) {
      warnings.push({
        elementId: element.id,
        type: element.type,
        message: "Element has no usable path points and was skipped.",
      });
      continue;
    }
    const duration = Math.min(
      maxDuration,
      Math.max(minDuration, Math.round(pathLength(points) / drawSpeed)),
    );
    const arrowhead =
      element.type === "arrow" && element.endArrowhead
        ? arrowPoints(points)
        : undefined;
    imported.push({
      id: element.id,
      type: "path",
      points,
      arrowhead,
      strokeColor,
      backgroundColor: ["rectangle", "ellipse", "diamond"].includes(
        element.type,
      )
        ? color(element.backgroundColor, "transparent")
        : undefined,
      strokeWidth,
      roughness:
        element.type === "freedraw"
          ? 0
          : Math.min(1.5, Math.max(0, finite(element.roughness, 1))),
      bowing: 1,
      seed: Math.max(1, Math.floor(finite(element.seed, 1))),
      strokeStyle: resolveStrokeStyle(element.strokeStyle),
      fillStyle: resolveFillStyle(element.fillStyle),
      opacity,
      roughGeometry:
        element.type === "rectangle"
          ? "rectangle"
          : element.type === "ellipse"
            ? "ellipse"
            : element.type === "diamond"
              ? "diamond"
              : undefined,
      freehand: element.type === "freedraw",
      roundness: Math.max(0, finite(element.roundness, 0)),
      start,
      duration,
    });
    cursor += duration + 16;
  }
  const semanticElements = semanticRevealOrder(raw.elements, imported);
  let semanticCursor = 0;
  const semanticGroups = new Map<string, ImportedElement[]>();
  for (const element of semanticElements) {
    const key = element.revealGroup ?? element.id;
    const group = semanticGroups.get(key) ?? [];
    group.push(element);
    semanticGroups.set(key, group);
  }
  const groupSchedule = new Map<string, { start: number; duration: number }>();
  for (const [key, group] of semanticGroups) {
    const duration = Math.max(...group.map((item) => item.duration));
    groupSchedule.set(key, { start: semanticCursor, duration });
    semanticCursor += duration + 16;
  }
  const scheduled = semanticElements.map((element) => {
    const schedule = groupSchedule.get(element.revealGroup ?? element.id)!;
    return {
      ...element,
      start: schedule.start,
      duration: schedule.duration,
    };
  });
  const report: ExcalidrawImportReport = {
    input: resolved,
    imported: imported.length,
    skipped: raw.elements.length - imported.length,
    warnings,
    durationFrames: Math.max(1, semanticCursor + 30),
    canvas: {
      width,
      height,
      background: color(raw.appState?.viewBackgroundColor, "#ffffff"),
    },
  };
  const importedIds = new Set(imported.map((element) => element.id));
  const safeFiles = Object.fromEntries(
    Object.entries(raw.files ?? {}).filter(
      ([, file]: [string, any]) =>
        typeof file?.dataURL === "string" &&
        file.dataURL.startsWith("data:image/"),
    ),
  );
  const document: ExcalidrawSourceDocument = {
    type: "excalidraw",
    version: Math.max(2, finite(raw.version, 2)),
    source: typeof raw.source === "string" ? raw.source : undefined,
    elements: raw.elements.filter(
      (element: any) => !element.isDeleted && importedIds.has(element.id),
    ),
    appState: {
      ...(raw.appState ?? {}),
      viewBackgroundColor: report.canvas.background,
    },
    files: safeFiles,
  };
  return { elements: scheduled, report, document };
}

function arrowPoints(points: ExcalidrawPoint[]): ExcalidrawPoint[] | undefined {
  if (points.length < 2) return undefined;
  const end = points[points.length - 1];
  const prev = points[points.length - 2];
  const angle = Math.atan2(end.y - prev.y, end.x - prev.x);
  // Excalidraw's default arrowhead is 25px with a 20° opening. It scales
  // down on short final segments to keep the head from overwhelming the line.
  const segmentLength = Math.hypot(end.x - prev.x, end.y - prev.y);
  const size = Math.min(25, segmentLength * 0.5);
  const wingAngle = (20 * Math.PI) / 180;
  const base = {
    x: end.x - Math.cos(angle) * size,
    y: end.y - Math.sin(angle) * size,
  };
  return [
    end,
    {
      x: base.x + Math.cos(angle + wingAngle) * size,
      y: base.y + Math.sin(angle + wingAngle) * size,
    },
    end,
    {
      x: base.x + Math.cos(angle - wingAngle) * size,
      y: base.y + Math.sin(angle - wingAngle) * size,
    },
  ];
}

export function generateExcalidrawTsx(
  elements: ImportedElement[],
  report: ExcalidrawImportReport,
  document?: ExcalidrawSourceDocument,
): string {
  if (document) {
    const timings = elements.map(({ id, start, duration, revealGroup }) => ({
      id,
      start,
      duration,
      group: revealGroup,
    }));
    return `import React from 'react';\nimport { ExcalidrawCanvasScene } from '@seqvio/whiteboard';\n\nconst document = ${JSON.stringify(document)};\nconst timings = ${JSON.stringify(timings)};\n\nexport default function ExcalidrawImport() {\n  return (\n    <ExcalidrawCanvasScene document={document} timings={timings} width={${report.canvas.width}} height={${report.canvas.height}} background={${JSON.stringify(report.canvas.background)}} />\n  );\n}\n\nexport const meta = { duration: ${report.durationFrames}, fps: 30 };\n`;
  }
  const children = elements
    .map((element) => {
      if (element.type === "text") {
        const lines = (element.text ?? "").split(/\r?\n/);
        const lineDuration = Math.max(
          6,
          Math.floor(element.duration / lines.length),
        );
        const align = element.textAlign ?? "left";
        const x =
          align === "center"
            ? (element.x ?? 0) + (element.width ?? 0) / 2
            : align === "right"
              ? (element.x ?? 0) + (element.width ?? 0)
              : element.x;
        return lines
          .map(
            (line, index) =>
              `      <DrawText text={\`${esc(line)}\`} position={{ x: ${Math.round(x ?? 0)}, y: ${Math.round((element.y ?? 0) + index * (element.fontSize ?? 24) * (element.lineHeight ?? 1.25))} }} align="${align}" font={${JSON.stringify(element.font)}} fontSize={${Math.round(element.fontSize ?? 24)}} strokeColor={${JSON.stringify(element.strokeColor)}} fillColor={${JSON.stringify(element.strokeColor)}} start={${element.start + index * lineDuration}} duration={${lineDuration}} />`,
          )
          .join("\n");
      }
      if (element.type === "image")
        return `      <DrawImage src={\`${esc(element.src ?? "")}\`} position={{ x: ${element.x}, y: ${element.y} }} size={{ width: ${element.width}, height: ${element.height} }} start={${element.start}} duration={${element.duration}} traceMode="full" />`;
      if (
        element.roughGeometry === "rectangle" &&
        (element.points?.length ?? 0) >= 4
      ) {
        const xs = element.points!.map((point) => point.x);
        const ys = element.points!.map((point) => point.y);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const width = Math.max(...xs) - x;
        const height = Math.max(...ys) - y;
        const fill =
          element.backgroundColor && element.backgroundColor !== "transparent"
            ? ` fillColor={${JSON.stringify(element.backgroundColor)}}`
            : "";
        return `      <DrawPath id={${JSON.stringify(element.id)}} points={${JSON.stringify(element.points ?? [])}} start={${element.start}} duration={${element.duration}} strokeColor={${JSON.stringify(element.strokeColor)}} strokeWidth={${element.strokeWidth}}${fill} roughness={${element.roughness ?? 0}} bowing={${element.bowing ?? 1}} seed={${element.seed ?? 1}} roughGeometry="rectangle" strokeStyle="${element.strokeStyle ?? "solid"}" fillStyle="${element.fillStyle ?? "solid"}" opacity={${element.opacity ?? 1}} />`;
      }
      const points = JSON.stringify(element.points ?? []);
      const fill =
        element.backgroundColor && element.backgroundColor !== "transparent"
          ? ` fillColor={${JSON.stringify(element.backgroundColor)}}`
          : "";
      const style = ` roughness={${element.roughness ?? 0}} bowing={${element.bowing ?? 1}} seed={${element.seed ?? 1}} roughGeometry={${JSON.stringify(element.roughGeometry)}} strokeStyle="${element.strokeStyle ?? "solid"}" fillStyle="${element.fillStyle ?? "solid"}" opacity={${element.opacity ?? 1}}${element.freehand ? " freehand" : ""}`;
      const arrow = element.arrowhead
        ? (() => {
            const [tip, left, , right] = element.arrowhead!;
            const arrowStart =
              element.start + Math.max(1, Math.round(element.duration * 0.78));
            const arrowDuration = Math.max(
              8,
              Math.round(element.duration * 0.22),
            );
            const arrowStyle = `strokeColor={${JSON.stringify(element.strokeColor)}} strokeWidth={${element.strokeWidth}} roughness={${Math.min(1, element.roughness ?? 0)}} bowing={${element.bowing ?? 1}} strokeStyle="solid" fillStyle="solid" opacity={${element.opacity ?? 1}}`;
            return `\n      <DrawPath id={${JSON.stringify(`${element.id}-arrowhead-left`)}} points={${JSON.stringify([left, tip])}} start={${arrowStart}} duration={${arrowDuration}} seed={${(element.seed ?? 1) + 7919}} ${arrowStyle} />\n      <DrawPath id={${JSON.stringify(`${element.id}-arrowhead-right`)}} points={${JSON.stringify([tip, right])}} start={${arrowStart}} duration={${arrowDuration}} seed={${(element.seed ?? 1) + 7920}} ${arrowStyle} />`;
          })()
        : "";
      return `      <DrawPath id={${JSON.stringify(element.id)}} points={${points}} start={${element.start}} duration={${element.duration}} strokeColor={${JSON.stringify(element.strokeColor)}} strokeWidth={${element.strokeWidth}}${fill}${style} />${arrow}`;
    })
    .join("\n");
  return `import React from 'react';\nimport { WhiteboardScene, DrawShape, DrawPath, DrawText, DrawImage, excalidrawTheme } from '@seqvio/whiteboard';\n\nexport default function ExcalidrawImport() {\n  return (\n    <WhiteboardScene width={${report.canvas.width}} height={${report.canvas.height}} texture="none" background={${JSON.stringify(report.canvas.background)}} theme={excalidrawTheme} singlePen={false}>\n${children}\n  </WhiteboardScene>\n  );\n}\n\nexport const meta = { duration: ${report.durationFrames}, fps: 30 };\n`;
}
