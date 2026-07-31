import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useCurrentFrame, useFPS } from '@seqvio/core';
import { TERMINAL_FONT_STACK } from './fonts';
import {
  resolveTerminalZoomCamera,
  type TerminalEvent,
  type TerminalGridSnapshot,
  type TerminalStep,
  type TerminalZoomKeyframe,
} from './TerminalDemo';

declare global {
  interface Window {
    Terminal?: any;
    __seqvio_terminalReady?: Promise<void>;
    __seqvio_terminalReadyById?: Map<string, Promise<void>>;
  }
}

export interface TerminalXtermDemoProps {
  id: string;
  events: TerminalEvent[];
  steps?: TerminalStep[];
  width?: number;
  height?: number;
  cols?: number;
  rows?: number;
  title?: string;
  maxLines?: number;
  presentation?: 'minimal' | 'vhs';
  windowChrome?: boolean;
  typingCps?: number;
  cursorBlink?: boolean;
  zoomOnInput?: boolean;
  maxZoom?: number;
  zoomTransitionMs?: number;
  zoomHoldMs?: number;
}

export interface TerminalFrameState {
  ansi: string;
  activeInput: string;
  cursorX: number;
  cursorY: number;
}

export const VHS_BG = '#171717';
export const VHS_STAGE_BG = '#1a1a2e';

const BASE_FONT_SIZE = 22;
const CHAR_WIDTH = Math.round(BASE_FONT_SIZE * 0.6);
const LINE_HEIGHT = Math.round(BASE_FONT_SIZE * 1.25);
const RESET_TERMINAL = '\x1bc\x1b[2J\x1b[H';
const SHOW_CURSOR = '\x1b[?25h';
const HIDE_CURSOR = '\x1b[?25l';
const CURSOR_BLINK_PERIOD_MS = 1000;

function terminalReadyRegistry(): Map<string, Promise<void>> {
  window.__seqvio_terminalReadyById ??= new Map<string, Promise<void>>();
  return window.__seqvio_terminalReadyById;
}

export function resolveTerminalFitScale(
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number,
  contentHeight: number,
  withChrome: boolean
): number {
  return Math.max(
    0.01,
    Math.min(
      1,
      (viewportWidth * (withChrome ? 0.94 : 1)) / Math.max(1, contentWidth),
      (viewportHeight * (withChrome ? 0.9 : 1)) / Math.max(1, contentHeight)
    )
  );
}

export function resolveTerminalCursorVisible(
  currentMs: number,
  cursorBlink: boolean
): boolean {
  if (!cursorBlink) return true;
  const phase = ((currentMs % CURSOR_BLINK_PERIOD_MS) + CURSOR_BLINK_PERIOD_MS)
    % CURSOR_BLINK_PERIOD_MS;
  return phase < CURSOR_BLINK_PERIOD_MS / 2;
}

function codePoints(text: string): string[] {
  return Array.from(text.replace(/\r?\n$/, ''));
}

function snapshotAnsi(event: TerminalEvent): string {
  const text = event.text.replace(/\r?\n/g, '\r\n');
  const cursor = event.grid
    ? `\x1b[${Math.max(0, event.grid.cursorY) + 1};${Math.max(0, event.grid.cursorX) + 1}H`
    : '';
  return `${RESET_TERMINAL}${text}${cursor}`;
}

/**
 * Resolve a complete terminal state for one logical video frame. Snapshot
 * events are authoritative checkpoints; stdin is synthesized only until the
 * next PTY snapshot arrives, which prevents command echo from being rendered
 * twice.
 */
