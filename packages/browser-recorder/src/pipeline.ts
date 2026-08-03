import * as fs from 'node:fs';
import * as path from 'node:path';
import { render, runCaptureQa, synthesizeAudioManifest } from '@seqvio/renderer';
import type { RenderProgress } from '@seqvio/renderer';
import { recordPlan } from './record';
import { toBrowserCaptureManifest } from './capture-session';
import { writeCaptureArtifacts } from './composition';
import { collectCaptureArtifacts, writeCaptureArtifactManifest } from '@seqvio/capture';
import type { BrowserPipelineOptions, BrowserPipelineResult, BrowserRecordingPlan, PipelineProgress } from './types';

export function browserRenderProgressPercent(progress: RenderProgress): number {
  const phasePercent = Math.max(0, Math.min(1, (progress.percent ?? 0) / 100));
  switch (progress.phase) {
    case 'setup': return 65;
    case 'rendering': return 66 + Math.round(phasePercent * 28);
    case 'encoding': return 94 + Math.round(phasePercent * 3);
    case 'muxing': return 97 + Math.round(phasePercent);
    case 'cleanup': return 98;
    case 'done': return 99;
  }
}

export async function runPipeline(
  plan: BrowserRecordingPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
  options: BrowserPipelineOptions = {},
): Promise<BrowserPipelineResult> {
  fs.mkdirSync(jobDir, { recursive: true });
  const planPath = path.join(jobDir, 'plan.json');
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  const recorded = await recordPlan(plan, jobDir, (progress) => {
    const percent = progress.phase === 'encoding'
      ? 50 + Math.round(progress.percent * 0.1)
      : Math.round(progress.percent * 0.5);
    onProgress?.({ ...progress, percent });
  });

  // Canonical path: manifest -> shared capture dispatcher -> IR -> TSX.
  const captureManifest = toBrowserCaptureManifest(recorded.manifest, plan);
  const artifacts = await writeCaptureArtifacts(captureManifest, jobDir);
  const { componentPath, audioManifestPath } = artifacts;
  onProgress?.({ phase: 'composing', percent: 63, message: 'Capture artifacts written' });

  let resolvedAudioManifestPath: string | undefined;
  if (options.withAudio && audioManifestPath) {
    onProgress?.({ phase: 'synthesizing', percent: 64, message: 'Synthesizing narration' });
    resolvedAudioManifestPath = await synthesizeAudioManifest({
      manifestPath: audioManifestPath,
      outDir: jobDir,
      provider: options.audioProvider,
      voice: options.audioVoice,
    });
  }

  const outputVideoPath = path.join(jobDir, 'final.mp4');
  await render({
    component: componentPath,
    output: outputVideoPath,
    width: recorded.manifest.recordingWidth,
    height: recorded.manifest.recordingHeight,
    fps: recorded.manifest.renderFps,
    quality: 'medium',
    pixelRatio: 1,
    frameFormat: 'jpeg',
    jpegQuality: 88,
    workers: 1,
    audioManifest: resolvedAudioManifestPath,
    burnCaptions: options.burnCaptions ?? false,
  }, (renderProgress) => {
    onProgress?.({
      phase: 'rendering',
      percent: browserRenderProgressPercent(renderProgress),
      message: renderProgress.message,
    });
  });
  onProgress?.({ phase: 'qa', percent: 99, message: 'Running capture QA' });
  const qa = await runCaptureQa({
    component: componentPath,
    outDir: jobDir,
    captureManifest: artifacts.captureManifestPath,
    audioManifest: resolvedAudioManifestPath ?? audioManifestPath,
    width: recorded.manifest.recordingWidth,
    height: recorded.manifest.recordingHeight,
    fps: recorded.manifest.renderFps,
    qaConfig: options.qaConfig,
    requireNarrationAudio: options.withAudio ?? false,
    onOutput: (message) => onProgress?.({ phase: 'qa', percent: 99, message }),
  });
  const artifactManifestPath = writeCaptureArtifactManifest(jobDir, {
    adapter: 'browser',
    status: 'complete',
    artifacts: collectCaptureArtifacts(jobDir, 'browser'),
  });
  onProgress?.({ phase: 'done', percent: 100, message: 'Recording rendered' });
  return {
    rawVideoPath: recorded.rawVideoPath,
    outputVideoPath,
    planPath,
    manifestPath: recorded.manifestPath,
    captureManifestPath: artifacts.captureManifestPath,
    explainerDocumentPath: artifacts.explainerDocumentPath,
    componentPath,
    audioManifestPath: artifacts.audioManifestPath,
    resolvedAudioManifestPath,
    qaReportPath: qa.reportPath,
    artifactManifestPath,
  };
}
