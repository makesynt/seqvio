import React, {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCurrentFrame } from '../frame';
import { resolveSafeLabelPlacement, resolveSafeLabelPlacements, routeConnector, routeGuidedPath, type SafeLabelPlacement } from './routing';

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function sameRect(left: TargetRect, right: TargetRect): boolean {
  return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height;
}

interface AnnotationTargetRegistry {
  register: (id: string, node: Element | null) => void;
  getRect: (id: string) => TargetRect | undefined;
  /** Subscribe to target map changes; returns unsubscribe. */
  subscribe: (listener: () => void) => () => void;
  getContainer: () => HTMLElement | null;
}

const AnnotationTargetContext = createContext<AnnotationTargetRegistry | null>(null);

export function useAnnotationTargetRegistry(): AnnotationTargetRegistry | null {
  return useContext(AnnotationTargetContext);
}

export interface AnnotationProviderProps {
  children: React.ReactNode;
}

/**
 * Stable registry: target nodes live in a ref so register() does not recreate
 * context value identity (which previously caused max-update-depth loops).
 *
 * Targets may also be discovered via `[data-annotation-target]` anywhere under
 * the provider — so whiteboard SVG drawables and product chrome can participate
 * without wrapping HTML divs around SVG trees.
 */
export const AnnotationProvider: React.FC<AnnotationProviderProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetsRef = useRef(new Map<string, Element>());
  const listenersRef = useRef(new Set<() => void>());

  const registry = useMemo<AnnotationTargetRegistry>(
    () => ({
      register: (id: string, node: Element | null) => {
        const prev = targetsRef.current.get(id) ?? null;
        if (prev === node) return;
        if (node) targetsRef.current.set(id, node);
        else targetsRef.current.delete(id);
        listenersRef.current.forEach((listener) => listener());
      },
      getContainer: () => containerRef.current,
      getRect: (id: string) => {
        const container = containerRef.current;
        if (!container) return undefined;
        const registered = targetsRef.current.get(id);
        const discovered =
          registered ??
          container.querySelector(`[data-annotation-target="${cssEscape(id)}"]`);
        if (!discovered) return undefined;
        const nodeRect = discovered.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
          x: nodeRect.left - containerRect.left,
          y: nodeRect.top - containerRect.top,
          width: nodeRect.width,
          height: nodeRect.height,
        };
      },
      subscribe: (listener: () => void) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    []
  );

  return (
    <AnnotationTargetContext.Provider value={registry}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {children}
      </div>
    </AnnotationTargetContext.Provider>
  );
};

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, '\\$&');
}

export interface AnnotationTargetProps {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  /** Render as SVG group when targeting inside an SVG tree. */
  as?: 'div' | 'g';
}

