#!/usr/bin/env node

import * as path from 'path';
import { render, RenderOptions, RenderResult } from './renderer';
import { renderChapters } from './chapter-render';
import { SEQVIO_BRAND } from './brand';
import { normalizeWhiteboardOptimize } from './whiteboard-optimization';

function printUsage(): void {
  console.log(`Usage:
  ${SEQVIO_BRAND.rendererCli} --component <path> --output <path> [options]

Options:
  --component <path>    Path to TSX/TS scene component (required)
  --output <path>       Output MP4 path (required)
  --preset <value>      preview | standard | final | high — set defaults for fps/pixelRatio/quality/frameFormat.
                          Explicit flags always override the preset.
                        preview:  fps=24, pixelRatio=1, quality=low, frameFormat=jpeg, jpegQuality=80 (fastest)
                        standard: fps=30, pixelRatio=1, quality=medium, frameFormat=png
                        final:    fps=30, pixelRatio=2, quality=medium, frameFormat=png
                        high:     fps=30, pixelRatio=2, quality=high,   frameFormat=png
  --width <number>      Video width (default: 1920)
  --height <number>     Video height (default: 1080)
  --fps <number>        Frames per second (default: 30)
  --quality <value>     low | medium | high | 4k — controls output MP4 CRF, not screenshot quality.
                        Use --frameFormat jpeg for faster screenshot capture (preview workflows).
  --frameFormat <v>     png | jpeg — per-frame screenshot format (default: png). jpeg is faster
                        for preview passes; png is lossless for final delivery.
  --jpegQuality <n>     JPEG screenshot quality 30-100 when --frameFormat jpeg (default: 90)
  --pixelRatio <n>      Screenshot scale factor 1 or 2 (default: 2, sharper strokes)
  --workers <n|auto>    Parallel capture workers (default: 1). workers>1 captures in parallel
                        and streams frames into one FFmpeg pass (no concat, no seams).
                        auto samples the composition before choosing a conservative count.
  --staticFrameDedup    Reuse adjacent static screenshots on the workers=1 streaming path
  --whiteboardOptimize <v>
                        none | 1 | 2 | 3 | react-static | bitmap-layer | frame-dedup
                        Experimental whiteboard render optimizations for benchmarking.
                        1=react-static, 2=bitmap-layer, 3=frame-dedup.
  --startFrame <n>      First source frame to render (default: 0)
  --endFrame <n>        Last source frame to render (inclusive)
  --duration <n>        Override total source duration in frames
  --tempDir <path>      Temp directory for intermediate files
  --audioManifest <p>   Path to audio manifest JSON
  --audioTrack <p>      Path to an audio file to mux as narration
  --mixMusic <p>        Path to a music file to mix under narration
  --captions <p>        Path to captions JSON for burn-in rendering
  --burnCaptions         Optional: bake caption cues into frames (hard subtitles).
                         Default: off. Do not use for full narration text or
                         whiteboard content in the lower third.
  --renderPlan <path>   Chapter render plan JSON (from seqvio-generate render-plan)
  --chapterDir <path>   Directory for chapter MP4 outputs and render-report.json
  --ir <path>           CompositionDocument v2 JSON; refreshes hashes/frame ranges
  --onlyChapters <ids>  Comma-separated chapter ids to render (stitch still uses full plan)
  --resume              Skip chapters whose content/settings hash already rendered
  --keepFrames          Keep intermediate frame files after render
  --help                Show this help
`);
}

type Preset = 'preview' | 'standard' | 'final' | 'high';

const PRESET_DEFAULTS: Record<Preset, Partial<RenderOptions>> = {
  preview:  { fps: 24, pixelRatio: 1, quality: 'low',    frameFormat: 'jpeg', jpegQuality: 80 },
  standard: { fps: 30, pixelRatio: 1, quality: 'medium', frameFormat: 'png'  },
  final:    { fps: 30, pixelRatio: 2, quality: 'medium', frameFormat: 'png'  },
  high:     { fps: 30, pixelRatio: 2, quality: 'high',   frameFormat: 'png'  },
};

