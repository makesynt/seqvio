/**
 * Compile a BrowserCaptureManifest into a CompositionDocument IR.
 *
 * Simpler than terminal: no xterm timing - the recorded video + cursor/focus
 * metadata map directly onto a BrowserSceneSpec. Per-step narration (timed) is
 * emitted as an audio manifest alongside the IR. AI explain: if a
 * NarrationProvider is supplied, narration is generated from each step's
 * captured real state (page state etc.), replacing the label fallback.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  CompositionDocument,
  BrowserSceneSpec,
  NarrationCue,
  CaptionCue,
} from '@seqvio/core';
import type {
  CompileOptions,
  CompositionDocumentSeed,
  BrowserCaptureManifest,
} from '@seqvio/capture';

export async function compileBrowserCapture(
  manifest: BrowserCaptureManifest,
  options?: CompileOptions
): Promise<CompositionDocumentSeed> {
  // 1. BrowserSceneSpec IR.
  const scene: BrowserSceneSpec = {
    type: 'browser',
    id: 'browser',
    sourceVideo: manifest.sourceVideo,
    cursorPoints: manifest.cursorPoints,
    focusTargets: manifest.focusTargets,
    clicks: manifest.clicks,
    recordingWidth: manifest.viewport.width,
    recordingHeight: manifest.viewport.height,
  };

  // 2. Per-step narration (AI explain or label fallback).
  const narration: NarrationCue[] = [];
  const captions: CaptionCue[] = [];
  for (let i = 0; i < manifest.steps.length; i += 1) {
    const step = manifest.steps[i];
    const startMs = step.timeMs;
    const endMs = Math.min(
      manifest.durationMs,
      i + 1 < manifest.steps.length ? manifest.steps[i + 1].timeMs : manifest.durationMs
    );
    const text = options?.narration
      ? await options.narration.narrate(step, manifest)
      : step.label;
    narration.push({
      id: step.id,
      sceneId: 'browser',
      text,
      startMs,
      endMs: Math.max(startMs + 250, endMs),
    });
    captions.push({
      id: `cap-${step.id}`,
      sceneId: 'browser',
      text: step.label,
      startMs,
      endMs: Math.max(startMs + 250, endMs),
    });
  }

  // 3. CompositionDocument with groundTruth carried from the manifest.
  const document: CompositionDocument = {
    version: '2.0',
    id: `browser-capture-${manifest.name}`,
    width: manifest.viewport.width,
    height: manifest.viewport.height,
    fps: manifest.renderFps,
    scenes: [scene],
    groundTruth: manifest.groundTruth ? { browser: manifest.groundTruth } : undefined,
  };

  // 4. Audio manifest (per-step timed narration) - written if jobDir is provided.
  let audioManifestPath: string | undefined;
  if (options?.jobDir) {
    const fps = manifest.renderFps;
    const duration = Math.max(1, Math.ceil((manifest.durationMs / 1000) * fps));
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
