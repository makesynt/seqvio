/**
 * Scatterbrain 风格组件 —— 便利贴 / 软木板 / 图钉 / 涂鸦。
 *
 * 这是一个与 @seqvio/whiteboard 平行的独立 style package：同一套 Storyboard
 * 时间模型（每元素 start/duration、帧驱动），但视觉走 div/CSS 路线，因此可以
 * 自由使用旋转、渐变、柔和投影、半透明胶带 —— 这些 whiteboard 的 SVG 手绘原语
 * 难以表达、却正是 scatterbrain 灵魂的效果。
 */

import React, { CSSProperties, useRef } from 'react';
import { type Easing } from './anim';
import { useGsapReveal, useGsapTimeline } from './use-gsap';
import {
  palette,
  fonts,
  typeScale,
  stickyColors,
  FONT_FACE_CSS,
  type StickyColor,
} from './theme';

const gsapEaseMap: Record<Easing, string> = {
  linear: 'none',
  'ease-in': 'power1.in',
  'ease-out': 'power1.out',
  'ease-in-out': 'power1.inOut',
  'back-out': 'back.out(1.7)',
};

// ─── 场景容器 ─────────────────────────────────────────────────────────────────

export interface ScatterSceneProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  /** 背景质感：纸桌面 / 软木板 / 暖渐变。 */
  surface?: 'paper' | 'cork' | 'warm';
  style?: CSSProperties;
}

const SceneContext = React.createContext<{ surface: 'paper' | 'cork' | 'warm' }>({
  surface: 'paper',
});

function surfaceBackground(surface: 'paper' | 'cork' | 'warm'): CSSProperties {
  if (surface === 'cork') {
    return {
      background: `radial-gradient(ellipse at 30% 20%, ${palette.cork} 0%, ${palette.corkDeep} 100%)`,
      backgroundColor: palette.cork,
    };
  }
  if (surface === 'warm') {
    return {
      background: `radial-gradient(circle at 20% 25%, rgba(255,224,102,0.35) 0%, transparent 45%),
                   radial-gradient(circle at 80% 70%, rgba(165,216,255,0.30) 0%, transparent 45%),
                   radial-gradient(circle at 60% 15%, rgba(255,201,201,0.25) 0%, transparent 40%),
                   linear-gradient(135deg, ${palette.cream} 0%, ${palette.paper} 100%)`,
      backgroundColor: palette.cream,
    };
  }
  // paper：奶油底 + 极淡网格线，暗示笔记本纸
  return {
    background: `linear-gradient(${palette.cream}, ${palette.cream}),
                 repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(45,42,38,0.05) 39px, rgba(45,42,38,0.05) 40px),
                 repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(45,42,38,0.05) 39px, rgba(45,42,38,0.05) 40px)`,
    backgroundColor: palette.cream,
  };
}