function applyPreset(opts: RenderOptions, preset: string): void {
  const defaults = PRESET_DEFAULTS[preset as Preset];
  if (!defaults) {
    throw new Error(`Unknown preset "${preset}". Valid values: preview | standard | final | high`);
  }
  // Only fill in fields that were not explicitly provided by the user.
  if (opts.fps === undefined)         opts.fps         = defaults.fps;
  if (opts.pixelRatio === undefined)  opts.pixelRatio  = defaults.pixelRatio;
  if (opts.quality === undefined)     opts.quality     = defaults.quality;
  if (opts.frameFormat === undefined) opts.frameFormat = defaults.frameFormat;
  if (opts.jpegQuality === undefined) opts.jpegQuality = defaults.jpegQuality;
}

function parseArgs(argv: string[]): {
  options: RenderOptions;
  preset?: string;
  renderPlan?: string;
  chapterDir?: string;
  documentPath?: string;
  onlyChapters?: string[];
  resume?: boolean;
} {
  const args = new Map<string, string | boolean>();

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'keepFrames' || key === 'help' || key === 'burnCaptions' || key === 'staticFrameDedup' || key === 'resume') {
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

  const width       = args.get('width');
  const height      = args.get('height');
  const fps         = args.get('fps');
  const quality     = args.get('quality');
  const startFrame  = args.get('startFrame');
  const endFrame    = args.get('endFrame');
  const duration    = args.get('duration');
  const tempDir     = args.get('tempDir');
  const pixelRatio  = args.get('pixelRatio');
  const frameFormat = args.get('frameFormat');
  const jpegQuality = args.get('jpegQuality');
  const workers     = args.get('workers');
  const audioManifest = args.get('audioManifest');
  const audioTrack  = args.get('audioTrack');
  const captions    = args.get('captions');
  const mixMusic    = args.get('mixMusic');
  const preset      = args.get('preset');
  const whiteboardOptimize = args.get('whiteboardOptimize');
  const renderPlan = args.get('renderPlan');
  const chapterDir = args.get('chapterDir');
  const documentPath = args.get('ir');
  const onlyChaptersRaw = args.get('onlyChapters');

  const options: RenderOptions = {
    component:    path.resolve(component),
    output:       path.resolve(output),
    width:        typeof width       === 'string' ? Number(width)       : undefined,
    height:       typeof height      === 'string' ? Number(height)      : undefined,
    fps:          typeof fps         === 'string' ? Number(fps)         : undefined,
    quality:      typeof quality     === 'string' ? (quality as RenderOptions['quality']) : undefined,
    startFrame:   typeof startFrame  === 'string' ? Number(startFrame)  : undefined,
    endFrame:     typeof endFrame    === 'string' ? Number(endFrame)    : undefined,
    duration:     typeof duration    === 'string' ? Number(duration)    : undefined,
    tempDir:      typeof tempDir     === 'string' ? path.resolve(tempDir) : undefined,
    keepFrames:   Boolean(args.get('keepFrames')),
    pixelRatio:   typeof pixelRatio  === 'string' ? Number(pixelRatio)  : undefined,
    frameFormat:  typeof frameFormat === 'string' ? (frameFormat as RenderOptions['frameFormat']) : undefined,
    jpegQuality:  typeof jpegQuality === 'string' ? Number(jpegQuality) : undefined,
    workers:      typeof workers     === 'string' ? (workers === 'auto' ? 'auto' : Number(workers)) : undefined,
    staticFrameDedup: Boolean(args.get('staticFrameDedup')),
    audioManifest: typeof audioManifest === 'string' ? path.resolve(audioManifest) : undefined,
    audioTrack:   typeof audioTrack  === 'string' ? path.resolve(audioTrack) : undefined,
    captions:     typeof captions    === 'string' ? path.resolve(captions)   : undefined,
    burnCaptions: Boolean(args.get('burnCaptions')),
    mixMusic:     typeof mixMusic    === 'string' ? path.resolve(mixMusic)   : undefined,
    whiteboardOptimize:
      typeof whiteboardOptimize === 'string'
        ? normalizeWhiteboardOptimize(whiteboardOptimize)
        : undefined,
  };

  return {
    options,
    preset: typeof preset === 'string' ? preset : undefined,
    renderPlan: typeof renderPlan === 'string' ? path.resolve(renderPlan) : undefined,
    chapterDir: typeof chapterDir === 'string' ? path.resolve(chapterDir) : undefined,
    documentPath: typeof documentPath === 'string' ? path.resolve(documentPath) : undefined,
    onlyChapters:
      typeof onlyChaptersRaw === 'string'
        ? onlyChaptersRaw.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined,
    resume: Boolean(args.get('resume')),
  };
}

