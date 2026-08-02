import React, { useMemo } from 'react';
import { useCurrentFrame, useFPS } from '@seqvio/core';
import {
  ansiToSpans,
  applySimpleTerminalRewrites,
  sliceAnsiByVisibleChars,
  sliceAnsiByVisibleLines,
  stripAnsi,
  visibleLength,
  VHS_DEFAULT,
  type AnsiSpan,
  type VhsTheme,
} from './ansi';
import { TERMINAL_FONT_STACK } from './fonts';
import { CodeFontFaces } from './CodeFontFaces';

const VHS_REFERENCE_BACKGROUND = '#171717';

export type TerminalEventKind = 'stdin' | 'stdout' | 'stderr';

export interface TerminalGridCell {
  x: number;
  chars: string;
  width: number;
  foreground?: string;
  background?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
  invisible?: boolean;
  strikethrough?: boolean;
}

export interface TerminalGridSnapshot {
  cols: number;
  rows: number;
  cursorX: number;
  cursorY: number;
  lines: TerminalGridCell[][];
}

export interface TerminalEvent {
  timeMs: number;
  kind: TerminalEventKind;
  text: string;
  transient?: boolean;
  /** Complete terminal viewport; replaces prior persistent output. */
  snapshot?: boolean;
  grid?: TerminalGridSnapshot;
  /** Raw ANSI input that produced this snapshot. */
  raw?: string;
}

export interface TerminalStep {
  id: string;
  label: string;
  timeMs: number;
}

export interface TerminalDemoProps {
  id: string;
  events: TerminalEvent[];
  steps?: TerminalStep[];
  width?: number;
  height?: number;
  title?: string;
  /** Hard cap for rendered line count; older lines are truncated. */
  maxLines?: number;
  /**
   * `vhs`: Charm-VHS-like floating macOS window on a gradient/margin stage.
   * `minimal`: edge-to-edge terminal panel.
   */
  presentation?: 'minimal' | 'vhs';
  /** Typing speed in characters per second (VHS TypingSpeed analogue). */
  typingCps?: number;
  /** Optional terminal column count (reserved for future exact layout). */
  cols?: number;
  /** Terminal row count used to fit the captured grid without CSS reflow. */
  rows?: number;
  theme?: VhsTheme;
  /**
   * Cinematic zoom-to-input: while stdin is being typed the content area
   * pushes in toward the input line, then eases back to the full overview
   * once the input completes. Mirrors the browser recorder's focus effect.
   */
  zoomOnInput?: boolean;
  /** Maximum magnification when zoomed into an input line. */
  maxZoom?: number;
  /** Ease duration (ms) between overview and input-line focus. */
  zoomTransitionMs?: number;
  /** Hold (ms) after an input finishes typing before easing back out. */
  zoomHoldMs?: number;
  /**
   * Duration (ms) over which snapshot text changes are progressively revealed
   * line-by-line.  0 = instant (no reveal animation), which looks like a real
   * terminal.  Defaults to whatever gap the scheduler left between snapshots.
   */
  snapshotRevealMs?: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export interface TerminalZoomKeyframe {
  timeMs: number;
  /** true = zoom into the input line; false = reset to full overview. */
  zoomIn: boolean;
  /** Focus center in content-area pixels (relative to the content box). */
  centerX: number;
  centerY: number;
}

export interface TerminalZoomOptions {
  contentWidth: number;
  contentHeight: number;
  maxZoom: number;
  transitionMs: number;
}

export interface TerminalZoomCamera {
  scale: number;
  translateX: number;
  translateY: number;
  centerX: number;
  centerY: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function cameraForKeyframe(
  keyframe: TerminalZoomKeyframe | undefined,
  options: TerminalZoomOptions
): { scale: number; centerX: number; centerY: number } {
  if (!keyframe || !keyframe.zoomIn) {
    return {
      scale: 1,
      centerX: options.contentWidth / 2,
      centerY: options.contentHeight / 2,
    };
  }
  return {
    scale: options.maxZoom,
    centerX: keyframe.centerX,
    centerY: keyframe.centerY,
  };
}

/**
 * Resolve a cinematic camera (pan + zoom) for the terminal content area.
 * Mirrors the browser recorder's focus-target model: between keyframes the
 * scale and center ease with a smoothstep over `transitionMs`. The content
 * area is both the recording canvas and the output viewport, so the base
 * (overview) scale is 1.
 */
export function resolveTerminalZoomCamera(
  currentMs: number,
  keyframes: TerminalZoomKeyframe[],
  options: TerminalZoomOptions
): TerminalZoomCamera {
  const { contentWidth, contentHeight, transitionMs } = options;
  const base: TerminalZoomCamera = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    centerX: contentWidth / 2,
    centerY: contentHeight / 2,
  };
  if (keyframes.length === 0) return base;

