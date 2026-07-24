import { Terminal } from '@xterm/headless';
import { VHS_DEFAULT } from '@seqvio/technical';

import type { TerminalEvent, TerminalGridCell, TerminalGridSnapshot } from './types';

interface TerminalCell {
  getWidth(): number;
  getChars(): string;
  isAttributeDefault(): boolean;
  getFgColor(): number;
  getBgColor(): number;
  isBold(): number;
  isDim(): number;
  isItalic(): number;
  isUnderline(): number;
  isBlink(): number;
  isInverse(): number;
  isInvisible(): number;
  isStrikethrough(): number;
  isFgRGB(): boolean;
  isBgRGB(): boolean;
  isFgPalette(): boolean;
  isBgPalette(): boolean;
}

// 16-color palette derived from the VHS default theme so grid cells rendered
// via @xterm/headless use the same high-saturation colors as TerminalDemo.
const ANSI_16 = [
  VHS_DEFAULT.black, VHS_DEFAULT.red, VHS_DEFAULT.green, VHS_DEFAULT.yellow,
  VHS_DEFAULT.blue, VHS_DEFAULT.magenta, VHS_DEFAULT.cyan, VHS_DEFAULT.white,
  VHS_DEFAULT.brightBlack, VHS_DEFAULT.brightRed, VHS_DEFAULT.brightGreen, VHS_DEFAULT.brightYellow,
  VHS_DEFAULT.brightBlue, VHS_DEFAULT.brightMagenta, VHS_DEFAULT.brightCyan, VHS_DEFAULT.brightWhite,
];

function paletteCss(index: number): string {
  if (index < 16) return ANSI_16[index] ?? '#cdd6f4';
  if (index >= 232) {
    const value = 8 + (index - 232) * 10;
    return `rgb(${value},${value},${value})`;
  }
  const cube = index - 16;
  const component = (value: number) => (value === 0 ? 0 : 55 + value * 40);
  const red = component(Math.floor(cube / 36));
  const green = component(Math.floor((cube % 36) / 6));
  const blue = component(cube % 6);
  return `rgb(${red},${green},${blue})`;
}

function cellColor(cell: TerminalCell, foreground: boolean): string | undefined {
  const isRgb = foreground ? cell.isFgRGB() : cell.isBgRGB();
  const isPalette = foreground ? cell.isFgPalette() : cell.isBgPalette();
  const value = foreground ? cell.getFgColor() : cell.getBgColor();
  if (isRgb) return `#${value.toString(16).padStart(6, '0')}`;
  if (isPalette) return paletteCss(value);
  return undefined;
}

function serializeGrid(terminal: Terminal): TerminalGridSnapshot {
  const buffer = terminal.buffer.active;
  const lines: TerminalGridCell[][] = [];
  for (let y = 0; y < terminal.rows; y += 1) {
    const line = buffer.getLine(buffer.baseY + y);
    const cells: TerminalGridCell[] = [];
    if (line) {
      for (let x = 0; x < line.length; x += 1) {
        const cell = line.getCell(x) as TerminalCell | undefined;
        if (!cell || cell.getWidth() === 0) continue;
        const chars = cell.getChars();
        if (!chars && cell.isAttributeDefault()) continue;
        cells.push({
          x,
          chars: chars || ' ',
          width: cell.getWidth(),
          foreground: cellColor(cell, true),
          background: cellColor(cell, false),
          bold: Boolean(cell.isBold()),
          dim: Boolean(cell.isDim()),
          italic: Boolean(cell.isItalic()),
          underline: Boolean(cell.isUnderline()),
          inverse: Boolean(cell.isInverse()),
          invisible: Boolean(cell.isInvisible()),
          strikethrough: Boolean(cell.isStrikethrough()),
        });
      }
    }
    lines.push(cells);
  }
  return {
    cols: terminal.cols,
    rows: terminal.rows,
    cursorX: buffer.cursorX,
    cursorY: buffer.cursorY,
    lines,
  };
}

function writeAsync(terminal: Terminal, data: string): Promise<void> {
  return new Promise((resolve) => terminal.write(data, resolve));
}

