#!/usr/bin/env node

import * as path from 'path';
import { render, RenderOptions } from './renderer';
import { SEQVIO_BRAND } from './brand';

function printUsage(): void {
  console.log(`Usage:
  ${SEQVIO_BRAND.rendererCli} --component <path> --output <path> [options]

Options:
  --component <path>   Path to TSX/TS scene component (required)
  --output <path>      Output MP4 path (required)
  --width <number>     Video width (default: 1920)
  --height <number>    Video height (default: 1080)
  --fps <number>       Frames per second (default: 30)
  --quality <value>    low | medium | high | 4k (default: high)
  --pixelRatio <n>   Screenshot scale factor 1 or 2 (default: 2, sharper strokes)
  --startFrame <n>     First source frame to render (default: 0)
  --endFrame <n>       Last source frame to render (inclusive)
  --duration <n>       Override total source duration in frames
  --tempDir <path>     Temp frame directory
  --audioManifest <p>  Path to audio manifest JSON
  --audioTrack <p>     Path to an audio file to mux as narration
  --mixMusic <p>       Path to a music file to mix under narration
  --captions <p>       Path to captions JSON for burn-in rendering
  --burnCaptions       Burn caption cues into the video frames
  --keepFrames         Keep frame PNGs after render
  --help               Show this help
`);
}

function parseArgs(argv: string[]): RenderOptions {
  const args = new Map<string, string | boolean>();

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'keepFrames' || key === 'help' || key === 'burnCaptions') {
      args.set(key, true);
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    args.set(key, value);
    i += 1;
  }

  if (args.get('help')) {
    printUsage();
    process.exit(0);
  }

  const component = args.get('component');
  const output = args.get('output');

  if (typeof component !== 'string' || typeof output !== 'string') {
    printUsage();
    throw new Error('Both --component and --output are required');
  }

  const width = args.get('width');
  const height = args.get('height');
  const fps = args.get('fps');
  const quality = args.get('quality');
  const startFrame = args.get('startFrame');
  const endFrame = args.get('endFrame');
  const duration = args.get('duration');
  const tempDir = args.get('tempDir');
  const pixelRatio = args.get('pixelRatio');
  const audioManifest = args.get('audioManifest');
  const audioTrack = args.get('audioTrack');
  const captions = args.get('captions');
  const mixMusic = args.get('mixMusic');

  return {
    component: path.resolve(component),
    output: path.resolve(output),
    width: typeof width === 'string' ? Number(width) : undefined,
    height: typeof height === 'string' ? Number(height) : undefined,
    fps: typeof fps === 'string' ? Number(fps) : undefined,
    quality: typeof quality === 'string'
      ? (quality as RenderOptions['quality'])
      : undefined,
    startFrame: typeof startFrame === 'string' ? Number(startFrame) : undefined,
    endFrame: typeof endFrame === 'string' ? Number(endFrame) : undefined,
    duration: typeof duration === 'string' ? Number(duration) : undefined,
    tempDir: typeof tempDir === 'string' ? path.resolve(tempDir) : undefined,
    keepFrames: Boolean(args.get('keepFrames')),
    pixelRatio: typeof pixelRatio === 'string' ? Number(pixelRatio) : undefined,
    audioManifest:
      typeof audioManifest === 'string' ? path.resolve(audioManifest) : undefined,
    audioTrack: typeof audioTrack === 'string' ? path.resolve(audioTrack) : undefined,
    captions: typeof captions === 'string' ? path.resolve(captions) : undefined,
    burnCaptions: Boolean(args.get('burnCaptions')),
    mixMusic: typeof mixMusic === 'string' ? path.resolve(mixMusic) : undefined,
  };
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    await render(options, (progress) => {
      if (progress.percent !== undefined) {
        console.log(`[${progress.phase}] ${progress.percent}% ${progress.message}`);
      } else {
        console.log(`[${progress.phase}] ${progress.message}`);
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Render failed: ${message}`);
    process.exit(1);
  }
}

void main();
