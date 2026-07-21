import * as fs from 'node:fs';
import * as path from 'node:path';
import { renderRecording } from './compose';
import { recordPlan } from './record';
import type { BrowserRecordingPlan, PipelineProgress } from './types';

export async function runPipeline(
  plan: BrowserRecordingPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<{ rawVideoPath: string; outputVideoPath: string; manifestPath: string }> {
  fs.mkdirSync(jobDir, { recursive: true });
  fs.writeFileSync(path.join(jobDir, 'plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  const recorded = await recordPlan(plan, jobDir, onProgress);
  const outputVideoPath = await renderRecording(recorded.manifest, jobDir, onProgress);
  onProgress?.({ phase: 'done', percent: 100, message: 'Recording rendered' });
  return {
    rawVideoPath: recorded.rawVideoPath,
    outputVideoPath,
    manifestPath: recorded.manifestPath,
  };
}