function paletteCode(value: number, foreground: boolean): string {
  if (value < 8) return String((foreground ? 30 : 40) + value);
  if (value < 16) return String((foreground ? 90 : 100) + value - 8);
  return `${foreground ? 38 : 48};5;${value}`;
}

function rgbCode(value: number, foreground: boolean): string {
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;
  return `${foreground ? 38 : 48};2;${red};${green};${blue}`;
}

function cellStyle(cell: TerminalCell | undefined): string {
  if (!cell) return '';
  const codes: string[] = [];
  if (cell.isBold()) codes.push('1');
  if (cell.isDim()) codes.push('2');
  if (cell.isItalic()) codes.push('3');
  if (cell.isUnderline()) codes.push('4');
  if (cell.isBlink()) codes.push('5');
  if (cell.isInverse()) codes.push('7');
  if (cell.isInvisible()) codes.push('8');
  if (cell.isStrikethrough()) codes.push('9');
  if (cell.isFgRGB()) codes.push(rgbCode(cell.getFgColor(), true));
  else if (cell.isFgPalette()) codes.push(paletteCode(cell.getFgColor(), true));
  if (cell.isBgRGB()) codes.push(rgbCode(cell.getBgColor(), false));
  else if (cell.isBgPalette()) codes.push(paletteCode(cell.getBgColor(), false));
  return codes.join(';');
}

function serializeViewport(terminal: Terminal): string {
  const buffer = terminal.buffer.active;
  const startRow = buffer.baseY;
  const rows: string[] = [];
  let lastMeaningfulRow = buffer.cursorY;

  for (let y = 0; y < terminal.rows; y += 1) {
    const line = buffer.getLine(startRow + y);
    if (!line) {
      rows.push('');
      continue;
    }

    let lastMeaningfulColumn = -1;
    for (let x = 0; x < line.length; x += 1) {
      const cell = line.getCell(x);
      if (cell && cell.getWidth() > 0 && (cell.getChars() || !cell.isAttributeDefault())) {
        lastMeaningfulColumn = x;
      }
    }
    if (y === buffer.cursorY) {
      lastMeaningfulColumn = Math.max(lastMeaningfulColumn, Math.min(buffer.cursorX - 1, terminal.cols - 1));
    }
    if (lastMeaningfulColumn >= 0) lastMeaningfulRow = Math.max(lastMeaningfulRow, y);

    const parts: string[] = [];
    let activeStyle = '';
    for (let x = 0; x <= lastMeaningfulColumn; x += 1) {
      const cell = line.getCell(x);
      if (!cell || cell.getWidth() === 0) continue;
      const nextStyle = cellStyle(cell);
      if (nextStyle !== activeStyle) {
        parts.push(nextStyle ? `\x1b[0;${nextStyle}m` : '\x1b[0m');
        activeStyle = nextStyle;
      }
      parts.push(cell.getChars() || ' ');
    }
    if (activeStyle) parts.push('\x1b[0m');
    rows.push(parts.join(''));
  }

  return rows.slice(0, lastMeaningfulRow + 1).join('\n');
}

/**
 * Replay PTY output through xterm's parser and replace output chunks with
 * deterministic viewport snapshots. Stdin events remain available for typing
 * animation while the real PTY echo is represented by the following snapshot.
 */
export async function buildTerminalSnapshotEvents(
  events: TerminalEvent[],
  options: { cols: number; rows: number; scrollback?: number }
): Promise<TerminalEvent[]> {
  const terminal = new Terminal({
    cols: options.cols,
    rows: options.rows,
    scrollback: options.scrollback ?? 1000,
    allowProposedApi: true,
    logLevel: 'off',
  });
  const result: TerminalEvent[] = [];
  let previousSnapshot: string | undefined;

  try {
    const sorted = [...events].sort((a, b) => a.timeMs - b.timeMs);
    for (const event of sorted) {
      if (event.kind === 'stdin') {
        result.push({ ...event });
        continue;
      }

      await writeAsync(terminal, event.text);
      const snapshot = serializeViewport(terminal);
      if (snapshot === previousSnapshot) continue;
      previousSnapshot = snapshot;
      result.push({
        timeMs: event.timeMs,
        kind: event.kind,
        text: snapshot,
        snapshot: true,
        grid: serializeGrid(terminal),
      });
    }
  } finally {
    terminal.dispose();
  }

  return coalesceTerminalSnapshotBursts(result);
}

