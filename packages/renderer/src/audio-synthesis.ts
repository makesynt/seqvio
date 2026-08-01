import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type NarrationProvider = 'elevenlabs' | 'minimax' | 'edge-tts' | 'openai';

export interface SynthesizeAudioManifestOptions {
  manifestPath: string;
  outDir: string;
  provider?: NarrationProvider;
  voice?: string;
}

export async function synthesizeAudioManifest(
  options: SynthesizeAudioManifestOptions,
): Promise<string> {
  const audioCli = path.join(__dirname, 'audio-cli.js');
  if (!fs.existsSync(audioCli)) {
    throw new Error(`seqvio-audio CLI not found at ${audioCli}. Build @seqvio/renderer first.`);
  }

  const manifestPath = path.resolve(options.manifestPath);
  const outDir = path.resolve(options.outDir);
  const outputPath = path.join(outDir, 'audio-manifest.resolved.json');
  const provider = options.provider
    ?? (process.env.SEQVIO_TTS_PROVIDER as NarrationProvider | undefined)
    ?? 'edge-tts';
  fs.mkdirSync(outDir, { recursive: true });

  const args = [
    audioCli,
    'synthesize',
    '--manifest', manifestPath,
    '--outDir', outDir,
    '--outManifest', outputPath,
    '--provider', provider,
  ];
  if (options.voice) args.push('--voice', options.voice);
  await execFileAsync(process.execPath, args, {
    cwd: path.dirname(manifestPath),
    maxBuffer: 10 * 1024 * 1024,
  });
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Expected resolved audio manifest at ${outputPath}`);
  }
  return outputPath;
}
