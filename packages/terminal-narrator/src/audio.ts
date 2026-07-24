import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

import type { PipelineProgress, TtsProvider } from './types';

const execFileAsync = promisify(execFile);
const moduleRequire = createRequire(__filename);

export function resolveSeqvioAudioCli(): string {
  const rendererPackage = moduleRequire.resolve('@seqvio/renderer/package.json');
  const cliPath = path.join(path.dirname(rendererPackage), 'dist', 'audio-cli.js');
  if (!fs.existsSync(cliPath)) {
    throw new Error(`seqvio-audio CLI not found at ${cliPath}. Run npm run build in the repo root.`);
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
  const audioCli = resolveSeqvioAudioCli();
  const outDir = path.resolve(options.outDir);
  const manifestPath = path.resolve(options.manifestPath);
  const resolvedManifestPath = path.join(outDir, 'audio-manifest.resolved.json');
  const provider =
    options.provider ??
    (process.env.SEQVIO_TTS_PROVIDER as TtsProvider | undefined) ??
    'edge-tts';

  fs.mkdirSync(outDir, { recursive: true });

  options.onProgress?.({
    phase: 'synthesizing',
    percent: 10,
    message: `Synthesizing narration with ${provider}`,
  });

  const args = [
    'synthesize',
    '--manifest',
    manifestPath,
    '--outDir',
    outDir,
    '--outManifest',
    resolvedManifestPath,
    '--provider',
    provider,
  ];

  if (options.voice) {
    args.push('--voice', options.voice);
  }

  await execFileAsync(process.execPath, [audioCli, ...args], {
    cwd: path.dirname(manifestPath),
    maxBuffer: 10 * 1024 * 1024,
  });

  if (!fs.existsSync(resolvedManifestPath)) {
    throw new Error(`Expected resolved audio manifest at ${resolvedManifestPath}`);
  }

  options.onProgress?.({
    phase: 'synthesizing',
    percent: 100,
    message: 'Narration synthesized',
  });

  return resolvedManifestPath;
}