export function coalesceTerminalSnapshotBursts(
  events: TerminalEvent[],
  maximumGapMs = 250
): TerminalEvent[] {
  const result: TerminalEvent[] = [];
  let inputBurst = false;
  for (const event of events) {
    const previous = result[result.length - 1];
    if (event.kind === 'stdin') {
      inputBurst = true;
      result.push(event);
      continue;
    }
    if (
      inputBurst &&
      event.snapshot &&
      previous?.snapshot &&
      event.timeMs - previous.timeMs <= maximumGapMs
    ) {
      result[result.length - 1] = event;
    } else {
      if (previous?.snapshot && event.timeMs - previous.timeMs > maximumGapMs) {
        inputBurst = false;
      }
      result.push(event);
    }
  }
  return result;
}

/**
 * Give meaningful TUI states enough screen time to be readable. Raw PTY
 * timestamps often contain complete startup and command screens only a few
 * hundred milliseconds apart, which otherwise looks like a flash followed by
 * a frozen final screen.
 */
export function scheduleTerminalSnapshotEvents(
  events: TerminalEvent[],
  options: { minimumSnapshotMs?: number; maximumGapMs?: number } = {}
): { events: TerminalEvent[]; durationMs: number; mapTime: (sourceTimeMs: number) => number } {
  const minimumSnapshotMs = options.minimumSnapshotMs ?? 900;
  const maximumGapMs = options.maximumGapMs ?? 1800;
  const sorted = [...events].sort((a, b) => a.timeMs - b.timeMs);
  if (sorted.length === 0) {
    return { events: [], durationMs: 1, mapTime: () => 0 };
  }

  const scheduled: TerminalEvent[] = [];
  const anchors: Array<{ sourceTimeMs: number; scheduledTimeMs: number }> = [];
  let previousSourceTime = sorted[0].timeMs;
  let scheduledTime = Math.min(previousSourceTime, maximumGapMs);
  let previousMinimumHoldMs = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const event = sorted[index];
    if (index > 0) {
      const sourceGap = Math.max(0, event.timeMs - previousSourceTime);
      scheduledTime += Math.max(previousMinimumHoldMs, Math.min(sourceGap, maximumGapMs));
    }
    scheduled.push({ ...event, timeMs: Math.round(scheduledTime) });
    anchors.push({ sourceTimeMs: event.timeMs, scheduledTimeMs: Math.round(scheduledTime) });
    previousSourceTime = event.timeMs;
    previousMinimumHoldMs = event.snapshot ? minimumSnapshotMs : event.transient ? 800 : 0;
  }

  const mapTime = (sourceTimeMs: number): number => {
    let previous = anchors[0];
    for (let index = 1; index < anchors.length; index += 1) {
      const next = anchors[index];
      if (sourceTimeMs <= next.sourceTimeMs) {
        const sourceSpan = next.sourceTimeMs - previous.sourceTimeMs;
        if (sourceSpan <= 0) return next.scheduledTimeMs;
        const progress = Math.max(
          0,
          Math.min(1, (sourceTimeMs - previous.sourceTimeMs) / sourceSpan)
        );
        return Math.round(
          previous.scheduledTimeMs +
            (next.scheduledTimeMs - previous.scheduledTimeMs) * progress
        );
      }
      previous = next;
    }
    return Math.round(
      previous.scheduledTimeMs +
        Math.min(Math.max(0, sourceTimeMs - previous.sourceTimeMs), maximumGapMs)
    );
  };

  return {
    events: scheduled,
    durationMs: Math.round(scheduledTime + minimumSnapshotMs),
    mapTime,
  };
}
