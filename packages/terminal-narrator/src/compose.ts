import * as fs from 'node:fs';
import * as path from 'node:path';
import { render } from '@seqvio/renderer';
import type { RenderableMeta } from '@seqvio/core';

import {
  DEFAULT_TRAILING_HOLD_MS,
  DEFAULT_TYPING_CPS,
  INLINE_EVENTS_THRESHOLD,
} from './constants';
import type {
  PipelineProgress,
  TerminalEvent,
  TerminalNarratorPlan,
  TerminalRecordingManifest,
} from './types';
import type { CaptionCue, NarrationCue } from '@seqvio/core';
import { normalizeTerminalText, refineStepTimings, type RefinedStep } from './timing';
import { buildTerminalSnapshotEvents, scheduleTerminalSnapshotEvents } from './terminal-state';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function normalizeText(input: string): string {
  return normalizeTerminalText(input).replace(/\n{3,}/g, '\n\n').trim();
}

function firstNonEmptyLine(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines[0] : null;
}

function truncate(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
}

const BOX_DRAWING_RE = /[│─└┌┐┘┃━┗┓┛┏┳┻┫┣╋┠┨┯┷┼╂]/;

function isUiChromeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  let boxCount = 0;
  for (const ch of trimmed) {
    if (BOX_DRAWING_RE.test(ch)) boxCount += 1;
  }
  return boxCount / trimmed.length > 0.5;
}

/**
 * Merge adjacent stdout/stderr events to reduce payload size without losing
 * content or breaking ANSI state. stdin events are kept separate.
 */
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
        // Keep the earliest timeMs.
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

function pickStdoutSnippet(
  events: TerminalEvent[],
  command: string | null,
  echoFound: boolean,
  startMs: number,
  endMs: number
): string | null {
  const segment = events
    .filter(
      (e) =>
        e.kind === 'stdout' &&
        e.timeMs >= startMs &&
        e.timeMs < endMs &&
        typeof e.text === 'string'
    )
    .map((e) => e.text)
    .join('');

  const lines = normalizeText(segment)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !isUiChromeLine(l));

  const needle = command?.trim() ?? '';
  for (const line of lines) {
    if (echoFound && needle && (line === needle || line.endsWith(needle))) continue;
    return truncate(line, 90);
  }
  return firstNonEmptyLine(lines.join('\n'));
}

function narrationText(baseText: string, snippet: string | null, locale: 'zh' | 'en'): string {
  if (snippet) {
    return locale === 'zh'
      ? `${baseText}。关键输出：${snippet}`
      : `${baseText}. Key output: ${snippet}`;
  }
  return locale === 'zh' ? `${baseText}。` : `${baseText}.`;
}

function buildNarrationAndCaptions(
  manifest: TerminalRecordingManifest,
  steps: RefinedStep[],
  locale: 'zh' | 'en'
): {
  narration: NarrationCue[];
  captions: CaptionCue[];
} {
  const events = manifest.events ?? [];
  const durationMs = manifest.durationMs;

  const narration: NarrationCue[] = [];
  const captions: CaptionCue[] = [];

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const startMs = Math.max(0, step.timeMs);
    const endMs = Math.min(durationMs, i + 1 < steps.length ? steps[i + 1].timeMs : durationMs);

    const stdinCommand = events
      .filter(
        (e) =>
          e.kind === 'stdin' &&
          e.timeMs >= step.inputTimeMs - 5 &&
          e.timeMs <= step.inputTimeMs + 5
      )
      .map((e) => e.text.replace(/^\$\s*/, '').trim())
      .find(Boolean) ?? null;

    const snippet = pickStdoutSnippet(
      events,
      stdinCommand ?? step.command,
      step.echoFound,
      startMs,
      endMs
    );

    const baseText = step.label.trim();
    const text = narrationText(baseText, snippet, locale);

    narration.push({
      id: step.id || `step-${i + 1}`,
      sceneId: 'terminal',
      text,
      startMs,
      endMs: Math.max(startMs + 250, endMs),
    });

    captions.push({
      id: `cap-${step.id || `step-${i + 1}`}`,
      sceneId: 'terminal',
      text: snippet ? snippet : baseText,
      startMs,
      endMs: Math.max(startMs + 250, endMs),
    });
  }

  if (steps.length === 0) {
    const fallback = locale === 'zh' ? '开始演示。' : 'Starting demo.';
    narration.push({
      id: 'intro',
      sceneId: 'terminal',
      text: fallback,
      startMs: 0,
      endMs: durationMs,
    });
    captions.push({
      id: 'cap-intro',
      sceneId: 'terminal',
      text: fallback,
      startMs: 0,
      endMs: durationMs,
    });
  }

  return { narration, captions };
}

function safeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'recording';
}

export interface CompositionArtifacts {
  componentPath: string;
  audioManifestPath: string;
}

export async function writeComposition(
  manifest: TerminalRecordingManifest,
  jobDir: string,
  plan: TerminalNarratorPlan,
  onProgress?: (progress: PipelineProgress) => void
): Promise<CompositionArtifacts> {
  onProgress?.({ phase: 'composing', percent: 0, message: 'Composing TSX' });

  const componentPath = path.join(jobDir, 'composition.tsx');

  const FPS = manifest.renderFps;
  const width = manifest.viewport.width;
  const height = manifest.viewport.height;
  const typingCps = plan.typingCps ?? DEFAULT_TYPING_CPS;
  const locale = plan.narrationLocale ?? 'en';

  const compressedEvents = mergeTerminalEvents(manifest.events, 1100);
  const renderedEvents = await buildTerminalSnapshotEvents(compressedEvents, {
    cols: manifest.cols,
    rows: manifest.rows,
    scrollback: manifest.maxLines,
  });
  const scheduledTimeline = scheduleTerminalSnapshotEvents(renderedEvents, {
    minimumSnapshotMs: plan.minSnapshotMs,
    maximumGapMs: plan.idleTimeLimitMs,
  });
  const renderedDurationMs = Math.max(
    scheduledTimeline.durationMs,
    plan.trailingHoldMs ?? DEFAULT_TRAILING_HOLD_MS
  );
  const DURATION_FRAMES = Math.max(1, Math.ceil((renderedDurationMs / 1000) * FPS));
  const refinedSteps = refineStepTimings(manifest);
  const sourceNarrationAndCaptions = buildNarrationAndCaptions(manifest, refinedSteps, locale);
  const remapNarration = (cue: NarrationCue): NarrationCue => {
    const startMs = cue.startMs ?? 0;
    const endMs = cue.endMs ?? renderedDurationMs;
    return {
      ...cue,
      startMs: Math.min(renderedDurationMs, scheduledTimeline.mapTime(startMs)),
      endMs: Math.min(
        renderedDurationMs,
        Math.max(
          scheduledTimeline.mapTime(startMs) + 250,
          scheduledTimeline.mapTime(endMs)
        )
      ),
    };
  };
  const remapCaption = (cue: CaptionCue): CaptionCue => {
    const startMs = cue.startMs ?? 0;
    const endMs = cue.endMs ?? renderedDurationMs;
    return {
      ...cue,
      startMs: Math.min(renderedDurationMs, scheduledTimeline.mapTime(startMs)),
      endMs: Math.min(
        renderedDurationMs,
        Math.max(
          scheduledTimeline.mapTime(startMs) + 250,
          scheduledTimeline.mapTime(endMs)
        )
      ),
    };
  };
  const narrationAndCaptions = {
    narration: sourceNarrationAndCaptions.narration.map(remapNarration),
    captions: sourceNarrationAndCaptions.captions.map(remapCaption),
  };
  const stepsForDemo = refinedSteps.map(({ id, label, timeMs }) => ({
    id,
    label,
    timeMs: scheduledTimeline.mapTime(timeMs),
  }));

  const meta: RenderableMeta = {
    fps: FPS,
    duration: DURATION_FRAMES,
    width,
    height,
    audio: {
      fps: FPS,
      lockToAudio: true,
      duration: DURATION_FRAMES,
      narration: narrationAndCaptions.narration,
      captions: narrationAndCaptions.captions,
    },
  };

  const eventsJson = JSON.stringify(scheduledTimeline.events, null, 2).replace(/\\u2028/g, '\\\\u2028');
  const eventsLiteral =
    eventsJson.length > INLINE_EVENTS_THRESHOLD
      ? null
      : eventsJson;

  let eventsImport = '';
  let eventsReference = '';
  if (eventsLiteral) {
    eventsReference = `const EVENTS = ${eventsLiteral};`;
  } else {
    const eventsModulePath = path.join(jobDir, 'events.js');
    fs.writeFileSync(
      eventsModulePath,
      `export const EVENTS = ${eventsJson};\n`,
      'utf8'
    );
    eventsImport = `import { EVENTS } from './events.js';`;
    eventsReference = '';
  }

  const title = plan.name || 'Terminal demo';
  const compositionId = `terminal-recording-${safeSlug(plan.name)}`;

  const source = `import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene } from '@seqvio/core';
import { TerminalXtermDemo } from '@seqvio/technical';
${eventsImport}

const WIDTH = ${width};
const HEIGHT = ${height};
const FPS = ${FPS};
const DURATION = ${DURATION_FRAMES};
${eventsReference}
const STEPS = ${JSON.stringify(stepsForDemo, null, 2)};
const PRESENTATION = ${JSON.stringify(plan.presentation ?? 'vhs')};
const MAX_LINES = ${manifest.maxLines};
const COLS = ${manifest.cols};
const ROWS = ${manifest.rows};

export default function TerminalRecording() {
  return (
    <VideoComposition
      id="${compositionId}"
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      duration={DURATION}
      backgroundColor="#070B14"
      audio={meta.audio}
    >
      <Scene id="terminal" duration={DURATION}>
        <TerminalXtermDemo
          id="terminal-demo"
          title=${JSON.stringify(title)}
          events={EVENTS}
          steps={STEPS}
          width={WIDTH}
          height={HEIGHT}
          maxLines={MAX_LINES}
          cols={COLS}
          rows={ROWS}
          presentation={PRESENTATION}
          typingCps={${typingCps}}
          zoomOnInput={${plan.zoomOnInput ?? true}}
          maxZoom={${plan.maxZoom ?? 2.2}}
          zoomTransitionMs={${plan.zoomTransitionMs ?? 480}}
          zoomHoldMs={${plan.zoomHoldMs ?? 220}}
        />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = ${JSON.stringify(meta, null, 2)};
`;

  const audioManifestPath = path.join(jobDir, 'audio-manifest.json');
  fs.writeFileSync(componentPath, source, 'utf8');
  fs.writeFileSync(
    audioManifestPath,
    `${JSON.stringify(meta.audio, null, 2)}\n`,
    'utf8'
  );
  onProgress?.({ phase: 'composing', percent: 90, message: 'TSX and audio manifest written' });
  return { componentPath, audioManifestPath };
}

export async function renderRecording(
  component: string,
  manifest: TerminalRecordingManifest,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
  audioManifest?: string
): Promise<string> {
  onProgress?.({ phase: 'rendering', percent: 0, message: 'Rendering frames' });
  const output = path.join(jobDir, 'final.mp4');
  const width = manifest.viewport.width;
  const height = manifest.viewport.height;

  await render(
    {
      component,
      output,
      width,
      height,
      fps: manifest.renderFps,
      quality: 'medium',
      pixelRatio: 1,
      frameFormat: 'jpeg',
      jpegQuality: 88,
      workers: 1,
      audioManifest,
      burnCaptions: Boolean(audioManifest),
    },
    (renderProgress) => {
      const percentBase =
        renderProgress.phase === 'rendering' ? 0 : renderProgress.phase === 'encoding' ? 60 : 75;
      const pct = renderProgress.percent ?? 0;
      const percent = percentBase + Math.round(clamp01(pct / 100) * 25);
      onProgress?.({
        phase: 'rendering',
        percent,
        message: renderProgress.message,
      });
    }
  );
  return output;
}