export const ScatterScene: React.FC<ScatterSceneProps> = ({
  children,
  width = 1280,
  height = 720,
  surface = 'paper',
  style,
}) => {
  return (
    <SceneContext.Provider value={{ surface }}>
      <div
        style={{
          position: 'relative',
          width,
          height,
          overflow: 'hidden',
          fontFamily: fonts.body,
          color: palette.ink,
          ...surfaceBackground(surface),
          ...style,
        }}
      >
        {/* 注入 renderer 捆绑的手写 / 中文字体 */}
        <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />
        {children}
        {/* 全局颗粒质感叠加，强化纸/木触感 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.04,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
            zIndex: 9999,
          }}
        />
      </div>
    </SceneContext.Provider>
  );
};

// ─── 便利贴 ───────────────────────────────────────────────────────────────────

export interface StickyNoteProps {
  children?: React.ReactNode;
  /** 顶部标题（可选，display 手写体）。 */
  title?: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  /** 便签颜色（六色之一）。 */
  color?: StickyColor;
  /** 旋转角度（度），便签随意摆放感。默认 0。 */
  rotate?: number;
  /** 顶部装饰：红图钉 / 胶带 / 无。 */
  attach?: 'pin' | 'tape' | 'none';
  /** 图钉颜色（attach='pin' 时生效）。 */
  pinColor?: 'red' | 'blue' | 'green' | 'gold';
  start?: number;
  duration?: number;
  fontSize?: number;
  style?: CSSProperties;
}

const pinColorMap = {
  red: palette.pinRed,
  blue: palette.pinBlue,
  green: palette.pinGreen,
  gold: palette.pinGold,
} as const;

export const StickyNote: React.FC<StickyNoteProps> = ({
  children,
  title,
  position,
  width = 320,
  height,
  color = 'yellow',
  rotate = 0,
  attach = 'pin',
  pinColor = 'red',
  start = 0,
  duration = 16,
  fontSize = typeScale.body,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const sticky = stickyColors[color];
  useGsapTimeline(
    `sticky-${start}-${position.x}-${position.y}`,
    (tl) => {
      const el = ref.current;
      if (!el) return;
      tl.to(el, { opacity: 1, duration: (duration * 0.71) / 30, ease: 'power1.out' }, start / 30);
      tl.to(el, { scale: 1, duration: duration / 30, ease: 'back.out(1.7)' }, start / 30);
    },
    [start, duration, position.x, position.y],
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        height,
        opacity: 0,
        transform: `rotate(${rotate}deg) scale(0.85)`,
        transformOrigin: 'center top',
        background: `linear-gradient(135deg, ${sticky.base} 0%, ${sticky.deep} 100%)`,
        boxShadow: `2px 4px 16px ${palette.shadow}, 0 1px 3px ${palette.shadowDeep}`,
        padding: '28px 30px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* 图钉 */}
      {attach === 'pin' && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            marginLeft: -9,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: `radial-gradient(circle at 32% 30%, ${pinColorMap[pinColor]}, ${palette.pinRedDeep})`,
            boxShadow: `0 2px 5px ${palette.shadowDeep}, inset -2px -2px 4px rgba(0,0,0,0.25)`,
          }}
        />
      )}
      {/* 胶带 */}
      {attach === 'tape' && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            marginLeft: -45,
            width: 90,
            height: 28,
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.35)',
            transform: 'rotate(-2.5deg)',
          }}
        />
      )}

      {title && (
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: typeScale.h2,
            fontWeight: 700,
            lineHeight: 1.05,
            marginBottom: children ? 14 : 0,
            color: palette.ink,
          }}
        >
          {title}
        </div>
      )}
      {children && (
        <div style={{ fontSize, lineHeight: 1.55, color: palette.ink }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── 手写标题 ─────────────────────────────────────────────────────────────────

export interface ScrawlProps {
  text: string;
  position: { x: number; y: number };
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  rotate?: number;
  /** 是否用手写 display 体（true，默认）还是 body 体。 */
  hand?: boolean;
  start?: number;
  duration?: number;
  easing?: Easing;
  width?: number;
}

/** 直接写在背景上的手写大字（封面 / 章节标题）。 */
export const Scrawl: React.FC<ScrawlProps> = ({
  text,
  position,
  fontSize = typeScale.display,
  color = palette.ink,
  align = 'left',
  rotate = 0,
  hand = true,
  start = 0,
  duration = 18,
  easing = 'ease-out',
  width,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useGsapReveal(
    `scrawl-${start}-${position.x}-${position.y}`,
    ref,
    { opacity: 1, y: 0, ease: gsapEaseMap[easing] },
    start,
    duration,
  );
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        textAlign: align,
        opacity: 0,
        transform: `rotate(${rotate}deg) translateY(18px)`,
        transformOrigin: 'left center',
        fontFamily: hand ? fonts.display : fonts.body,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.05,
        color,
      }}
    >
      {text}
    </div>
  );
};

// ─── 图钉列表（错位摆放的便签序列）────────────────────────────────────────────

export interface PinnedListProps {
  items: string[];
  position: { x: number; y: number };
  /** 每项一种便签色，循环使用。 */
  colors?: StickyColor[];
  itemWidth?: number;
  gap?: number;
  start?: number;
  stagger?: number;
  fontSize?: number;
}

/** 一列竖排便签，逐张弹出，交替轻微旋转。 */
export const PinnedList: React.FC<PinnedListProps> = ({
  items,
  position,
  colors = ['yellow', 'blue', 'pink', 'green', 'orange', 'purple'],
  itemWidth = 360,
  gap = 22,
  start = 0,
  stagger = 12,
  fontSize = typeScale.body,
}) => {
  // 每项高度估算固定，错位旋转交替（留足竖向间距，避免便签重叠）
  const ITEM_H = 104;
  return (
    <>
      {items.map((item, i) => {
        const rot = (i % 2 === 0 ? 1 : -1) * (1.5 + (i % 3));
        return (
          <StickyNote
            key={i}
            position={{ x: position.x, y: position.y + i * (ITEM_H + gap) }}
            width={itemWidth}
            color={colors[i % colors.length]}
            rotate={rot}
            attach={i % 2 === 0 ? 'pin' : 'tape'}
            pinColor={(['red', 'blue', 'gold', 'green'] as const)[i % 4]}
            start={start + i * stagger}
            duration={14}
            fontSize={fontSize}
            style={{ padding: '18px 24px' }}
          >
            {item}
          </StickyNote>
        );
      })}
    </>
  );
};

// ─── 涂鸦装饰 ─────────────────────────────────────────────────────────────────

export interface DoodleProps {
  type: 'circle' | 'squiggle' | 'arrow' | 'star' | 'underline';
  position: { x: number; y: number };
  size?: number;
  color?: string;
  rotate?: number;
  start?: number;
  duration?: number;
  /** 描边强度。 */
  opacity?: number;
}

/** 角落 / 强调用的手绘涂鸦标记，SVG path 描边逐渐画出。 */
export const Doodle: React.FC<DoodleProps> = ({
  type,
  position,
  size = 80,
  color = palette.ink,
  rotate = 0,
  start = 0,
  duration = 20,
  opacity = 0.85,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const paths: Record<DoodleProps['type'], string> = {
    circle: 'M 50,8 C 78,8 92,30 92,50 C 92,74 72,92 50,92 C 26,92 8,72 8,50 C 8,28 24,8 50,8',
    squiggle: 'M 6,50 Q 22,20 38,50 T 70,50 T 96,46',
    arrow: 'M 10,30 C 40,30 60,45 78,62 M 78,62 L 60,58 M 78,62 L 72,44',
    star: 'M 50,8 L 61,38 L 92,38 L 67,58 L 77,90 L 50,70 L 23,90 L 33,58 L 8,38 L 39,38 Z',
    underline: 'M 4,28 C 30,18 70,18 96,26 C 72,30 30,30 6,34',
  };
  const len = 400;
  useGsapTimeline(
    `doodle-${start}-${position.x}-${position.y}`,
    (tl) => {
      if (svgRef.current) {
        tl.to(svgRef.current, { opacity, duration: duration / 30, ease: 'power1.out' }, start / 30);
      }
      if (pathRef.current) {
        tl.to(pathRef.current, { strokeDashoffset: 0, duration: duration / 30, ease: 'power1.out' }, start / 30);
      }
    },
    [start, duration, position.x, position.y, opacity],
  );
  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: `rotate(${rotate}deg)`,
        opacity: 0,
        overflow: 'visible',
      }}
    >
      <path
        ref={pathRef}
        d={paths[type]}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len}
      />
    </svg>
  );
};

