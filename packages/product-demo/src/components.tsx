import React, { CSSProperties } from 'react';
import {
  AnnotationLayer,
  AnnotationProvider,
  type AnnotationItem,
} from '@seqvio/core';
import { useReveal } from './anim';
import { useCurrentFrame } from '@seqvio/core';
import { productFonts, productPalette } from './theme';

export interface ProductDemoSceneProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  background?: string;
  style?: CSSProperties;
  annotations?: AnnotationItem[];
}

export const ProductDemoScene: React.FC<ProductDemoSceneProps> = ({
  children,
  width = 1280,
  height = 720,
  background = productPalette.canvas,
  style,
  annotations = [],
}) => (
  <div
    style={{
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      background,
      color: productPalette.ink,
      fontFamily: productFonts.body,
      ...style,
    }}
  >
    <AnnotationProvider>
      {children}
      {annotations.length > 0 ? <AnnotationLayer annotations={annotations} /> : null}
    </AnnotationProvider>
  </div>
);

export interface BrowserFrameProps {
  children?: React.ReactNode;
  position: { x: number; y: number };
  width: number;
  height: number;
  url?: string;
  title?: string;
  chromeFontFamily?: string;
  start?: number;
  duration?: number;
  style?: CSSProperties;
  annotationId?: string;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  position,
  width,
  height,
  url = 'app.seqvio.local',
  title = 'Seqvio Studio',
  chromeFontFamily = productFonts.mono,
  start = 0,
  duration = 22,
  style,
  annotationId,
}) => {
  const progress = useReveal(start, duration, 'back-out');
  return (
    <div
      data-annotation-target={annotationId}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        height,
        opacity: Math.min(1, progress),
        transform: `translateY(${(1 - progress) * 22}px) scale(${0.96 + progress * 0.04})`,
        border: `1px solid ${productPalette.line}`,
        background: productPalette.surface,
        boxShadow: `0 22px 54px ${productPalette.shadow}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          height: 46,
          borderBottom: `1px solid ${productPalette.line}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          background: '#F8FAFC',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#EF4444' }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#F59E0B' }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#22C55E' }} />
        <div
          style={{
            marginLeft: 12,
            flex: 1,
            height: 25,
            border: `1px solid ${productPalette.line}`,
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontFamily: chromeFontFamily,
            fontSize: 12,
            color: productPalette.muted,
          }}
        >
          {url}
        </div>
        <div style={{ fontSize: 12, color: productPalette.muted }}>{title}</div>
      </div>
      <div style={{ position: 'relative', height: height - 46 }}>{children}</div>
    </div>
  );
};

export interface ScreenshotPlaceholderProps {
  label?: string;
  start?: number;
  duration?: number;
  style?: CSSProperties;
  annotationId?: string;
}

export const ScreenshotPlaceholder: React.FC<ScreenshotPlaceholderProps> = ({
  label = 'Product screen',
  start = 18,
  duration = 20,
  style,
  annotationId,
}) => {
  const progress = useReveal(start, duration);
  return (
    <div
      data-annotation-target={annotationId}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: progress,
        background:
          'linear-gradient(90deg, rgba(37,99,235,0.10) 1px, transparent 1px), linear-gradient(0deg, rgba(37,99,235,0.10) 1px, transparent 1px), #FBFDFF',
        backgroundSize: '40px 40px',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', left: 34, top: 34, fontSize: 30, fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ position: 'absolute', left: 34, top: 92, color: productPalette.muted, fontSize: 18 }}>
        Generated scene preview, screenshot slot, or recorded UI frame.
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 34,
            top: 160 + i * 78,
            width: 420 + i * 80,
            height: 48,
            background: i === 0 ? productPalette.accent : '#E7EEF8',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          right: 42,
          top: 145,
          width: 238,
          height: 255,
          border: `1px solid ${productPalette.line}`,
          background: productPalette.surface,
          padding: 18,
        }}
      >
        <div style={{ fontSize: 14, color: productPalette.muted }}>Status</div>
        <div style={{ marginTop: 20, fontSize: 58, fontWeight: 800, color: productPalette.accent }}>
          92%
        </div>
        <div style={{ marginTop: 8, fontSize: 18 }}>ready to render</div>
      </div>
    </div>
  );
};

export interface CalloutProps {
  text: string;
  position: { x: number; y: number };
  width?: number;
  start?: number;
  duration?: number;
  accent?: string;
  annotationId?: string;
}

