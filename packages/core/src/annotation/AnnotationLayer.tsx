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

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  | 'spotlight';

export interface AnnotationItem {
  id: string;
  targetId: string;
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
  const annotationKey = annotations
    .map((annotation) => `${annotation.id}:${annotation.targetId}:${annotation.start}:${annotation.duration}`)
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
      for (const annotation of annotations) {
        if (annotationOpacity(frame, annotation.start, annotation.duration) <= 0) continue;
        const rect = registry.getRect(annotation.targetId);
        if (rect) next.set(annotation.id, rect);
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

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      {annotations.map((annotation) => {
        const opacity = annotationOpacity(frame, annotation.start, annotation.duration);
        if (opacity <= 0) return null;
        const rect = rects.get(annotation.id);
        if (!rect) return null;
        return (
          <div
            key={annotation.id}
            data-seqvio-annotation-id={annotation.id}
            data-seqvio-annotation-kind={annotation.kind}
            style={{ display: 'contents' }}
          >
            <AnnotationOverlay
              annotation={annotation}
              rect={rect}
              opacity={opacity}
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
  opacity: number;
}> = ({ annotation, rect, opacity }) => {
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

  if (annotation.kind === 'circle') {
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