// ─── 拍立得照片框 ─────────────────────────────────────────────────────────────

export interface PolaroidProps {
  /** 内容区背景（图片占位用纯色 / 渐变）。 */
  fill?: string;
  caption?: string;
  position: { x: number; y: number };
  width?: number;
  rotate?: number;
  start?: number;
  duration?: number;
  children?: React.ReactNode;
}

/** 白边拍立得照片框，底部手写说明。 */
export const Polaroid: React.FC<PolaroidProps> = ({
  fill = '#e9e4d8',
  caption,
  position,
  width = 280,
  rotate = -2,
  start = 0,
  duration = 16,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const innerH = width * 0.75; // 4:3
  useGsapTimeline(
    `polaroid-${start}-${position.x}-${position.y}`,
    (tl) => {
      const el = ref.current;
      if (!el) return;
      tl.to(el, { opacity: 1, duration: (duration * 0.71) / 30, ease: 'power1.out' }, start / 30);
      tl.to(el, { scale: 1, duration: duration / 30, ease: 'back.out(1.7)' }, start / 30);
    },
    [start, duration, position.x, position.y],
  );
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        background: '#fff',
        padding: 14,
        paddingBottom: caption ? 8 : 14,
        boxShadow: `3px 5px 18px ${palette.shadow}`,
        opacity: 0,
        transform: `rotate(${rotate}deg) scale(0.88)`,
        transformOrigin: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          height: innerH,
          background: fill,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
      {caption && (
        <div
          style={{
            fontFamily: fonts.hand,
            fontSize: typeScale.caption,
            textAlign: 'center',
            padding: '8px 4px 4px',
            color: palette.ink,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};

// ─── 逐字弹入标题 ─────────────────────────────────────────────────────────────

export interface TextRevealProps {
  text: string;
  position: { x: number; y: number };
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  rotate?: number;
  /** 是否用手写 display 体。 */
  hand?: boolean;
  start?: number;
  /** 单字符动画时长（帧）。 */
  duration?: number;
  /** 相邻字符的起始间隔（帧）—— GSAP stagger。 */
  stagger?: number;
}

/**
 * 逐字弹入标题 —— 每个字符依次带回弹地跳出来。
 *
 * 这是 GSAP stagger 编排的典型效果：手写拆分每个字符为独立 span，
 * 用一条 timeline + `stagger` 让整行字像打字机一样活泼地浮现。
 */
export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  position,
  fontSize = typeScale.h1,
  color = palette.ink,
  align = 'left',
  rotate = 0,
  hand = true,
  start = 0,
  duration = 14,
  stagger = 2,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const chars = Array.from(text);
  useGsapTimeline(
    `text-reveal-${start}-${position.x}-${position.y}`,
    (tl) => {
      const el = ref.current;
      if (!el) return;
      const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('[data-char]'));
      if (spans.length === 0) return;
      tl.to(
        spans,
        {
          opacity: 1,
          y: 0,
          rotation: 0,
          duration: duration / 30,
          ease: 'back.out(2.2)',
          stagger: stagger / 30,
        },
        start / 30,
      );
    },
    [start, duration, stagger, text, position.x, position.y],
  );
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        textAlign: align,
        fontFamily: hand ? fonts.display : fonts.body,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.1,
        color,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {chars.map((ch, i) => (
        <span
          key={i}
          data-char
          style={{
            display: 'inline-block',
            opacity: 0,
            transform: 'translateY(26px) rotate(9deg)',
            whiteSpace: ch === ' ' ? 'pre' : 'normal',
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
};

// ─── 弹性便签 ─────────────────────────────────────────────────────────────────

export interface ElasticNoteProps {
  children?: React.ReactNode;
  title?: string;
  position: { x: number; y: number };
  width?: number;
  color?: StickyColor;
  /** 落定后的旋转角度。 */
  rotate?: number;
  start?: number;
  duration?: number;
  fontSize?: number;
  style?: CSSProperties;
}

/**
 * 弹性便签 —— 从上方"啪"地弹跳落定，投影随之收紧。
 *
 * 展示 GSAP 的 elastic 缓动（比 back-out 回弹次数更多、更活泼）与
 * boxShadow 补间：落定瞬间投影从"悬空的大虚影"收紧为"贴实的清晰影"，
 * 强化便签被按上墙的物理手感。这是手写插值难以做到的效果。
 */
export const ElasticNote: React.FC<ElasticNoteProps> = ({
  children,
  title,
  position,
  width = 320,
  color = 'yellow',
  rotate = 0,
  start = 0,
  duration = 26,
  fontSize = typeScale.body,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const sticky = stickyColors[color];
  useGsapTimeline(
    `elastic-note-${start}-${position.x}-${position.y}`,
    (tl) => {
      const el = ref.current;
      if (!el) return;
      // 从上方掉落 + 回弹落定（elastic）
      tl.to(
        el,
        { y: 0, rotation: rotate, duration: duration / 30, ease: 'elastic.out(1, 0.45)' },
        start / 30,
      );
      // 快速淡入
      tl.to(el, { opacity: 1, duration: (duration * 0.35) / 30, ease: 'power1.out' }, start / 30);
      // 落定时投影收紧，模拟"贴实"
      tl.to(
        el,
        {
          boxShadow: `2px 5px 16px ${palette.shadowDeep}, 0 1px 3px ${palette.shadowDeep}`,
          duration: duration / 30,
          ease: 'power2.out',
        },
        start / 30,
      );
    },
    [start, duration, rotate, position.x, position.y],
  );
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width,
        opacity: 0,
        transform: `translateY(-70px) rotate(${rotate - 7}deg)`,
        background: `linear-gradient(135deg, ${sticky.base} 0%, ${sticky.deep} 100%)`,
        boxShadow: `10px 18px 34px ${palette.shadow}, 0 3px 8px ${palette.shadow}`,
        padding: '26px 30px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: typeScale.h2,
            fontWeight: 700,
            lineHeight: 1.05,
            marginBottom: children ? 14 : 0,
            color: palette.ink,
          }}
        >
          {title}
        </div>
      )}
      {children && (
        <div style={{ fontSize, lineHeight: 1.55, color: palette.ink }}>{children}</div>
      )}
    </div>
  );
};
