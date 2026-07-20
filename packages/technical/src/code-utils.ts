import { technicalCodeTheme } from './theme';

export interface HighlightToken {
  text: string;
  color: string;
}

const KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
  'false', 'finally', 'for', 'from', 'function', 'get', 'if', 'implements',
  'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null', 'of',
  'package', 'private', 'protected', 'public', 'return', 'set', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof',
  'undefined', 'var', 'void', 'while', 'with', 'yield',
]);

const TYPE_HINTS = new Set([
  'string', 'number', 'boolean', 'any', 'unknown', 'never', 'object', 'symbol',
  'bigint', 'Record', 'Partial', 'Required', 'Readonly', 'Array', 'Promise',
  'Map', 'Set', 'Error',
]);

export function highlightLine(line: string, language: string): HighlightToken[] {
  if (language === 'plain' || line.length === 0) {
    return [{ text: line || ' ', color: technicalCodeTheme.plain }];
  }

  const tokens: HighlightToken[] = [];
  let i = 0;
  while (i < line.length) {
    if (line.slice(i, i + 2) === '//') {
      tokens.push({ text: line.slice(i), color: technicalCodeTheme.comment });
      break;
    }
    if (line.slice(i, i + 2) === '/*') {
      const end = line.indexOf('*/', i + 2);
      const j = end >= 0 ? end + 2 : line.length;
      tokens.push({ text: line.slice(i, j), color: technicalCodeTheme.comment });
      i = j;
      continue;
    }
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      tokens.push({ text: line.slice(i, j), color: technicalCodeTheme.string });
      i = j;
      continue;
    }
    const wordMatch = /^[A-Za-z_$][\w$]*/.exec(line.slice(i));
    if (wordMatch) {
      const word = wordMatch[0];
      const next = line[i + word.length];
      const isFunction = next === '(';
      const color = KEYWORDS.has(word)
        ? technicalCodeTheme.keyword
        : TYPE_HINTS.has(word)
          ? technicalCodeTheme.keyword
          : isFunction
            ? technicalCodeTheme.function
            : technicalCodeTheme.plain;
      tokens.push({ text: word, color });
      i += word.length;
      continue;
    }
    const numberMatch = /^[0-9]+(\.[0-9]+)?/.exec(line.slice(i));
    if (numberMatch) {
      tokens.push({ text: numberMatch[0], color: technicalCodeTheme.number });
      i += numberMatch[0].length;
      continue;
    }
    tokens.push({ text: line[i], color: technicalCodeTheme.plain });
    i += 1;
  }
  return tokens.length > 0 ? tokens : [{ text: ' ', color: technicalCodeTheme.plain }];
}

export function splitSourceLines(source: string): string[] {
  const normalized = source.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  return lines.length > 0 ? lines : [''];
}

export interface LineRange {
  startLine: number;
  endLine: number;
}

export type CodeStep =
  | { at: number; action: 'type'; range?: LineRange }
  | { at: number; action: 'focus'; range: LineRange }
  | { at: number; action: 'insert'; line: number; text: string }
  | { at: number; action: 'replace'; range: LineRange; text: string }
  | { at: number; action: 'delete'; range: LineRange }
  | { at: number; action: 'annotate'; targetId: string; text: string };

/** A source line with an identity that survives insert/delete of other lines. */
export interface CodeLineRecord {
  id: string;
  text: string;
  /** 1-based display line number after applying edits up to the current frame. */
  lineNumber: number;
}

let lineIdCounter = 0;

export function resetLineIdCounter(seed = 0): void {
  lineIdCounter = seed;
}

function nextLineId(prefix = 'L'): string {
  lineIdCounter += 1;
  return `${prefix}${lineIdCounter}`;
}

export function createLineRecords(source: string, idPrefix = 'L'): CodeLineRecord[] {
  return splitSourceLines(source).map((text, index) => ({
    id: `${idPrefix}${index + 1}`,
    text,
    lineNumber: index + 1,
  }));
}

function renumber(lines: CodeLineRecord[]): CodeLineRecord[] {
  return lines.map((line, index) => ({
    ...line,
    lineNumber: index + 1,
  }));
}

function splitInsertLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n');
  // Trailing newline means "end of last line", not an extra empty line.
  const trimmed = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;
  return trimmed.length === 0 ? [''] : trimmed.split('\n');
}

export function applyCodeSteps(source: string, steps: CodeStep[], frame: number): {
  lines: string[];
  records: CodeLineRecord[];
  focusRange?: LineRange;
  focusLineIds: string[];
  typedChars: Map<string, number>;
  annotations: Array<{ targetId: string; text: string }>;
} {
  let records = createLineRecords(source);
  let focusRange: LineRange | undefined;
  let focusLineIds: string[] = [];
  const typedChars = new Map<string, number>();
  const annotations: Array<{ targetId: string; text: string }> = [];

  const sorted = [...steps].sort((a, b) => a.at - b.at);
  for (const step of sorted) {
    if (frame < step.at) continue;
    switch (step.action) {
      case 'focus': {
        focusRange = step.range;
        focusLineIds = records
          .filter(
            (line) =>
              line.lineNumber >= step.range.startLine &&
              line.lineNumber <= step.range.endLine
          )
          .map((line) => line.id);
        break;
      }
      case 'insert': {
        const index = Math.max(0, Math.min(records.length, step.line - 1));
        const insertLines = splitInsertLines(step.text).map((text) => ({
          id: nextLineId('I'),
          text,
          lineNumber: 0,
        }));
        records = renumber([
          ...records.slice(0, index),
          ...insertLines,
          ...records.slice(index),
        ]);
        break;
      }
      case 'replace': {
        const start = Math.max(1, step.range.startLine);
        const end = Math.min(records.length, step.range.endLine);
        const keptIds = records
          .slice(start - 1, end)
          .map((line) => line.id);
        const replacement = splitInsertLines(step.text).map((text, index) => ({
          id: keptIds[index] ?? nextLineId('R'),
          text,
          lineNumber: 0,
        }));
        records = renumber([
          ...records.slice(0, start - 1),
          ...replacement,
          ...records.slice(end),
        ]);
        break;
      }
      case 'delete': {
        const start = Math.max(1, step.range.startLine);
        const end = Math.min(records.length, step.range.endLine);
        records = renumber([
          ...records.slice(0, start - 1),
          ...records.slice(end),
        ]);
        break;
      }
      case 'type': {
        const range = step.range ?? { startLine: 1, endLine: records.length };
        for (const line of records) {
          if (line.lineNumber < range.startLine || line.lineNumber > range.endLine) {
            continue;
          }
          const elapsed = frame - step.at;
          const chars = Math.min(
            line.text.length,
            Math.max(0, Math.floor(elapsed / 2))
          );
          typedChars.set(line.id, chars);
        }
        break;
      }
      case 'annotate':
        annotations.push({ targetId: step.targetId, text: step.text });
        break;
      default:
        break;
    }
  }

  return {
    lines: records.map((line) => line.text),
    records,
    focusRange,
    focusLineIds,
    typedChars,
    annotations,
  };
}
