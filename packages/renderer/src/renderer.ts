/**
 * Video Renderer
 * Captures frames via browser React runtime and generates MP4 video
 */

import { execFile, spawn } from 'node:child_process';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { resolveCompositionDurationFrames, type CompositionAudioManifest } from './media-contract';
import {
  buildManifestFromMeta,
  loadAudioManifest,
  loadCaptionCues,
  resolveMaybeRelativePath,
} from './audio/manifest';
import { bundleScene, resolveComponentPath } from './bundle-scene';
import { getMetaFromPage, loadRenderShell, setFrameAndWait } from './browser-shell';
// @ts-ignore
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

export interface RenderOptions {
  component: string;
  output: string;
  width?: number;
  height?: number;
  fps?: number;
  quality?: 'low' | 'medium' | 'high' | '4k';
  startFrame?: number;
  endFrame?: number;
  duration?: number;
  tempDir?: string;
  keepFrames?: boolean;
  /** Device pixel ratio for screenshots (default: 2). Output MP4 is scaled to width×height. */
  pixelRatio?: number;
  audioManifest?: string;
  audioTrack?: string;
  captions?: string;
  burnCaptions?: boolean;
  mixMusic?: string;
}

export interface RenderProgress {
  phase: 'setup' | 'rendering' | 'encoding' | 'muxing' | 'cleanup' | 'done';
  currentFrame?: number;
  totalFrames?: number;
  percent?: number;
  message: string;
}

interface ResolvedAudioTrack {
  id: string;
  path: string;
  kind: 'narration' | 'music' | 'sfx';
  volume: number;
  offsetMs: number;
}

interface ResolvedRenderOptions {
  component: string;
  output: string;
  width: number;
  height: number;
  fps: number;
  quality: 'low' | 'medium' | 'high' | '4k';
  startFrame: number;
  endFrame: number;
  duration: number;
  tempDir: string;
  keepFrames: boolean;
  pixelRatio: number;
  audioManifest?: string;
  audioTrack?: string;
  captions?: string;
  burnCaptions: boolean;
  mixMusic?: string;
}

