import * as path from 'node:path';
import { render } from '@seqvio/renderer';
import type { RenderProgress } from '@seqvio/renderer';
import type {
  PipelineProgress,
  TerminalRecordingManifest,
} from './types';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function terminalRenderProgressPercent(progress: RenderProgress): number {
  const phasePercent = clamp01((progress.percent ?? 0) / 100);
  switch (progress.phase) {
    case 'setup': return 75;
    case 'rendering': return 76 + Math.round(phasePercent * 18);
    case 'encoding': return 94 + Math.round(phasePercent * 3);
    case 'muxing': return 97 + Math.round(phasePercent);
    case 'cleanup': return 98;
    case 'done': return 99;
  }
}

export async function renderRecording(
  component: string,
  manifest: TerminalRecordingManifest,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
  audioManifest?: string,
  burnCaptions = false,
): Promise<string> {
  onProgress?.({ phase: 'rendering', percent: 75, message: 'Rendering frames' });
  const output = path.join(jobDir, 'final.mp4');

  await render(
    {
      component,
      output,
      width: manifest.viewport.width,
      height: manifest.viewport.height,
      fps: manifest.renderFps,
      quality: 'medium',
      pixelRatio: 1,
      frameFormat: 'jpeg',
      jpegQuality: 88,
      workers: 1,
      audioManifest,
      burnCaptions,
    },
    (renderProgress) => {
      onProgress?.({
        phase: 'rendering',
        percent: terminalRenderProgressPercent(renderProgress),
        message: renderProgress.message,
      });
    }
  );
  return output;
}
