/**
 * Compile a TerminalCaptureManifest into a CompositionDocument IR.
 *
 * Ports the timing logic from compose.ts (mergeTerminalEvents ->
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
  CompositionDocument,
  TerminalSceneSpec,
  NarrationCue,
  CaptionCue,
} from '@seqvio/core';
import type {
  CompileOptions,
  CompositionDocumentSeed,
  TerminalCaptureManifest,
} from '@seqvio/capture';
import { buildTerminalSnapshotEvents, scheduleTerminalSnapshotEvents } from './terminal-state';
import { mergeTerminalEvents } from './compose';
import type { TerminalEvent } from './types';
import { DEFAULT_TRAILING_HOLD_MS } from './constants';

export async function compileTerminalCapture(
  manifest: TerminalCaptureManifest,
  options?: CompileOptions
): Promise<CompositionDocumentSeed> {
  // 1. Timing: compress -> snapshot -> schedule (port of compose.ts).
  const events = manifest.events as unknown as TerminalEvent[];
  const compressed = mergeTerminalEvents(events, 1100);
  const rendered = await buildTerminalSnapshotEvents(compressed, {
    cols: manifest.cols,
    rows: manifest.rows,
    scrollback: manifest.cols * manifest.rows * 2,
  });
  const timeline = scheduleTerminalSnapshotEvents(rendered);
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
      id: step.id,
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
  }

  // 4. TerminalSceneSpec IR. Per-step narration lives in the audio manifest, not
  //    scene.narration (IR scene.narration is one string; terminal needs cues).
  const scene: TerminalSceneSpec = {
    type: 'terminal',
    id: 'terminal',
    events: timeline.events as unknown as TerminalSceneSpec['events'],
    steps,
  };

  // 5. CompositionDocument.
  const document: CompositionDocument = {
    version: '2.0',
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
    };
    fs.mkdirSync(options.jobDir, { recursive: true });
    audioManifestPath = path.join(options.jobDir, 'audio-manifest.json');
    fs.writeFileSync(audioManifestPath, `${JSON.stringify(audio, null, 2)}\n`, 'utf8');
  }

  return { document, audioManifestPath };
}
