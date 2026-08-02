import type {
  PipelineOptions,
  PipelineProgress,
  PipelineResult,
  TerminalNarratorPlan,
} from './types';
import { synthesizeNarration } from './audio';
import { recordPlan } from './record';
import { renderRecording } from './render';
import { toCaptureManifest } from './capture-session';
import { writeCaptureArtifacts } from './composition';
import { collectCaptureArtifacts, writeCaptureArtifactManifest } from '@seqvio/capture';
import { runCaptureQa } from '@seqvio/renderer';

export async function runPipeline(
  plan: TerminalNarratorPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const recorded = await recordPlan(plan, jobDir, (progress) => {
    const percent = progress.phase === 'composing'
      ? 55 + Math.round(progress.percent * 0.05)
      : Math.round(progress.percent * 0.55);
    onProgress?.({ ...progress, percent });
  });

  // Canonical path: manifest -> shared capture dispatcher -> IR -> TSX.
  const captureManifest = toCaptureManifest(recorded.manifest, plan, recorded.castPath);
  const artifacts = await writeCaptureArtifacts(captureManifest, jobDir);
  const { componentPath, audioManifestPath } = artifacts;

  let resolvedAudioManifestPath: string | undefined;
  if (options.withAudio && audioManifestPath) {
    resolvedAudioManifestPath = await synthesizeNarration({
      manifestPath: audioManifestPath,
      outDir: jobDir,
      provider: options.audioProvider,
      voice: options.audioVoice,
      onProgress: (progress) => onProgress?.({
        ...progress,
        percent: 60 + Math.round(progress.percent * 0.15),
      }),
    });
  }

  const outputVideoPath = await renderRecording(
    componentPath,
    recorded.manifest,
    jobDir,
    onProgress,
    resolvedAudioManifestPath,
    options.burnCaptions ?? false,
  );
  onProgress?.({ phase: 'qa', percent: 99, message: 'Running capture QA' });
  const qa = await runCaptureQa({
    component: componentPath,
    outDir: jobDir,
    captureManifest: artifacts.captureManifestPath,
    audioManifest: resolvedAudioManifestPath ?? audioManifestPath,
    width: recorded.manifest.viewport.width,
    height: recorded.manifest.viewport.height,
    fps: recorded.manifest.renderFps,
    qaConfig: options.qaConfig,
    requireNarrationAudio: options.withAudio ?? false,
    onOutput: (message) => onProgress?.({ phase: 'qa', percent: 99, message }),
  });
  const artifactManifestPath = writeCaptureArtifactManifest(jobDir, {
    adapter: 'terminal',
    status: 'complete',
    artifacts: collectCaptureArtifacts(jobDir, 'terminal'),
  });

  onProgress?.({ phase: 'done', percent: 100, message: 'Terminal recording rendered' });
  return {
    engine: 'native',
    manifest: recorded.manifest,
    manifestPath: recorded.manifestPath,
    castPath: recorded.castPath,
    componentPath,
    captureManifestPath: artifacts.captureManifestPath,
    compositionDocumentPath: artifacts.compositionDocumentPath,
    audioManifestPath,
    resolvedAudioManifestPath,
    qaReportPath: qa.reportPath,
    outputVideoPath,
    artifactManifestPath,
  };
}