export const Callout: React.FC<CalloutProps> = ({
  text,
  position,
  width = 300,
  start = 60,
  duration = 18,
  accent = productPalette.accent,
  annotationId,
}) => {
  const progress = useReveal(start, duration, 'back-out');
  return (
    <div
      data-annotation-target={annotationId}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        opacity: Math.min(1, progress),
        transform: `translateY(${(1 - progress) * 14}px) scale(${0.9 + progress * 0.1})`,
        background: productPalette.ink,
        color: '#FFFFFF',
        padding: '16px 18px',
        fontSize: 18,
        lineHeight: 1.35,
        boxShadow: `0 14px 36px ${productPalette.shadow}`,
        borderTop: `4px solid ${accent}`,
      }}
    >
      {text}
    </div>
  );
};

export interface CursorPathProps {
  points: Array<{ x: number; y: number }>;
  start?: number;
  duration?: number;
  color?: string;
}

export const CursorPath: React.FC<CursorPathProps> = ({
  points,
  start = 45,
  duration = 50,
  color = productPalette.accent,
}) => {
  const progress = useReveal(start, duration);
  if (points.length === 0) return null;
  const maxIndex = Math.min(points.length - 1, Math.floor(progress * (points.length - 1)));
  const current = points[maxIndex];
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1280 720"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="8 10"
        opacity={0.45 * progress}
      />
      <path
        d={`M ${current.x} ${current.y} l 0 28 l 8 -8 l 8 18 l 8 -4 l -8 -18 l 12 0 z`}
        fill={productPalette.ink}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
    </svg>
  );
};

export interface ProductTitleProps {
  title: string;
  subtitle?: string;
  position: { x: number; y: number };
  start?: number;
  annotationId?: string;
}

