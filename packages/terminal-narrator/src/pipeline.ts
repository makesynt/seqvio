import type {
  PipelineOptions,
  PipelineProgress,
  PipelineResult,
  TerminalNarratorPlan,
} from './types';
import { synthesizeNarration } from './audio';
import { recordPlan } from './record';
import { renderRecording, writeComposition } from './compose';

export async function runPipeline(
  plan: TerminalNarratorPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const recorded = await recordPlan(plan, jobDir, onProgress);
  const composed = await writeComposition(recorded.manifest, jobDir, plan, onProgress);

  let resolvedAudioManifestPath: string | undefined;
  if (options.withAudio) {
    resolvedAudioManifestPath = await synthesizeNarration({
      manifestPath: composed.audioManifestPath,
      outDir: jobDir,
      provider: options.audioProvider,
      voice: options.audioVoice,
      onProgress,
    });
  }

  const outputVideoPath = await renderRecording(
    composed.componentPath,
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
    componentPath: composed.componentPath,
    audioManifestPath: composed.audioManifestPath,
    resolvedAudioManifestPath,
    outputVideoPath,
  };
}
