import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  PipelineOptions,
  PipelineProgress,
  PipelineResult,
  TerminalNarratorPlan,
} from './types';
import { synthesizeNarration } from './audio';
import { recordPlan } from './record';
import { renderRecording } from './compose';
import { toCaptureManifest } from './capture-session';
import { compileTerminalCapture } from './compile-to-ir';
import { compileCompositionDocumentToTsx } from '@seqvio/core';

export async function runPipeline(
  plan: TerminalNarratorPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const recorded = await recordPlan(plan, jobDir, onProgress);

  // IR path: manifest -> CompositionDocument IR -> tsx (replaces hand-stringed
  // writeComposition). Visual control (maxZoom/zoomOnInput/presentation/typingCps)
  // is carried via renderOptions on the IR.
  const captureManifest = toCaptureManifest(recorded.manifest, plan, recorded.castPath);
  const seed = await compileTerminalCapture(captureManifest, { jobDir });
  const tsxResult = compileCompositionDocumentToTsx(seed.document);
  const componentPath = path.join(jobDir, 'composition.tsx');
  fs.writeFileSync(componentPath, tsxResult.code, 'utf8');
  const audioManifestPath = seed.audioManifestPath;

  let resolvedAudioManifestPath: string | undefined;
  if (options.withAudio && audioManifestPath) {
    resolvedAudioManifestPath = await synthesizeNarration({
      manifestPath: audioManifestPath,
      outDir: jobDir,
      provider: options.audioProvider,
      voice: options.audioVoice,
      onProgress,
    });
  }

  const outputVideoPath = await renderRecording(
    componentPath,
    recorded.manifest,
    jobDir,
    onProgress,
    resolvedAudioManifestPath
  );

  onProgress?.({ phase: 'done', percent: 100, message: 'Terminal recording rendered' });
  return {
    engine: 'native',
    manifest: recorded.manifest,
    manifestPath: recorded.manifestPath,
    castPath: recorded.castPath,
    componentPath,
    audioManifestPath,
    resolvedAudioManifestPath,
    outputVideoPath,
  };
}
