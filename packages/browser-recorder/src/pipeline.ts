import * as fs from 'node:fs';
import * as path from 'node:path';
import { render } from '@seqvio/renderer';
import { recordPlan } from './record';
import { toBrowserCaptureManifest } from './capture-session';
import { compileBrowserCapture } from './compile-to-ir';
import { compileCompositionDocumentToTsx } from '@seqvio/core';
import type { BrowserRecordingPlan, PipelineProgress } from './types';

export async function runPipeline(
  plan: BrowserRecordingPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<{ rawVideoPath: string; outputVideoPath: string; manifestPath: string }> {
  fs.mkdirSync(jobDir, { recursive: true });
  fs.writeFileSync(path.join(jobDir, 'plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  const recorded = await recordPlan(plan, jobDir, onProgress);

  // IR path: manifest -> IR -> tsx (replaces hand-stringed writeComposition)
  const captureManifest = toBrowserCaptureManifest(recorded.manifest, plan);
  const seed = await compileBrowserCapture(captureManifest, { jobDir });
  const tsxResult = compileCompositionDocumentToTsx(seed.document);
  const componentPath = path.join(jobDir, 'composition.tsx');
  fs.writeFileSync(componentPath, tsxResult.code, 'utf8');

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
  }, (renderProgress) => {
    const percent = renderProgress.percent ?? 0;
    onProgress?.({ phase: 'rendering', percent, message: renderProgress.message });
  });
  onProgress?.({ phase: 'done', percent: 100, message: 'Recording rendered' });
  return {
    rawVideoPath: recorded.rawVideoPath,
    outputVideoPath,
    manifestPath: recorded.manifestPath,
  };
}