export const AnnotationTarget: React.FC<AnnotationTargetProps> = ({
  id,
  children,
  style,
  className,
  as = 'div',
}) => {
  const registry = useAnnotationTargetRegistry();
  const ref = useRef<Element | null>(null);

  useLayoutEffect(() => {
    registry?.register(id, ref.current);
    return () => registry?.register(id, null);
  }, [registry, id]);

  if (as === 'g') {
    return (
      <g
        ref={ref as React.RefObject<SVGGElement>}
        data-annotation-target={id}
        className={className}
        style={style}
      >
        {children}
      </g>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      data-annotation-target={id}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
};

export type AnnotationKind =
  | 'arrow'
  | 'circle'
  | 'box'
  | 'underline'
  | 'spotlight'
  | 'focus-ring'
  | 'callout'
  | 'bracket'
  | 'connector'
  | 'region-shade'
  | 'guided-path';

export interface AnnotationItem {
  id: string;
  targetId: string;
  toTargetId?: string;
  pathTargetIds?: string[];
  kind: AnnotationKind;
  start: number;
  duration: number;
  label?: string;
}

export interface AnnotationLayerProps {
  annotations: AnnotationItem[];
}

function annotationOpacity(frame: number, start: number, duration: number): number {
  if (frame < start) return 0;
  if (frame >= start + duration) return 1;
  const t = (frame - start) / Math.max(1, duration);
  return Math.min(1, t * 1.4);
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ annotations }) => {
  const registry = useAnnotationTargetRegistry();
  const frame = useCurrentFrame();
  const readyId = useId();
  const [registryVersion, bump] = useState(0);
  const [rects, setRects] = useState<Map<string, TargetRect>>(() => new Map());
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const annotationKey = annotations
    .map((annotation) => `${annotation.id}:${annotation.targetId}:${annotation.toTargetId ?? ''}:${annotation.pathTargetIds?.join(',') ?? ''}:${annotation.start}:${annotation.duration}`)
    .join('|');

  useLayoutEffect(() => {
    if (!registry) return undefined;
    return registry.subscribe(() => bump((n) => n + 1));
  }, [registry]);

  // Measure only after the requested frame has committed to the DOM. Reading
  // bounds during render observes the previous frame and makes overlays depend
  // on whether frames were requested forward or backward.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const runtime = window as unknown as Record<string, unknown>;
    const key = '__seqvio_annotationReadyById';
    const pending = (runtime[key] as Map<string, Promise<void>> | undefined) ?? new Map();
    runtime[key] = pending;
    return () => {
      pending.delete(readyId);
    };
  }, [readyId]);

  useLayoutEffect(() => {
    let cancelled = false;
    let resolveReady: (() => void) | undefined;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    if (typeof window !== 'undefined') {
      const runtime = window as unknown as Record<string, unknown>;
      const key = '__seqvio_annotationReadyById';
      const pending = (runtime[key] as Map<string, Promise<void>> | undefined) ?? new Map();
      pending.set(readyId, ready);
      runtime[key] = pending;
    }
    if (!registry) {
      setRects(new Map());
      resolveReady?.();
      return;
    }
    const measureHandle = requestAnimationFrame(() => {
      if (cancelled) return;
      const next = new Map<string, TargetRect>();
      const container = registry.getContainer();
      if (container) setCanvasSize({ width: container.clientWidth, height: container.clientHeight });
      for (const annotation of annotations) {
        if (annotationOpacity(frame, annotation.start, annotation.duration) <= 0) continue;
        const rect = registry.getRect(annotation.targetId);
        if (rect) next.set(annotation.id, rect);
        if (annotation.toTargetId) {
          const toRect = registry.getRect(annotation.toTargetId);
          if (toRect) next.set(`${annotation.id}:to`, toRect);
        }
        for (const [index, targetId] of (annotation.pathTargetIds ?? []).entries()) {
          const pathRect = registry.getRect(targetId);
          if (pathRect) next.set(`${annotation.id}:path:${index}`, pathRect);
        }
      }
      setRects(next);
      resolveReady?.();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(measureHandle);
      resolveReady?.();
    };
  }, [registry, registryVersion, frame, annotationKey, readyId]);

  if (!registry) return null;

  const measuredTargets = [...rects.entries()]
    .filter(([id]) => !id.includes(':to') && !id.includes(':path:'))
    .map(([, rect]) => rect)
    .filter((rect, index, all) => all.findIndex((candidate) => candidate.x === rect.x && candidate.y === rect.y && candidate.width === rect.width && candidate.height === rect.height) === index);
  const labelPlacements = resolveSafeLabelPlacements(
    annotations.filter((annotation) => annotation.kind === 'callout' && annotation.label && rects.has(annotation.id)).map((annotation) => ({
      id: annotation.id,
      target: rects.get(annotation.id)!,
      width: 180,
      height: 38,
    })),
    canvasSize.width,
    canvasSize.height,
    measuredTargets,
    72,
  );
  const labelPlacementMap = new Map(labelPlacements.map((placement) => [placement.id, placement]));
  const routeObstacles: TargetRect[] = [...measuredTargets, ...labelPlacements];

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      {annotations.map((annotation) => {
        const opacity = annotationOpacity(frame, annotation.start, annotation.duration);
        if (opacity <= 0) return null;
        const rect = rects.get(annotation.id);
        if (!rect) return <span key={annotation.id} data-seqvio-annotation-id={annotation.id} data-seqvio-annotation-target-id={annotation.targetId} data-seqvio-annotation-target-resolved="false" style={{ display: 'none' }} />;
        return (
          <div
            key={annotation.id}
            data-seqvio-annotation-id={annotation.id}
            data-seqvio-annotation-kind={annotation.kind}
            data-seqvio-annotation-target-id={annotation.targetId}
            data-seqvio-annotation-target-resolved="true"
            style={{ display: 'contents' }}
          >
            <AnnotationOverlay
              annotation={annotation}
              rect={rect}
              toRect={rects.get(`${annotation.id}:to`)}
              pathRects={(annotation.pathTargetIds ?? []).map((_, index) => rects.get(`${annotation.id}:path:${index}`)).filter((value): value is TargetRect => Boolean(value))}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              opacity={opacity}
              labelPlacement={labelPlacementMap.get(annotation.id)}
              routeObstacles={routeObstacles}
            />
          </div>
        );
      })}
    </div>
  );
};

