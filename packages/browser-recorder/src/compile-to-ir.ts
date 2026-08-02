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
  // 1. Per-step narration and jointly-authored explanation beats.
  const narration: NarrationCue[] = [];
  const captions: CaptionCue[] = [];
  const explanationCues: NonNullable<BrowserSceneSpec['explanation']>['cues'] = [];
  const explanationBeats: NonNullable<BrowserSceneSpec['explanation']>['beats'] = [];
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
      id: `browser.${step.id}`,
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
    explanationCues.push({ id: step.id, text });
    explanationBeats.push({
      id: `beat-${step.id}`,
      cueId: step.id,
      anchor: { text },
      visuals: [{ targetId: step.id, action: 'focus' }],
      evidence: { captureStepId: step.id },
    });
  }

  // 2. BrowserSceneSpec IR. Capture steps remain available as timing evidence.
  const scene: BrowserSceneSpec = {
    type: 'browser',
    id: 'browser',
    sourceVideo: manifest.sourceVideo,
    cursorPoints: manifest.cursorPoints,
    focusTargets: manifest.focusTargets,
    clicks: manifest.clicks,
    steps: manifest.steps.map(({ id, label, timeMs }) => ({ id, label, timeMs })),
    recordingWidth: manifest.viewport.width,
    recordingHeight: manifest.viewport.height,
    maxZoom: manifest.maxZoom,
    explanation: explanationCues.length > 0
      ? { cues: explanationCues, beats: explanationBeats }
      : undefined,
  };

  // 3. CompositionDocument with groundTruth carried from the manifest.
  const document: CompositionDocument = {
    version: '2.0',
    id: `browser-capture-${manifest.name}`,
    width: manifest.viewport.width,
    height: manifest.viewport.height,
    fps: manifest.renderFps,
    scenes: [scene],
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
      sceneTimings: [{
        sceneId: 'browser',
        startFrame: 0,
        durationFrames: duration,
        sourceDurationFrames: duration,
        highlights: manifest.steps.map((step, index) => ({
          id: `browser.beat-${step.id}`,
          source: 'beat',
          startFrame: Math.round((step.timeMs / 1000) * fps),
          endFrame: index + 1 < manifest.steps.length
            ? Math.round((manifest.steps[index + 1].timeMs / 1000) * fps)
            : duration,
          minDurationFrames: Math.ceil(0.9 * fps),
        })),
      }],
      explanationBeats: explanationBeats.map((beat) => ({
        id: `browser.${beat.id}`,
        sceneId: 'browser',
        cueId: `browser.${beat.cueId}`,
        anchor: beat.anchor,
        sourceFrame: Math.round((manifest.steps.find((step) => step.id === beat.evidence?.captureStepId)?.timeMs ?? 0) / 1000 * fps),
        visuals: beat.visuals,
      })),
    };
    fs.mkdirSync(options.jobDir, { recursive: true });
    audioManifestPath = path.join(options.jobDir, 'audio-manifest.json');
    fs.writeFileSync(audioManifestPath, `${JSON.stringify(audio, null, 2)}\n`, 'utf8');
  }

  return { document, audioManifestPath };
}