  const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);
  const nextIndex = sorted.findIndex((target) => target.timeMs > currentMs);
  const currentIndex = nextIndex === -1 ? sorted.length - 1 : nextIndex - 1;
  if (currentIndex < 0) return base;

  const current = sorted[currentIndex];
  const previous = currentIndex > 0 ? sorted[currentIndex - 1] : undefined;
  const from = cameraForKeyframe(previous, options);
  const to = cameraForKeyframe(current, options);
  const progress = smoothstep((currentMs - current.timeMs) / Math.max(1, transitionMs));
  const scale = from.scale + (to.scale - from.scale) * progress;
  const centerX = from.centerX + (to.centerX - from.centerX) * progress;
  const centerY = from.centerY + (to.centerY - from.centerY) * progress;

  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const translateX = clamp(
    contentWidth / 2 - centerX * scale,
    Math.min(0, contentWidth - scaledWidth),
    Math.max(0, contentWidth - scaledWidth)
  );
  const translateY = clamp(
    contentHeight / 2 - centerY * scale,
    Math.min(0, contentHeight - scaledHeight),
    Math.max(0, contentHeight - scaledHeight)
  );
  return { scale, translateX, translateY, centerX, centerY };
}

function normalizeStdinText(text: string): string {
  // Backwards compatibility: older manifests synthesize `$ command\n`.
  let t = text;
  if (t.startsWith('$ ')) {
    t = t.slice(2);
  }
  return t.replace(/\n$/, '');
}

function spansToNodes(spans: AnsiSpan[], keyPrefix: string): React.ReactNode[] {
  return spans.map((span, idx) => {
    if (!span.text) return null;
    const style: React.CSSProperties = {
      color: span.style.color,
      backgroundColor: span.style.backgroundColor,
      fontWeight: span.style.fontWeight,
      fontStyle: span.style.fontStyle,
      textDecoration: span.style.textDecoration,
      opacity: span.style.opacity,
    };
    return (
      <span key={`${keyPrefix}-${idx}`} style={style}>
        {span.text}
      </span>
    );
  });
}

function revealSnapshotLines(previous: string, next: string, progress: number): string {
  if (!previous || progress >= 1) return next;
  if (progress <= 0) return previous;
  const previousLines = previous.split('\n');
  const nextLines = next.split('\n');
  const lineCount = Math.max(previousLines.length, nextLines.length);
  const changed: number[] = [];
  for (let index = 0; index < lineCount; index += 1) {
    if ((previousLines[index] ?? '') !== (nextLines[index] ?? '')) changed.push(index);
  }
  const revealedCount = Math.max(1, Math.ceil(changed.length * progress));
  const revealed = new Set(changed.slice(0, revealedCount));
  return Array.from({ length: lineCount }, (_, index) =>
    revealed.has(index) ? (nextLines[index] ?? '') : (previousLines[index] ?? '')
  ).join('\n');
}

function revealGridRows(
  previous: TerminalGridSnapshot | undefined,
  next: TerminalGridSnapshot,
  progress: number
): TerminalGridSnapshot {
  if (!previous || progress >= 1) return next;
  if (progress <= 0) return previous;
  const changed: number[] = [];
  for (let row = 0; row < next.rows; row += 1) {
    if (JSON.stringify(previous.lines[row] ?? []) !== JSON.stringify(next.lines[row] ?? [])) {
      changed.push(row);
    }
  }
  const revealedCount = Math.max(1, Math.ceil(changed.length * progress));
  const revealed = new Set(changed.slice(0, revealedCount));
  return {
    ...next,
    lines: Array.from({ length: next.rows }, (_, row) =>
      revealed.has(row) ? (next.lines[row] ?? []) : (previous.lines[row] ?? [])
    ),
  };
}

