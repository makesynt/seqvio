import type { TerminalEvent } from './types';

/** Merge adjacent output events without changing stdin or ANSI ordering. */
export function mergeTerminalEvents(
  events: TerminalEvent[],
  maxEvents: number
): TerminalEvent[] {
  if (events.length <= maxEvents) return events;
  const sorted = [...events].sort((a, b) => a.timeMs - b.timeMs);
  let thresholdMs = 16;

  while (true) {
    const merged: TerminalEvent[] = [];
    for (const event of sorted) {
      const last = merged[merged.length - 1];
      if (
        last &&
        last.kind === event.kind &&
        event.kind !== 'stdin' &&
        event.timeMs - last.timeMs <= thresholdMs
      ) {
        last.text += event.text;
      } else {
        merged.push({ ...event });
      }
    }
    if (merged.length <= maxEvents || thresholdMs >= 2000) {
      return merged;
    }
    thresholdMs *= 2;
  }
}
