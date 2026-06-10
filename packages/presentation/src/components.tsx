/**
 * Presentation style components — slide/keynote-style explainers.
 *
 * A deliberately small but real set proving the framework is not whiteboard-only:
 * the same Storyboard IR can target this package instead. Visuals are clean
 * fades/slides (not hand-drawn), but the timing model (start/duration per
 * element, frame-driven) matches whiteboard so compositions compose identically.
 */

import React, { CSSProperties } from 'react';
import { useReveal, type Easing } from './anim';

export interface PresentationSceneProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  background?: string;
  /** Accent color used by titles/bullets unless overridden per element. */
  accent?: string;
  style?: CSSProperties;
}

const DEFAULT_BG = '#0f172a';
const DEFAULT_ACCENT = '#38bdf8';
const DEFAULT_TEXT = '#e2e8f0';

const SceneContext = React.createContext<{ accent: string }>({ accent: DEFAULT_ACCENT });

export const PresentationScene: React.FC<PresentationSceneProps> = ({
  children,
  width = 1280,
  height = 720,
  background = DEFAULT_BG,
  accent = DEFAULT_ACCENT,
  style,
}) => {
  return (
    <SceneContext.Provider value={{ accent }}>
      <div
        style={{
          position: 'relative',
          width,
          height,
          background,
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          ...style,
        }}
      >
        {children}
      </div>
    </SceneContext.Provider>
  );
};

export interface SlideTitleProps {
  text: string;
  position?: { x: number; y: number };
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  start?: number;
  duration?: number;
  easing?: Easing;
}

/** Title that fades in and rises slightly. */
export const SlideTitle: React.FC<SlideTitleProps> = ({
  text,
  position = { x: 640, y: 160 },
  fontSize = 64,
  color,
  align = 'center',
  start = 0,
  duration = 18,
  easing = 'ease-out',
}) => {
  const { accent } = React.useContext(SceneContext);
  const progress = useReveal(start, duration, easing);
  const translate = (1 - progress) * 24;

  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'center' ? 0 : position.x,
        right: align === 'center' ? 0 : undefined,
        top: position.y,
        textAlign: align,
        opacity: progress,
        transform: `translateY(${translate}px)`,
        fontSize,
        fontWeight: 800,
        color: color ?? accent,
        letterSpacing: '-0.02em',
        padding: '0 64px',
      }}
    >
      {text}
    </div>
  );
};

export interface BulletListProps {
  items: string[];
  position?: { x: number; y: number };
  fontSize?: number;
  color?: string;
  /** Frame the first bullet appears. */
  start?: number;
  /** Frames between consecutive bullets. */
  stagger?: number;
  /** Reveal duration per bullet. */
  duration?: number;
  /** CSS line-height multiplier for wrapped bullets. */
  lineHeight?: number;
  /** Max width before text wraps. */
  width?: number;
}

/** Bullets that reveal one after another (staggered). */
export const BulletList: React.FC<BulletListProps> = ({
  items,
  position = { x: 240, y: 300 },
  fontSize = 36,
  color = DEFAULT_TEXT,
  start = 0,
  stagger = 14,
  duration = 16,
  lineHeight = 1.4,
  width = 800,
}) => {
  const { accent } = React.useContext(SceneContext);
  // Normal document flow (not absolute per-bullet) so wrapped multi-line
  // bullets push each other down instead of overlapping.
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {items.map((item, index) => (
        <Bullet
          key={index}
          text={item}
          accent={accent}
          color={color}
          fontSize={fontSize}
          lineHeight={lineHeight}
          start={start + index * stagger}
          duration={duration}
        />
      ))}
    </div>
  );
};

const Bullet: React.FC<{
  text: string;
  accent: string;
  color: string;
  fontSize: number;
  lineHeight: number;
  start: number;
  duration: number;
}> = ({ text, accent, color, fontSize, lineHeight, start, duration }) => {
  const progress = useReveal(start, duration, 'ease-out');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 18,
        opacity: progress,
        transform: `translateX(${(1 - progress) * 20}px)`,
        fontSize,
        lineHeight,
        color,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: accent,
          flexShrink: 0,
          // Nudge the dot down to align with the first text line.
          marginTop: fontSize * 0.35,
        }}
      />
      <span>{text}</span>
    </div>
  );
};

export interface CalloutProps {
  text: string;
  position?: { x: number; y: number };
  width?: number;
  fontSize?: number;
  color?: string;
  background?: string;
  start?: number;
  duration?: number;
}

/** Emphasis box that scales/fades in. */
export const Callout: React.FC<CalloutProps> = ({
  text,
  position = { x: 340, y: 520 },
  width = 600,
  fontSize = 30,
  color = '#0f172a',
  background,
  start = 0,
  duration = 16,
}) => {
  const { accent } = React.useContext(SceneContext);
  const progress = useReveal(start, duration, 'ease-out');
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        opacity: progress,
        transform: `scale(${0.92 + progress * 0.08})`,
        transformOrigin: 'center',
        background: background ?? accent,
        color,
        fontSize,
        fontWeight: 700,
        padding: '18px 28px',
        borderRadius: 16,
        textAlign: 'center',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}
    >
      {text}
    </div>
  );
};