function gridWithInput(
  grid: TerminalGridSnapshot,
  input: string,
  foreground: string
): TerminalGridSnapshot {
  let promptRow = grid.cursorY;
  let promptX = Math.max(0, grid.cursorX);
  let nearestDistance = Number.POSITIVE_INFINITY;

  // Prompt chars ordered by priority: ❯ (VHS modern) → $ (bash/sh) → # (root) → > (cmd)
  const PROMPT_CHARS = ['❯', '$', '#', '>'];
  for (let row = 0; row < grid.lines.length; row += 1) {
    const prompt = grid.lines[row]?.find((cell) =>
      PROMPT_CHARS.some((ch) => cell.chars.includes(ch))
    );
    if (!prompt) continue;
    const distance = Math.abs(row - grid.cursorY);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      promptRow = row;
      promptX = prompt.x + prompt.width + 1;
    }
  }

  return {
    ...grid,
    cursorX: promptX + Array.from(input).length,
    cursorY: promptRow,
    lines: grid.lines.map((line, row) => {
      if (row !== promptRow) return line;
      const beforeInput = line.filter((cell) => cell.x + cell.width <= promptX);
      if (!input) return beforeInput;
      return [
        ...beforeInput,
        {
          x: promptX,
          chars: input,
          width: Array.from(input).length,
          foreground,
          bold: true,
        },
      ];
    }),
  };
}

