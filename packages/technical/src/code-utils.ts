export type { HighlightToken } from './highlighter';
export { highlightLine, highlightLineFallback, highlightSource } from './highlighter';

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
        const linesInRange = records.filter(
          (line) =>
            line.lineNumber >= range.startLine && line.lineNumber <= range.endLine
        );
        // Reveal one line at a time: finish the current line before starting the next.
        const framesPerChar = 2;
        let budget = Math.max(0, Math.floor((frame - step.at) / framesPerChar));
        for (const line of linesInRange) {
          if (budget <= 0) {
            typedChars.set(line.id, 0);
            continue;
          }
          const visible = Math.min(line.text.length, budget);
          typedChars.set(line.id, visible);
          budget -= visible;
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