function printTimingSummary(result: RenderResult): void {
  const totalSec = (result.totalMs / 1000).toFixed(1);
  const fps = result.renderedFps.toFixed(2);
  const mb = (result.outputBytes / 1024 / 1024).toFixed(2);
  const setupS   = (result.phaseMs.setup    / 1000).toFixed(1);
  const renderS  = (result.phaseMs.rendering / 1000).toFixed(1);
  const muxS     = (result.phaseMs.muxing   / 1000).toFixed(1);
  const cleanS   = (result.phaseMs.cleanup  / 1000).toFixed(1);

  console.log('');
  console.log('─────────────────────────────');
  console.log(`  Render complete`);
  console.log(`  Output:   ${result.output}`);
  console.log(`  Frames:   ${result.totalFrames} @ ${result.pixelRatio}× (${result.frameFormat})`);
  console.log(`  Workers:  ${result.workers}`);
  console.log(`  Total:    ${totalSec}s  (${fps} rendered fps)`);
  console.log(`  Setup:    ${setupS}s`);
  console.log(`  Render:   ${renderS}s`);
  if (result.phaseMs.muxing > 0) console.log(`  Mux:      ${muxS}s`);
  console.log(`  Cleanup:  ${cleanS}s`);
  console.log(`  Size:     ${mb} MB`);
  console.log('─────────────────────────────');
}

async function main(): Promise<void> {
  try {
    const { options, preset, renderPlan, chapterDir, documentPath, onlyChapters, resume } = parseArgs(process.argv.slice(2));

    if (preset) {
      applyPreset(options, preset);
    }

    if (renderPlan) {
      if (!chapterDir) {
        throw new Error('Chapter rendering requires --chapterDir <path>');
      }
      const { result, report } = await renderChapters(
        {
          ...options,
          renderPlanPath: renderPlan,
          chapterDir,
          resume,
          presetName: preset,
          documentPath,
          onlyChapters,
        },
        (progress) => {
          if (progress.percent !== undefined) {
            console.log(`[${progress.phase}] ${progress.percent}% ${progress.message}`);
          } else {
            console.log(`[${progress.phase}] ${progress.message}`);
          }
        }
      );
      printTimingSummary(result);
      console.log(`  Chapters: ${report.chapters.length} (${report.resumed ? 'resume enabled' : 'fresh run'})`);
      if (report.changedChapterIds.length > 0) {
        console.log(`  Updated:  ${report.changedChapterIds.join(', ')}`);
      }
      if (report.audioMuxed) {
        console.log('  Audio:    muxed into final output');
      }
      console.log(`  Report:   ${path.join(chapterDir, 'render-report.json')}`);
      return;
    }

    const result = await render(options, (progress) => {
      if (progress.percent !== undefined) {
        console.log(`[${progress.phase}] ${progress.percent}% ${progress.message}`);
      } else {
        console.log(`[${progress.phase}] ${progress.message}`);
      }
    });

    printTimingSummary(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Render failed: ${message}`);
    process.exit(1);
  }
}

void main();
