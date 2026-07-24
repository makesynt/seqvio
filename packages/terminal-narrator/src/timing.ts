import { applySimpleTerminalRewrites, stripAnsi } from '@seqvio/technical';

import type { TerminalEvent, TerminalRecordingManifest } from './types';

export interface RefinedStep {
  id: string;
  label: string;
  /** Aligned to stdout command echo / first meaningful output when possible. */
  timeMs: number;
  /** Original stdin-write timestamp from recording. */
  inputTimeMs: number;
  /** Whether the command echo was found in stdout. */
  echoFound: boolean;
  /** The command text extracted from stdin, if any. */
  command: string | null;
}

export function normalizeTerminalText(input: string): string {
  return stripAnsi(applySimpleTerminalRewrites(input))
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ');
}

export function extractCommandFromStdin(text: string): string | null {
  const normalized = normalizeTerminalText(text).trim();
  const command = normalized.replace(/^\$\s*/, '').trim();
  return command.length > 0 ? command : null;
}

function findStepCommand(
  step: { id: string; timeMs: number },
  events: TerminalEvent[],
  nextStepMs: number
): string | null {
  const stdinNear = events
    .filter(
      (e) =>
        e.kind === 'stdin' &&
        e.timeMs >= step.timeMs - 5 &&
        e.timeMs < nextStepMs
    )
    .sort((a, b) => Math.abs(a.timeMs - step.timeMs) - Math.abs(b.timeMs - step.timeMs));

  for (const event of stdinNear) {
    const command = extractCommandFromStdin(event.text);
    if (command) return command;
  }
  return null;
}

/**
 * Find the first stdout chunk (after stdin write) that echoes the typed command.
 */
export function findCommandEchoTimeMs(
  events: TerminalEvent[],
  command: string,
  searchFromMs: number,
  searchUntilMs: number
): number | null {
  const needle = command.trim();
  if (!needle) return null;

  const stdout = events
    .filter(
      (e) =>
        e.kind === 'stdout' &&
        e.timeMs >= searchFromMs &&
        e.timeMs < searchUntilMs
    )
    .sort((a, b) => a.timeMs - b.timeMs);

  for (const event of stdout) {
    const text = normalizeTerminalText(event.text);
    if (text.includes(needle)) {
      return event.timeMs;
    }
  }
  return null;
}

/**
 * Within/after the echo chunk, prefer the first non-empty line that is not the
 * command itself (i.e. the visible result line). Falls back to echo time.
 */
export function findCommandOutputTimeMs(
  events: TerminalEvent[],
  command: string,
  echoMs: number,
  searchUntilMs: number
): number | null {
  const needle = command.trim();
  const stdout = events
    .filter(
      (e) =>
        e.kind === 'stdout' &&
        e.timeMs >= echoMs &&
        e.timeMs < searchUntilMs
    )
    .sort((a, b) => a.timeMs - b.timeMs);

  for (const event of stdout) {
    const lines = normalizeTerminalText(event.text)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (line === needle) continue;
      // Skip prompt-ish leftovers that still contain the command as a suffix.
      if (line.endsWith(needle) && line.length > needle.length + 2) continue;
      // Found a result-looking line in this chunk → align to chunk start.
      if (!line.includes(needle)) {
        return event.timeMs;
      }
    }
  }
  return echoMs;
}

/**
 * Find the first non-empty stdout output after a given timestamp, regardless of
 * whether the command echo was visible. Useful for TUI apps and `stty -echo`.
 */
export function findFirstOutputTimeMs(
  events: TerminalEvent[],
  searchFromMs: number,
  searchUntilMs: number
): number | null {
  const stdout = events
    .filter(
      (e) =>
        e.kind === 'stdout' &&
        e.timeMs >= searchFromMs &&
        e.timeMs < searchUntilMs
    )
    .sort((a, b) => a.timeMs - b.timeMs);

  for (const event of stdout) {
    const text = normalizeTerminalText(event.text);
    if (text.trim().length > 0) {
      return event.timeMs;
    }
  }
  return null;
}

/**
 * Re-time steps from stdin-write moments to stdout echo / first output moments
 * so TerminalDemo highlights and narration cues track visible terminal text.
 */
export function refineStepTimings(manifest: TerminalRecordingManifest): RefinedStep[] {
  const steps = [...(manifest.steps ?? [])].sort((a, b) => a.timeMs - b.timeMs);
  const events = manifest.events ?? [];
  const durationMs = manifest.durationMs;

  return steps.map((step, index) => {
    const nextStepMs =
      index + 1 < steps.length ? steps[index + 1].timeMs : durationMs;
    const inputTimeMs = step.timeMs;
    const command = findStepCommand(step, events, nextStepMs);

    if (!command) {
      const firstOutput = findFirstOutputTimeMs(events, inputTimeMs, nextStepMs);
      const timeMs = firstOutput ?? inputTimeMs;
      return {
        id: step.id,
        label: step.label,
        timeMs: Math.min(Math.max(timeMs, inputTimeMs), Math.max(inputTimeMs, nextStepMs - 1)),
        inputTimeMs,
        echoFound: false,
        command: null,
      };
    }

    const echoMs = findCommandEchoTimeMs(events, command, inputTimeMs, nextStepMs);
    const echoFound = echoMs != null;
    let aligned: number;
    if (echoFound) {
      const outputMs = findCommandOutputTimeMs(events, command, echoMs!, nextStepMs);
      aligned = outputMs ?? echoMs!;
    } else {
      const firstOutput = findFirstOutputTimeMs(events, inputTimeMs, nextStepMs);
      aligned = firstOutput ?? inputTimeMs;
    }

    const upperBound = Math.max(inputTimeMs, nextStepMs - 1);
    const timeMs = Math.min(Math.max(aligned, inputTimeMs), upperBound);

    return {
      id: step.id,
      label: step.label,
      timeMs,
      inputTimeMs,
      echoFound,
      command,
    };
  });
}
