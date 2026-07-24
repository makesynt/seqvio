import * as fs from 'node:fs';

import type { TerminalEvent, TerminalRecordingManifest } from './types';

export interface AsciinemaHeader {
  version: 2;
  width: number;
  height: number;
  timestamp?: number;
  title?: string;
  env?: Record<string, string>;
}

export type AsciinemaEvent = [number, 'o' | 'i' | 'r' | 'm', string];

/**
 * Convert our timestamped manifest into asciinema cast v2 (NDJSON).
 * Capture-layer compatibility with `asciinema play` and Charm VHS `.tape` inputs.
 */
export function manifestToAsciinemaCast(manifest: TerminalRecordingManifest): string {
  const header: AsciinemaHeader = {
    version: 2,
    width: manifest.cols,
    height: manifest.rows,
    timestamp: Math.floor(Date.now() / 1000),
    title: manifest.name,
    env: {
      TERM: 'xterm-256color',
      SHELL: process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'),
    },
  };

  const lines: string[] = [JSON.stringify(header)];

  const castEvents: AsciinemaEvent[] = [];
  const events = [...(manifest.events ?? [])].sort((a, b) => a.timeMs - b.timeMs);

  for (const event of events) {
    const castEvent = toCastEvent(event);
    if (castEvent) {
      castEvents.push(castEvent);
    }
  }

  // Emit step boundaries as asciinema marker (`m`) events so external players
  // (e.g. `asciinema play --pause-on-markers`) can navigate chapters.
  for (const step of [...(manifest.steps ?? [])]) {
    const seconds = Math.max(0, step.timeMs) / 1000;
    castEvents.push([Number(seconds.toFixed(6)), 'm', step.label]);
  }

  castEvents.sort((a, b) => a[0] - b[0]);

  for (const castEvent of castEvents) {
    lines.push(JSON.stringify(castEvent));
  }

  return `${lines.join('\n')}\n`;
}

function toCastEvent(event: TerminalEvent): AsciinemaEvent | null {
  if (typeof event.text !== 'string' || event.text.length === 0) return null;
  const seconds = Math.max(0, event.timeMs) / 1000;
  if (event.kind === 'stdin') {
    // Backwards compatibility with older manifests that synthesized `$ cmd\n`.
    let payload = event.text.startsWith('$ ')
      ? event.text.slice(2).replace(/\n$/, '')
      : event.text.replace(/\n$/, '');
    if (!payload.endsWith('\r')) {
      payload += '\r';
    }
    return [Number(seconds.toFixed(6)), 'i', payload];
  }
  if (event.kind === 'stdout' || event.kind === 'stderr') {
    return [Number(seconds.toFixed(6)), 'o', event.text];
  }
  return null;
}

export function writeAsciinemaCast(
  manifest: TerminalRecordingManifest,
  castPath: string
): string {
  fs.writeFileSync(castPath, manifestToAsciinemaCast(manifest), 'utf8');
  return castPath;
}

/**
 * Best-effort parse of asciinema cast v2 into our event list (for external captures).
 */
export function parseAsciinemaCast(castSource: string): {
  cols: number;
  rows: number;
  title?: string;
  events: TerminalEvent[];
  durationMs: number;
} {
  const lines = castSource
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    throw new Error('Empty asciinema cast');
  }

  const header = JSON.parse(lines[0]) as AsciinemaHeader;
  if (header.version !== 2) {
    throw new Error(`Unsupported asciinema cast version: ${header.version}`);
  }

  const events: TerminalEvent[] = [];
  let lastMs = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const row = JSON.parse(lines[i]) as AsciinemaEvent;
    const [seconds, kind, text] = row;
    const timeMs = Math.round(Number(seconds) * 1000);
    lastMs = Math.max(lastMs, timeMs);
    if (kind === 'o') {
      events.push({ timeMs, kind: 'stdout', text: String(text) });
    } else if (kind === 'i') {
      const raw = String(text).replace(/\r$/, '');
      events.push({ timeMs, kind: 'stdin', text: raw, transient: true });
    }
  }

  return {
    cols: header.width,
    rows: header.height,
    title: header.title,
    events,
    durationMs: Math.max(1, lastMs + 600),
  };
}