export function resolveTerminalFrameState(
  events: TerminalEvent[],
  currentMs: number,
  typingCps: number
): TerminalFrameState {
  const visible = [...events]
    .filter((event) => event.timeMs <= currentMs)
    .sort((a, b) => a.timeMs - b.timeMs);
  let snapshotIndex = -1;
  for (let index = visible.length - 1; index >= 0; index -= 1) {
    if (visible[index].kind !== 'stdin' && visible[index].snapshot) {
      snapshotIndex = index;
      break;
    }
  }

  let ansi = RESET_TERMINAL;
  let cursorX = 0;
  let cursorY = 0;
  let latestOutputIndex = -1;
  if (snapshotIndex >= 0) {
    const snapshot = visible[snapshotIndex];
    ansi = snapshotAnsi(snapshot);
    cursorX = snapshot.grid?.cursorX ?? 0;
    cursorY = snapshot.grid?.cursorY ?? 0;
    latestOutputIndex = snapshotIndex;
    for (let index = snapshotIndex + 1; index < visible.length; index += 1) {
      const event = visible[index];
      if (event.kind === 'stdin') continue;
      ansi += event.raw ?? event.text;
      latestOutputIndex = index;
    }
  } else {
    for (let index = 0; index < visible.length; index += 1) {
      const event = visible[index];
      if (event.kind === 'stdin') continue;
      ansi += event.raw ?? event.text;
      latestOutputIndex = index;
      cursorX = event.grid?.cursorX ?? cursorX;
      cursorY = event.grid?.cursorY ?? cursorY;
    }
  }

  let activeInputEvent: TerminalEvent | undefined;
  for (let index = visible.length - 1; index > latestOutputIndex; index -= 1) {
    const event = visible[index];
    if (event.kind === 'stdin') {
      activeInputEvent = event;
      break;
    }
  }

  let activeInput = '';
  if (activeInputEvent) {
    const chars = codePoints(activeInputEvent.text);
    const elapsedMs = Math.max(0, currentMs - activeInputEvent.timeMs);
    const count = Math.min(
      chars.length,
      Math.floor((elapsedMs * Math.max(1, typingCps)) / 1000)
    );
    activeInput = chars.slice(0, count).join('');
    ansi += activeInput;
  }

  return { ansi, activeInput, cursorX, cursorY };
}

function buildZoomKeyframes(
  events: TerminalEvent[],
  typingCps: number,
  zoomHoldMs: number,
  contentWidth: number,
  contentHeight: number
): TerminalZoomKeyframe[] {
  const frames: TerminalZoomKeyframe[] = [];
  let grid: TerminalGridSnapshot | undefined;
  for (const event of [...events].sort((a, b) => a.timeMs - b.timeMs)) {
    if (event.kind !== 'stdin') {
      grid = event.grid ?? grid;
      continue;
    }
    if (!grid) continue;
    const length = codePoints(event.text).length;
    frames.push({
      timeMs: event.timeMs,
      zoomIn: true,
      centerX: (grid.cursorX + length / 2) * CHAR_WIDTH,
      centerY: (grid.cursorY + 0.5) * LINE_HEIGHT,
    });
    frames.push({
      timeMs: event.timeMs + (length / Math.max(1, typingCps)) * 1000 + zoomHoldMs,
      zoomIn: false,
      centerX: contentWidth / 2,
      centerY: contentHeight / 2,
    });
  }
  return frames;
}

