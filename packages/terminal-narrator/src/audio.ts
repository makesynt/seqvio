import { synthesizeAudioManifest } from '@seqvio/renderer';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { PipelineProgress, TtsProvider } from './types';

const moduleRequire = createRequire(__filename);

/** @deprecated Use synthesizeAudioManifest from @seqvio/renderer. */
export function resolveSeqvioAudioCli(): string {
  const rendererPackage = moduleRequire.resolve('@seqvio/renderer/package.json');
  const cliPath = path.join(path.dirname(rendererPackage), 'dist', 'audio-cli.js');
  if (!fs.existsSync(cliPath)) {
    throw new Error(`seqvio-audio CLI not found at ${cliPath}. Build @seqvio/renderer first.`);
  }
  return cliPath;
}

export interface SynthesizeNarrationOptions {
  manifestPath: string;
  outDir: string;
  provider?: TtsProvider;
  voice?: string;
  onProgress?: (progress: PipelineProgress) => void;
}

export async function synthesizeNarration(
  options: SynthesizeNarrationOptions
): Promise<string> {
  const provider =
    options.provider ??
    (process.env.SEQVIO_TTS_PROVIDER as TtsProvider | undefined) ??
    'edge-tts';

  options.onProgress?.({
    phase: 'synthesizing',
    percent: 10,
    message: `Synthesizing narration with ${provider}`,
  });

  const resolvedManifestPath = await synthesizeAudioManifest({
    manifestPath: options.manifestPath,
    outDir: options.outDir,
    provider,
    voice: options.voice,
  });

  options.onProgress?.({
    phase: 'synthesizing',
    percent: 100,
    message: 'Narration synthesized',
  });

  return resolvedManifestPath;
}