const AnnotationOverlay: React.FC<{
  annotation: AnnotationItem;
  rect: TargetRect;
  toRect?: TargetRect;
  pathRects: TargetRect[];
  canvasWidth: number;
  canvasHeight: number;
  opacity: number;
  labelPlacement?: SafeLabelPlacement;
  routeObstacles: TargetRect[];
}> = ({ annotation, rect, toRect, pathRects, canvasWidth, canvasHeight, opacity, labelPlacement, routeObstacles }) => {
  const pad = 8;
  const common: React.CSSProperties = {
    position: 'absolute',
    left: rect.x - pad,
    top: rect.y - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    opacity,
    pointerEvents: 'none',
  };

  if (annotation.kind === 'spotlight') {
    return (
      <div
        style={{
          ...common,
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
          borderRadius: 12,
          background: 'transparent',
        }}
      />
    );
  }

  if (annotation.kind === 'circle' || annotation.kind === 'focus-ring') {
    return (
      <div
        style={{
          ...common,
          borderRadius: 999,
          border: '2px solid rgba(56, 189, 248, 0.9)',
          boxShadow: '0 0 24px rgba(56, 189, 248, 0.35)',
        }}
      />
    );
  }

  if (annotation.kind === 'underline') {
    return (
      <div
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y + rect.height + 4,
          width: rect.width,
          height: 3,
          background: '#38bdf8',
          opacity,
        }}
      />
    );
  }

  if (annotation.kind === 'region-shade') {
    return <div style={{ ...common, borderRadius: 8, background: 'rgba(56, 189, 248, 0.16)', border: '1px solid rgba(125, 211, 252, 0.55)' }} />;
  }

  if (annotation.kind === 'bracket') {
    return (
      <div style={{ ...common, width: 16, borderLeft: '3px solid #38bdf8', borderTop: '3px solid #38bdf8', borderBottom: '3px solid #38bdf8' }}>
        {annotation.label ? <div style={{ position: 'absolute', left: 18, top: '40%', color: '#7dd3fc', fontSize: 13, whiteSpace: 'nowrap' }}>{annotation.label}</div> : null}
      </div>
    );
  }

  if (annotation.kind === 'callout') {
    const label = labelPlacement ?? resolveSafeLabelPlacement(rect, 180, 38, canvasWidth, canvasHeight, [rect], 72);
    const route = routeConnector(rect, label, canvasWidth, canvasHeight, 24, routeObstacles.filter((obstacle) => !sameRect(obstacle, rect) && !sameRect(obstacle, label)));
    return (
      <><svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}><polyline points={route.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinejoin="round" /></svg><div style={{ position: 'absolute', left: label.x, top: label.y, width: label.width, minHeight: label.height, padding: '8px 10px', boxSizing: 'border-box', borderRadius: 7, background: '#e2e8f0', color: '#0f172a', fontSize: 13, fontWeight: 650, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.28)', opacity }}>{annotation.label ?? 'Note'}</div></>
    );
  }

  if (annotation.kind === 'connector' && toRect) {
    const points = routeConnector(rect, toRect, canvasWidth, canvasHeight, 24, routeObstacles.filter((obstacle) => !sameRect(obstacle, rect) && !sameRect(obstacle, toRect)));
    const middle = points[Math.floor(points.length / 2)];
    return (
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, overflow: 'visible' }}>
        <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.length ? <><circle cx={points[0].x} cy={points[0].y} r="4" fill="#38bdf8" /><circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#38bdf8" /></> : null}
        {annotation.label && middle ? <text x={middle.x} y={Math.max(18, middle.y - 8)} fill="#7dd3fc" fontSize="13" textAnchor="middle">{annotation.label}</text> : null}
      </svg>
    );
  }

  if (annotation.kind === 'guided-path' && pathRects.length >= 2) {
    const points = routeGuidedPath(pathRects, canvasWidth, canvasHeight, 24, routeObstacles.filter((obstacle) => !pathRects.includes(obstacle)));
    return <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, overflow: 'visible' }}><polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="8 7" strokeLinecap="round" strokeLinejoin="round" />{points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r={index === points.length - 1 ? 6 : 3} fill="#fbbf24" />)}</svg>;
  }

  if (annotation.kind === 'arrow') {
    return (
      <div style={{ ...common, border: 'none' }}>
        <div
          style={{
            position: 'absolute',
            right: -28,
            top: rect.height / 2,
            width: 28,
            height: 2,
            background: '#38bdf8',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -34,
            top: rect.height / 2 - 5,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '10px solid #38bdf8',
          }}
        />
        {annotation.label ? (
          <div
            style={{
              position: 'absolute',
              right: -12,
              top: -28,
              fontSize: 13,
              color: '#7dd3fc',
              whiteSpace: 'nowrap',
            }}
          >
            {annotation.label}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      style={{
        ...common,
        borderRadius: 10,
        border: '2px solid rgba(56, 189, 248, 0.85)',
        background: 'rgba(56, 189, 248, 0.08)',
      }}
    >
      {annotation.label ? (
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: -24,
            fontSize: 13,
            color: '#7dd3fc',
            whiteSpace: 'nowrap',
          }}
        >
          {annotation.label}
        </div>
      ) : null}
    </div>
  );
};