export const TerminalXtermDemo: React.FC<TerminalXtermDemoProps> = ({
  id,
  events,
  width = 1280,
  height = 720,
  cols = 80,
  rows = 24,
  title = 'Terminal',
  maxLines = 220,
  presentation = 'vhs',
  windowChrome = true,
  typingCps = 52,
  cursorBlink = true,
  zoomOnInput = false,
  maxZoom = 2.2,
  zoomTransitionMs = 480,
  zoomHoldMs = 220,
}) => {
  const frame = useCurrentFrame();
  const fps = useFPS();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<any>(null);
  const lastAnsiRef = useRef('');
  const currentMs = (frame / Math.max(1, fps)) * 1000;
  const frameState = useMemo(
    () => resolveTerminalFrameState(events, currentMs, typingCps),
    [events, currentMs, typingCps]
  );
  const renderedAnsi = `${frameState.ansi}${
    resolveTerminalCursorVisible(currentMs, cursorBlink) ? SHOW_CURSOR : HIDE_CURSOR
  }`;

  const termWidth = cols * CHAR_WIDTH + 20;
  const termHeight = rows * LINE_HEIGHT + 5;
  const showChrome = presentation !== 'minimal' && windowChrome;
  const barHeight = showChrome ? 44 : 0;
  const contentPad = showChrome ? 16 : 0;
  const naturalWidth = termWidth + contentPad * 2;
  const naturalHeight = termHeight + contentPad * 2 + barHeight;
  const fitScale = resolveTerminalFitScale(
    width,
    height,
    naturalWidth,
    naturalHeight,
    showChrome
  );

  const zoomKeyframes = useMemo(
    () =>
      zoomOnInput
        ? buildZoomKeyframes(events, typingCps, zoomHoldMs, termWidth, termHeight)
        : [],
    [events, typingCps, zoomHoldMs, zoomOnInput, termWidth, termHeight]
  );
  const zoomCamera = resolveTerminalZoomCamera(currentMs, zoomKeyframes, {
    contentWidth: termWidth,
    contentHeight: termHeight,
    maxZoom,
    transitionMs: zoomTransitionMs,
  });

  useLayoutEffect(() => {
    const element = containerRef.current;
    const Terminal = window.Terminal;
    if (!element || !Terminal) return;
    const terminal = new Terminal({
      cols,
      rows,
      scrollback: Math.max(rows, maxLines),
      allowProposedApi: true,
      cursorBlink: false,
      cursorStyle: 'block',
      cursorInactiveStyle: 'block',
      disableStdin: true,
      fontFamily: TERMINAL_FONT_STACK,
      fontSize: BASE_FONT_SIZE,
      lineHeight: 1.25,
      theme: {
        background: VHS_BG,
        foreground: '#dddddd',
        cursor: '#dddddd',
        cursorAccent: VHS_BG,
        selectionBackground: '#44475a',
        black: '#282a2e',
        red: '#D74E6F',
        green: '#31BB71',
        yellow: '#D3E561',
        blue: '#8056FF',
        magenta: '#ED61D7',
        cyan: '#04D7D7',
        white: '#bfbfbf',
        brightBlack: '#4d4d4d',
        brightRed: '#FE5F86',
        brightGreen: '#00D787',
        brightYellow: '#EBFF71',
        brightBlue: '#9B79FF',
        brightMagenta: '#FF7AEA',
        brightCyan: '#00FEFE',
        brightWhite: '#e6e6e6',
      },
      allowTransparency: false,
    });
    terminal.open(element);
    termRef.current = terminal;
    lastAnsiRef.current = '';
    terminalReadyRegistry().set(id, Promise.resolve());
    return () => {
      terminal.dispose();
      termRef.current = null;
      lastAnsiRef.current = '';
      terminalReadyRegistry().delete(id);
    };
  }, [id, cols, rows, maxLines]);

  useLayoutEffect(() => {
    const terminal = termRef.current;
    if (!terminal || lastAnsiRef.current === renderedAnsi) {
      const ready = Promise.resolve();
      terminalReadyRegistry().set(id, ready);
      window.__seqvio_terminalReady = ready;
      return;
    }
    lastAnsiRef.current = renderedAnsi;
    const ready = new Promise<void>((resolve) => {
      terminal.write(renderedAnsi, resolve);
    });
    terminalReadyRegistry().set(id, ready);
    window.__seqvio_terminalReady = ready;
  }, [id, renderedAnsi, cols, rows, maxLines]);

  const terminal = (
    <div
      style={{
        width: termWidth,
        height: termHeight,
        overflow: 'hidden',
        background: VHS_BG,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: termWidth,
          height: termHeight,
          background: VHS_BG,
          transform: `translate(${zoomCamera.translateX}px, ${zoomCamera.translateY}px) scale(${zoomCamera.scale})`,
          transformOrigin: '0 0',
        }}
      />
    </div>
  );

  const content = showChrome ? (
    <div
      style={{
        width: naturalWidth,
        height: naturalHeight,
        overflow: 'hidden',
        borderRadius: 10,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        background: VHS_BG,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: barHeight,
          background: '#1e1e1e',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          gap: 8,
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f56' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#27c93f' }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a3a3a3',
            fontSize: 13,
            pointerEvents: 'none',
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          padding: contentPad,
          width: naturalWidth,
          height: naturalHeight - barHeight,
          boxSizing: 'border-box',
          background: VHS_BG,
        }}
      >
        {terminal}
      </div>
    </div>
  ) : (
    terminal
  );

  return (
    <div
      data-terminal-demo-id={id}
      style={{
        width,
        height,
        overflow: 'hidden',
        background: showChrome ? VHS_STAGE_BG : VHS_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: TERMINAL_FONT_STACK,
      }}
    >
      <div
        style={{
          width: naturalWidth,
          height: naturalHeight,
          flex: '0 0 auto',
          transform: `scale(${fitScale})`,
        }}
      >
        {content}
      </div>
    </div>
  );
};