export const ProductTitle: React.FC<ProductTitleProps> = ({
  title,
  subtitle,
  position,
  start = 0,
  annotationId,
}) => {
  const titleProgress = useReveal(start, 22);
  const subtitleProgress = useReveal(start + 18, 22);
  return (
    <div
      data-annotation-target={annotationId}
      style={{ position: 'absolute', left: position.x, top: position.y }}
    >
      <div
        style={{
          opacity: titleProgress,
          transform: `translateY(${(1 - titleProgress) * 18}px)`,
          fontSize: 58,
          lineHeight: 1.05,
          fontWeight: 850,
          letterSpacing: 0,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: 18,
            maxWidth: 520,
            opacity: subtitleProgress,
            transform: `translateY(${(1 - subtitleProgress) * 14}px)`,
            fontSize: 24,
            lineHeight: 1.35,
            color: productPalette.muted,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

export interface TimedPoint {
  timeMs: number;
  x: number;
  y: number;
}

export interface FocusTarget extends TimedPoint {
  width: number;
  height: number;
  zoom?: number;
  reset?: boolean;
}

export interface ClickMarker extends TimedPoint {}

export interface RecordedBrowserDemoProps {
  src: string;
  recordingWidth: number;
  recordingHeight: number;
  width?: number;
  height?: number;
  fps?: number;
  focusTargets?: FocusTarget[];
  cursorPoints?: TimedPoint[];
  clicks?: ClickMarker[];
  maxZoom?: number;
  focusPadding?: number;
  transitionMs?: number;
  showCursor?: boolean;
  showFocusRing?: boolean;
  background?: string;
  style?: CSSProperties;
}

interface CameraState {
  scale: number;
  centerX: number;
  centerY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function cameraForTarget(
  target: FocusTarget | undefined,
  recordingWidth: number,
  recordingHeight: number,
  outputWidth: number,
  outputHeight: number,
  maxZoom: number,
  padding: number,
): CameraState {
  const baseScale = Math.max(outputWidth / recordingWidth, outputHeight / recordingHeight);
  if (!target || target.reset) {
    return {
      scale: baseScale,
      centerX: recordingWidth / 2,
      centerY: recordingHeight / 2,
    };
  }

  const paddedWidth = Math.max(1, target.width + padding * 2);
  const paddedHeight = Math.max(1, target.height + padding * 2);
  const autoScale = Math.min(outputWidth / paddedWidth, outputHeight / paddedHeight);
  return {
    scale: clamp(target.zoom ?? autoScale, baseScale, maxZoom),
    centerX: target.x + target.width / 2,
    centerY: target.y + target.height / 2,
  };
}

function resolveCamera(
  timeMs: number,
  targets: FocusTarget[],
  recordingWidth: number,
  recordingHeight: number,
  outputWidth: number,
  outputHeight: number,
  maxZoom: number,
  padding: number,
  transitionMs: number,
): CameraState {
  const sorted = [...targets].sort((a, b) => a.timeMs - b.timeMs);
  const base = cameraForTarget(
    undefined,
    recordingWidth,
    recordingHeight,
    outputWidth,
    outputHeight,
    maxZoom,
    padding,
  );
  const nextIndex = sorted.findIndex((target) => target.timeMs > timeMs);
  const currentIndex = nextIndex === -1 ? sorted.length - 1 : nextIndex - 1;
  if (currentIndex < 0) return base;

  const current = sorted[currentIndex];
  const previous = currentIndex > 0 ? sorted[currentIndex - 1] : undefined;
  const from = cameraForTarget(
    previous,
    recordingWidth,
    recordingHeight,
    outputWidth,
    outputHeight,
    maxZoom,
    padding,
  );
  const to = cameraForTarget(
    current,
    recordingWidth,
    recordingHeight,
    outputWidth,
    outputHeight,
    maxZoom,
    padding,
  );
  const progress = smoothstep((timeMs - current.timeMs) / Math.max(1, transitionMs));
  return {
    scale: from.scale + (to.scale - from.scale) * progress,
    centerX: from.centerX + (to.centerX - from.centerX) * progress,
    centerY: from.centerY + (to.centerY - from.centerY) * progress,
  };
}

function interpolatePoint(timeMs: number, points: TimedPoint[]): TimedPoint | undefined {
  if (points.length === 0) return undefined;
  const sorted = [...points].sort((a, b) => a.timeMs - b.timeMs);
  const nextIndex = sorted.findIndex((point) => point.timeMs >= timeMs);
  if (nextIndex <= 0) return sorted[0];
  if (nextIndex === -1) return sorted[sorted.length - 1];
  const from = sorted[nextIndex - 1];
  const to = sorted[nextIndex];
  const progress = smoothstep((timeMs - from.timeMs) / Math.max(1, to.timeMs - from.timeMs));
  return {
    timeMs,
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

export const RecordedBrowserDemo: React.FC<RecordedBrowserDemoProps> = ({
  src,
  recordingWidth,
  recordingHeight,
  width = 1280,
  height = 720,
  fps = 30,
  focusTargets = [],
  cursorPoints = [],
  clicks = [],
  maxZoom = 2.2,
  focusPadding = 110,
  transitionMs = 520,
  showCursor = true,
  showFocusRing = true,
  background = '#0B0F17',
  style,
}) => {
  const frame = useCurrentFrame();
  const timeMs = (frame / Math.max(1, fps)) * 1000;
  const camera = resolveCamera(
    timeMs,
    focusTargets,
    recordingWidth,
    recordingHeight,
    width,
    height,
    maxZoom,
    focusPadding,
    transitionMs,
  );
  const cursor = interpolatePoint(timeMs, cursorPoints);
  const scaledWidth = recordingWidth * camera.scale;
  const scaledHeight = recordingHeight * camera.scale;
  const translateX = clamp(
    width / 2 - camera.centerX * camera.scale,
    Math.min(0, width - scaledWidth),
    Math.max(0, width - scaledWidth),
  );
  const translateY = clamp(
    height / 2 - camera.centerY * camera.scale,
    Math.min(0, height - scaledHeight),
    Math.max(0, height - scaledHeight),
  );
  const activeClick = [...clicks]
    .reverse()
    .find((click) => timeMs >= click.timeMs && timeMs - click.timeMs <= 420);
  const clickProgress = activeClick ? (timeMs - activeClick.timeMs) / 420 : 0;

  const transformPoint = (point: { x: number; y: number }) => ({
    x: point.x * camera.scale + translateX,
    y: point.y * camera.scale + translateY,
  });
  const renderedCursor = cursor ? transformPoint(cursor) : undefined;
  const renderedClick = activeClick ? transformPoint(activeClick) : undefined;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background,
        ...style,
      }}
    >
      <video
        data-seqvio-seekable-media="true"
        src={src}
        muted
        preload="auto"
        playsInline
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: recordingWidth,
          height: recordingHeight,
          objectFit: 'fill',
          transformOrigin: '0 0',
          transform: `translate(${translateX}px, ${translateY}px) scale(${camera.scale})`,
          willChange: 'transform',
        }}
      />
      {showFocusRing && renderedClick ? (
        <div
          style={{
            position: 'absolute',
            left: renderedClick.x,
            top: renderedClick.y,
            width: 26 + clickProgress * 44,
            height: 26 + clickProgress * 44,
            borderRadius: '50%',
            border: `3px solid rgba(59, 130, 246, ${1 - clickProgress})`,
            transform: 'translate(-50%, -50%)',
            opacity: 1 - clickProgress,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      {showCursor && renderedCursor ? (
        <div
          style={{
            position: 'absolute',
            left: renderedCursor.x,
            top: renderedCursor.y,
            width: 23,
            height: 30,
            background: '#FFFFFF',
            clipPath: 'polygon(0 0, 0 83%, 24% 64%, 40% 100%, 58% 91%, 42% 58%, 75% 58%)',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.65))',
            transform: 'translate(-2px, -2px)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
};