export class VideoRenderer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private options: ResolvedRenderOptions;
  private effectiveFps = 30;
  private sceneDuration = 300;
  private shellPath = '';
  private frameFileCount = 0;
  private componentDir = process.cwd();
  private audioManifest: CompositionAudioManifest | undefined;
  private audioManifestBaseDir: string | undefined;
  private resolvedAudioTracks: ResolvedAudioTrack[] = [];
  private onProgress?: (progress: RenderProgress) => void;

  constructor(options: RenderOptions, onProgress?: (progress: RenderProgress) => void) {
    this.options = {
      component: options.component,
      output: options.output,
      width: options.width || 1920,
      height: options.height || 1080,
      fps: options.fps || 30,
      quality: options.quality || 'high',
      startFrame: Math.max(0, options.startFrame ?? 0),
      endFrame: options.endFrame ?? Number.MAX_SAFE_INTEGER,
      duration: options.duration ?? 0,
      tempDir: options.tempDir || path.join(process.cwd(), 'temp'),
      keepFrames: options.keepFrames || false,
      pixelRatio: options.pixelRatio ?? 2,
      audioManifest: options.audioManifest,
      audioTrack: options.audioTrack,
      captions: options.captions,
      burnCaptions: options.burnCaptions || false,
      mixMusic: options.mixMusic,
    };
    this.onProgress = onProgress;
  }

  private reportProgress(progress: RenderProgress) {
    if (this.onProgress) {
      this.onProgress(progress);
      return;
    }
    console.log(`[${progress.phase}] ${progress.message}`);
  }

  async render(): Promise<void> {
    try {
      this.reportProgress({
        phase: 'setup',
        message: 'Bundling scene and setting up browser...',
      });
      await this.setup();

      this.effectiveFps = Math.max(1, this.options.fps);
      const totalFrames = this.resolveRenderFrameCount(this.sceneDuration);
      if (totalFrames <= 0) {
        throw new Error('Render frame range is empty. Check startFrame/endFrame/duration.');
      }

      this.reportProgress({
        phase: 'rendering',
        currentFrame: 0,
        totalFrames,
        percent: 0,
        message: `Rendering ${totalFrames} frames...`,
      });
      const encodedVideoPath = await this.renderAndEncode(totalFrames);

      if (this.resolvedAudioTracks.length > 0) {
        this.reportProgress({
          phase: 'muxing',
          percent: 0,
          message: `Muxing ${this.resolvedAudioTracks.length} audio track(s)...`,
        });
        await this.muxAudio(encodedVideoPath);
      }

      this.reportProgress({
        phase: 'cleanup',
        message: 'Cleaning up...',
      });
      await this.cleanup();

      this.reportProgress({
        phase: 'done',
        percent: 100,
        message: `Video saved to: ${this.options.output}`,
      });
    } catch (error) {
      console.error('Render error:', error);
      throw error;
    }
  }

  private async setup(): Promise<void> {
    const renderTempDir = path.join(
      this.options.tempDir,
      `render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
    this.options.tempDir = renderTempDir;
    fs.mkdirSync(this.options.tempDir, { recursive: true });

    const outputDir = path.dirname(this.options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const resolvedComponent = resolveComponentPath(this.options.component);
    this.componentDir = path.dirname(resolvedComponent);
    const explicitManifest = this.options.audioManifest
      ? loadAudioManifest(this.options.audioManifest)
      : null;
    const explicitCaptions = this.options.captions
      ? loadCaptionCues(this.options.captions)
      : undefined;

    const bundleResult = await bundleScene({
      componentPath: resolvedComponent,
      outDir: this.options.tempDir,
      width: this.options.width,
      height: this.options.height,
      fps: this.options.fps,
      duration: this.options.duration > 0 ? this.options.duration : undefined,
      burnCaptions: this.options.burnCaptions,
      captions: explicitCaptions ?? explicitManifest?.manifest.captions,
      resolvedAudioManifest: explicitManifest?.manifest,
    });
    this.shellPath = bundleResult.shellPath;

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--allow-file-access-from-files',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: this.options.width,
      height: this.options.height,
      deviceScaleFactor: this.options.pixelRatio,
    });

    await loadRenderShell(this.page, this.shellPath);

    const pageMeta = await getMetaFromPage(this.page);
    this.effectiveFps = Math.max(1, this.options.fps || pageMeta.fps || 30);
    const metaManifest = buildManifestFromMeta(pageMeta);
    this.audioManifest = explicitManifest?.manifest ?? metaManifest;
    this.audioManifestBaseDir = explicitManifest?.baseDir ?? this.componentDir;

    if (this.audioManifest) {
      this.audioManifest = {
        ...this.audioManifest,
        captions: explicitCaptions ?? this.audioManifest.captions,
      };
    } else if (explicitCaptions && explicitCaptions.length > 0) {
      this.audioManifest = {
        fps: this.effectiveFps,
        captions: explicitCaptions,
      };
      this.audioManifestBaseDir = this.componentDir;
    }

    this.sceneDuration = resolveCompositionDurationFrames(
      this.options.duration > 0 ? this.options.duration : pageMeta.duration,
      this.effectiveFps,
      this.audioManifest,
      explicitCaptions
    );
    this.resolvedAudioTracks = this.resolveAudioTracks();
  }

  private resolveRenderFrameCount(duration: number): number {
    const totalDuration = Math.max(1, duration);
    const maxFrame = totalDuration - 1;
    const start = Math.min(this.options.startFrame, maxFrame);
    const end = Math.min(this.options.endFrame, maxFrame);
    return end >= start ? end - start + 1 : 0;
  }

  private crfForQuality(): number {
    const qualitySettings: Record<string, number> = {
      low: 28,
      medium: 20,
      high: 18,
      '4k': 15,
    };
    return qualitySettings[this.options.quality];
  }

  private buildEncodeArgs(targetPath: string): string[] {
    const args = [
      '-y',
      '-f', 'image2pipe',
      '-framerate', String(this.effectiveFps),
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', String(this.crfForQuality()),
      '-preset', 'medium',
      '-movflags', '+faststart',
    ];
    if (this.options.pixelRatio > 1) {
      args.push('-vf', `scale=${this.options.width}:${this.options.height}`);
    }
    args.push('-r', String(this.effectiveFps), targetPath);
    return args;
  }

  /**
   * Render a contiguous frame segment on the given page and stream each captured
   * PNG straight into a dedicated FFmpeg process via stdin (image2pipe). No
   * intermediate PNG files touch disk; rendering and encoding overlap.
   *
   * onFrame is invoked once per encoded frame so the caller can aggregate
   * progress across concurrent segments.
   */
  private async encodeSegment(
    page: Page,
    firstSourceFrame: number,
    frameCount: number,
    targetPath: string,
    onFrame: () => void
  ): Promise<void> {
    const ffmpeg = spawn(ffmpegPath.path, this.buildEncodeArgs(targetPath), {
      windowsHide: true,
    });

    let ffmpegStderr = '';
    ffmpeg.stderr.on('data', (chunk) => {
      ffmpegStderr += chunk.toString();
    });

    const ffmpegExit = new Promise<void>((resolve, reject) => {
      ffmpeg.on('error', reject);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(ffmpegStderr || `FFmpeg exited with code ${code}`));
      });
    });

    const writeFrame = (buffer: Buffer): Promise<void> =>
      new Promise((resolve, reject) => {
        ffmpeg.stdin.write(buffer, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

    try {
      for (let i = 0; i < frameCount; i++) {
        const sourceFrame = firstSourceFrame + i;
        await setFrameAndWait(page, sourceFrame);

        const buffer = (await page.screenshot({
          type: 'png',
          omitBackground: false,
        })) as Buffer;

        await writeFrame(buffer);

        // Optional debug tee: also persist PNGs when --keepFrames is set.
        if (this.options.keepFrames) {
          fs.writeFileSync(
            path.join(this.options.tempDir, `frame-${String(sourceFrame).padStart(6, '0')}.png`),
            buffer
          );
        }

        onFrame();
      }

      ffmpeg.stdin.end();
      await ffmpegExit;
    } catch (error) {
      ffmpeg.stdin.destroy();
      ffmpeg.kill();
      throw error;
    }
  }

  /**
   * Render all frames to an encoded (video-only) MP4 by streaming each captured
   * frame into a single FFmpeg process.
   *
   * NOTE: Multi-page parallel rendering (split frame range across N pages, then
   * concat) was prototyped but is intentionally not enabled — on a single host
   * N headless Chrome + N FFmpeg processes contend for CPU and run slower than
   * serial, with intermittent segment-encode failures. Parallelism belongs at
   * the orchestration layer (one process per video across machines), not here.
   */
  private async renderAndEncode(totalFrames: number): Promise<string> {
    const targetPath =
      this.resolvedAudioTracks.length > 0
        ? path.join(this.options.tempDir, 'video-only.mp4')
        : this.options.output;

    this.frameFileCount = 0;
    let done = 0;
    const onFrame = () => {
      done += 1;
      if (done % 30 === 0 || done === totalFrames) {
        this.reportProgress({
          phase: 'rendering',
          currentFrame: done,
          totalFrames,
          percent: Math.round((done / totalFrames) * 100),
          message: `Rendered ${done}/${totalFrames} frames`,
        });
      }
    };

    await this.encodeSegment(
      this.page!,
      this.options.startFrame,
      totalFrames,
      targetPath,
      onFrame
    );
    this.frameFileCount = done;
    this.reportProgress({ phase: 'encoding', percent: 100, message: 'Encoding: 100%' });
    return targetPath;
  }

  private resolveAudioTracks(): ResolvedAudioTrack[] {
    const resolved: ResolvedAudioTrack[] = [];
    const manifestTracks = this.audioManifest?.tracks ?? [];
    const manifestBaseDir = this.audioManifestBaseDir ?? this.componentDir;

    for (const track of manifestTracks) {
      resolved.push({
        id: track.id,
        path: resolveMaybeRelativePath(track.src, manifestBaseDir),
        kind: track.kind,
        volume: track.volume ?? 1,
        offsetMs: track.offsetMs ?? 0,
      });
    }

    if (this.options.audioTrack) {
      resolved.push({
        id: 'cli-audio-track',
        path: resolveMaybeRelativePath(this.options.audioTrack, this.componentDir),
        kind: 'narration',
        volume: 1,
        offsetMs: 0,
      });
    }

    if (this.options.mixMusic) {
      resolved.push({
        id: 'cli-music-track',
        path: resolveMaybeRelativePath(this.options.mixMusic, this.componentDir),
        kind: 'music',
        volume: 0.35,
        offsetMs: 0,
      });
    }

    for (const track of resolved) {
      if (!fs.existsSync(track.path)) {
        throw new Error(`Audio track file not found: ${track.path}`);
      }
    }

    return resolved;
  }

  private async muxAudio(videoPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetDurationSeconds = this.sceneDuration / this.effectiveFps;
      const filters: string[] = [];
      const labels: string[] = [];
      const args: string[] = ['-y', '-i', videoPath];

      this.resolvedAudioTracks.forEach((track, index) => {
        const inputIndex = index + 1;
        args.push('-i', track.path);
        const filterParts: string[] = [];

        if (track.offsetMs > 0) {
          filterParts.push(`adelay=${track.offsetMs}|${track.offsetMs}`);
        }
        if (track.volume !== 1) {
          filterParts.push(`volume=${track.volume}`);
        }
        if (filterParts.length === 0) {
          filterParts.push('anull');
        }

        const label = `a${index}`;
        filters.push(`[${inputIndex}:a]${filterParts.join(',')}[${label}]`);
        labels.push(`[${label}]`);
      });

      filters.push(
        `anullsrc=r=24000:cl=mono,atrim=0:${targetDurationSeconds.toFixed(3)}[asilence]`
      );
      filters.push(
        `${labels.join('')}[asilence]amix=inputs=${labels.length + 1}:duration=longest:dropout_transition=0[aout]`
      );

      args.push(
        '-filter_complex',
        filters.join(';'),
        '-map',
        '0:v:0',
        '-map',
        '[aout]',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        this.options.output
      );

      execFile(ffmpegPath.path, args, { windowsHide: true }, (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        this.reportProgress({
          phase: 'muxing',
          percent: 100,
          message: 'Muxing: 100%',
        });
        resolve();
      });
    });
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }

    // Frames are streamed straight to FFmpeg, so no PNGs exist unless
    // --keepFrames was requested (in which case the caller wants to keep them).
  }
}

export async function render(
  options: RenderOptions,
  onProgress?: (progress: RenderProgress) => void
): Promise<void> {
  const renderer = new VideoRenderer(options, onProgress);
  await renderer.render();
}

export { resolveComponentPath };
