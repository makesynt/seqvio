import React, { CSSProperties } from 'react';
import { useReveal } from './anim';
import { productFonts, productPalette } from './theme';

export interface ProductDemoSceneProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  background?: string;
  style?: CSSProperties;
}

export const ProductDemoScene: React.FC<ProductDemoSceneProps> = ({
  children,
  width = 1280,
  height = 720,
  background = productPalette.canvas,
  style,
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
    {children}
  </div>
);

export interface BrowserFrameProps {
  children?: React.ReactNode;
  position: { x: number; y: number };
  width: number;
  height: number;
  url?: string;
  title?: string;
  start?: number;
  duration?: number;
  style?: CSSProperties;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  position,
  width,
  height,
  url = 'app.seqvio.local',
  title = 'Seqvio Studio',
  start = 0,
  duration = 22,
  style,
}) => {
  const progress = useReveal(start, duration, 'back-out');
  return (
    <div
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
            fontFamily: productFonts.mono,
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
}

export const ScreenshotPlaceholder: React.FC<ScreenshotPlaceholderProps> = ({
  label = 'Product screen',
  start = 18,
  duration = 20,
  style,
}) => {
  const progress = useReveal(start, duration);
  return (
    <div
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
}

export const Callout: React.FC<CalloutProps> = ({
  text,
  position,
  width = 300,
  start = 60,
  duration = 18,
  accent = productPalette.accent,
}) => {
  const progress = useReveal(start, duration, 'back-out');
  return (
    <div
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
}

export const ProductTitle: React.FC<ProductTitleProps> = ({
  title,
  subtitle,
  position,
  start = 0,
}) => {
  const titleProgress = useReveal(start, 22);
  const subtitleProgress = useReveal(start + 18, 22);
  return (
    <div style={{ position: 'absolute', left: position.x, top: position.y }}>
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

