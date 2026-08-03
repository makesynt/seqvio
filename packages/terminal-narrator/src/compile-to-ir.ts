/**
 * Compile a TerminalCaptureManifest into an ExplainerDocument IR.
 *
 * Applies the terminal timing pipeline (mergeTerminalEvents ->
 * buildTerminalSnapshotEvents -> scheduleTerminalSnapshotEvents) but produces a
 * TerminalSceneSpec IR instead of hand-stringing tsx. The per-step narration
 * (timed) is emitted as an audio manifest alongside the IR - IR scene.narration
 * is a single per-scene string, but terminal needs per-step timed cues.
 *
 * AI explain: if a NarrationProvider is supplied, narration is generated from
 * each step's captured real state (stdout etc.), replacing the label fallback.
 * groundTruth is carried from the manifest onto the document.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  ExplainerDocument,
  TerminalSceneSpec,
  NarrationCue,
  CaptionCue,
} from '@seqvio/core';
import type {
  CompileOptions,
  ExplainerDocumentSeed,
  TerminalCaptureManifest,
} from '@seqvio/capture';
import { buildTerminalSnapshotEvents, scheduleTerminalSnapshotEvents } from './terminal-state';
import { mergeTerminalEvents } from './event-utils';
import type { TerminalEvent } from './types';
import { DEFAULT_TRAILING_HOLD_MS } from './constants';

function mapEventsToSchema(events: TerminalEvent[]): TerminalSceneSpec['events'] {
  return events.map((event) => ({
    timeMs: event.timeMs,
    kind: event.kind,
    text: event.text,
    transient: event.transient,
    snapshot: event.snapshot,
    raw: event.raw,
    grid: event.grid
      ? {
          cols: event.grid.cols,
          rows: event.grid.rows,
          cursorX: event.grid.cursorX,
          cursorY: event.grid.cursorY,
          lines: event.grid.lines.map((row) =>
            row.map((cell) => ({
              x: cell.x,
              chars: cell.chars,
              width: cell.width,
              foreground: cell.foreground,
              background: cell.background,
              bold: cell.bold,
              dim: cell.dim,
              italic: cell.italic,
              underline: cell.underline,
              inverse: cell.inverse,
              invisible: cell.invisible,
              strikethrough: cell.strikethrough,
            }))
          ),
        }
      : undefined,
  }));
}

export async function compileTerminalCapture(
  manifest: TerminalCaptureManifest,
  options?: CompileOptions
): Promise<ExplainerDocumentSeed> {
  // 1. Timing: compress -> snapshot -> schedule.
  const events = manifest.events as unknown as TerminalEvent[];
  const compressed = mergeTerminalEvents(events, 1100);
  const rendered = await buildTerminalSnapshotEvents(compressed, {
    cols: manifest.cols,
    rows: manifest.rows,
    scrollback: manifest.cols * manifest.rows * 2,
  });
  const timeline = scheduleTerminalSnapshotEvents(rendered, {
    minimumSnapshotMs: manifest.timingOptions?.minimumSnapshotMs,
    maximumGapMs: manifest.timingOptions?.maximumGapMs,
  });
  const durationMs = Math.max(timeline.durationMs, DEFAULT_TRAILING_HOLD_MS);

  // 2. Steps mapped onto the scheduled timeline.
  const steps = manifest.steps.map((step) => ({
    id: step.id,
    label: step.label,
    timeMs: timeline.mapTime(step.timeMs),
  }));

  // 3. Per-step narration (AI explain or label fallback).
  const narration: NarrationCue[] = [];
  const captions: CaptionCue[] = [];
  const explanationCues: NonNullable<TerminalSceneSpec['explanation']>['cues'] = [];
  const explanationBeats: NonNullable<TerminalSceneSpec['explanation']>['beats'] = [];
  for (let i = 0; i < manifest.steps.length; i += 1) {
    const step = manifest.steps[i];
    const startMs = Math.max(0, timeline.mapTime(step.timeMs));
    const endMs = Math.min(
      durationMs,
      i + 1 < manifest.steps.length
        ? timeline.mapTime(manifest.steps[i + 1].timeMs)
        : durationMs
    );
    const text = options?.narration
      ? await options.narration.narrate(step, manifest)
      : step.label;
    narration.push({
      id: `terminal.${step.id}`,
      sceneId: 'terminal',
      text,
      startMs,
      endMs: Math.max(startMs + 250, endMs),
    });
    captions.push({
      id: `cap-${step.id}`,
      sceneId: 'terminal',
      text: step.label,
      startMs,
      endMs: Math.max(startMs + 250, endMs),
    });
    explanationCues.push({ id: step.id, text });
    explanationBeats.push({
      id: `beat-${step.id}`,
      cueId: step.id,
      anchor: { text },
      visuals: [{ targetId: step.id, action: 'focus' }],
      evidence: { captureStepId: step.id },
    });
  }

  // 4. TerminalSceneSpec IR. Per-step narration lives in the audio manifest, not
  //    scene.narration (IR scene.narration is one string; terminal needs cues).
  const scene: TerminalSceneSpec = {
    type: 'terminal',
    id: 'terminal',
    events: mapEventsToSchema(timeline.events),
    steps,
    cols: manifest.cols,
    rows: manifest.rows,
    maxLines: manifest.maxLines,
    renderOptions: manifest.renderOptions,
    explanation: explanationCues.length > 0
      ? { cues: explanationCues, beats: explanationBeats }
      : undefined,
  };

  // 5. Executable explainer IR.
  const document: ExplainerDocument = {
    format: 'seqvio-explainer',
    schemaVersion: '1.0',
    id: `terminal-capture-${manifest.name}`,
    width: manifest.viewport.width,
    height: manifest.viewport.height,
    fps: manifest.renderFps,
    scenes: [scene],
  };

  // 6. Audio manifest (per-step timed narration) - written if jobDir is provided.
  let audioManifestPath: string | undefined;
  if (options?.jobDir) {
    const fps = manifest.renderFps;
    const duration = Math.max(1, Math.ceil((durationMs / 1000) * fps));
    const audio = {
      fps,
      lockToAudio: true,
      duration,
      narration,
      captions,
      sceneTimings: [{
        sceneId: 'terminal',
        startFrame: 0,
        durationFrames: duration,
        sourceDurationFrames: duration,
        highlights: steps.map((step, index) => ({
          id: `terminal.beat-${step.id}`,
          source: 'beat',
          startFrame: Math.round((step.timeMs / 1000) * fps),
          endFrame: index + 1 < steps.length
            ? Math.round((steps[index + 1].timeMs / 1000) * fps)
            : duration,
          minDurationFrames: Math.ceil(0.9 * fps),
        })),
      }],
      explanationBeats: explanationBeats.map((beat) => ({
        id: `terminal.${beat.id}`,
        sceneId: 'terminal',
        cueId: `terminal.${beat.cueId}`,
        anchor: beat.anchor,
        sourceFrame: Math.round((steps.find((step) => step.id === beat.evidence?.captureStepId)?.timeMs ?? 0) / 1000 * fps),
        visuals: beat.visuals,
      })),
    };
    fs.mkdirSync(options.jobDir, { recursive: true });
    audioManifestPath = path.join(options.jobDir, 'audio-manifest.json');
    fs.writeFileSync(audioManifestPath, `${JSON.stringify(audio, null, 2)}\n`, 'utf8');
  }

  return { document, audioManifestPath };
}
