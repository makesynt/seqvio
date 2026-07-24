/**
 * Minimal SGR (Select Graphic Rendition) ANSI → styled span parser.
 * Aimed at Charm VHS / xterm-style demos (16-color + bold/dim/underline/italic).
 */

export interface AnsiStyle {
  color?: string;
  backgroundColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  opacity?: number;
}

export interface AnsiSpan {
  text: string;
  style: AnsiStyle;
}

/** Catppuccin Mocha — common VHS `Set Theme` preset. */
export const VHS_CATPPUCCIN_MOCHA = {
  name: 'Catppuccin Mocha',
  background: '#1e1e2e',
  foreground: '#cdd6f4',
  cursor: '#f5e0dc',
  black: '#45475a',
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  blue: '#89b4fa',
  magenta: '#f5c2e7',
  cyan: '#94e2d5',
  white: '#bac2de',
  brightBlack: '#585b70',
  brightRed: '#f38ba8',
  brightGreen: '#a6e3a1',
  brightYellow: '#f9e2af',
  brightBlue: '#89b4fa',
  brightMagenta: '#f5c2e7',
  brightCyan: '#94e2d5',
  brightWhite: '#a6adc8',
} as const;

export interface VhsTheme {
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

/**
 * VHS default theme (Charm vhs style.go / meowgorithm dotfiles).
 * High-saturation 16-color palette on a neutral #171717 grey background.
 * Bright variants are brighter than normal, giving stronger contrast than
 * Catppuccin Mocha (where bright == normal). This is the signature vhs look.
 */
export const VHS_DEFAULT: VhsTheme = {
  name: 'VHS Default',
  background: '#171717',
  foreground: '#dddddd',
  cursor: '#dddddd',
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
};

const CSI_SGR = /\u001b\[([0-9;]*)m/g;
const OSC = /\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g;
/** CSI sequences that are not SGR (final byte is not `m`). */
const CSI_NON_SGR = /\u001b\[[0-9;?]*[A-Za-ln-z]/g;
const OTHER_ESC = /\u001b[()][0-9A-Za-z]/g;

export function stripAnsi(input: string): string {
  return input
    .replace(CSI_SGR, '')
    .replace(OSC, '')
    .replace(CSI_NON_SGR, '')
    .replace(OTHER_ESC, '');
}

export function visibleLength(input: string): number {
  return stripAnsi(input).length;
}

/**
 * Slice ANSI text by visible character count, preserving complete SGR sequences
 * so partial typing does not leave broken escape codes.
 */
export function sliceAnsiByVisibleChars(input: string, visibleCount: number): string {
  if (visibleCount <= 0) return '';
  let visible = 0;
  let out = '';
  let i = 0;
  while (i < input.length && visible < visibleCount) {
    if (input[i] === '\u001b') {
      const rest = input.slice(i);
      const csiSgr = rest.match(/^\u001b\[[0-9;]*m/);
      const csiOther = rest.match(/^\u001b\[[0-9;?]*[A-Za-ln-z]/);
      const osc = rest.match(/^\u001b\][^\u0007]*(?:\u0007|\u001b\\)/);
      const other = rest.match(/^\u001b[()][0-9A-Za-z]/);
      const seq = csiSgr?.[0] ?? csiOther?.[0] ?? osc?.[0] ?? other?.[0];
      if (seq) {
        out += seq;
        i += seq.length;
        continue;
      }
    }
    out += input[i];
    visible += 1;
    i += 1;
  }
  return out;
}

function paletteColor(theme: VhsTheme, code: number): string | undefined {
  switch (code) {
    case 30:
      return theme.black;
    case 31:
      return theme.red;
    case 32:
      return theme.green;
    case 33:
      return theme.yellow;
    case 34:
      return theme.blue;
    case 35:
      return theme.magenta;
    case 36:
      return theme.cyan;
    case 37:
      return theme.white;
    case 90:
      return theme.brightBlack;
    case 91:
      return theme.brightRed;
    case 92:
      return theme.brightGreen;
    case 93:
      return theme.brightYellow;
    case 94:
      return theme.brightBlue;
    case 95:
      return theme.brightMagenta;
    case 96:
      return theme.brightCyan;
    case 97:
      return theme.brightWhite;
    default:
      return undefined;
  }
}

function paletteBg(theme: VhsTheme, code: number): string | undefined {
  // 40-47 / 100-107
  return paletteColor(theme, code - 10);
}

function applySgr(style: AnsiStyle, params: number[], theme: VhsTheme): AnsiStyle {
  let next: AnsiStyle = { ...style };
  if (params.length === 0) params = [0];

  for (let i = 0; i < params.length; i += 1) {
    const p = params[i];
    if (p === 0) {
      next = {};
      continue;
    }
    if (p === 1) next.fontWeight = 'bold';
    else if (p === 2) next.opacity = 0.72;
    else if (p === 3) next.fontStyle = 'italic';
    else if (p === 4) next.textDecoration = 'underline';
    else if (p === 22) {
      next.fontWeight = 'normal';
      next.opacity = undefined;
    } else if (p === 23) next.fontStyle = 'normal';
    else if (p === 24) next.textDecoration = 'none';
    else if (p === 39) next.color = undefined;
    else if (p === 49) next.backgroundColor = undefined;
    else if ((p >= 30 && p <= 37) || (p >= 90 && p <= 97)) {
      next.color = paletteColor(theme, p);
    } else if ((p >= 40 && p <= 47) || (p >= 100 && p <= 107)) {
      next.backgroundColor = paletteBg(theme, p);
    } else if (p === 38 || p === 48) {
      const isFg = p === 38;
      const mode = params[i + 1];
      if (mode === 5 && params[i + 2] !== undefined) {
        // 256-color: map roughly onto 16-color vibe
        const idx = params[i + 2];
        const mapped = paletteColor(theme, 30 + (idx % 8)) ?? theme.foreground;
        if (isFg) next.color = mapped;
        else next.backgroundColor = mapped;
        i += 2;
      } else if (mode === 2 && params[i + 4] !== undefined) {
        const rgb = `rgb(${params[i + 2]},${params[i + 3]},${params[i + 4]})`;
        if (isFg) next.color = rgb;
        else next.backgroundColor = rgb;
        i += 4;
      }
    }
  }
  return next;
}

/**
 * Parse text containing SGR into styled spans. Non-SGR escapes are dropped.
 */
export function ansiToSpans(
  input: string,
  theme: VhsTheme = VHS_CATPPUCCIN_MOCHA
): AnsiSpan[] {
  const cleaned = input.replace(OSC, '').replace(CSI_NON_SGR, '').replace(OTHER_ESC, '');
  const spans: AnsiSpan[] = [];
  let style: AnsiStyle = {};
  let cursor = 0;
  CSI_SGR.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CSI_SGR.exec(cleaned)) !== null) {
    if (match.index > cursor) {
      const text = cleaned.slice(cursor, match.index);
      if (text) spans.push({ text, style: { ...style } });
    }
    const params = match[1]
      ? match[1].split(';').filter(Boolean).map((n) => Number(n))
      : [0];
    style = applySgr(style, params.map((n) => (Number.isFinite(n) ? n : 0)), theme);
    cursor = match.index + match[0].length;
  }

  if (cursor < cleaned.length) {
    const text = cleaned.slice(cursor);
    if (text) spans.push({ text, style: { ...style } });
  }

  return mergeSpans(spans);
}

function mergeSpans(spans: AnsiSpan[]): AnsiSpan[] {
  if (spans.length === 0) return spans;
  const out: AnsiSpan[] = [{ ...spans[0], style: { ...spans[0].style } }];
  for (let i = 1; i < spans.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = spans[i];
    if (styleKey(prev.style) === styleKey(cur.style)) {
      prev.text += cur.text;
    } else {
      out.push({ text: cur.text, style: { ...cur.style } });
    }
  }
  return out;
}

function styleKey(style: AnsiStyle): string {
  return [
    style.color ?? '',
    style.backgroundColor ?? '',
    style.fontWeight ?? '',
    style.fontStyle ?? '',
    style.textDecoration ?? '',
    style.opacity ?? '',
  ].join('|');
}

interface RewriteCell {
  char: string;
  prefix: string;
}

const TAB_SIZE = 8;

function ensureRow(rows: RewriteCell[][], row: number, col: number): void {
  while (rows.length <= row) {
    rows.push([]);
  }
  const r = rows[row];
  while (r.length <= col) {
    r.push({ char: ' ', prefix: '' });
  }
}

function renderRows(rows: RewriteCell[][]): string {
  const out: string[] = [];
  let currentPrefix = '';
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    // Trim trailing empty cells but keep one if row is empty.
    let last = row.length - 1;
    while (last >= 0 && row[last].char === ' ' && row[last].prefix === '') {
      last -= 1;
    }
    const end = Math.max(0, last);
    for (let c = 0; c <= end; c += 1) {
      const cell = row[c] ?? { char: ' ', prefix: '' };
      if (cell.prefix !== currentPrefix) {
        out.push(cell.prefix);
        currentPrefix = cell.prefix;
      }
      out.push(cell.char);
    }
    if (r + 1 < rows.length) {
      out.push('\n');
    }
  }
  return out.join('');
}

/**
 * Lightweight rewrite of simple terminal control characters / sequences.
 *
 * Handles:
 *   - \r\n and \n as line breaks
 *   - bare \r as return to start of current line (overwrite)
 *   - \b as backspace (overwrite)
 *   - \t as tab expansion
 *   - SGR sequences (preserved per cell)
 *   - EL (erase in line) and ED (erase in display) as clear operations
 *
 * This is NOT a full terminal emulator: cursor movement, scroll regions,
 * and alternate screen are not supported. It is enough to keep progress bars
 * and simple overwrite-based CLI output from exploding into many lines.
 */
export function applySimpleTerminalRewrites(input: string): string {
  const rows: RewriteCell[][] = [[]];
  let row = 0;
  let col = 0;
  let activePrefix = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // CRLF -> newline
    if (ch === '\r' && input[i + 1] === '\n') {
      row += 1;
      col = 0;
      ensureRow(rows, row, 0);
      i += 2;
      continue;
    }

    if (ch === '\n') {
      row += 1;
      col = 0;
      ensureRow(rows, row, 0);
      i += 1;
      continue;
    }

    if (ch === '\r') {
      col = 0;
      i += 1;
      continue;
    }

    if (ch === '\b') {
      col = Math.max(0, col - 1);
      i += 1;
      continue;
    }

    if (ch === '\t') {
      const target = Math.floor(col / TAB_SIZE) * TAB_SIZE + TAB_SIZE;
      ensureRow(rows, row, target);
      col = target;
      i += 1;
      continue;
    }

    if (ch === '') {
      const rest = input.slice(i);

      const sgr = rest.match(/^\[[0-9;]*m/);
      if (sgr) {
        const seq = sgr[0];
        if (seq === '[0m' || seq === '[m') {
          activePrefix = '';
        } else {
          activePrefix += seq;
        }
        i += seq.length;
        continue;
      }

      const cursor = rest.match(/^\[([0-9]*)(?:;([0-9]*))?([ABCDGHf])/);
      if (cursor) {
        const first = Math.max(1, Number(cursor[1] || 1));
        const second = Math.max(1, Number(cursor[2] || 1));
        switch (cursor[3]) {
          case 'A':
            row = Math.max(0, row - first);
            break;
          case 'B':
            row += first;
            break;
          case 'C':
            col += first;
            break;
          case 'D':
            col = Math.max(0, col - first);
            break;
          case 'G':
            col = first - 1;
            break;
          case 'H':
          case 'f':
            row = first - 1;
            col = second - 1;
            break;
        }
        ensureRow(rows, row, col);
        i += cursor[0].length;
        continue;
      }

      const el = rest.match(/^\[([0-2]?)K/);
      if (el) {
        ensureRow(rows, row, col);
        const mode = Number(el[1] || 0);
        if (mode === 2) {
          rows[row] = [];
          col = 0;
        } else if (mode === 1) {
          for (let c = 0; c <= col; c += 1) {
            rows[row][c] = { char: ' ', prefix: '' };
          }
        } else {
          rows[row].length = col;
        }
        i += el[0].length;
        continue;
      }

      const ed = rest.match(/^\[[0-9;]*J/);
      if (ed) {
        rows.length = 0;
        rows.push([]);
        row = 0;
        col = 0;
        activePrefix = '';
        i += ed[0].length;
        continue;
      }

      // Drop other escape sequences (cursor movement, OSC, etc.).
      const osc = rest.match(/^\][^]*(?:|\\)/);
      const csiOther = rest.match(/^\[[0-9;?]*[A-Za-z]/);
      const other = rest.match(/^[()][0-9A-Za-z]/);
      const seq = osc?.[0] ?? csiOther?.[0] ?? other?.[0];
      if (seq) {
        i += seq.length;
        continue;
      }
    }

    ensureRow(rows, row, col);
    rows[row][col] = { char: ch, prefix: activePrefix };
    col += 1;
    i += 1;
  }

  return renderRows(rows);
}

/**
 * Keep only the last `keepLastLines` visible lines of an ANSI string.
 * Preserves SGR sequences inside the kept tail and resets style at the
 * truncation boundary so upstream colors do not leak.
 */
export function sliceAnsiByVisibleLines(input: string, keepLastLines: number): string {
  if (keepLastLines <= 0) return '';
  const lines = input.split('\n');
  if (lines.length <= keepLastLines) return input;
  return `[0m${lines.slice(lines.length - keepLastLines).join('\n')}`;
}

/** Normalize newlines; keep ANSI SGR. */
export function normalizeTerminalNewlines(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