export const TerminalDemo: React.FC<TerminalDemoProps> = ({
  id,
  events,
  steps = [],
  width = 1280,
  height = 720,
  title,
  maxLines = 220,
  presentation = 'vhs',
  typingCps = 52,
  cols,
  rows,
  theme = VHS_DEFAULT,
  zoomOnInput = false,
  maxZoom = 2.2,
  zoomTransitionMs = 480,
  zoomHoldMs = 220,
  snapshotRevealMs = 0,
}) => {
  const frame = useCurrentFrame();
  const fps = useFPS();
  const currentMs = (frame / Math.max(1, fps)) * 1000;
  const isVhs = presentation === 'vhs';
  const marginX = isVhs ? Math.round(width * 0.03) : 0;
  const marginY = isVhs ? Math.round(height * 0.05) : 0;
  const windowWidth = width - marginX * 2;
  const windowHeight = height - marginY * 2;
  const barHeight = isVhs ? 42 : 40;
  const pad = isVhs ? 32 : 18;
  const contentWidth = windowWidth - pad * 2;
  const contentHeight = windowHeight - barHeight - pad * 2;
  // Auto-fit font size to terminal columns so the grid fills the content
  // width without horizontal clipping (vhs uses large fixed fonts; seqvio
  // adapts to the plan's cols, giving bigger text when cols is small).
  const terminalCols = cols ?? 80;
  const fontSize = Math.max(
    18,
    Math.min(30, Math.floor((contentWidth * 0.96) / (terminalCols * 0.6)))
  );
  const lineHeight = fontSize * 1.2;
  const gridCellWidth = fontSize * 0.6;
  const gridCellHeight = lineHeight;
  const gridFontSize = fontSize;
  const visibleLineLimit = Math.max(
    1,
    Math.min(maxLines, Math.floor((windowHeight - barHeight - pad * 2) / lineHeight))
  );

  const normalized = useMemo(() => {
    const sorted = [...events]
      .filter((e) => e && typeof e.timeMs === 'number' && typeof e.text === 'string')
      .sort((a, b) => a.timeMs - b.timeMs);

    return sorted.map((e) => {
      if (e.kind === 'stdin') {
        const text = normalizeStdinText(e.text);
        return {
          ...e,
          text,
          plainLen: visibleLength(text),
          transient: e.transient ?? true,
        };
      }
      return {
        ...e,
        text: e.text,
        plainLen: visibleLength(e.text),
        transient: false,
      };
    });
  }, [events]);

  const segments = useMemo(() => {
    return normalized.map((e, idx) => {
      const startMs = e.timeMs;
      const nextStart =
        idx + 1 < normalized.length ? normalized[idx + 1].timeMs : e.timeMs + 1200;
      // VHS-like: type at a steady CPS, don't stretch across long idle gaps.
      const naturalMs = Math.max(60, Math.ceil((e.plainLen / Math.max(1, typingCps)) * 1000));
      const endMs = e.transient
        ? nextStart
        : e.snapshot
          ? Math.min(nextStart, startMs + 650)
          : Math.min(nextStart, startMs + naturalMs);
      return { ...e, startMs, endMs, typeEndMs: Math.min(nextStart, startMs + naturalMs) };
    });
  }, [normalized, typingCps]);

  const zoomKeyframes = useMemo<TerminalZoomKeyframe[]>(() => {
    if (!zoomOnInput) return [];
    const frames: TerminalZoomKeyframe[] = [];
    let persistentGrid: TerminalGridSnapshot | undefined;
    for (const seg of segments) {
      if (seg.snapshot && seg.grid) {
        persistentGrid = seg.grid;
        continue;
      }
      if (!seg.transient) continue;
      if (!persistentGrid) continue;
      // Focus the input line: center on the prompt + half the typed text so
      // the whole input stays inside the magnified viewport.
      const row = persistentGrid.cursorY;
      const promptX = persistentGrid.cursorX;
      const inputLen = seg.plainLen;
      const centerX = (promptX + inputLen / 2) * gridCellWidth;
      const centerY = (row + 0.5) * gridCellHeight;
      frames.push({ timeMs: seg.startMs, zoomIn: true, centerX, centerY });
      frames.push({
        timeMs: seg.typeEndMs + zoomHoldMs,
        zoomIn: false,
        centerX: contentWidth / 2,
        centerY: contentHeight / 2,
      });
    }
    return frames;
  }, [
    segments,
    zoomOnInput,
    zoomHoldMs,
    gridCellWidth,
    gridCellHeight,
    contentWidth,
    contentHeight,
  ]);

  const zoomCamera = useMemo(() => {
    if (!zoomOnInput || zoomKeyframes.length === 0) return null;
    return resolveTerminalZoomCamera(currentMs, zoomKeyframes, {
      contentWidth,
      contentHeight,
      maxZoom,
      transitionMs: zoomTransitionMs,
    });
  }, [
    zoomOnInput,
    zoomKeyframes,
    currentMs,
    contentWidth,
    contentHeight,
    maxZoom,
    zoomTransitionMs,
  ]);

  const { visibleAnsi, visibleGrid, transientInput, transientGrid } = useMemo(() => {
    if (segments.length === 0) {
      return {
        visibleAnsi: '',
        visibleGrid: undefined,
        transientInput: '',
        transientGrid: undefined,
      };
    }

    let persistentRaw = '';
    let previousSnapshot = '';
    let persistentGrid: TerminalGridSnapshot | undefined;
    let transient = '';
    let transientAt: TerminalGridSnapshot | undefined;

    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i];
      if (currentMs >= seg.endMs) {
        if (!seg.transient) {
          if (seg.snapshot) {
            previousSnapshot = persistentRaw;
            persistentRaw = seg.text;
            if (seg.grid) persistentGrid = seg.grid;
          } else {
            persistentRaw += seg.text;
          }
        }
        continue;
      }
      if (currentMs < seg.startMs) {
        break;
      }

      if (seg.snapshot) {
        const revealDurationMs =
          snapshotRevealMs > 0
            ? snapshotRevealMs
            : snapshotRevealMs === 0
              ? 1
              : Math.max(1, seg.endMs - seg.startMs);
        const progress = clamp01(
          (currentMs - seg.startMs) / Math.max(1, revealDurationMs)
        );
        persistentRaw = revealSnapshotLines(previousSnapshot, seg.text, progress);
        if (seg.grid) persistentGrid = revealGridRows(persistentGrid, seg.grid, progress);
        break;
      }

      const progress = clamp01(
        (currentMs - seg.startMs) / Math.max(1, seg.typeEndMs - seg.startMs)
      );
      const sliceLen = Math.floor(seg.plainLen * progress);
      const sliced = sliceAnsiByVisibleChars(seg.text, sliceLen);

      if (seg.transient) {
        transient = sliced;
        transientAt = persistentGrid;
      } else {
        persistentRaw += sliced;
      }
      break;
    }

    const persistent = sliceAnsiByVisibleLines(
      applySimpleTerminalRewrites(persistentRaw),
      visibleLineLimit
    );
    return {
      visibleAnsi: persistent,
      visibleGrid: persistentGrid,
      transientInput: transient,
      transientGrid: transientAt,
    };
  }, [segments, currentMs, visibleLineLimit]);

  const activeStep = useMemo(() => {
    if (!steps || steps.length === 0) return null;
    const sortedSteps = [...steps].sort((a, b) => a.timeMs - b.timeMs);
    for (let i = 0; i < sortedSteps.length; i += 1) {
      const s = sortedSteps[i];
      const start = s.timeMs;
      const end = i + 1 < sortedSteps.length ? sortedSteps[i + 1].timeMs : Number.POSITIVE_INFINITY;
      if (currentMs >= start && currentMs < end) return s;
    }
    return null;
  }, [steps, currentMs]);

  const showCaret = useMemo(() => {
    if (segments.length === 0) return false;
    const active = segments.find((s) => currentMs >= s.startMs && currentMs < s.endMs);
    if (active) return true;
    const last = segments[segments.length - 1];
    return currentMs >= last.endMs && currentMs < last.endMs + 900;
  }, [segments, currentMs]);

  const caretVisible = Math.floor(currentMs / 530) % 2 === 0;

  const contentNodes = useMemo(() => {
    const spans = ansiToSpans(visibleAnsi, theme);
    return spansToNodes(spans, 't');
  }, [visibleAnsi, theme]);

  const transientNodes = useMemo(() => {
    if (!transientInput) return null;
    const spans = ansiToSpans(
      `[1;36m$[0m [1;37m${transientInput}[0m`,
      theme
    );
    return spansToNodes(spans, 'p');
  }, [transientInput, theme]);

  const displayedGrid = useMemo(() => {
    if (!visibleGrid) return undefined;
    if (!transientInput || !transientGrid) return visibleGrid;
    return gridWithInput(visibleGrid, transientInput, theme.cyan);
  }, [visibleGrid, transientInput, transientGrid, theme.cyan]);

  const gridNodes = useMemo(() => {
    if (!displayedGrid) return null;
    return displayedGrid.lines.flatMap((line, row) =>
      line.map((cell, index) => {
        let foreground = cell.foreground ?? theme.foreground;
        let background = cell.background;
        if (cell.inverse) {
          const originalForeground = foreground;
          foreground = background ?? VHS_REFERENCE_BACKGROUND;
          background = originalForeground;
        }
        return (
          <span
            key={`g-${row}-${cell.x}-${index}`}
            style={{
              position: 'absolute',
              left: cell.x * gridCellWidth,
              top: row * gridCellHeight,
              width: cell.width * gridCellWidth,
              height: gridCellHeight,
              lineHeight: `${gridCellHeight}px`,
              overflow: 'visible',
              whiteSpace: 'pre',
              color: cell.invisible ? 'transparent' : foreground,
              backgroundColor: background,
              fontWeight: cell.bold ? 700 : 400,
              fontStyle: cell.italic ? 'italic' : 'normal',
              textDecoration: [cell.underline ? 'underline' : '', cell.strikethrough ? 'line-through' : '']
                .filter(Boolean)
                .join(' ') || 'none',
              opacity: cell.dim ? 0.65 : 1,
              fontVariantLigatures: 'none',
              letterSpacing: 0,
              boxSizing: 'border-box',
            }}
          >
            {cell.chars}
          </span>
        );
      })
    );
  }, [displayedGrid, gridCellWidth, gridCellHeight, theme]);

  const terminalPanel = (
    <div
      style={{
        width: windowWidth,
        height: windowHeight,
        background: VHS_REFERENCE_BACKGROUND,
        color: theme.foreground,
        fontFamily: TERMINAL_FONT_STACK,
        fontWeight: 400,
        boxSizing: 'border-box',
        borderRadius: isVhs ? 12 : 10,
        overflow: 'hidden',
        border: isVhs ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.35)',
        boxShadow: isVhs
          ? '0 40px 100px rgba(0,0,0,0.65), 0 12px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)'
          : undefined,
      }}
      data-terminal-demo-id={id}
    >
      <CodeFontFaces />
      <div
        style={{
          height: barHeight,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: VHS_REFERENCE_BACKGROUND,
        }}
      >
        {/* WindowBar Colorful */}
        <span style={{ width: 12, height: 12, borderRadius: 999, background: '#FF5F4D' }} />
        <span style={{ width: 12, height: 12, borderRadius: 999, background: '#FEBB00' }} />
        <span style={{ width: 12, height: 12, borderRadius: 999, background: '#00CC1D' }} />
        <span
          style={{
            marginLeft: 10,
            fontSize: 13,
            color: theme.brightBlack,
            letterSpacing: 0.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: windowWidth - 120,
          }}
        >
          {title ?? 'Terminal'}
        </span>
      </div>

      <div style={{ position: 'relative', height: `calc(100% - ${barHeight}px)` }}>
        {activeStep ? (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(137, 180, 250, 0.12)',
              border: '1px solid rgba(137, 180, 250, 0.35)',
              color: theme.blue,
              fontSize: 13,
              maxWidth: Math.min(420, windowWidth - 48),
              zIndex: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2, color: theme.magenta }}>
              Step
            </div>
            <div style={{ lineHeight: 1.3, color: theme.foreground }}>{activeStep.label}</div>
          </div>
        ) : null}

        <div
          style={{
            padding: pad,
            height: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: contentWidth,
              height: contentHeight,
              transformOrigin: '0 0',
              transform: zoomCamera
                ? `translate(${zoomCamera.translateX}px, ${zoomCamera.translateY}px) scale(${zoomCamera.scale})`
                : undefined,
              willChange: zoomCamera ? 'transform' : undefined,
            }}
          >
          {visibleGrid ? (
            <div
              style={{
                position: 'relative',
                width: Math.min(contentWidth, (visibleGrid?.cols ?? cols ?? 1) * gridCellWidth),
                height: Math.min(contentHeight, (visibleGrid?.rows ?? rows ?? 1) * gridCellHeight),
                fontSize: gridFontSize,
                lineHeight: `${gridCellHeight}px`,
                fontFamily: TERMINAL_FONT_STACK,
                fontWeight: 400,
                fontVariantLigatures: 'none',
                overflow: 'hidden',
              }}
            >
              {gridNodes}
              {displayedGrid && caretVisible ? (
                <span
                  aria-hidden
                  data-terminal-cursor
                  style={{
                    position: 'absolute',
                    left: displayedGrid.cursorX * gridCellWidth,
                    top: displayedGrid.cursorY * gridCellHeight,
                    width: gridCellWidth,
                    height: gridCellHeight,
                    background: '#d8d8d8',
                    opacity: 0.96,
                    zIndex: 3,
                  }}
                />
              ) : null}
            </div>
          ) : (
          <pre
            style={{
              margin: 0,
              fontSize,
              lineHeight: `${lineHeight}px`,
              fontFamily: TERMINAL_FONT_STACK,
              fontWeight: 400,
              whiteSpace: 'pre',
              wordBreak: 'normal',
              position: 'relative',
              zIndex: 1,
              color: theme.foreground,
            }}
          >
            {contentNodes}
            {transientNodes}
            {showCaret && caretVisible ? (
              <span
                style={{
                  color: theme.cursor,
                  backgroundColor: theme.cursor,
                  marginLeft: 1,
                  display: 'inline-block',
                  width: Math.max(8, Math.round(fontSize * 0.55)),
                  height: Math.round(fontSize * 1.05),
                  transform: 'translateY(2px)',
                  verticalAlign: 'text-bottom',
                  opacity: 0.9,
                }}
              />
            ) : null}
          </pre>
          )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isVhs) {
    return terminalPanel;
  }

  return (
    <div
      style={{
        width,
        height,
        boxSizing: 'border-box',
        padding: `${marginY}px ${marginX}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 50% 38%, #1f1f1f 0%, #151515 52%, #0c0c0c 100%)',
      }}
    >
      {terminalPanel}
    </div>
  );
};
